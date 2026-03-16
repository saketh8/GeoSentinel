import {
    MOCK_FLIGHTS, MOCK_SHIPS, MOCK_CONFLICTS,
    MOCK_SATELLITES, MOCK_GPS_JAM, MOCK_NOFLY,
    MOCK_WHALE_TRADES, MOCK_BASES, MOCK_NUCLEAR,
    MOCK_IRRADIATORS, MOCK_WATERWAYS, MOCK_SPACEPORTS,
    MOCK_WEATHER, MOCK_IRAN_ATTACKS
} from '../../utils/mockData';

// ═══════════ ARCS — Flight paths ═══════════
export function getArcsData(activeLayers: string[], liveData?: any) {
    if (!activeLayers.includes('flights')) return [];
    
    // Fallback to mock if live data isn't ready
    let flightData = MOCK_FLIGHTS;
    
    // If live OpenSky data is available
    if (liveData?.flights && Array.isArray(liveData.flights.states)) {
        // OpenSky API format: [ icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source ]
        // We need to map this to arcs. Since we only have current positions, we'll draw short arcs indicating heading.
        flightData = liveData.flights.states.slice(0, 300).filter((s: any) => s[5] && s[6] && s[10]).map((s: any) => {
            const lng = s[5];
            const lat = s[6];
            const track = s[10]; // true track (heading)
            
            // Calculate a destination point slightly ahead based on track
            const dist = 0.5; // arbitrary short distance
            const radTrack = track * (Math.PI / 180);
            const dLat = dist * Math.cos(radTrack);
            const dLng = dist * Math.sin(radTrack);
            
            return {
                from: [lng, lat],
                to: [lng + dLng, lat + dLat],
                type: s[2]?.toLowerCase().includes('force') || s[2]?.toLowerCase().includes('military') ? 'military' : 'civilian',
                callsign: s[1]?.trim() || s[0]
            };
        });
    }

    return flightData.map((f: any) => ({
        startLat: f.from[1],
        startLng: f.from[0],
        endLat: f.to[1],
        endLng: f.to[0],
        color: f.type === 'military'
            ? ['rgba(255,140,0,0.9)', 'rgba(255,59,59,0.9)']
            : ['rgba(0,191,255,0.6)', 'rgba(0,255,156,0.6)'],
        stroke: f.type === 'military' ? 1.2 : 0.6,
        label: f.callsign,
        dashGap: f.type === 'military' ? 0.5 : 1,
        dashAnimateTime: f.type === 'military' ? 1500 : 3000,
    }));
}

// ═══════════ POINTS — Ships, Sats, Conflicts, GPS Jam, Weather ═══════════
export function getPointsData(activeLayers: string[], liveData?: any) {
    const points: any[] = [];

    if (activeLayers.includes('ships')) {
        MOCK_SHIPS.forEach(s => {
            const color = s.type === 'warship' ? '#ff3b3b' :
                s.type === 'tanker' ? '#ffb400' : '#9d4edd';
            points.push({
                lat: s.pos[1], lng: s.pos[0],
                size: s.type === 'warship' ? 0.6 : 0.4,
                color,
                label: `⚓ ${s.name}`,
                category: 'ship',
                ringColor: color,
                ringMaxRadius: s.type === 'warship' ? 3 : 2,
            });
        });
    }

    if (activeLayers.includes('sats')) {
        MOCK_SATELLITES.forEach(s => {
            const color = s.type === 'station' ? '#00ff9c' :
                s.type === 'reconnaissance' ? '#ff3b3b' : '#9d4edd';
            points.push({
                lat: s.pos[1], lng: s.pos[0],
                size: s.type === 'station' ? 0.5 : 0.3,
                color,
                label: `🛰 ${s.name}`,
                category: 'satellite',
                ringColor: color,
                ringMaxRadius: 2,
            });
        });
    }

    if (activeLayers.includes('conflicts')) {
        // Live Earthquakes
        if (liveData?.earthquakes && Array.isArray(liveData.earthquakes.features)) {
            liveData.earthquakes.features.slice(0, 100).forEach((eq: any) => {
                const mag = eq.properties.mag || 0;
                points.push({
                    lat: eq.geometry.coordinates[1], lng: eq.geometry.coordinates[0],
                    size: mag / 10,
                    color: mag >= 6.0 ? '#ff3b3b' : mag >= 4.5 ? '#ff8c00' : '#ffcc00',
                    label: `💥 ${eq.properties.title}`,
                    category: 'conflict',
                    ringColor: '#ff3b3b',
                    ringMaxRadius: mag / 2,
                });
            });
        } else {
            // Mock Fallback
            MOCK_CONFLICTS.forEach(c => {
                points.push({
                    lat: c.pos[1], lng: c.pos[0],
                    size: c.intensity / 100,
                    color: c.intensity >= 80 ? '#ff3b3b' : c.intensity >= 60 ? '#ff8c00' : '#ffcc00',
                    label: `💥 ${c.title}`,
                    category: 'conflict',
                    ringColor: '#ff3b3b',
                    ringMaxRadius: c.intensity / 20,
                });
            });
        }
    }

    if (activeLayers.includes('gps jam')) {
        MOCK_GPS_JAM.forEach(z => {
            const color = z.severity === 'critical' ? '#ff3b3b' :
                z.severity === 'high' ? '#ff8c00' : '#ffcc00';
            points.push({
                lat: z.center[1], lng: z.center[0],
                size: 0.5,
                color,
                label: `📡 ${z.label}`,
                category: 'gps_jam',
                ringColor: color,
                ringMaxRadius: 4,
            });
        });
    }

    if (activeLayers.includes('no-fly')) {
        MOCK_NOFLY.forEach(z => {
            points.push({
                lat: z.center[1], lng: z.center[0],
                size: 0.4,
                color: '#ff3b3b',
                label: `⛔ ${z.label}`,
                category: 'nofly',
                ringColor: '#ff3b3b',
                ringMaxRadius: 5,
            });
        });
    }

    if (activeLayers.includes('whales')) {
        MOCK_WHALE_TRADES.forEach((w: any) => {
            const color = w.type === 'buy' ? '#00ff9c' : '#ff3b3b';
            points.push({
                lat: w.pos[1], lng: w.pos[0],
                size: 1.5, // Large size for "Whales"
                color,
                label: `💎 WHALE TRADE: ${w.title}`,
                category: 'whale',
                ringColor: color,
                ringMaxRadius: 6,
            });
        });
    }

    if (activeLayers.includes('wildfires') && Array.isArray(liveData?.wildfires)) {
        liveData.wildfires.forEach((f: any) => {
            points.push({
                lat: f.lat, lng: f.lon,
                size: 0.8,
                color: '#ff4500', // Orange Red
                label: `🔥 FIRE: ${f.label}`,
                category: 'wildfire',
                ringColor: '#ff4500',
                ringMaxRadius: 3,
            });
        });
    }

    if (activeLayers.includes('outages') && Array.isArray(liveData?.infrastructure)) {
        liveData.infrastructure.forEach((infra: any) => {
            const color = infra.status === 'CRITICAL' ? '#ff3b3b' : infra.status === 'MODERATE' ? '#ff8c00' : '#00ff9c';
            const icon = infra.type === 'POWER' ? '🔌' : '📡';
            points.push({
                lat: infra.lat, lng: infra.lon,
                size: 0.6,
                color,
                label: `${icon} ${infra.name} (${infra.status})`,
                category: 'outage',
                ringColor: color,
                ringMaxRadius: 4,
            });
        });
    }

    if (activeLayers.includes('sanctions') && Array.isArray(liveData?.sanctions)) {
        liveData.sanctions.forEach((s: any) => {
            const color = s.level === 'CRITICAL' ? '#ff3b3b' : s.level === 'HIGH' ? '#ff8c00' : '#ffff00';
            const icon = s.type === 'FINANCIAL' ? '💸' : s.type === 'ENERGY' ? '⚡' : '📦';
            points.push({
                lat: s.lat, lng: s.lon,
                size: 0.7,
                color,
                label: `${icon} SANCTION: ${s.target} (${s.type})`,
                category: 'sanction',
                ringColor: color,
                ringMaxRadius: 5,
            });
        });
    }



    return points;
}

// ═══════════ LABELS — Location labels ═══════════
export function getLabelsData(activeLayers: string[]) {
    const labels: any[] = [];

    if (activeLayers.includes('flights')) {
        MOCK_FLIGHTS.filter(f => f.type === 'military').forEach(f => {
            labels.push({
                lat: f.from[1], lng: f.from[0],
                text: `✈ ${f.callsign}`,
                color: '#ffaa33',
                size: 0.6,
            });
        });
    }

    return labels;
}

// ═══════════ HTML ELEMENTS — Feature Logos/Emojis ═══════════
export function getHtmlMarkersData(activeLayers: string[], _liveData?: any) {
    const markers: any[] = [];

    if (activeLayers.includes('bases')) {
        MOCK_BASES.forEach(b => {
            markers.push({
                lat: b.pos[1], lng: b.pos[0],
                size: 16,
                color: '#4169E1',
                icon: '🛡️',
                label: `BASE: ${b.name}`,
            });
        });
    }

    if (activeLayers.includes('nuclear')) {
        MOCK_NUCLEAR.forEach(n => {
            markers.push({
                lat: n.pos[1], lng: n.pos[0],
                size: 16,
                color: '#FFD700',
                icon: '☢️',
                label: `NUCLEAR: ${n.name}`,
            });
        });
    }

    if (activeLayers.includes('irradiators')) {
        MOCK_IRRADIATORS.forEach(i => {
            markers.push({
                lat: i.pos[1], lng: i.pos[0],
                size: 14,
                color: '#32CD32',
                icon: '⚠️',
                label: `IRRADIATOR: ${i.name}`,
            });
        });
    }

    if (activeLayers.includes('waterways')) {
        MOCK_WATERWAYS.forEach(w => {
            const color = w.risk === 'Critical' ? '#ff3b3b' : w.risk === 'Elevated' ? '#ff8c00' : '#4169E1';
            markers.push({
                lat: w.pos[1], lng: w.pos[0],
                size: 16,
                color,
                icon: '⚓',
                label: `CHOKEPOINT: ${w.name}`,
            });
        });
    }

    if (activeLayers.includes('spaceports')) {
        MOCK_SPACEPORTS.forEach(s => {
            markers.push({
                lat: s.pos[1], lng: s.pos[0],
                size: 16,
                color: '#9370DB',
                icon: '🚀',
                label: `SPACEPORT: ${s.name}`,
            });
        });
    }

    if (activeLayers.includes('weather')) {
        MOCK_WEATHER.forEach(w => {
            markers.push({
                lat: w.pos[1], lng: w.pos[0],
                size: 20,
                color: '#00CED1',
                icon: '🌪️',
                label: `WEATHER: ${w.name}`,
            });
        });
    }

    if (activeLayers.includes('iranAttacks')) {
        MOCK_IRAN_ATTACKS.forEach(a => {
            markers.push({
                lat: a.pos[1], lng: a.pos[0],
                size: 18,
                color: '#DC143C',
                icon: '💥',
                label: `STRIKE: ${a.name}`,
            });
        });
    }

    return markers;
}

// ═══════════ RINGS — animated rings for active events ═══════════
export function getRingsData(activeLayers: string[], liveData?: any) {
    const rings: any[] = [];

    if (activeLayers.includes('conflicts')) {
        if (liveData?.earthquakes && Array.isArray(liveData.earthquakes.features)) {
            liveData.earthquakes.features.filter((eq:any) => eq.properties.mag >= 4.5).forEach((eq: any) => {
                const mag = eq.properties.mag;
                rings.push({
                    lat: eq.geometry.coordinates[1], lng: eq.geometry.coordinates[0],
                    maxR: mag / 1.5,
                    propagationSpeed: 2,
                    repeatPeriod: 1200,
                    color: () => `rgba(255, 59, 59, ${1 - Math.random() * 0.3})`,
                });
            });
        } else {
            MOCK_CONFLICTS.forEach(c => {
                rings.push({
                    lat: c.pos[1], lng: c.pos[0],
                    maxR: c.intensity / 15,
                    propagationSpeed: 2,
                    repeatPeriod: 1200,
                    color: () => `rgba(255, 59, 59, ${1 - Math.random() * 0.3})`,
                });
            });
        }
    }

    if (activeLayers.includes('gps jam')) {
        MOCK_GPS_JAM.forEach(z => {
            rings.push({
                lat: z.center[1], lng: z.center[0],
                maxR: 6,
                propagationSpeed: 3,
                repeatPeriod: 800,
                color: () => z.severity === 'critical'
                    ? `rgba(255, 59, 59, ${0.7 - Math.random() * 0.3})`
                    : `rgba(255, 140, 0, ${0.6 - Math.random() * 0.3})`,
            });
        });
    }

    return rings;
}

// Stats
export function getLayerStats(_activeLayers: string[], liveData?: any) {
    let flightsCount = 0;
    
    if (liveData?.flights && Array.isArray(liveData.flights.states)) {
        flightsCount = liveData.flights.states.length;
    } else {
        flightsCount = MOCK_FLIGHTS.length;
    }

    let conflictsCount = 0;
    if (liveData?.earthquakes && Array.isArray(liveData.earthquakes.features)) {
        conflictsCount = liveData.earthquakes.features.length;
    } else {
        conflictsCount = MOCK_CONFLICTS.length;
    }

    return {
        flights: flightsCount,
        militaryFlights: 112, // Simulated fixed value or logic
        ships: MOCK_SHIPS.length,
        warships: MOCK_SHIPS.filter(s => s.type === 'warship').length,
        satellites: MOCK_SATELLITES.length,
        conflicts: conflictsCount,
        gpsJam: MOCK_GPS_JAM.length,
        nofly: MOCK_NOFLY.length,
        whales: MOCK_WHALE_TRADES.length,
        wildfires: liveData?.wildfires?.length || 0,
        outages: liveData?.infrastructure?.length || 0,
        sanctions: liveData?.sanctions?.length || 0,
        bases: MOCK_BASES.length,
        nuclear: MOCK_NUCLEAR.length,
        irradiators: MOCK_IRRADIATORS.length,
        waterways: MOCK_WATERWAYS.length,
        spaceports: MOCK_SPACEPORTS.length,
        weather: MOCK_WEATHER.length,
        iranAttacks: MOCK_IRAN_ATTACKS.length,
    };
}
