/**
 * Binary EquaLab - Epicycles PRO
 * 
 * Professional Fourier visualization with:
 * - Draw custom shapes → auto-calculate Fourier coefficients
 * - Function input f(t) → animate
 * - Preset waves (square, triangle, sawtooth)
 * - SVG path import (future)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Play, Pause, RefreshCw, ZoomIn, ZoomOut, Settings2,
    Pencil, Trash2, Upload, Move, MousePointer2, Sparkles
} from 'lucide-react';

type WaveType = 'square' | 'triangle' | 'sawtooth' | 'custom';
type InputMode = 'drawing' | 'animation';

interface FourierCoeff {
    freq: number;      // Frequency multiplier
    amplitude: number; // Radius
    phase: number;     // Starting angle
}

// Discrete Fourier Transform for custom drawings
function computeDFT(points: { x: number; y: number }[]): FourierCoeff[] {
    const N = points.length;
    if (N === 0) return [];

    const coefficients: FourierCoeff[] = [];

    for (let k = 0; k < N; k++) {
        let re = 0;
        let im = 0;

        for (let n = 0; n < N; n++) {
            const angle = (2 * Math.PI * k * n) / N;
            re += points[n].x * Math.cos(angle) + points[n].y * Math.sin(angle);
            im += points[n].y * Math.cos(angle) - points[n].x * Math.sin(angle);
        }

        re /= N;
        im /= N;

        const amplitude = Math.sqrt(re * re + im * im);
        const phase = Math.atan2(im, re);

        coefficients.push({
            freq: k,
            amplitude,
            phase
        });
    }

    // Sort by amplitude (largest circles first for visual appeal)
    return coefficients.sort((a, b) => b.amplitude - a.amplitude);
}

const EpicyclesPRO: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mode: drawing or animation
    const [inputMode, setInputMode] = useState<InputMode>('animation');

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawnPoints, setDrawnPoints] = useState<{ x: number; y: number }[]>([]);
    const [fourierCoeffs, setFourierCoeffs] = useState<FourierCoeff[]>([]);

    // Animation state
    const [isPlaying, setIsPlaying] = useState(true);
    const timeRef = useRef({ t: 0 });
    const pathRef = useRef<{ x: number; y: number }[]>([]);

    // Parameters
    const [numCircles, setNumCircles] = useState(50);
    const numCirclesRef = useRef(50);
    const [speed, setSpeed] = useState(1);
    const speedRef = useRef(1);
    const [waveType, setWaveType] = useState<WaveType>('custom');
    const waveTypeRef = useRef<WaveType>('custom');

    // Viewport
    const zoomRef = useRef(1);
    const panRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const [, setTick] = useState(0);

    // Sync refs
    useEffect(() => { numCirclesRef.current = numCircles; }, [numCircles]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => {
        waveTypeRef.current = waveType;
        if (waveType !== 'custom') {
            setFourierCoeffs([]); // Clear custom coefficients when switching to preset
        }
    }, [waveType]);

    // Drawing handlers
    const handleDrawStart = useCallback((e: React.MouseEvent) => {
        if (inputMode !== 'drawing') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setIsDrawing(true);
        setDrawnPoints([{
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        }]);
    }, [inputMode]);

    const handleDrawMove = useCallback((e: React.MouseEvent) => {
        if (!isDrawing || inputMode !== 'drawing') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setDrawnPoints(prev => [...prev, {
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        }]);
    }, [isDrawing, inputMode]);

    const handleDrawEnd = useCallback(() => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (drawnPoints.length > 10) {
            // Sample points evenly for better DFT
            const sampled: { x: number; y: number }[] = [];
            const step = Math.max(1, Math.floor(drawnPoints.length / 200));
            for (let i = 0; i < drawnPoints.length; i += step) {
                sampled.push(drawnPoints[i]);
            }

            // Compute Fourier coefficients
            const coeffs = computeDFT(sampled);
            setFourierCoeffs(coeffs);
            setWaveType('custom');

            // Switch to animation mode
            setInputMode('animation');
            pathRef.current = [];
            timeRef.current.t = 0;
        }
    }, [isDrawing, drawnPoints]);

    // Clear drawing
    const clearDrawing = () => {
        setDrawnPoints([]);
        setFourierCoeffs([]);
        pathRef.current = [];
        timeRef.current.t = 0;
    };

    // Pan/Zoom handlers for animation mode
    const handleWheel = (e: React.WheelEvent) => {
        if (inputMode === 'drawing') return;
        zoomRef.current = Math.max(0.1, Math.min(10, zoomRef.current * (1 - e.deltaY * 0.001)));
        setTick(t => t + 1);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (inputMode === 'drawing') {
            handleDrawStart(e);
        } else {
            isDraggingRef.current = true;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (inputMode === 'drawing') {
            handleDrawMove(e);
        } else if (isDraggingRef.current) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            panRef.current.x += dx;
            panRef.current.y += dy;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        if (inputMode === 'drawing') {
            handleDrawEnd();
        }
        isDraggingRef.current = false;
    };

    // Main animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        let animationFrameId: number;
        let lastTime = performance.now();

        const render = (now: number) => {
            if (!ctx) return;
            const dt = (now - lastTime) * speedRef.current;
            lastTime = now;

            if (isPlaying && inputMode === 'animation') {
                timeRef.current.t += dt * 0.001;
            }

            draw(ctx, canvas.width, canvas.height, timeRef.current.t);
            animationFrameId = requestAnimationFrame(render);
        };
        render(lastTime);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, inputMode, fourierCoeffs, waveType]);

    // Drawing function
    const draw = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        const zoom = zoomRef.current;
        const pan = panRef.current;

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
        ctx.scale(zoom, zoom);

        // Draw grid
        drawGrid(ctx, width, height, zoom);

        if (inputMode === 'drawing') {
            // Draw current path being drawn
            if (drawnPoints.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = '#ff6b35';
                ctx.lineWidth = 3 / zoom;
                ctx.moveTo(drawnPoints[0].x, drawnPoints[0].y);
                for (const pt of drawnPoints) {
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
            }
        } else {
            // Animation mode - draw epicycles
            let x = 0, y = 0;

            if (waveType === 'custom' && fourierCoeffs.length > 0) {
                // Use computed Fourier coefficients
                const maxCircles = Math.min(numCirclesRef.current, fourierCoeffs.length);

                for (let i = 0; i < maxCircles; i++) {
                    const coeff = fourierCoeffs[i];
                    const prevX = x, prevY = y;

                    const angle = coeff.freq * time * 2 * Math.PI + coeff.phase;
                    x += coeff.amplitude * Math.cos(angle);
                    y += coeff.amplitude * Math.sin(angle);

                    // Draw circle
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 1 / zoom;
                    ctx.arc(prevX, prevY, coeff.amplitude, 0, Math.PI * 2);
                    ctx.stroke();

                    // Draw line
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(x, y);
                    ctx.stroke();

                    // Draw dot
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(x, y, 2 / zoom, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Use preset wave formulas
                const baseAmplitude = 100;
                const maxCircles = numCirclesRef.current;

                for (let i = 0; i < maxCircles; i++) {
                    let n: number, radius: number;

                    switch (waveTypeRef.current) {
                        case 'square':
                            n = i * 2 + 1;
                            radius = baseAmplitude * (4 / (n * Math.PI));
                            break;
                        case 'triangle':
                            n = i * 2 + 1;
                            const sign = (i % 2 === 0) ? 1 : -1;
                            radius = baseAmplitude * sign * (8 / (Math.PI * Math.PI * n * n));
                            break;
                        case 'sawtooth':
                            n = i + 1;
                            radius = baseAmplitude * (2 / (n * Math.PI)) * (n % 2 === 0 ? -1 : 1);
                            break;
                        default:
                            n = i * 2 + 1;
                            radius = baseAmplitude * (4 / (n * Math.PI));
                    }

                    const prevX = x, prevY = y;
                    const angle = n * time;
                    x = prevX + radius * Math.cos(angle);
                    y = prevY + radius * Math.sin(angle);

                    // Draw circle
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 1 / zoom;
                    ctx.arc(prevX, prevY, Math.abs(radius), 0, Math.PI * 2);
                    ctx.stroke();

                    // Draw line
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }

            // Store path point
            pathRef.current.push({ x, y });
            if (pathRef.current.length > 2000) {
                pathRef.current.shift();
            }

            // Draw traced path
            if (pathRef.current.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = '#ff6b35';
                ctx.lineWidth = 2 / zoom;
                ctx.moveTo(pathRef.current[0].x, pathRef.current[0].y);
                for (const pt of pathRef.current) {
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
            }

            // Draw final point
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.arc(x, y, 5 / zoom, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, zoom: number) => {
        const step = 50;
        const left = -width / 2 / zoom;
        const right = width / 2 / zoom;
        const top = -height / 2 / zoom;
        const bottom = height / 2 / zoom;

        ctx.lineWidth = 1 / zoom;
        ctx.strokeStyle = '#2f2b26';
        ctx.beginPath();

        for (let i = Math.floor(left / step) * step; i < right; i += step) {
            ctx.moveTo(i, top);
            ctx.lineTo(i, bottom);
        }
        for (let i = Math.floor(top / step) * step; i < bottom; i += step) {
            ctx.moveTo(left, i);
            ctx.lineTo(right, i);
        }
        ctx.stroke();

        // Axes
        ctx.lineWidth = 2 / zoom;
        ctx.strokeStyle = '#57534e';
        ctx.beginPath();
        ctx.moveTo(left, 0); ctx.lineTo(right, 0);
        ctx.moveTo(0, top); ctx.lineTo(0, bottom);
        ctx.stroke();
    };

    const resetView = () => {
        zoomRef.current = 1;
        panRef.current = { x: 0, y: 0 };
        setTick(t => t + 1);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-aurora-bg text-aurora-text overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-80 bg-aurora-surface/50 backdrop-blur-sm border-r border-white/5 flex flex-col z-20 shrink-0 shadow-xl">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-aurora-panel/30">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={16} className="text-aurora-primary" />
                        Epicycles PRO
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-aurora-primary/20 text-aurora-primary border border-aurora-primary/30 font-mono animate-pulse">
                        {inputMode === 'drawing' ? 'DRAW' : 'LIVE'}
                    </span>
                </div>

                <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Input Mode Toggle */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-aurora-muted uppercase">Input Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setInputMode('drawing')}
                                className={`py-3 px-4 text-sm font-bold rounded-lg transition-all border flex items-center justify-center gap-2 ${inputMode === 'drawing'
                                        ? 'bg-aurora-primary text-white border-aurora-primary shadow-lg'
                                        : 'bg-white/5 text-aurora-muted border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <Pencil size={16} />
                                Dibujar
                            </button>
                            <button
                                onClick={() => setInputMode('animation')}
                                className={`py-3 px-4 text-sm font-bold rounded-lg transition-all border flex items-center justify-center gap-2 ${inputMode === 'animation'
                                        ? 'bg-aurora-primary text-white border-aurora-primary shadow-lg'
                                        : 'bg-white/5 text-aurora-muted border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <Play size={16} />
                                Animar
                            </button>
                        </div>
                    </div>

                    {/* Drawing Mode Info */}
                    {inputMode === 'drawing' && (
                        <div className="p-4 rounded-xl bg-aurora-primary/10 border border-aurora-primary/30">
                            <p className="text-sm text-aurora-primary font-medium">
                                ✏️ Dibuja una forma en el canvas. Cuando sueltes, se calcularán los coeficientes de Fourier automáticamente.
                            </p>
                            {drawnPoints.length > 0 && (
                                <button
                                    onClick={clearDrawing}
                                    className="mt-3 w-full py-2 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    Borrar dibujo
                                </button>
                            )}
                        </div>
                    )}

                    {/* Wave Type Selector (for presets) */}
                    {inputMode === 'animation' && (
                        <>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-aurora-muted uppercase">Forma de Onda</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['square', 'triangle', 'sawtooth', 'custom'] as WaveType[]).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setWaveType(type);
                                                pathRef.current = [];
                                                timeRef.current.t = 0;
                                            }}
                                            disabled={type === 'custom' && fourierCoeffs.length === 0}
                                            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border ${waveType === type
                                                    ? 'bg-aurora-primary text-white border-aurora-primary shadow-lg'
                                                    : type === 'custom' && fourierCoeffs.length === 0
                                                        ? 'bg-white/5 text-aurora-muted/50 border-white/5 cursor-not-allowed'
                                                        : 'bg-white/5 text-aurora-muted border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            {type === 'square' && '▭ Cuadrada'}
                                            {type === 'triangle' && '△ Triángulo'}
                                            {type === 'sawtooth' && '⋸ Diente'}
                                            {type === 'custom' && `✏️ Custom${fourierCoeffs.length > 0 ? ` (${fourierCoeffs.length})` : ''}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Harmonics Control */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-aurora-muted uppercase">Armónicos</label>
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 font-mono text-xs text-aurora-primary">{numCircles}</span>
                                </div>
                                <input
                                    type="range" min="1" max={waveType === 'custom' ? Math.max(fourierCoeffs.length, 1) : 100} step="1"
                                    value={numCircles}
                                    onChange={(e) => {
                                        setNumCircles(parseInt(e.target.value));
                                        pathRef.current = [];
                                    }}
                                    className="w-full h-1.5 bg-aurora-panel rounded-lg appearance-none cursor-pointer accent-aurora-primary"
                                />
                            </div>

                            {/* Speed Control */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-aurora-muted uppercase">Velocidad</label>
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 font-mono text-xs text-aurora-primary">{speed.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="5.0" step="0.1"
                                    value={speed}
                                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-aurora-panel rounded-lg appearance-none cursor-pointer accent-aurora-primary"
                                />
                            </div>
                        </>
                    )}

                    {/* Fourier Info */}
                    {waveType === 'custom' && fourierCoeffs.length > 0 && (
                        <div className="p-4 rounded-xl bg-aurora-panel border border-white/5 shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="size-2 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-bold text-white">Fourier Calculado</span>
                            </div>
                            <div className="text-xs text-aurora-muted font-mono">
                                {fourierCoeffs.length} coeficientes
                            </div>
                            <div className="mt-2 text-[10px] text-emerald-500 flex items-center gap-1">
                                <RefreshCw size={10} className="animate-spin" /> Rendering at 60 FPS
                            </div>
                        </div>
                    )}

                    {/* Reset Button */}
                    <button
                        onClick={() => { pathRef.current = []; timeRef.current.t = 0; setTick(t => t + 1); }}
                        className="w-full py-2 text-xs border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Reiniciar Animación
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div
                className="flex-1 relative h-full bg-[#111] overflow-hidden select-none"
                ref={containerRef}
                style={{ cursor: inputMode === 'drawing' ? 'crosshair' : 'grab' }}
            >
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />

                {/* Floating Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-aurora-panel/90 backdrop-blur-md border border-white/10 shadow-2xl z-30">
                    <button
                        onClick={() => { zoomRef.current = Math.max(0.1, zoomRef.current - 0.2); setTick(t => t + 1); }}
                        className="p-3 rounded-xl hover:bg-white/10 text-white transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <div className="w-px h-6 bg-white/10"></div>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="size-12 rounded-xl bg-aurora-primary text-white flex items-center justify-center hover:bg-aurora-primaryHover shadow-[0_0_15px_rgba(234,88,12,0.4)] transition-all active:scale-95"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>
                    <div className="w-px h-6 bg-white/10"></div>
                    <button
                        onClick={() => { zoomRef.current = Math.min(10, zoomRef.current + 0.2); setTick(t => t + 1); }}
                        className="p-3 rounded-xl hover:bg-white/10 text-white transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={20} />
                    </button>
                </div>

                {/* Mode Indicator */}
                <div className="absolute top-6 right-6 flex flex-col items-end pointer-events-none">
                    <h1 className="text-2xl font-bold text-white/20 select-none">EPICYCLES PRO</h1>
                    <div className="flex items-center gap-4 text-white/30 font-mono text-xs mt-1">
                        {inputMode === 'drawing' ? (
                            <span className="flex items-center gap-1"><Pencil size={12} /> Dibuja tu forma</span>
                        ) : (
                            <>
                                <span className="flex items-center gap-1"><MousePointer2 size={12} /> Pan</span>
                                <span className="flex items-center gap-1"><Move size={12} /> Zoom</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EpicyclesPRO;
