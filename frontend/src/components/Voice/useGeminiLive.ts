import { useState, useRef, useCallback, useEffect } from 'react';
import { WS_BASE_URL } from '../../config';

export function useGeminiLive() {
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [transcript, setTranscript] = useState('');
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    // Audio playback queue
    const audioQueueRef = useRef<ArrayBuffer[]>([]);
    const isPlayingRef = useRef(false);

    // PCM audio playback
    const playAudioChunk = useCallback(async (pcmData: ArrayBuffer) => {
        audioQueueRef.current.push(pcmData);
        if (isPlayingRef.current) return;
        isPlayingRef.current = true;

        while (audioQueueRef.current.length > 0) {
            const chunk = audioQueueRef.current.shift()!;
            try {
                // Convert 16-bit PCM at 24kHz to Float32 for Web Audio
                const int16 = new Int16Array(chunk);
                const sampleRate = 24000; // Gemini outputs 24kHz
                const float32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) {
                    float32[i] = int16[i] / 32768;
                }

                const ctx = audioContextRef.current || new AudioContext({ sampleRate });
                audioContextRef.current = ctx;

                const buffer = ctx.createBuffer(1, float32.length, sampleRate);
                buffer.copyToChannel(float32, 0);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();

                // Wait for playback to finish
                await new Promise<void>(resolve => {
                    source.onended = () => resolve();
                    setTimeout(resolve, (buffer.duration * 1000) + 50);
                });
            } catch (e) {
                console.error('Audio playback error:', e);
            }
        }
        isPlayingRef.current = false;
    }, []);

    const connect = useCallback(async () => {
        try {
            // 1. Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            streamRef.current = stream;

            // 2. Create audio context for capture
            const audioCtx = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            // 3. Connect to backend WebSocket
            const ws = new WebSocket(`${WS_BASE_URL}/ws/agent`);
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                console.log('Connected to GeoSentinel Agent WS');
                setStatus('listening');

                // 4. Set up audio capture pipeline
                const source = audioCtx.createMediaStreamSource(stream);
                sourceRef.current = source;

                // ScriptProcessorNode for capturing PCM samples
                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                processor.onaudioprocess = (e) => {
                    if (ws.readyState !== WebSocket.OPEN) return;

                    const float32 = e.inputBuffer.getChannelData(0);
                    // Convert Float32 to Int16 PCM
                    const int16 = new Int16Array(float32.length);
                    for (let i = 0; i < float32.length; i++) {
                        const s = Math.max(-1, Math.min(1, float32[i]));
                        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    // Send PCM bytes to backend
                    ws.send(int16.buffer);
                };

                source.connect(processor);
                processor.connect(audioCtx.destination);
            };

            ws.onmessage = (event) => {
                if (event.data instanceof ArrayBuffer) {
                    // Audio response from Gemini — play it
                    setStatus('speaking');
                    playAudioChunk(event.data);
                } else if (typeof event.data === 'string') {
                    try {
                        const msg = JSON.parse(event.data);

                        if (msg.type === 'text') {
                            // Accumulate transcript
                            setTranscript(prev => prev + msg.content);
                            setStatus('processing');
                        }

                        if (msg.type === 'brief') {
                            console.log('Received brief:', msg.content);
                            (window as any).latestBrief = msg.content;
                            window.dispatchEvent(new CustomEvent('intelBriefReceived', { detail: msg.content }));
                        }

                        if (msg.type === 'globe_action') {
                            console.log('Received globe action:', msg.content);
                            (window as any).latestGlobeAction = msg.content;
                            window.dispatchEvent(new CustomEvent('globeActionReceived', { detail: msg.content }));
                        }

                        if (msg.type === 'news') {
                            console.log('Received news:', msg.content);
                            (window as any).latestNews = msg.content;
                            window.dispatchEvent(new CustomEvent('newsReceived', { detail: msg.content }));
                        }
                    } catch (e) {
                        console.error('Error parsing agent message', e);
                    }
                }
            };

            ws.onclose = () => {
                console.log('Disconnected from Agent WS');
                setStatus('idle');
                setIsListening(false);
            };

            ws.onerror = (e) => {
                console.error('WebSocket error:', e);
                setStatus('idle');
            };

            wsRef.current = ws;
        } catch (err) {
            console.error('Mic access denied or error:', err);
            setStatus('idle');
            setIsListening(false);
        }
    }, [playAudioChunk]);

    const disconnect = useCallback(() => {
        // Stop audio processing
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        // Stop microphone stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        // Clear transcript
        setTranscript('');
        audioQueueRef.current = [];
        isPlayingRef.current = false;
    }, []);

    const toggleListen = useCallback(() => {
        if (isListening) {
            disconnect();
            setIsListening(false);
            setStatus('idle');
        } else {
            setIsListening(true);
            connect();
        }
    }, [isListening, connect, disconnect]);

    // Handle incoming text commands (e.g. from the AI Intel button or command bar)
    useEffect(() => {
        const handleCommand = async (e: any) => {
            const text = e.detail?.text;
            if (!text) return;

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                console.log('Sending text command:', text);
                wsRef.current.send(JSON.stringify({ type: 'text_query', content: text }));
            } else {
                // Auto-connect if not listening
                console.log('Agent not connected. Connecting to handle command:', text);
                await connect();
                // Wait for WS to be open (up to 3s)
                let attempts = 0;
                const checkAndSend = setInterval(() => {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'text_query', content: text }));
                        clearInterval(checkAndSend);
                    }
                    if (++attempts > 30) clearInterval(checkAndSend);
                }, 100);
            }
        };

        window.addEventListener('commandInput', handleCommand);
        return () => window.removeEventListener('commandInput', handleCommand);
    }, [connect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { isListening, status, transcript, toggleListen, setTranscript };
}
