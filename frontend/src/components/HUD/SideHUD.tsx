import React, { useState, useEffect } from 'react';
import './SideHUD.css';

const MOCK_ORBITAL = [
  { name: 'USA-326 (KH-11)', type: 'IMINT', status: 'OVERHEAD' },
  { name: 'NROL-85 (INTRUDER)', type: 'SIGINT', status: 'APPROACH' },
  { name: 'SBIRS GEO-6', type: 'EARLY WARNING', status: 'STATIONARY' },
  { name: 'STARLINK G4-20', type: 'COMMS', status: 'TRANSIT' }
];

const MOCK_CYBER = [
  { target: 'SWIFT Gateway EU', threat: 'DDoS (High)' },
  { target: 'USGrid-East Comms', threat: 'Intrusion Attempt' },
  { target: 'NATO SIPRNet Reflector', threat: 'Anomalous Ping' },
  { target: 'Subsea Cable (TAT-14)', threat: 'Signal Degradation' }
];

const MOCK_SIGINT_LINES = [
  { time: '08:42:12', src: 'JFT-7', text: 'Encrypted burst detected.' },
  { time: '08:42:15', src: 'SYS', text: 'Decrypting header payload...', err: false },
  { time: '08:42:19', src: 'SYS', text: 'DECRYPTION FAILED. KEY ROTATED.', err: true },
  { time: '08:42:25', src: 'NSA-A', text: 'Routing raw payload to Fort Meade.' },
  { time: '08:42:40', src: 'JFT-7', text: 'Target vessel changed heading 045.' },
  { time: '08:43:01', src: 'SATCOM', text: 'Uplink established. Bandwidth 4Mbps.' },
];

export const SideHUD: React.FC = () => {
  const [sigintFeed, setSigintFeed] = useState(MOCK_SIGINT_LINES.slice(0, 3));
  const [lineIndex, setLineIndex] = useState(3);

  // Simulate scrolling SIGINT feed
  useEffect(() => {
    const interval = setInterval(() => {
      if (lineIndex < MOCK_SIGINT_LINES.length) {
        setSigintFeed(prev => [...prev.slice(-4), MOCK_SIGINT_LINES[lineIndex]]);
        setLineIndex(prev => (prev + 1) % MOCK_SIGINT_LINES.length); // Loop for demo
      } else {
         setLineIndex(0); // Reset for continuous loop
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [lineIndex]);

  return (
    <div className="side-hud-container">
      {/* LEFT HUD - Threat & Comms */}
      <div className="hud-panel left-hud">
        
        {/* DEFCON GAUGE */}
        <div className="hud-widget">
          <div className="hud-title">☢ GLOBAL TENSION</div>
          <div className="defcon-gauge-container">
            <div className="defcon-arc">
              <div className="defcon-arc-active"></div>
              <div className="defcon-level">3</div>
            </div>
            <div className="defcon-label">DEFENSE READINESS</div>
          </div>
        </div>

        {/* SIGINT INTERCEPTS */}
        <div className="hud-widget">
          <div className="hud-title">📡 SIGINT STREAM</div>
          <div className="sigint-feed">
            {sigintFeed.map((line, i) => (
              <div key={i} className="sigint-line">
                <span className="sig-time">[{line.time}]</span>
                <span className="sig-src">{line.src}:</span>
                <span className={line.err ? 'sig-err' : 'sig-text'}>{line.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT HUD - Orbital & Cyber */}
      <div className="hud-panel right-hud">
        
        {/* ORBITAL ASSETS */}
        <div className="hud-widget">
          <div className="hud-title">🛰 ORBITAL TRACKING</div>
          <div className="orbital-list">
            {MOCK_ORBITAL.map((sat, i) => (
              <div key={i} className="orbital-item">
                <div>
                  <div className="orb-name">{sat.name}</div>
                  <div className="orb-type">{sat.type}</div>
                </div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: sat.status === 'OVERHEAD' ? 'var(--color-safe)' : '#777' }}>
                  {sat.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CYBER ANOMALIES */}
        <div className="hud-widget">
          <div className="hud-title">💻 CYBER THREAT NET</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_CYBER.map((c, i) => (
              <div key={i} className="cyber-item">
                <span className="cyb-target">{c.target}</span>
                <span className="cyb-threat">{c.threat}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
