import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './config';
import Globe from './components/Globe/Globe';
import NewsFeed from './components/NewsFeed/NewsFeed';
import { useGeminiLive } from './components/Voice/useGeminiLive';
import { getLayerStats } from './components/Globe/GlobeData';
import { DashboardOverlay } from './components/Dashboard/DashboardOverlay';
import { SideHUD } from './components/HUD/SideHUD';
import { MOCK_LIVE_SIGNALS, MOCK_WHALE_TRADES, MOCK_CONFLICTS } from './utils/mockData';
import './styles/globals.css';

interface NewsArticle {
  title: string;
  source?: string;
  date?: string;
  url?: string;
  image?: string;
  tone?: number;
}

interface IntelBrief {
  region?: string;
  tension?: string;
  summary?: string;
  bullets?: string[];
  timestamp?: string;
}

// Live data state
interface LiveData {
  flights: any;
  earthquakes: any;
  wildfires: any[];
  infrastructure: any[];
  sanctions: any[];
}

// World clock cities
const CLOCKS = [
  { city: 'MOS', tz: 'Europe/Moscow' },
  { city: 'DXB', tz: 'Asia/Dubai' },
  { city: 'BOM', tz: 'Asia/Kolkata' },
  { city: 'SIN', tz: 'Asia/Singapore' },
  { city: 'TOK', tz: 'Asia/Tokyo' },
  { city: 'SYD', tz: 'Australia/Sydney' },
  { city: 'NYC', tz: 'America/New_York' },
  { city: 'LAX', tz: 'America/Los_Angeles' },
  { city: 'LON', tz: 'Europe/London' },
  { city: 'BER', tz: 'Europe/Berlin' },
  { city: 'CAI', tz: 'Africa/Cairo' },
  { city: 'IST', tz: 'Europe/Istanbul' },
];

function App() {
  const [activeLayers, setActiveLayers] = useState<string[]>(['heatmap', 'conflicts']);
  const [focusedCountry, setFocusedCountry] = useState<string>('');
  const [countryNews, setCountryNews] = useState<NewsArticle[]>([]);
  const [intelBrief, setIntelBrief] = useState<IntelBrief | null>(null);
  const [globalNews, _setGlobalNews] = useState<NewsArticle[]>([]);
  const [clockTimes, setClockTimes] = useState<Record<string, string>>({});
  const [utcTime, setUtcTime] = useState('');
  const [commandText, setCommandText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const { isListening, status, transcript, toggleListen } = useGeminiLive();
  const [liveData, setLiveData] = useState<LiveData>({ 
    flights: null, 
    earthquakes: null,
    wildfires: [],
    infrastructure: [],
    sanctions: [] 
  });

  // Clock updates every second
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const times: Record<string, string> = {};
      CLOCKS.forEach(c => {
        times[c.city] = now.toLocaleTimeString('en-GB', {
          timeZone: c.tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      });
      setClockTimes(times);
      setUtcTime(now.toLocaleTimeString('en-GB', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleLayer = (id: string) => {
    setActiveLayers(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleCountryClickHandler = useCallback((name: string, lat: number, lng: number) => {
    console.log(`Analyzing OSINT profile for: ${name} [${lat}, ${lng}]`);
    setFocusedCountry(name.toUpperCase());
    setCountryNews([]);
    setIntelBrief(null);
  }, []);

  // Event listeners
  useEffect(() => {
    const handleNews = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.articles) {
        setCountryNews(detail.articles);
        if (detail.location) setFocusedCountry(detail.location.toUpperCase());
      }
    };

    const handleBrief = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setIntelBrief(detail);
        if (detail.region) setFocusedCountry(detail.region.toUpperCase());
      }
    };

    const handleGlobalCountryClick = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.name) {
        setFocusedCountry(detail.name.toUpperCase());
        setCountryNews([]);
        setIntelBrief(null);
      }
    };

    window.addEventListener('newsReceived', handleNews);
    window.addEventListener('intelBriefReceived', handleBrief);
    window.addEventListener('countryClicked', handleGlobalCountryClick);
    return () => {
      window.removeEventListener('newsReceived', handleNews);
      window.removeEventListener('intelBriefReceived', handleBrief);
      window.removeEventListener('countryClicked', handleGlobalCountryClick);
    };
  }, []);

  // Fetch live data for stats and globe
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [eqRes, flRes, wfRes, infraRes, sanctionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/earthquakes`).catch(() => null),
          fetch(`${API_BASE_URL}/api/flights`).catch(() => null),
          fetch(`${API_BASE_URL}/api/wildfires`).catch(() => null),
          fetch(`${API_BASE_URL}/api/infrastructure`).catch(() => null),
          fetch(`${API_BASE_URL}/api/sanctions`).catch(() => null),
        ]);
        
        const newData: LiveData = { 
          flights: null, 
          earthquakes: null,
          wildfires: [],
          infrastructure: [],
          sanctions: []
        };

        if (eqRes && eqRes.ok) newData.earthquakes = await eqRes.json();
        if (flRes && flRes.ok) newData.flights = await flRes.json();
        if (wfRes && wfRes.ok) newData.wildfires = await wfRes.json();
        if (infraRes && infraRes.ok) newData.infrastructure = await infraRes.json();
        if (sanctionsRes && sanctionsRes.ok) newData.sanctions = await sanctionsRes.json();
        setLiveData(newData);
      } catch (err) {
        console.warn('Failed to fetch live data:', err);
      }
    };
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = getLayerStats(activeLayers, liveData);

  const tensionColor = (t: string) => {
    if (t === 'HIGH' || t === 'CRITICAL') return 'var(--color-live)';
    if (t === 'MODERATE' || t === 'ELEVATED') return 'var(--color-warning)';
    if (t === 'LOW') return 'var(--color-safe)';
    return 'var(--color-info)';
  };

  const sentiment = countryNews.length > 0
    ? (countryNews.reduce((sum, a) => sum + (a.tone || 0), 0) / countryNews.length)
    : 0;

  const tensionLevel = sentiment < -5 ? 'CRITICAL' : sentiment < -3 ? 'HIGH' : sentiment < -1 ? 'MODERATE' : 'LOW';

  const DASHBOARD_CATEGORIES = [
    {
      name: 'GEOPOLITICAL',
      icon: '🛡️',
      items: [
        { k: 'conflicts', icon: '💥', label: 'CONFLICTS' },
        { k: 'bases', icon: '🛡️', label: 'MILITARY BASES' },
        { k: 'iranAttacks', icon: '🚀', label: 'STRIKE ZONES' }
      ]
    },
    {
      name: 'TRANSPORT',
      icon: '✈️',
      items: [
        { k: 'flights', icon: '✈', label: 'FLIGHTS' },
        { k: 'ships', icon: '⚓', label: 'SHIPS' },
        { k: 'waterways', icon: '🌊', label: 'WATERWAYS' },
      ]
    },
    {
      name: 'INFRASTRUCTURE',
      icon: '🏭',
      items: [
        { k: 'outages', icon: '🔌', label: 'OUTAGES' },
        { k: 'nuclear', icon: '☢️', label: 'NUCLEAR SITES' },
        { k: 'irradiators', icon: '⚠️', label: 'IRRADIATORS' },
        { k: 'spaceports', icon: '🚀', label: 'SPACEPORTS' },
        { k: 'gps jam', icon: '📡', label: 'GPS JAM' },
        { k: 'no-fly', icon: '⛔', label: 'NO-FLY' }
      ]
    },
    {
      name: 'NATURAL/WEATHER',
      icon: '🌪️',
      items: [
        { k: 'wildfires', icon: '🔥', label: 'WILDFIRES' },
        { k: 'weather', icon: '🌪️', label: 'SEVERE WEATHER' }
      ]
    },
    {
      name: 'ECONOMIC & SPACE',
      icon: '🛰️',
      items: [
        { k: 'sanctions', icon: '🚫', label: 'SANCTIONS' },
        { k: 'whales', icon: '💎', label: 'WHALES' },
        { k: 'sats', icon: '🛰', label: 'SATELLITES' },
        { k: 'heatmap', icon: '🌡', label: 'HEATMAP' }
      ]
    }
  ];

  return (
    <div id="root">
      {/* ═══════ TOP BAR — WORLD CLOCKS ═══════ */}
      <div className="top-bar">
        <span className="brand-name">◈ GEOSENTINEL</span>

        <div className="clocks-ticker">
          <div className="clocks-track">
            {/* Duplicate for infinite scroll */}
            {[...CLOCKS, ...CLOCKS].map((c, i) => (
              <span key={i} className="clock-item">
                <span className="clock-city">{c.city}</span>
                <span className="clock-time">{clockTimes[c.city] || '--:--'}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginRight: '16px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>GLOBAL TENSION:</span>
          <span style={{ fontSize: '12px', color: tensionColor(focusedCountry ? tensionLevel : 'HIGH'), fontWeight: 'bold' }}>
            {focusedCountry ? tensionLevel : 'HIGH'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="top-time">{utcTime || '--:--'}</span>
          <span className="top-time-label">UTC ZULU</span>
        </div>
      </div>

      {/* ═══════ LIVE SIGNALS TICKER ═══════ */}
      <div className="live-signals-bar">
        <div className="signals-track">
          {[...MOCK_LIVE_SIGNALS, ...MOCK_LIVE_SIGNALS].map((sig, i) => (
            <span key={i} className="signal-item">
              <span style={{ fontSize: '12px' }}>⚡</span> {sig}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════ 3-COLUMN MAIN ═══════ */}
      <div className="main-content">
        {/* LEFT — Global News Feed */}
        <NewsFeed articles={globalNews} />

        {/* CENTER — Globe */}
        <div className="globe-viewport">
          <Globe 
            activeLayers={activeLayers} 
            liveData={liveData}
            onCountryClick={handleCountryClickHandler} 
          />
          <SideHUD />
        </div>

        {/* RIGHT — Intel Panel */}
        <div className="intel-panel">
          <div className="panel-header">
            <span className="panel-icon">🎯</span>
            <span className="panel-title">PLANETARY INTEL</span>
            <span className="live-dot" />
            <span style={{ marginLeft: '4px', fontSize: '9px', color: 'var(--color-live)' }}>LIVE FEED</span>
          </div>

          <div className="intel-scroll">
            {/* OSINT DASHBOARD */}
            <div className="intel-section" style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="intel-section-header" style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-info)' }}>🗺️</span> Global OSINT Dashboard
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DASHBOARD_CATEGORIES.map(cat => (
                  <div key={cat.name} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', padding: '6px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      {cat.icon} {cat.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {cat.items.map(btn => {
                        const count = (stats as any)[btn.k] || 0;
                        const hasData = count > 0 && typeof count === 'number';
                        return (
                          <button
                            key={btn.k}
                            className={`layer-toggle ${activeLayers.includes(btn.k) ? 'active' : ''}`}
                            style={{
                              padding: '4px 6px',
                              fontSize: '9px',
                              border: '1px solid',
                              borderColor: activeLayers.includes(btn.k) ? 'var(--color-live)' : 'rgba(255,255,255,0.2)',
                              background: activeLayers.includes(btn.k) ? 'rgba(255,59,59,0.1)' : 'transparent',
                              color: activeLayers.includes(btn.k) ? '#fff' : 'var(--text-secondary)',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              flex: '1 1 auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              textAlign: 'center',
                              minWidth: '30%'
                            }}
                            onClick={() => toggleLayer(btn.k)}
                          >
                            <span>{btn.icon}</span> 
                            <span>{btn.label}</span>
                            {hasData && (
                              <span style={{ 
                                background: activeLayers.includes(btn.k) ? 'var(--color-live)' : 'rgba(255,255,255,0.1)', 
                                padding: '1px 4px', 
                                borderRadius: '4px', 
                                fontSize: '8px',
                                color: activeLayers.includes(btn.k) ? '#fff' : 'var(--text-secondary)'
                              }}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="intel-section">
              <div className="intel-section-header">
                <span style={{ color: 'var(--color-safe)' }}>⚡</span> System Status
              </div>
              <div className="intel-card low" style={{ fontSize: '10px' }}>
                <div style={{ marginBottom: '3px' }}>GeoSentinel Core: <span style={{ color: 'var(--color-safe)' }}>ONLINE</span></div>
                <div style={{ marginBottom: '3px' }}>Satellite Uplink: <span style={{ color: 'var(--color-safe)' }}>STABLE</span> (GDELT/OSINT)</div>
                <div>Gemini Engine: <span style={{ color: status === 'idle' ? 'var(--color-warning)' : 'var(--color-safe)' }}>
                  {status === 'idle' ? 'STANDBY' : status === 'listening' ? 'ACTIVE' : 'PROCESSING'}
                </span></div>
              </div>
            </div>

            {/* Country Intel (when selected) */}
            {focusedCountry && (
              <div className="intel-section">
                <div className="intel-section-header">
                  <span style={{ color: 'var(--color-info)' }}>📍</span> {focusedCountry}
                </div>

                {/* Tension & Sentiment */}
                <div className="intel-card" style={{ borderLeft: `3px solid ${tensionColor(tensionLevel)}` }}>
                  <div style={{ marginBottom: '6px', fontWeight: 'bold', fontSize: '11px' }}>
                    Tension: <span style={{ color: tensionColor(tensionLevel) }}>{tensionLevel}</span>
                  </div>
                  <div className="stat-grid">
                    <div><span className="stat-label">Sentiment:</span></div>
                    <div><span className="stat-value" style={{ color: sentiment < -3 ? 'var(--color-live)' : sentiment < 0 ? 'var(--color-warning)' : 'var(--color-safe)' }}>
                      {sentiment.toFixed(1)}
                    </span></div>
                    <div><span className="stat-label">Articles:</span></div>
                    <div><span className="stat-value">{countryNews.length}</span></div>
                    <div><span className="stat-label">Sources:</span></div>
                    <div><span className="stat-value">{new Set(countryNews.map(a => a.source)).size}</span></div>
                  </div>
                </div>

                {/* Country News */}
                {countryNews.length > 0 && (
                  <>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', margin: '8px 0 6px', letterSpacing: '1px' }}>
                      NEWS ({countryNews.length})
                    </div>
                    {countryNews.slice(0, 6).map((article, i) => (
                      <a
                        key={i}
                        href={article.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="country-news-card"
                      >
                        <div style={{ fontWeight: 600, lineHeight: '1.3', marginBottom: '3px' }}>
                          {article.title}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-secondary)' }}>
                          <span>{article.source}</span>
                          <span style={{ color: 'var(--color-info)' }}>SOURCE ↗</span>
                        </div>
                        {article.tone !== undefined && (
                          <div style={{
                            fontSize: '8px', marginTop: '2px', fontWeight: 600,
                            color: article.tone < -5 ? 'var(--color-live)' : article.tone < 0 ? 'var(--color-warning)' : 'var(--color-safe)',
                          }}>
                            ● {article.tone < -5 ? 'CRITICAL' : article.tone < 0 ? 'NEGATIVE' : 'NEUTRAL'}
                          </div>
                        )}
                      </a>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Intel Brief (from Gemini) */}
            {intelBrief && (
              <div className="intel-section">
                <div className="intel-section-header">
                  <span style={{ color: 'var(--color-warning)' }}>📋</span> Intel Brief
                </div>
                <div className={`intel-card ${intelBrief.tension === 'HIGH' ? 'high' : 'moderate'}`}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{intelBrief.region?.toUpperCase()}</div>
                  {intelBrief.summary && (
                    <div style={{ lineHeight: '1.4', marginBottom: '6px', fontSize: '10px' }}>{intelBrief.summary}</div>
                  )}
                  {intelBrief.bullets?.map((b, i) => (
                    <div key={i} style={{ fontSize: '9px', marginBottom: '2px', color: 'var(--text-secondary)' }}>▸ {b}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats & Intel Tracking */}
            <div className="intel-section">
              <div className="intel-section-header">
                <span style={{ color: 'var(--color-satellite)' }}>📊</span> Quick Stats
              </div>
              <div className="intel-card low" style={{ marginBottom: '12px' }}>
                <div className="stat-grid">
                  {stats.flights > 0 && <><div className="stat-label">✈ Flights</div><div className="stat-value">{stats.flights} ({stats.militaryFlights} mil)</div></>}
                  {stats.ships > 0 && <><div className="stat-label">⚓ Ships</div><div className="stat-value">{stats.ships} ({stats.warships} war)</div></>}
                  {stats.satellites > 0 && <><div className="stat-label">🛰 Satellites</div><div className="stat-value">{stats.satellites}</div></>}
                  {stats.gpsJam > 0 && <><div className="stat-label">📡 GPS Jam</div><div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.gpsJam} zones</div></>}
                </div>
              </div>

              {/* Detailed Intel Tracking (WorldMonitor Style) */}
              {activeLayers.includes('conflicts') && MOCK_CONFLICTS.length > 0 && (
                <>
                  <div className="intel-section-header">
                    <span style={{ color: 'var(--color-live)' }}>💥</span> Active Conflicts Tracker
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    {MOCK_CONFLICTS.slice(0, 4).map((c, i) => (
                      <div key={`c-${i}`} className="intel-list-item">
                        <span className="intel-list-title">[{c.type.toUpperCase()}] {c.title}</span>
                        <span className="intel-list-value" style={{ color: 'var(--color-live)' }}>{c.intensity}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeLayers.includes('whales') && MOCK_WHALE_TRADES.length > 0 && (
                <>
                  <div className="intel-section-header">
                    <span style={{ color: 'var(--color-safe)' }}>💎</span> Prediction Market Whales
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    {MOCK_WHALE_TRADES.slice(0, 4).map((w, i) => (
                      <div key={`w-${i}`} className="intel-list-item">
                        <span className="intel-list-title">{w.title}</span>
                        <span className="intel-list-value" style={{ color: w.type === 'buy' ? 'var(--color-safe)' : 'var(--color-live)' }}>{w.type.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Scanning animation */}
            <div className="intel-section">
              <div className="intel-section-header">
                <span style={{ color: 'var(--color-warning)' }}>⚠</span> Scanning...
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Scanning global telemetry for anomalies...<br />
                {focusedCountry ? `Monitoring ${focusedCountry} sector...` : 'Waiting for event selection...'}
              </div>
              <div className="scanning-bar">
                <div className="scanning-bar-fill" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ BOTTOM BAR — Command + Mic + REC ═══════ */}
      <div className="bottom-bar">
        <span className="command-label">COMMAND_INPUT</span>

        <input
          className="command-input"
          placeholder="Type command (e.g., 'STATUS REPORT', 'FLY TO SYRIA')"
          value={commandText}
          onChange={(e) => setCommandText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && commandText.trim()) {
              // Could dispatch command to agent
              window.dispatchEvent(new CustomEvent('commandInput', { detail: { text: commandText } }));
              setCommandText('');
            }
          }}
        />

        <button
          className={`mic-btn ${isListening ? 'active' : ''}`}
          onClick={toggleListen}
          title={isListening ? 'Stop listening' : 'Start voice command'}
        >
          {isListening ? '⏹' : '🎙'}
        </button>

        {status !== 'idle' && (
          <span className="data-font" style={{
            fontSize: '10px',
            color: status === 'listening' ? 'var(--color-live)' :
              status === 'processing' ? 'var(--color-warning)' : 'var(--color-safe)',
            fontWeight: 'bold',
            minWidth: '80px',
          }}>
            {status === 'listening' ? '● LISTENING' :
              status === 'processing' ? '◌ ANALYZING' : '◉ BRIEFING'}
          </span>
        )}

        {transcript && (
          <span className="data-font" style={{ fontSize: '9px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {transcript.slice(-60)}
          </span>
        )}

        <button
          className={`rec-btn ${isRecording ? 'recording' : ''}`}
          onClick={() => setIsRecording(!isRecording)}
        >
          ● REC
        </button>

        <button
          className="layer-toggle"
          style={{ 
            border: '1px solid var(--color-safe)', 
            color: 'var(--color-safe)', 
            marginLeft: 'auto',
            background: 'rgba(0, 255, 156, 0.1)',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}
          onClick={() => setIsDashboardOpen(true)}
        >
          📊 COMMAND CENTER
        </button>
      </div>

      {isDashboardOpen && <DashboardOverlay onClose={() => setIsDashboardOpen(false)} />}
    </div>
  );
}

export default App;
