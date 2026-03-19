import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { getArcsData, getPointsData, getLabelsData, getRingsData, getHtmlMarkersData } from './GlobeData';
import { MOCK_COUNTRY_TENSION } from '../../utils/mockData';

// Lazy-load react-globe.gl to avoid SSR/initialization issues

interface GlobeProps {
    activeLayers: string[];
    liveData: any;
    onCountryClick?: (country: string, lat: number, lng: number) => void;
}

const Globe: React.FC<GlobeProps> = ({ activeLayers, liveData, onCountryClick }) => {
    const globeRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [GlobeComponent, setGlobeComponent] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [countries, setCountries] = useState<any>({ features: [] });
    const [tensionData, setTensionData] = useState<Record<string, number>>({});

    // Fetch GeoJSON countries for choropleth map
    useEffect(() => {
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountries)
            .catch(e => console.error('Failed to load countries geojson:', e));
    }, []);

    // Fetch Live Tension Data from Backend
    useEffect(() => {
        const fetchTension = async () => {
            try {
                const resp = await fetch('http://localhost:8000/api/intelligence/tension');
                if (resp.ok) {
                    const data = await resp.json();
                    setTensionData(data);
                }
            } catch (err) {
                console.warn('Failed to fetch tension data:', err);
            }
        };
        fetchTension();
        const interval = setInterval(fetchTension, 300000); // 5 min refresh
        return () => clearInterval(interval);
    }, []);

    // Dynamic import of react-globe.gl
    useEffect(() => {
        import('react-globe.gl')
            .then(mod => {
                setGlobeComponent(() => mod.default);
            })
            .catch(err => {
                console.error('Failed to load react-globe.gl:', err);
                setError('Failed to load globe renderer');
            });
    }, []);

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                const w = Math.floor(entry.contentRect.width);
                const h = Math.floor(entry.contentRect.height);
                if (w > 0 && h > 0) {
                    setDimensions({ width: w, height: h });
                }
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // Globe config on mount
    useEffect(() => {
        const globe = globeRef.current;
        if (!globe) return;

        try {
            globe.pointOfView({ lat: 20, lng: 45, altitude: 2.2 }, 0);

            const controls = globe.controls();
            if (controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.4;
                controls.enableZoom = true;
                controls.enablePan = false;
                controls.minDistance = 150;
                controls.maxDistance = 500;
            }
        } catch (e) {
            console.warn('Globe init error:', e);
        }
    }, [GlobeComponent, dimensions]);

    // Fly-to from Gemini agent
    useEffect(() => {
        const handleGlobeAction = () => {
            const action = (window as any).latestGlobeAction;
            if (action?.action === 'FLY_TO' && globeRef.current) {
                try {
                    const controls = globeRef.current.controls();
                    if (controls) {
                        controls.autoRotate = false;
                        setTimeout(() => { if (controls) controls.autoRotate = true; }, 10000);
                    }
                    globeRef.current.pointOfView({
                        lat: action.lat || 30,
                        lng: action.lon || 45,
                        altitude: action.zoom ? 3 / action.zoom : 1.5,
                    }, action.duration_ms || 2000);
                } catch (e) {
                    console.warn('Fly-to error:', e);
                }
            }
        };
        window.addEventListener('globeActionReceived', handleGlobeAction);
        return () => window.removeEventListener('globeActionReceived', handleGlobeAction);
    }, []);

    // Data
    const arcs = useMemo(() => getArcsData(activeLayers, liveData), [activeLayers, liveData]);
    const points = useMemo(() => getPointsData(activeLayers, liveData), [activeLayers, liveData]);
    const labels = useMemo(() => getLabelsData(activeLayers), [activeLayers]);
    const rings = useMemo(() => getRingsData(activeLayers, liveData), [activeLayers, liveData]);
    const htmlElements = useMemo(() => getHtmlMarkersData(activeLayers, liveData), [activeLayers, liveData]);

    // Country/globe click handler
    const handleGlobeClick = useCallback(({ lat, lng }: { lat: number; lng: number }) => {
        if (!lat || !lng) return;
        // Fetch news for the nearest country
        const countryName = guessCountryFromCoords(lat, lng);
        if (countryName) {
            onCountryClick?.(countryName, lat, lng);
            window.dispatchEvent(new CustomEvent('countryClicked', {
                detail: { name: countryName, coordinate: [lng, lat] }
            }));
            fetchGdeltNews(countryName);

            try {
                const controls = globeRef.current?.controls();
                if (controls) {
                    controls.autoRotate = false;
                    setTimeout(() => { if (controls) controls.autoRotate = true; }, 10000);
                }
                globeRef.current?.pointOfView({ lat, lng, altitude: 1.8 }, 2000);
            } catch (e) {
                console.warn('Click fly-to error:', e);
            }
        }
    }, [onCountryClick]);

    if (error) {
        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-live)' }}>
                ⚠ {error}
            </div>
        );
    }

    if (!GlobeComponent) {
        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--color-info)' }}>
                    <div style={{ fontSize: '28px', marginBottom: '12px', animation: 'pulse 1.2s infinite' }}>◈</div>
                    Initializing Globe Renderer...
                </div>
            </div>
        );
    }

    if (dimensions.width === 0 || dimensions.height === 0) {
        return (
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                    Loading viewport...
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div className="atmosphere-glow" />
            <GlobeComponent
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                showAtmosphere={true}
                atmosphereColor="#3388ff"
                atmosphereAltitude={0.2}
                onGlobeClick={handleGlobeClick}
                animateIn={true}

                // Choropleth Web Map (Tension Heatmap)
                polygonsData={activeLayers.includes('heatmap') ? countries.features : []}
                polygonAltitude={0.005}
                polygonCapColor={(d: any) => {
                    const name = d.properties.ADMIN;
                    const tension = tensionData[name] || MOCK_COUNTRY_TENSION[name] || 10;
                    if (tension >= 90) return 'rgba(255, 0, 0, 0.7)';
                    if (tension >= 75) return 'rgba(255, 100, 0, 0.5)';
                    if (tension >= 60) return 'rgba(200, 160, 0, 0.3)';
                    return 'rgba(20, 20, 20, 0.5)'; // Base dark color
                }}
                polygonSideColor={() => 'rgba(0, 0, 0, 0.1)'}
                polygonStrokeColor={() => '#111'}
                polygonLabel={(d: any) => {
                    if (!activeLayers.includes('heatmap')) return '';
                    const name = d.properties.ADMIN;
                    const tension = tensionData[name] || MOCK_COUNTRY_TENSION[name] || 0;
                    return `
                        <div style="background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px; border: 1px solid #333; font-family: monospace;">
                            <div style="color: #fff; font-weight: bold;">${name}</div>
                            <div style="color: ${tension >= 80 ? '#ff3b3b' : '#00bfff'}">SENTINEL-SCORE: ${tension}</div>
                        </div>
                    `;
                }}

                // Arcs — flight paths
                arcsData={arcs}
                arcColor="color"
                arcStroke="stroke"
                arcDashLength={0.5}
                arcDashGap={1}
                arcDashAnimateTime={3000}
                arcAltitudeAutoScale={0.3}

                // Points
                pointsData={points}
                pointLat="lat"
                pointLng="lng"
                pointColor="color"
                pointRadius="size"
                pointAltitude={0.01}
                pointLabel="label"

                // Labels
                labelsData={labels}
                labelLat="lat"
                labelLng="lng"
                labelText="text"
                labelColor="color"
                labelSize="size"
                labelDotRadius={0.3}
                labelAltitude={0.01}
                labelResolution={2}

                // Rings
                ringsData={rings}
                ringLat="lat"
                ringLng="lng"
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                ringColor="color"

                // HTML Elements
                htmlElementsData={htmlElements}
                htmlLat="lat"
                htmlLng="lng"
                htmlElement={(d: any) => {
                    const el = document.createElement('div');
                    el.innerHTML = d.icon;
                    el.style.color = d.color;
                    el.style.fontSize = `${d.size}px`;
                    el.style.pointerEvents = 'auto';
                    el.style.cursor = 'pointer';
                    // Optional: add a tiny glowing text label below the icon
                    if (d.label) {
                        const lbl = document.createElement('div');
                        lbl.innerHTML = d.label;
                        lbl.style.fontSize = '8px';
                        lbl.style.color = d.color;
                        lbl.style.whiteSpace = 'nowrap';
                        lbl.style.textAlign = 'center';
                        lbl.style.transform = 'translateX(-50%)';
                        lbl.style.textShadow = '0 0 2px black, 0 0 4px #000';
                        lbl.style.marginTop = '2px';
                        el.appendChild(lbl);
                        el.style.display = 'flex';
                        el.style.flexDirection = 'column';
                        el.style.alignItems = 'center';
                    }
                    return el;
                }}
            />
        </div>
    );
};

// Simple country guess from coordinates
function guessCountryFromCoords(lat: number, lng: number): string {
    const countries = [
        { name: 'Ukraine', latR: [44, 53], lngR: [22, 41] },
        { name: 'Syria', latR: [32, 38], lngR: [35, 43] },
        { name: 'Iraq', latR: [29, 38], lngR: [38, 49] },
        { name: 'Iran', latR: [25, 40], lngR: [44, 64] },
        { name: 'Israel', latR: [29, 34], lngR: [34, 36] },
        { name: 'Lebanon', latR: [33, 35], lngR: [35, 37] },
        { name: 'Yemen', latR: [12, 19], lngR: [42, 55] },
        { name: 'Saudi Arabia', latR: [16, 33], lngR: [34, 56] },
        { name: 'Egypt', latR: [22, 32], lngR: [24, 37] },
        { name: 'Turkey', latR: [36, 42], lngR: [26, 45] },
        { name: 'India', latR: [7, 36], lngR: [68, 98] },
        { name: 'China', latR: [18, 54], lngR: [73, 135] },
        { name: 'Russia', latR: [41, 82], lngR: [27, 180] },
        { name: 'United States', latR: [24, 50], lngR: [-125, -66] },
        { name: 'Brazil', latR: [-34, 6], lngR: [-74, -35] },
        { name: 'Sudan', latR: [3, 23], lngR: [21, 39] },
        { name: 'Ethiopia', latR: [3, 15], lngR: [33, 48] },
        { name: 'Afghanistan', latR: [29, 39], lngR: [60, 75] },
        { name: 'Myanmar', latR: [10, 29], lngR: [92, 102] },
        { name: 'Somalia', latR: [-2, 12], lngR: [41, 52] },
        { name: 'Libya', latR: [19, 34], lngR: [9, 26] },
        { name: 'Pakistan', latR: [23, 37], lngR: [61, 78] },
        { name: 'Nigeria', latR: [4, 14], lngR: [3, 15] },
        { name: 'Democratic Republic of the Congo', latR: [-14, 6], lngR: [12, 32] },
    ];

    for (const c of countries) {
        if (lat >= c.latR[0] && lat <= c.latR[1] && lng >= c.lngR[0] && lng <= c.lngR[1]) {
            return c.name;
        }
    }
    return `Region (${lat.toFixed(1)}, ${lng.toFixed(1)})`;
}

// GDELT fetch (with CORS proxy fallback)
async function fetchGdeltNews(countryName: string) {
    try {
        // Try direct fetch first
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(countryName)}%20sourcelang:eng&mode=artlist&maxrecords=8&format=json&sort=DateDesc`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`GDELT ${resp.status}`);
        const data = await resp.json();
        const articles = (data.articles || []).map((a: any) => ({
            title: a.title || '',
            url: a.url || '',
            source: a.domain || '',
            date: a.seendate || '',
            image: a.socialimage || '',
            tone: a.tone || 0,
        }));
        (window as any).latestNews = { location: countryName, articles };
        window.dispatchEvent(new CustomEvent('newsReceived', { detail: { location: countryName, articles } }));
    } catch {
        // Fallback with curated data
        const fallback = [
            { title: `Breaking: Situation escalates in ${countryName}`, source: 'Reuters', url: `https://www.reuters.com/search/news?query=${encodeURIComponent(countryName)}`, date: new Date().toISOString(), tone: -6, image: '' },
            { title: `${countryName}: International response intensifies`, source: 'BBC News', url: `https://www.bbc.co.uk/search?q=${encodeURIComponent(countryName)}`, date: new Date().toISOString(), tone: -4, image: '' },
            { title: `Analysis: What's happening in ${countryName}`, source: 'Al Jazeera', url: `https://www.aljazeera.com/search/${encodeURIComponent(countryName)}`, date: new Date().toISOString(), tone: -3, image: '' },
            { title: `${countryName} crisis: Humanitarian concerns grow`, source: 'The Guardian', url: `https://www.theguardian.com/world`, date: new Date().toISOString(), tone: -5, image: '' },
            { title: `Diplomatic efforts in ${countryName} region`, source: 'AP News', url: `https://apnews.com/search?q=${encodeURIComponent(countryName)}`, date: new Date().toISOString(), tone: -2, image: '' },
        ];
        (window as any).latestNews = { location: countryName, articles: fallback };
        window.dispatchEvent(new CustomEvent('newsReceived', { detail: { location: countryName, articles: fallback } }));
    }
}

export default Globe;
