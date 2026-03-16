import React from 'react';
import './DashboardOverlay.css';

interface DashboardOverlayProps {
  onClose: () => void;
}

const POSTURE_DATA = [
  { region: 'Iran Theater', status: 'CRIT', count1: 1, count2: 2 },
  { region: 'TAIWAN', status: 'WARN', count1: 4, count2: 12 },
  { region: 'BALTIC', status: 'NORM', count1: 2, count2: 0 },
  { region: 'BLACK SEA', status: 'WARN', count1: 5, count2: 3 },
  { region: 'KOREA', status: 'NORM', count1: 1, count2: 0 },
];

const INSTABILITY_DATA = [
  { country: 'Iran', score: 86, color: '#ff3b3b' },
  { country: 'Ukraine', score: 73, color: '#ff8c00' },
  { country: 'Russia', score: 66, color: '#ff8c00' },
  { country: 'Israel', score: 55, color: '#ffd700' },
  { country: 'China', score: 50, color: '#00ff9c' },
];

const HEATMAP_DATA = [
  { ticker: 'XLK', val: -0.75 }, { ticker: 'XLF', val: +0.12 }, { ticker: 'XLE', val: +0.33 }, { ticker: 'XLV', val: -0.25 },
  { ticker: 'XLY', val: -0.59 }, { ticker: 'XLI', val: -0.36 }, { ticker: 'XLP', val: +0.58 }, { ticker: 'XLU', val: +0.99 },
  { ticker: 'XLB', val: -0.99 }, { ticker: 'XLRE', val: +0.26 }, { ticker: 'XLC', val: -0.71 }, { ticker: 'SMH', val: -0.21 },
];

const CLIMATE_DATA = [
  { zone: 'South Asia', temp: '+4.3°C', precip: '-0.1mm', severity: 'MODERATE', color: '#ff8c00' },
  { zone: 'California', temp: '+4.1°C', precip: '-3.6mm', severity: 'MODERATE', color: '#ff8c00' },
  { zone: 'Central Asia', temp: '-4.2°C', precip: '-0.6mm', severity: 'MODERATE', color: '#ff8c00' },
  { zone: 'Ukraine', temp: '+6.2°C', precip: '-2.0mm', severity: 'EXTREME', color: '#ff3b3b' },
];

const ECONOMIC_DATA = [
  { label: 'Fed Total Assets', val: '6646$B', change: '+17$B', up: true },
  { label: 'Fed Funds Rate', val: '3.64%', change: '0%', up: null },
  { label: '10Y-2Y Spread', val: '0.55%', change: '+0.04%', up: true },
  { label: 'Unemployment', val: '4.4%', change: '+0.1%', up: false },
];

const COMMODITIES_DATA = [
  { label: 'VIX', val: '26.02', change: '-4.30%', up: false },
  { label: 'GOLD', val: '$4,999', change: '-1.23%', up: false },
  { label: 'OIL', val: '$100.76', change: '+2.10%', up: true },
  { label: 'NATGAS', val: '$3.12', change: '-0.85%', up: false },
];

const INTEL_FEED_DATA = [
  { source: 'MILITARY TIMES', tag: 'MILITARY', time: 'yesterday', text: 'Pentagon identifies six airmen killed in KC-135 crash in Iraq' },
  { source: 'ATLANTIC COUNCIL', tag: 'CONFLICT', time: '2 days ago', text: 'UN: Putin’s deportation of Ukrainian children is a crime against humanity' },
];

const TRADE_POLICY_DATA = [
  { country: 'India', tariff: '16.2%', status: 'High', affects: 'All trading partners' },
  { country: 'South Korea', tariff: '13.4%', status: 'High', affects: 'All trading partners' },
  { country: 'Brazil', tariff: '12.0%', status: 'High', affects: 'All trading partners' },
];

export const DashboardOverlay: React.FC<DashboardOverlayProps> = ({ onClose }) => {
  return (
    <div className="dashboard-overlay-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <span>📊</span> COMMAND CENTER OSINT DASHBOARD
        </div>
        <button className="close-btn" onClick={onClose}>[ ESC ] CLOSE</button>
      </div>

      <div className="dashboard-grid">
        
        {/* WIDGET: PENTAGON PIZZA INDEX */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">🍕 PENTAGON PIZZA INDEX</div>
            <div className="widget-badges"><span className="badge-live">LIVE</span></div>
          </div>
          <div className="widget-content">
            <div style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.4 }}>
              OSINT tracker for late-night pizza deliveries to US DoD, CIA, and Pentagon facilities. High volume indicates likely impending crisis operations.
            </div>
            <div className="pizza-index-value">
              86 <span className="pizza-index-label">/ 100</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#ff3b3b', fontWeight: 'bold' }}>
              <span>ELEVATED THREAT</span>
              <span>+34% vs 30D AVG</span>
            </div>
            <div className="pizza-bar-container">
              <div className="pizza-bar-fill" style={{ width: '86%' }}></div>
            </div>
            <div style={{ fontSize: '9px', color: '#777', marginTop: '8px' }}>
              Latest anomalous order: 45 pies to Langley Ops Center (14 mins ago)
            </div>
          </div>
        </div>

        {/* WIDGET: AI STRATEGIC POSTURE */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">🎯 AI STRATEGIC POSTURE</div>
            <div className="widget-badges"><span className="badge-count">5 REGIONS</span></div>
          </div>
          <div className="widget-content" style={{ gap: '4px' }}>
            {POSTURE_DATA.map(p => (
              <div key={p.region} className="posture-item">
                <span className="posture-region">{p.region}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#aaa' }}>✈ {p.count1} ⚓ {p.count2}</span>
                  <span className={`posture-status ${p.status.toLowerCase()}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET: COUNTRY INSTABILITY */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">⚠️ COUNTRY INSTABILITY</div>
          </div>
          <div className="widget-content">
            {INSTABILITY_DATA.map(c => (
              <div key={c.country} className="instability-item">
                <div className="instability-header">
                  <span style={{ color: '#fff', fontSize: '12px' }}>{c.country}</span>
                  <span style={{ color: c.color, fontWeight: 'bold' }}>{c.score}</span>
                </div>
                <div className="instability-bar">
                  <div className="instability-fill" style={{ width: `${c.score}%`, background: c.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET: SUPPLY CHAIN CHOKEPOINTS */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">⚓ SUPPLY CHAIN DISRUPTION</div>
            <div className="widget-badges"><span className="badge-live">AIS DATA</span></div>
          </div>
          <div className="widget-content">
            <div className="supply-item">
              <div className="supply-title">Strait of Hormuz <span className="supply-risk">● 95/100</span></div>
              <div className="supply-stats">Traffic down 95% vs 30-day baseline.<br/>Disruption: <span style={{color: '#ff3b3b'}}>81.0%</span></div>
              <div style={{ fontSize: '9px', color: '#777', marginTop: '4px' }}>Active Iran naval blockade risk</div>
            </div>
            <div className="supply-item" style={{ borderLeftColor: '#ff8c00' }}>
              <div className="supply-title">Kerch Strait <span style={{color: '#ff8c00'}}>● 70/100</span></div>
              <div className="supply-stats">Northbound WoW change: <span style={{color: '#00ff9c'}}>▲37.5%</span></div>
              <div style={{ fontSize: '9px', color: '#777', marginTop: '4px' }}>Active conflict zone restrictions</div>
            </div>
          </div>
        </div>

        {/* WIDGET: UNHCR DISPLACEMENT */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">⛺ UNHCR DISPLACEMENT</div>
          </div>
          <div className="widget-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
                <div style={{ color: '#ff3b3b', fontSize: '20px', fontWeight: 'bold' }}>30.5M</div>
                <div style={{ fontSize: '9px', color: '#aaa' }}>REFUGEES</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
                <div style={{ color: '#ff8c00', fontSize: '20px', fontWeight: 'bold' }}>63.9M</div>
                <div style={{ fontSize: '9px', color: '#aaa' }}>IDPS</div>
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>Syrian Arab Rep.</span><span style={{ color: '#ff3b3b' }}>CRISIS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>Ukraine</span><span style={{ color: '#ff3b3b' }}>CRISIS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Afghanistan</span><span style={{ color: '#ff3b3b' }}>CRISIS</span>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET: MARKET SECTOR HEATMAP */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">📈 SECTOR HEATMAP</div>
            <div className="widget-badges"><span className="badge-count">12 SECTORS</span></div>
          </div>
          <div className="widget-content">
            <div className="heatmap-grid">
              {HEATMAP_DATA.map(h => (
                <div key={h.ticker} className={`heatmap-cell ${h.val >= 0 ? 'up' : 'down'}`}>
                  <span>{h.ticker}</span>
                  <span style={{ fontWeight: 'bold' }}>{h.val > 0 ? '+' : ''}{h.val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WIDGET: AI FORECASTS */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">🔮 AI FORECASTS</div>
            <div className="widget-badges"><span className="badge-live">LIVE</span></div>
          </div>
          <div className="widget-content">
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
              Oil price impact from Strait of Hormuz disruption 
              <span style={{ float: 'right', color: '#ff3b3b' }}>73%</span>
            </div>
            <div className="pizza-bar-container" style={{ margin: '8px 0' }}>
              <div className="pizza-bar-fill" style={{ width: '73%' }}></div>
            </div>
            <div style={{ fontSize: '10px', color: '#aaa', lineHeight: 1.5 }}>
              24h: 95% | 7d: 95% | 30d: 73%<br/>
              Middle East | 30d | stable<br/>
              AI predicts high likelihood of continued energy market volatility throughout Q2.
            </div>
          </div>
        </div>

        {/* WIDGET: STRATEGIC RISK OVERVIEW */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">🌐 STRATEGIC RISK OVERVIEW</div>
            <div className="widget-badges"><span className="badge-live">LIVE</span></div>
          </div>
          <div className="widget-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '24px 12px' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '50%', border: '8px solid rgba(255,255,255,0.05)', borderTopColor: '#ff8c00', borderRightColor: '#ff8c00', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255,140,0,0.2) inset' }}>
              <div style={{ color: '#ff8c00', fontSize: '38px', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,140,0,0.5)' }}>38</div>
              <div style={{ fontSize: '10px', color: '#ff8c00', fontWeight: 'bold' }}>MODERATE</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '1px' }}>TREND</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: 'bold' }}>
                <span style={{ color: '#00ced1' }}>➡️</span> Stable
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET: CRYPTO */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">🪙 CRYPTO TRACKER</div>
          </div>
          <div className="widget-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Bitcoin</div>
                <div style={{ fontSize: '10px', color: '#777' }}>BTC</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>$73,839</div>
                <div style={{ fontSize: '12px', color: '#00ff9c', fontWeight: 'bold' }}>+3.04%</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 0' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Ethereum</div>
                <div style={{ fontSize: '10px', color: '#777' }}>ETH</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>$2,265.53</div>
                <div style={{ fontSize: '12px', color: '#00ff9c', fontWeight: 'bold' }}>+7.27%</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>BNB</div>
                <div style={{ fontSize: '10px', color: '#777' }}>BNB</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>$680.12</div>
                <div style={{ fontSize: '12px', color: '#00ff9c', fontWeight: 'bold' }}>+2.99%</div>
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET: GLOBAL ECONOMIC INDICATORS */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">🏦 ECONOMIC INDICATORS</div>
          </div>
          <div className="widget-content">
            {ECONOMIC_DATA.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < ECONOMIC_DATA.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{e.label}</div>
                  <div style={{ fontSize: '9px', color: '#777' }}>2026-03-16</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{e.val}</div>
                  <div style={{ fontSize: '11px', color: e.up ? '#00ff9c' : e.up === false ? '#ff3b3b' : '#aaa', fontWeight: 'bold' }}>{e.up ? '▲' : e.up === false ? '▼' : '-'} {e.change}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET: CLIMATE ANOMALIES */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">🌡️ CLIMATE ANOMALIES</div>
            <div className="widget-badges"><span className="badge-count">4 ZONES</span></div>
          </div>
          <div className="widget-content">
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#777', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '6px' }}>
                <span style={{ width: '100px' }}>ZONE</span>
                <span style={{ width: '50px', textAlign: 'right' }}>TEMP</span>
                <span style={{ width: '50px', textAlign: 'right' }}>PRECIP</span>
                <span style={{ width: '60px', textAlign: 'right' }}>SEV.</span>
             </div>
             {CLIMATE_DATA.map((c, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 0' }}>
                 <span style={{ width: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   {parseFloat(c.temp) > 0 ? '🌡️' : '❄️'} {c.zone}
                 </span>
                 <span style={{ width: '50px', textAlign: 'right', fontFamily: 'monospace' }}>{c.temp}</span>
                 <span style={{ width: '50px', textAlign: 'right', fontFamily: 'monospace', color: '#aaa' }}>{c.precip}</span>
                 <span style={{ width: '60px', textAlign: 'right' }}>
                   <span style={{ backgroundColor: `${c.color}22`, color: c.color, padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', border: `1px solid ${c.color}66` }}>
                     {c.severity}
                   </span>
                 </span>
               </div>
             ))}
          </div>
        </div>

        {/* WIDGET: COMMODITIES */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">🛢️ COMMODITIES</div>
          </div>
          <div className="widget-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {COMMODITIES_DATA.map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: '#777', marginBottom: '8px' }}>{c.label}</div>
                  <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ marginBottom: '8px' }}>
                    <polyline points={c.up ? "0,20 20,15 40,18 60,10 80,12 100,2" : "0,5 20,2 40,10 60,8 80,15 100,18"} fill="none" stroke={c.up ? "#00ff9c" : "#ff3b3b"} strokeWidth="1.5" />
                  </svg>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{c.val}</div>
                  <div style={{ fontSize: '10px', color: c.up ? '#00ff9c' : '#ff3b3b' }}>{c.change}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WIDGET: INTEL FEED */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">📡 INTEL FEED</div>
            <div className="widget-badges">
              <span className="badge-live">LIVE</span>
              <span className="badge-count">11</span>
            </div>
          </div>
          <div className="widget-content">
            {INTEL_FEED_DATA.map((item, i) => (
              <div key={i} style={{ borderBottom: i < INTEL_FEED_DATA.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingBottom: i < INTEL_FEED_DATA.length - 1 ? '12px' : '0', marginBottom: i < INTEL_FEED_DATA.length - 1 ? '12px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#4169E1', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>{item.source}</span>
                  <span style={{ backgroundColor: 'rgba(255,59,59,0.2)', color: '#ff3b3b', border: '1px solid #ff3b3b', padding: '1px 4px', fontSize: '8px', fontWeight: 'bold', borderRadius: '2px' }}>ALERT</span>
                  <span style={{ backgroundColor: 'rgba(255,140,0,0.2)', color: '#ff8c00', border: '1px solid #ff8c00', padding: '1px 4px', fontSize: '8px', fontWeight: 'bold', borderRadius: '2px' }}>{item.tag}</span>
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.4 }}>{item.text}</div>
                <div style={{ textAlign: 'right', fontSize: '9px', color: '#777', marginTop: '6px' }}>{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET: TRADE POLICY */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">⚖️ TRADE POLICY</div>
          </div>
          <div className="widget-content">
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', fontSize: '11px', color: '#aaa' }}>
              <span style={{ color: '#fff', borderBottom: '2px solid #fff', paddingBottom: '6px' }}>Restrictions</span>
              <span>Tariffs</span>
              <span>Barriers</span>
            </div>
            {TRADE_POLICY_DATA.map((t, i) => (
              <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', borderLeft: '2px solid #ff3b3b', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {t.country}
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#aaa', padding: '2px 6px', borderRadius: '2px', fontSize: '8px' }}>MFN Applied Tariff</span>
                  </div>
                  <span style={{ backgroundColor: 'rgba(255,59,59,0.2)', color: '#ff3b3b', padding: '2px 6px', borderRadius: '2px', fontSize: '9px', fontWeight: 'bold' }}>{t.status}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', lineHeight: 1.5 }}>
                  All products<br/>
                  Average tariff rate: {t.tariff}<br/>
                  Affects: {t.affects}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
