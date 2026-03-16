import React from 'react';
import { useGeminiLive } from './useGeminiLive';

const micStates = {
    idle: { ring: 'rgba(255,255,255,0.2)', label: 'Say a country, city, or ask anything about the world...', animation: 'none' },
    listening: { ring: 'rgba(255,59,59,0.8)', label: '● LISTENING — Speak now', animation: 'pulse 1.2s ease-in-out infinite' },
    processing: { ring: 'rgba(255,140,0,0.8)', label: '◌ ANALYZING INTEL', animation: 'spin 1s linear infinite' },
    speaking: { ring: 'rgba(0,255,156,0.8)', label: '◉ BRIEFING IN PROGRESS', animation: 'none' }
};

export const MicButton: React.FC = () => {
    const { isListening, status, transcript, toggleListen, setTranscript } = useGeminiLive();
    const currentState = micStates[status];

    return (
        <div className="mic-bar">
            {/* Waveform / Transcript display */}
            <div style={{
                width: '360px',
                minHeight: '20px',
                maxHeight: '40px',
                backgroundColor: status === 'speaking' ? 'rgba(0,255,156,0.08)' :
                    status === 'listening' ? 'rgba(255,59,59,0.08)' :
                        'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: `1px solid ${status !== 'idle' ? currentState.ring : 'rgba(255,255,255,0.06)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: status === 'speaking' ? 'center' : 'flex-start',
                gap: '4px',
                overflow: 'hidden',
                padding: '0 12px',
                transition: 'all 0.3s ease',
            }}>
                {status === 'speaking' && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                    <div key={i} style={{
                        width: '4px',
                        height: Math.random() * 18 + 4 + 'px',
                        backgroundColor: 'var(--color-safe)',
                        borderRadius: '4px',
                        animation: `waveBar 0.5s ease-in-out ${i * 0.05}s infinite alternate`,
                    }} />
                ))}
                {status === 'listening' && [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} style={{
                        width: '3px',
                        height: Math.random() * 12 + 3 + 'px',
                        backgroundColor: 'var(--color-live)',
                        borderRadius: '3px',
                        opacity: 0.6,
                        animation: `waveBar 0.4s ease-in-out ${i * 0.07}s infinite alternate`,
                    }} />
                ))}
                {(status === 'processing' || status === 'idle') && transcript && (
                    <div className="data-font" style={{
                        fontSize: '10px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {transcript.slice(-80)}
                    </div>
                )}
            </div>

            {/* Mic Toggle Button */}
            <button
                onClick={toggleListen}
                style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    backgroundColor: isListening ? 'rgba(255, 59, 59, 0.15)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${currentState.ring}`,
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    animation: currentState.animation,
                    transition: 'all 0.3s ease',
                    fontSize: '20px',
                    boxShadow: isListening ? `0 0 20px ${currentState.ring}` : 'none',
                }}>
                {isListening ? '⏹' : '🎙'}
            </button>

            {/* Status Label */}
            <div className="data-font" style={{
                fontSize: '11px',
                color: status === 'idle' ? 'var(--text-secondary)' : currentState.ring,
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                minWidth: '200px',
            }}>
                {currentState.label}
            </div>

            {/* Clear transcript button */}
            {transcript && (
                <button
                    onClick={() => setTranscript('')}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '10px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontFamily: 'JetBrains Mono, monospace',
                    }}>
                    CLEAR
                </button>
            )}

            <style>
                {`
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 59, 59, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(255, 59, 59, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 59, 59, 0); }
          }
          @keyframes spin {
             from { transform: rotate(0deg); }
             to { transform: rotate(360deg); }
          }
          @keyframes waveBar {
             from { height: 4px; }
             to { height: 18px; }
          }
        `}
            </style>
        </div>
    );
};

export default MicButton;
