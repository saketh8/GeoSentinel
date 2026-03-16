import React, { useState, useEffect } from 'react';

export const Timeline: React.FC = () => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const utcStr = now.toISOString().replace('T', '  ').substring(0, 21) + ' UTC';

    return (
        <div className="timeline-bar data-font" style={{ fontSize: '11px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="layer-toggle">|◄ START</button>
            <button className="layer-toggle">◄ -1H</button>
            <button className="layer-toggle">◄ -5M</button>
            <button className="layer-toggle" style={{ color: 'var(--color-info)' }}>▶/⏸</button>

            <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--panel-border)', position: 'relative', margin: '0 16px' }}>
                {/* Event markers on timeline */}
                <div style={{ position: 'absolute', left: '20%', top: '-3px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-warning)', opacity: 0.6 }} />
                <div style={{ position: 'absolute', left: '45%', top: '-3px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-live)', opacity: 0.7 }} />
                <div style={{ position: 'absolute', left: '70%', top: '-3px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-military)', opacity: 0.5 }} />
                <div style={{ position: 'absolute', right: 0, top: '-4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-info)', boxShadow: '0 0 8px rgba(0,191,255,0.4)' }} />
            </div>

            <span style={{ color: 'var(--color-info)', fontWeight: 'bold' }}>NOW ▶</span>
            <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>{utcStr}</span>

            <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                <button className="layer-toggle active">1x</button>
                <button className="layer-toggle">5x</button>
                <button className="layer-toggle">60x</button>
            </div>
        </div>
    );
};

export default Timeline;
