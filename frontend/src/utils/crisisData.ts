/**
 * Country-level crisis severity data and color mapping.
 * Severity scores: 0 (peaceful) → 100 (extreme crisis)
 */

// Crisis severity by ISO 3166-1 alpha-3 country code
// Scores are illustrative for the demo, reflecting real-world hotspots
export const COUNTRY_CRISIS: Record<string, { score: number; label: string }> = {
    // === CRITICAL (80-100) ===
    UKR: { score: 95, label: 'Active conflict zone' },
    SYR: { score: 92, label: 'Civil war & humanitarian crisis' },
    SDN: { score: 90, label: 'Armed conflict & famine' },
    YEM: { score: 88, label: 'Humanitarian catastrophe' },
    MMR: { score: 85, label: 'Military junta & resistance' },
    SOM: { score: 82, label: 'Insurgency & famine risk' },
    PSE: { score: 80, label: 'Active conflict zone' },

    // === HIGH (60-79) ===
    AFG: { score: 78, label: 'Insurgency & collapse' },
    LBY: { score: 72, label: 'Political instability' },
    IRQ: { score: 68, label: 'Militia activity & tensions' },
    COD: { score: 75, label: 'Eastern Congo conflict' },
    HTI: { score: 73, label: 'Gang violence & crisis' },
    ETH: { score: 70, label: 'Regional conflicts' },
    MLI: { score: 67, label: 'Sahel insurgency' },
    BFA: { score: 66, label: 'Sahel insurgency' },
    NER: { score: 64, label: 'Military coup & instability' },
    NGA: { score: 62, label: 'Boko Haram & banditry' },
    LBN: { score: 65, label: 'Economic collapse & tensions' },
    PAK: { score: 60, label: 'Border tensions & TTP' },

    // === ELEVATED (40-59) ===
    IRN: { score: 58, label: 'Regional proxy conflicts' },
    RUS: { score: 55, label: 'Sanctions & conflict party' },
    ISR: { score: 56, label: 'Active military operations' },
    VEN: { score: 50, label: 'Political crisis' },
    TCD: { score: 48, label: 'Political instability' },
    MOZ: { score: 47, label: 'Cabo Delgado insurgency' },
    CMR: { score: 45, label: 'Anglophone crisis' },
    COL: { score: 42, label: 'Armed groups active' },
    PRK: { score: 55, label: 'Nuclear threat & sanctions' },
    MYA: { score: 50, label: 'Political tensions' },
    EGY: { score: 40, label: 'Regional spillover risk' },

    // === MODERATE (20-39) ===
    TUR: { score: 35, label: 'PKK conflict & regional role' },
    IND: { score: 30, label: 'Kashmir & border tensions' },
    CHN: { score: 32, label: 'Taiwan strait & SCS tensions' },
    MEX: { score: 38, label: 'Cartel violence' },
    PHL: { score: 28, label: 'SCS disputes' },
    TWN: { score: 30, label: 'Cross-strait tensions' },
    KOR: { score: 25, label: 'North Korea proximity' },

    // === LOW (0-19) ===
    USA: { score: 12, label: 'Stable' },
    GBR: { score: 8, label: 'Stable' },
    DEU: { score: 7, label: 'Stable' },
    FRA: { score: 10, label: 'Stable' },
    JPN: { score: 6, label: 'Stable' },
    AUS: { score: 5, label: 'Stable' },
    CAN: { score: 5, label: 'Stable' },
    BRA: { score: 18, label: 'Low-level instability' },
};

/**
 * Map ISO alpha-3 to alternative name matchers used in GeoJSON datasets.
 * Many GeoJSON files use different property names (NAME, ADMIN, ISO_A3, etc.)
 */
export const ISO_NAME_MAP: Record<string, string[]> = {
    UKR: ['Ukraine'],
    SYR: ['Syria', 'Syrian Arab Republic'],
    SDN: ['Sudan'],
    YEM: ['Yemen'],
    MMR: ['Myanmar', 'Burma'],
    SOM: ['Somalia'],
    PSE: ['Palestine', 'West Bank', 'Gaza'],
    AFG: ['Afghanistan'],
    LBY: ['Libya'],
    IRQ: ['Iraq'],
    COD: ['Dem. Rep. Congo', 'Democratic Republic of the Congo', 'Congo DRC'],
    HTI: ['Haiti'],
    ETH: ['Ethiopia'],
    MLI: ['Mali'],
    BFA: ['Burkina Faso'],
    NER: ['Niger'],
    NGA: ['Nigeria'],
    LBN: ['Lebanon'],
    PAK: ['Pakistan'],
    IRN: ['Iran', 'Islamic Republic of Iran'],
    RUS: ['Russia', 'Russian Federation'],
    ISR: ['Israel'],
    VEN: ['Venezuela'],
    TCD: ['Chad'],
    MOZ: ['Mozambique'],
    CMR: ['Cameroon'],
    COL: ['Colombia'],
    PRK: ['North Korea', 'Dem. Rep. Korea', "Korea, Dem. People's Rep."],
    EGY: ['Egypt'],
    TUR: ['Turkey', 'Türkiye'],
    IND: ['India'],
    CHN: ['China', "People's Republic of China"],
    MEX: ['Mexico'],
    PHL: ['Philippines'],
    TWN: ['Taiwan'],
    KOR: ['South Korea', 'Korea, Rep.', 'Republic of Korea'],
    USA: ['United States', 'United States of America'],
    GBR: ['United Kingdom'],
    DEU: ['Germany'],
    FRA: ['France'],
    JPN: ['Japan'],
    AUS: ['Australia'],
    CAN: ['Canada'],
    BRA: ['Brazil'],
};

/**
 * Returns RGBA color for a crisis severity score (0–100).
 * 0    = transparent (no data / peaceful)
 * 1-20 = green (stable)
 * 21-40 = yellow-green (moderate)
 * 41-60 = orange (elevated)
 * 61-80 = red-orange (high)
 * 81-100 = bright red (critical)
 */
export function getCrisisColor(score: number): [number, number, number, number] {
    if (score <= 0) return [0, 0, 0, 0];
    if (score <= 15) return [0, 180, 80, 35];        // green, very transparent
    if (score <= 30) return [80, 200, 50, 55];        // yellow-green
    if (score <= 45) return [200, 180, 0, 70];        // yellow
    if (score <= 60) return [255, 140, 0, 90];        // orange
    if (score <= 75) return [255, 69, 0, 110];        // red-orange
    if (score <= 85) return [255, 30, 30, 130];       // red
    return [220, 0, 40, 160];                          // deep red (critical)
}

/**
 * Look up crisis score for a GeoJSON feature by trying ISO_A3,
 * then NAME, then ADMIN properties.
 */
export function getCountryScore(properties: Record<string, any>): number {
    // Try ISO alpha-3 directly
    const iso = properties.ISO_A3 || properties.iso_a3 || properties.ADM0_A3;
    if (iso && COUNTRY_CRISIS[iso]) {
        return COUNTRY_CRISIS[iso].score;
    }

    // Try matching by name
    const name = properties.NAME || properties.name || properties.ADMIN || properties.admin || '';
    for (const [code, names] of Object.entries(ISO_NAME_MAP)) {
        if (names.some(n => name.includes(n) || n.includes(name))) {
            return COUNTRY_CRISIS[code]?.score ?? 0;
        }
    }

    return 0; // No data = transparent
}
