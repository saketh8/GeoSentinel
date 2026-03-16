import { ScatterplotLayer, ArcLayer, TextLayer, PolygonLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, GeoJsonLayer } from '@deck.gl/layers';
import {
    MOCK_FLIGHTS, MOCK_SHIPS, MOCK_CONFLICTS,
    MOCK_SATELLITES, MOCK_GPS_JAM, MOCK_NOFLY, MOCK_WEATHER
} from '../../utils/mockData';
import { getCrisisColor, getCountryScore } from '../../utils/crisisData';

// ─────────── GeoJSON Countries ───────────
const COUNTRIES_GEOJSON_URL =
    'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson';

let cachedGeoJson: any = null;
let fetchPromise: Promise<any> | null = null;

function fetchCountries(): Promise<any> {
    if (cachedGeoJson) return Promise.resolve(cachedGeoJson);
    if (fetchPromise) return fetchPromise;
    fetchPromise = fetch(COUNTRIES_GEOJSON_URL)
        .then(r => r.json())
        .then(data => { cachedGeoJson = data; return data; })
        .catch(err => { console.error('GeoJSON fetch error:', err); fetchPromise = null; return null; });
    return fetchPromise;
}
fetchCountries();

export function getCountryGeoJson(): any { return cachedGeoJson; }

// Generate circle polygon
function circlePolygon(center: [number, number], radiusMeters: number, segments = 48): number[][] {
    const [lng, lat] = center;
    const ring: number[][] = [];
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const dlat = (radiusMeters / 111320) * Math.cos(angle);
        const dlng = (radiusMeters / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
        ring.push([lng + dlng, lat + dlat]);
    }
    return ring;
}

export function getLayers(activeLayers: string[], selectedCountry: string | null = null) {
    const layers: any[] = [];

    // ═══════════ BASEMAP ═══════════
    layers.push(
        new TileLayer({
            id: 'basemap-tiles',
            data: 'https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
            minZoom: 0, maxZoom: 19, tileSize: 256,
            renderSubLayers: (props: any) => {
                const { boundingBox } = props.tile;
                return new BitmapLayer(props, {
                    data: undefined, image: props.data,
                    bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
                });
            },
        })
    );

    // ═══════════ COUNTRY POLYGONS (always present for click) ═══════════
    const showHeatmap = activeLayers.includes('heatmap');
    if (cachedGeoJson) {
        layers.push(
            new GeoJsonLayer({
                id: 'crisis-countries',
                data: cachedGeoJson,
                filled: true, stroked: true,
                getFillColor: (f: any) => {
                    const name = f.properties?.NAME || f.properties?.name || '';
                    if (selectedCountry && name === selectedCountry) return [0, 180, 255, 120];
                    if (!showHeatmap) return [0, 0, 0, 0];
                    return getCrisisColor(getCountryScore(f.properties || {}));
                },
                getLineColor: (f: any) => {
                    const name = f.properties?.NAME || f.properties?.name || '';
                    if (selectedCountry && name === selectedCountry) return [0, 220, 255, 200];
                    if (!showHeatmap) return [0, 0, 0, 0];
                    const s = getCountryScore(f.properties || {});
                    if (s >= 80) return [255, 59, 59, 60];
                    if (s >= 60) return [255, 140, 0, 50];
                    if (s >= 40) return [200, 180, 0, 35];
                    return [0, 0, 0, 0];
                },
                getLineWidth: (f: any) => {
                    const name = f.properties?.NAME || f.properties?.name || '';
                    if (selectedCountry && name === selectedCountry) return 3;
                    if (!showHeatmap) return 0;
                    return getCountryScore(f.properties || {}) >= 60 ? 1 : 0;
                },
                lineWidthMinPixels: 0, pickable: true,
                autoHighlight: true, highlightColor: [0, 200, 255, 50],
                updateTriggers: {
                    getFillColor: [selectedCountry, showHeatmap],
                    getLineColor: [selectedCountry, showHeatmap],
                    getLineWidth: [selectedCountry, showHeatmap],
                },
            })
        );
    }

    // ═══════════ GPS JAMMING ZONES ═══════════
    if (activeLayers.includes('gps jam')) {
        const jamPolygons = MOCK_GPS_JAM.map(z => ({
            polygon: circlePolygon(z.center as [number, number], z.radius),
            ...z,
        }));
        layers.push(
            new PolygonLayer({
                id: 'gps-jam-zones',
                data: jamPolygons,
                getPolygon: (d: any) => d.polygon,
                getFillColor: (d: any) =>
                    d.severity === 'critical' ? [255, 59, 59, 35] :
                        d.severity === 'high' ? [255, 140, 0, 30] : [255, 200, 0, 20],
                getLineColor: (d: any) =>
                    d.severity === 'critical' ? [255, 59, 59, 150] :
                        d.severity === 'high' ? [255, 140, 0, 120] : [255, 200, 0, 80],
                getLineWidth: 2,
                lineWidthMinPixels: 1,
                filled: true, stroked: true,
            }),
            new TextLayer({
                id: 'gps-jam-labels',
                data: MOCK_GPS_JAM,
                getPosition: (d: any) => d.center,
                getText: (d: any) => `📡 ${d.label}`,
                getSize: 14,
                getColor: [255, 180, 0, 220],
                getTextAnchor: 'middle',
                getAlignmentBaseline: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 'bold',
                billboard: true,
            })
        );
    }

    // ═══════════ NO-FLY ZONES ═══════════
    if (activeLayers.includes('no-fly')) {
        const nfzPolygons = MOCK_NOFLY.map(z => ({
            polygon: circlePolygon(z.center as [number, number], z.radius),
            ...z,
        }));
        layers.push(
            new PolygonLayer({
                id: 'nofly-zones',
                data: nfzPolygons,
                getPolygon: (d: any) => d.polygon,
                getFillColor: [255, 0, 0, 15],
                getLineColor: [255, 59, 59, 100],
                getLineWidth: 2,
                lineWidthMinPixels: 1,
                filled: true, stroked: true,
                lineJointRounded: true,
                lineDashJustified: true,
            }),
            new TextLayer({
                id: 'nofly-labels',
                data: MOCK_NOFLY,
                getPosition: (d: any) => d.center,
                getText: (d: any) => `⛔ ${d.label}`,
                getSize: 13,
                getColor: [255, 100, 100, 200],
                getTextAnchor: 'middle',
                getAlignmentBaseline: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                billboard: true,
            })
        );
    }

    // ═══════════ FLIGHTS ═══════════
    if (activeLayers.includes('flights')) {
        layers.push(
            new ArcLayer({
                id: 'flight-arcs',
                data: MOCK_FLIGHTS,
                getSourcePosition: (d: any) => d.from,
                getTargetPosition: (d: any) => d.to,
                getSourceColor: (d: any) => d.type === 'military' ? [255, 140, 0, 220] : [0, 191, 255, 180],
                getTargetColor: (d: any) => d.type === 'military' ? [255, 59, 59, 220] : [0, 255, 156, 180],
                getWidth: (d: any) => d.type === 'military' ? 3 : 1.5,
                getHeight: 0.3,
                greatCircle: true,
            }),
            new TextLayer({
                id: 'flight-labels',
                data: MOCK_FLIGHTS.filter(f => f.type === 'military'),
                getPosition: (d: any) => d.from,
                getText: (d: any) => `✈ ${d.callsign}`,
                getSize: 12,
                getColor: (d: any) => d.type === 'military' ? [255, 150, 50, 255] : [100, 200, 255, 180],
                getTextAnchor: 'start',
                getAlignmentBaseline: 'bottom',
                fontFamily: 'JetBrains Mono, monospace',
                billboard: true,
                getPixelOffset: [8, -8],
            })
        );
    }

    // ═══════════ SHIPS ═══════════
    if (activeLayers.includes('ships')) {
        layers.push(
            new ScatterplotLayer({
                id: 'ship-layer',
                data: MOCK_SHIPS,
                getPosition: (d: any) => d.pos,
                getFillColor: (d: any) =>
                    d.type === 'warship' ? [255, 59, 59, 220] :
                        d.type === 'tanker' ? [255, 180, 0, 200] : [157, 78, 221, 200],
                getLineColor: (d: any) =>
                    d.type === 'warship' ? [255, 100, 100, 255] :
                        d.type === 'tanker' ? [255, 200, 80, 255] : [200, 130, 255, 255],
                getRadius: (d: any) => d.type === 'warship' ? 35000 : 25000,
                stroked: true, lineWidthMinPixels: 1,
                pickable: true, radiusMinPixels: 5, radiusMaxPixels: 22,
            }),
            new TextLayer({
                id: 'ship-labels',
                data: MOCK_SHIPS,
                getPosition: (d: any) => d.pos,
                getText: (d: any) => {
                    const icon = d.type === 'warship' ? '⚔' : d.type === 'tanker' ? '🛢' : '⚓';
                    return `${icon} ${d.name}`;
                },
                getSize: 11,
                getColor: (d: any) =>
                    d.type === 'warship' ? [255, 100, 100, 200] :
                        d.type === 'tanker' ? [255, 200, 80, 200] : [180, 140, 255, 200],
                getTextAnchor: 'start',
                getAlignmentBaseline: 'bottom',
                fontFamily: 'JetBrains Mono, monospace',
                billboard: true,
                getPixelOffset: [10, -10],
            })
        );
    }

    // ═══════════ SATELLITES ═══════════
    if (activeLayers.includes('sats')) {
        layers.push(
            new ScatterplotLayer({
                id: 'sat-layer',
                data: MOCK_SATELLITES,
                getPosition: (d: any) => d.pos,
                getFillColor: (d: any) =>
                    d.type === 'station' ? [0, 255, 156, 200] :
                        d.type === 'reconnaissance' ? [255, 59, 59, 180] : [157, 78, 221, 180],
                getLineColor: [255, 255, 255, 100],
                getRadius: (d: any) => d.type === 'station' ? 40000 : 20000,
                stroked: true, lineWidthMinPixels: 1,
                radiusMinPixels: 4, radiusMaxPixels: 16,
            }),
            new TextLayer({
                id: 'sat-labels',
                data: MOCK_SATELLITES,
                getPosition: (d: any) => d.pos,
                getText: (d: any) => `🛰 ${d.name}`,
                getSize: 10,
                getColor: (d: any) =>
                    d.type === 'reconnaissance' ? [255, 100, 100, 180] : [157, 78, 221, 200],
                getTextAnchor: 'start',
                getAlignmentBaseline: 'bottom',
                fontFamily: 'JetBrains Mono, monospace',
                billboard: true,
                getPixelOffset: [8, -8],
            })
        );
    }

    // ═══════════ CONFLICTS ═══════════
    if (activeLayers.includes('conflicts')) {
        layers.push(
            // Pulse ring
            new ScatterplotLayer({
                id: 'conflict-pulse',
                data: MOCK_CONFLICTS,
                getPosition: (d: any) => d.pos,
                getFillColor: [255, 59, 59, 25],
                getLineColor: [255, 59, 59, 60],
                getRadius: (d: any) => d.intensity * 1200,
                stroked: true, lineWidthMinPixels: 1,
                filled: true, radiusMinPixels: 12, radiusMaxPixels: 50,
            }),
            // Core marker
            new ScatterplotLayer({
                id: 'conflict-layer',
                data: MOCK_CONFLICTS,
                getPosition: (d: any) => d.pos,
                getFillColor: [255, 59, 59, 200],
                getLineColor: [255, 120, 120, 255],
                getRadius: (d: any) => d.intensity * 500,
                stroked: true, lineWidthMinPixels: 2,
                pickable: true, radiusMinPixels: 6, radiusMaxPixels: 28,
            }),
            // Labels
            new TextLayer({
                id: 'conflict-labels',
                data: MOCK_CONFLICTS,
                getPosition: (d: any) => d.pos,
                getText: (d: any) => {
                    const icons: Record<string, string> = {
                        airstrike: '💥', naval: '⚓', air_defense: '🛡',
                        artillery: '💣', missile: '🚀', ground: '⚔', ied: '💣',
                    };
                    return `${icons[d.type] || '⚠'} ${d.title}`;
                },
                getSize: 11,
                getColor: [255, 120, 80, 200],
                getTextAnchor: 'start',
                getAlignmentBaseline: 'bottom',
                fontFamily: 'JetBrains Mono, monospace',
                billboard: true,
                getPixelOffset: [12, -12],
            })
        );
    }

    // ═══════════ WEATHER ═══════════
    if (activeLayers.includes('weather')) {
        layers.push(
            new ScatterplotLayer({
                id: 'weather-outer',
                data: MOCK_WEATHER,
                getPosition: (d: any) => d.pos,
                getFillColor: [0, 120, 255, 20],
                getLineColor: [0, 180, 255, 60],
                getRadius: (d: any) => d.severity * 2000,
                stroked: true, lineWidthMinPixels: 1,
                filled: true, radiusMinPixels: 15, radiusMaxPixels: 60,
            }),
            new ScatterplotLayer({
                id: 'weather-core',
                data: MOCK_WEATHER,
                getPosition: (d: any) => d.pos,
                getFillColor: (d: any) =>
                    d.severity >= 80 ? [255, 100, 0, 180] :
                        d.severity >= 60 ? [255, 200, 0, 160] : [0, 180, 255, 160],
                getLineColor: [255, 255, 255, 100],
                getRadius: (d: any) => d.severity * 800,
                stroked: true, lineWidthMinPixels: 1,
                radiusMinPixels: 6, radiusMaxPixels: 25,
            }),
            new TextLayer({
                id: 'weather-labels',
                data: MOCK_WEATHER,
                getPosition: (d: any) => d.pos,
                getText: (d: any) => {
                    const icons: Record<string, string> = {
                        typhoon: '🌀', cyclone: '🌀', hurricane: '🌀', storm: '⛈',
                    };
                    return `${icons[d.type] || '☁'} ${d.name}`;
                },
                getSize: 12,
                getColor: [100, 200, 255, 220],
                getTextAnchor: 'start',
                getAlignmentBaseline: 'bottom',
                fontFamily: 'JetBrains Mono, monospace',
                billboard: true,
                getPixelOffset: [10, -10],
            })
        );
    }

    return layers;
}
