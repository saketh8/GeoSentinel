// ─────────── FLIGHTS ───────────
export const MOCK_FLIGHTS = [
    // Commercial routes
    { callsign: 'UAE432', from: [55.36, 25.25], to: [-0.46, 51.47], alt: 34000, type: 'commercial' },
    { callsign: 'QTR11', from: [51.53, 25.27], to: [-73.78, 40.64], alt: 36000, type: 'commercial' },
    { callsign: 'ETH702', from: [38.79, 8.97], to: [12.23, 41.80], alt: 38000, type: 'commercial' },
    { callsign: 'SIA22', from: [103.99, 1.36], to: [-73.78, 40.64], alt: 41000, type: 'commercial' },
    { callsign: 'BAW115', from: [-0.46, 51.47], to: [-73.78, 40.64], alt: 38000, type: 'commercial' },
    { callsign: 'CPA840', from: [113.91, 22.31], to: [139.78, 35.55], alt: 33000, type: 'commercial' },
    { callsign: 'THY16', from: [28.81, 40.98], to: [-73.78, 40.64], alt: 39000, type: 'commercial' },
    { callsign: 'AFR1420', from: [2.55, 49.01], to: [55.36, 25.25], alt: 37000, type: 'commercial' },
    { callsign: 'KLM868', from: [4.76, 52.31], to: [113.91, 22.31], alt: 35000, type: 'commercial' },
    // Military flights
    { callsign: 'REACH101', from: [49.18, 55.97], to: [69.20, 34.53], alt: 28000, type: 'military' },
    { callsign: 'FORTE10', from: [32.90, 39.93], to: [36.23, 33.82], alt: 50000, type: 'military' },
    { callsign: 'RRR7215', from: [12.25, 41.80], to: [35.48, 33.83], alt: 42000, type: 'military' },
    { callsign: 'DUKE41', from: [-87.0, 32.41], to: [28.24, 36.40], alt: 32000, type: 'military' },
    { callsign: 'IRON66', from: [34.87, 32.01], to: [36.15, 33.5], alt: 15000, type: 'military' },
    { callsign: 'VIPER03', from: [53.25, 25.97], to: [56.8, 26.3], alt: 18000, type: 'military' },
];

// ─────────── SHIPS ───────────
export const MOCK_SHIPS = [
    { name: 'GALAXY LEADER', pos: [42.0, 15.0], type: 'cargo', speed: 14, flag: 'UK' },
    { name: 'FRONT ALTAIR', pos: [57.5, 25.0], type: 'tanker', speed: 11, flag: 'NO' },
    { name: 'USS EISENHOWER', pos: [56.2, 26.2], type: 'warship', speed: 18, flag: 'US' },
    { name: 'MERCER STREET', pos: [58.3, 24.1], type: 'tanker', speed: 12, flag: 'JP' },
    { name: 'SOPHIE', pos: [43.5, 14.2], type: 'cargo', speed: 13, flag: 'DE' },
    { name: 'EVER GIVEN', pos: [32.40, 30.01], type: 'cargo', speed: 0, flag: 'PA' },
    { name: 'MOSKVA', pos: [31.0, 45.5], type: 'warship', speed: 16, flag: 'RU' },
    { name: 'HMS DIAMOND', pos: [42.5, 13.8], type: 'warship', speed: 22, flag: 'UK' },
    { name: 'STENA IMPERO', pos: [56.0, 26.6], type: 'tanker', speed: 0, flag: 'UK' },
    { name: 'COSCO DALIAN', pos: [114.2, 22.3], type: 'cargo', speed: 15, flag: 'CN' },
];

// ─────────── CONFLICTS ───────────
export const MOCK_CONFLICTS = [
    { pos: [34.5, 31.5], title: 'Airstrike reported — Gaza', intensity: 95, type: 'airstrike' },
    { pos: [56.2, 26.8], title: 'Vessel harassed — Hormuz', intensity: 65, type: 'naval' },
    { pos: [30.5, 50.4], title: 'Drone intercepted — Eastern Ukraine', intensity: 90, type: 'air_defense' },
    { pos: [36.3, 33.5], title: 'Artillery exchange — S. Lebanon', intensity: 80, type: 'artillery' },
    { pos: [45.3, 15.4], title: 'Houthi missile launch — Yemen', intensity: 88, type: 'missile' },
    { pos: [43.1, 11.6], title: 'Naval skirmish — Red Sea', intensity: 72, type: 'naval' },
    { pos: [38.8, 7.5], title: 'Ethnic violence — Ethiopia', intensity: 60, type: 'ground' },
    { pos: [30.0, 12.8], title: 'Armed clash — Sudan', intensity: 85, type: 'ground' },
    { pos: [21.5, -4.3], title: 'Rebel attack — DRC', intensity: 70, type: 'ground' },
    { pos: [69.2, 34.5], title: 'IED detonation — Afghanistan', intensity: 55, type: 'ied' },
    { pos: [95.9, 16.8], title: 'Military operation — Myanmar', intensity: 75, type: 'ground' },
];

// ─────────── LIVE NEWS FEED ───────────
export const MOCK_NEWS = [
    {
        id: 1,
        title: 'UN Security Council Emergency Session — Middle East Crisis',
        date: '2025-03-15',
        sentiment: 'CRITICAL',
        source: 'GDELT',
        category: 'GEO-POL',
        rep: 'HIGH REP'
    },
    {
        id: 2,
        title: 'GPS Jamming Activity Surges Across Eastern Mediterranean',
        date: '2025-03-15',
        sentiment: 'CRITICAL',
        source: 'OSINT',
        category: 'MILITARY',
        rep: 'HIGH REP'
    },
    {
        id: 3,
        title: 'Major Cyclone System Developing in Bay of Bengal',
        date: '2025-03-14',
        sentiment: 'NEGATIVE',
        source: 'NOAA',
        category: 'WEATHER',
        rep: 'HIGH REP'
    },
    {
        id: 4,
        title: 'Ukraine Frontline: Drone Warfare Intensifies',
        date: '2025-03-14',
        sentiment: 'CRITICAL',
        source: 'REUTERS',
        category: 'CONFLICT',
        rep: 'HIGH REP'
    },
    {
        id: 5,
        title: 'Red Sea Shipping Routes Disrupted by Houthi Attacks',
        date: '2025-03-14',
        sentiment: 'NEGATIVE',
        source: 'MARITIME',
        category: 'LOGISTICS',
        rep: 'MED REP'
    },
    {
        id: 6,
        title: 'NATO Increases Satellite Surveillance Over Black Sea',
        date: '2025-03-13',
        sentiment: 'NEGATIVE',
        source: 'DEFENSE',
        category: 'INTEL',
        rep: 'HIGH REP'
    },
];

// ─────────── LIVE SIGNALS TICKER ───────────
export const MOCK_LIVE_SIGNALS = [
    "🔴 [LIVE] Naval movement detected in Strait of Hormuz — Risk +2.7%",
    "🟡 [HIGH] AI identifies anomaly in drone telemetry near Kyiv",
    "🔴 [LIVE] Heavy GPS jamming reported across Baltics",
    "🟢 [UPDATE] Diplomatic channels open for Sudan ceasefire talks",
    "🟡 [HIGH] Unscheduled satellite repositioning observed over South China Sea"
];
// ─────────── SATELLITES ───────────
export const MOCK_SATELLITES = [
    { name: 'ISS (ZARYA)', pos: [120.5, 10.2], alt: 408, type: 'station', orbit: 'LEO' },
    { name: 'USA-326 (KH-11)', pos: [42.0, 33.0], alt: 260, type: 'reconnaissance', orbit: 'LEO' },
    { name: 'COSMOS 2558', pos: [68.5, 52.0], alt: 420, type: 'reconnaissance', orbit: 'LEO' },
    { name: 'STARLINK-5102', pos: [-45.0, 25.0], alt: 550, type: 'communication', orbit: 'LEO' },
    { name: 'GPS III SV06', pos: [-95.0, 38.0], alt: 20200, type: 'navigation', orbit: 'MEO' },
    { name: 'MUSIS CSO-2', pos: [2.5, 48.0], alt: 480, type: 'reconnaissance', orbit: 'LEO' },
    { name: 'YAOGAN-39', pos: [116.0, 28.0], alt: 500, type: 'reconnaissance', orbit: 'LEO' },
    { name: 'TIANGONG', pos: [100.0, -5.0], alt: 390, type: 'station', orbit: 'LEO' },
];

// ─────────── GPS JAMMING ZONES ───────────
export const MOCK_GPS_JAM = [
    { center: [37.0, 35.0], radius: 150000, label: 'Zone A7 — NW Syria', severity: 'high' },
    { center: [44.5, 33.3], radius: 120000, label: 'Zone A8 — Baghdad', severity: 'high' },
    { center: [34.8, 32.0], radius: 80000, label: 'Zone B3 — N. Israel/S. Lebanon', severity: 'moderate' },
    { center: [32.0, 47.0], radius: 200000, label: 'Zone C1 — E. Ukraine', severity: 'critical' },
];

// ─────────── NO-FLY ZONES ───────────
export const MOCK_NOFLY = [
    { center: [36.0, 34.0], radius: 200000, label: 'NFZ-01 Syria Exclusion', authority: 'NOTAM' },
    { center: [31.5, 50.0], radius: 300000, label: 'NFZ-02 Ukraine East', authority: 'ICAO' },
    { center: [44.4, 15.5], radius: 180000, label: 'NFZ-03 Yemen Conflict', authority: 'NOTAM' },
];

// ─────────── COUNTRY TENSION (Choropleth Heatmap) ───────────
// Simulating global tension scores for country coloring (0-100)
export const MOCK_COUNTRY_TENSION: Record<string, number> = {
    'Ukraine': 95,
    'Russia': 85,
    'Israel': 95,
    'Palestine': 95,
    'Syria': 88,
    'Iran': 85,
    'Iraq': 75,
    'Lebanon': 80,
    'Yemen': 85,
    'Sudan': 90,
    'Ethiopia': 75,
    'Somalia': 70,
    'Myanmar': 80,
    'Democratic Republic of the Congo': 75,
    'Afghanistan': 65,
    'Mali': 65,
    'Burkina Faso': 70,
    'Haiti': 85,
    'Venezuela': 60,
    'Taiwan': 55,
    'North Korea': 60,
    'Turkey': 50,
    'Pakistan': 60,
};

// ─────────── WHALE TRADES (Prediction Markets) ───────────
export const MOCK_WHALE_TRADES = [
    { pos: [56.2, 26.8], title: '$850k: Strait of Hormuz Closure (YES)', type: 'buy', amount: 850000 },
    { pos: [34.5, 31.5], title: '$1.2M: Gaza Ceasefire by May (NO)', type: 'sell', amount: 1200000 },
    { pos: [31.5, 50.0], title: '$500k: Eastern Ukraine Offensive (YES)', type: 'buy', amount: 500000 },
    { pos: [114.2, 22.3], title: '$2.5M: Taiwan Blockade (NO)', type: 'sell', amount: 2500000 },
    { pos: [43.1, 11.6], title: '$400k: Red Sea Shipping Restored (NO)', type: 'sell', amount: 400000 },
    { pos: [38.0, 127.0], title: '$900k: Korean Peninsula De-escalation (YES)', type: 'buy', amount: 900000 },
];

// ─────────── BASES (Military) ───────────
export const MOCK_BASES = [
    { pos: [144.9, 13.5], name: 'Andersen Air Force Base', faction: 'US', type: 'AirBase' },
    { pos: [35.8, 33.8], name: 'Rayak Air Base', faction: 'LBN', type: 'AirBase' },
    { pos: [45.0, 15.0], name: 'Camp Lemonnier', faction: 'US', type: 'NavalExpeditionary' },
    { pos: [32.9, 34.6], name: 'RAF Akrotiri', faction: 'UK', type: 'AirBase' },
    { pos: [39.9, 34.1], name: 'Hmeymim Air Base', faction: 'RU', type: 'AirBase' },
    { pos: [109.5, 18.2], name: 'Yulin Naval Base', faction: 'CN', type: 'SubmarineBase' },
    { pos: [51.4, 25.1], name: 'Al Udeid Air Base', faction: 'US/QA', type: 'AirBase' },
];

// ─────────── NUCLEAR SITES ───────────
export const MOCK_NUCLEAR = [
    { pos: [33.0, 47.1], name: 'Zaporizhzhia NPP', status: 'At Risk', type: 'Power' },
    { pos: [50.4, 28.8], name: 'Bushehr NPP', status: 'Operational', type: 'Power' },
    { pos: [51.7, 33.9], name: 'Natanz Enrichment', status: 'Underground', type: 'Enrichment' },
    { pos: [127.5, 40.0], name: 'Yongbyon', status: 'Active', type: 'Research/Weapons' },
    { pos: [38.3, 56.0], name: 'Sarov', status: 'Secure', type: 'Weapons' },
];

// ─────────── IRRADIATORS (Isotope Facilities) ───────────
export const MOCK_IRRADIATORS = [
    { pos: [14.4, 48.3], name: 'Isotope Production Center Alpha', type: 'Medical' },
    { pos: [-84.2, 36.0], name: 'Oak Ridge National Lab', type: 'Research' },
    { pos: [11.5, 49.3], name: 'Erlangen Med-Tech Facility', type: 'Medical' },
];

// ─────────── WATERWAYS & CHOKEPOINTS ───────────
export const MOCK_WATERWAYS = [
    { pos: [32.3, 30.6], name: 'Suez Canal', status: 'High Traffic', risk: 'Elevated' },
    { pos: [56.4, 26.5], name: 'Strait of Hormuz', status: 'Military Escort Required', risk: 'Critical' },
    { pos: [43.4, 12.6], name: 'Bab el-Mandeb', status: 'Houthi Threat', risk: 'Critical' },
    { pos: [103.8, 1.2], name: 'Strait of Malacca', status: 'Clear', risk: 'Low' },
    { pos: [-79.9, 9.1], name: 'Panama Canal', status: 'Drought Restrictions', risk: 'Moderate' },
    { pos: [29.0, 41.0], name: 'Bosporus Strait', status: 'Warship Restricted (Montreux)', risk: 'Elevated' },
];

// ─────────── SPACEPORTS ───────────
export const MOCK_SPACEPORTS = [
    { pos: [-80.5, 28.5], name: 'Kennedy Space Center', status: 'Active (SpaceX Launch Pad 39A)' },
    { pos: [63.3, 46.0], name: 'Baikonur Cosmodrome', status: 'Routine Operations' },
    { pos: [110.9, 19.6], name: 'Wenchang Spacecraft Launch Site', status: 'Preparing Heavy Lift' },
    { pos: [-52.7, 5.2], name: 'Guiana Space Centre', status: 'Active (Ariane 6 Prep)' },
    { pos: [-105.0, 31.4], name: 'Blue Origin Launch Site One', status: 'Standby' },
];

// ─────────── SEVERE WEATHER ───────────
export const MOCK_WEATHER = [
    { pos: [90.0, 15.0], name: 'Cyclone Remal Alert', severity: 'Category 3', type: 'Hurricane' },
    { pos: [135.0, 32.0], name: 'Typhoon Ampil', severity: 'Category 4', type: 'Typhoon' },
    { pos: [-95.0, 28.0], name: 'Gulf Coast Hurricane Threat', severity: 'Category 1', type: 'Hurricane' },
];

// ─────────── IRAN ATTACKS (Event Markers) ───────────
export const MOCK_IRAN_ATTACKS = [
    { pos: [35.0, 31.8], name: 'April 14 Drone/Missile Swarm Target Area', type: 'Historical' },
    { pos: [35.2, 32.9], name: 'Nevatim Airbase Strike Zone', type: 'Historical' },
    { pos: [34.7, 32.1], name: 'Tel Aviv Interception Vector', type: 'Historical' },
];
