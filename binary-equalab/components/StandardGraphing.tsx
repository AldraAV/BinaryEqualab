import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, RefreshCw, TrendingUp, Calculator } from 'lucide-react';

interface FunctionEntry {
    id: string;
    expression: string;
    color: string;
    visible: boolean;
    showDerivative: boolean;
}

const COLORS = ['#EA580C', '#10B981', '#3B82F6', '#A855F7', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4'];

const StandardGraphing: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Functions list
    const [functions, setFunctions] = useState<FunctionEntry[]>([
        { id: '1', expression: 'sin(x)', color: COLORS[0], visible: true, showDerivative: false },
        { id: '2', expression: 'cos(x)', color: COLORS[1], visible: true, showDerivative: false },
    ]);
    const [newExpression, setNewExpression] = useState('');

    // Integral state
    const [integralA, setIntegralA] = useState<string>('0');
    const [integralB, setIntegralB] = useState<string>('');
    const [integralFnId, setIntegralFnId] = useState<string>('');
    const [integralResult, setIntegralResult] = useState<number | null>(null);

    // Trace mode
    const [tracePos, setTracePos] = useState<{ x: number; y: number; mathX: number; mathY: number } | null>(null);

    // Viewport state
    const zoomRef = useRef(50); // pixels per unit
    const panRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const [, setTick] = useState(0);

    // Parse and evaluate mathematical expression
    const evaluateExpression = useCallback((expr: string, x: number): number | null => {
        try {
            // Replace common math functions
            let parsed = expr
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/abs/g, 'Math.abs')
                .replace(/log/g, 'Math.log')
                .replace(/ln/g, 'Math.log')
                .replace(/exp/g, 'Math.exp')
                .replace(/pi/gi, 'Math.PI')
                .replace(/e(?![xp])/g, 'Math.E')
                .replace(/\^/g, '**');

            // Simple function evaluation
            const fn = new Function('x', `return ${parsed}`);
            const result = fn(x);
            return isFinite(result) ? result : null;
        } catch {
            return null;
        }
    }, []);

    // Draw everything
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const zoom = zoomRef.current;
        const panX = panRef.current.x;
        const panY = panRef.current.y;

        // Clear
        ctx.fillStyle = '#0C0A09';
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2 + panX;
        const cy = h / 2 + panY;

        // World bounds in math coordinates
        const left = -cx / zoom;
        const right = (w - cx) / zoom;
        const top = cy / zoom;
        const bottom = -(h - cy) / zoom;

        // Grid
        const gridStep = zoom > 30 ? 1 : zoom > 15 ? 2 : 5;
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Vertical lines
        for (let x = Math.floor(left / gridStep) * gridStep; x <= right; x += gridStep) {
            const screenX = cx + x * zoom;
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, h);
        }
        // Horizontal lines
        for (let y = Math.floor(bottom / gridStep) * gridStep; y <= top; y += gridStep) {
            const screenY = cy - y * zoom;
            ctx.moveTo(0, screenY);
            ctx.lineTo(w, screenY);
        }
        ctx.stroke();

        // Axes
        ctx.strokeStyle = '#57534E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // X axis
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        // Y axis
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#A8A29E';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        // X labels
        for (let x = Math.floor(left / gridStep) * gridStep; x <= right; x += gridStep) {
            if (x === 0) continue;
            const screenX = cx + x * zoom;
            ctx.fillText(x.toString(), screenX, cy + 16);
        }
        // Y labels
        ctx.textAlign = 'right';
        for (let y = Math.floor(bottom / gridStep) * gridStep; y <= top; y += gridStep) {
            if (y === 0) continue;
            const screenY = cy - y * zoom;
            ctx.fillText(y.toString(), cx - 8, screenY + 4);
        }

        // Origin
        ctx.textAlign = 'right';
        ctx.fillText('0', cx - 8, cy + 16);

        // Draw integral shading FIRST (behind functions)
        if (integralFnId && integralA && integralB) {
            const fn = functions.find(f => f.id === integralFnId);
            if (fn && fn.visible) {
                const a = parseFloat(integralA);
                const b = parseFloat(integralB);
                if (!isNaN(a) && !isNaN(b) && a < b) {
                    ctx.beginPath();
                    const startScreenX = cx + a * zoom;
                    ctx.moveTo(startScreenX, cy);

                    for (let mathX = a; mathX <= b; mathX += 0.05) {
                        const mathY = evaluateExpression(fn.expression, mathX);
                        if (mathY !== null) {
                            const screenX = cx + mathX * zoom;
                            const screenY = cy - mathY * zoom;
                            ctx.lineTo(screenX, screenY);
                        }
                    }

                    const endScreenX = cx + b * zoom;
                    ctx.lineTo(endScreenX, cy);
                    ctx.closePath();

                    ctx.fillStyle = fn.color + '30'; // 30% opacity
                    ctx.fill();
                    ctx.strokeStyle = fn.color + '60';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        // Draw functions
        functions.forEach(fn => {
            if (!fn.visible) return;

            // Main function curve
            ctx.strokeStyle = fn.color;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();

            let started = false;

            for (let screenX = 0; screenX < w; screenX += 2) {
                const mathX = (screenX - cx) / zoom;
                const mathY = evaluateExpression(fn.expression, mathX);

                if (mathY !== null && isFinite(mathY)) {
                    const screenY = cy - mathY * zoom;
                    if (!started) {
                        ctx.moveTo(screenX, screenY);
                        started = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                } else {
                    started = false;
                }
            }
            ctx.stroke();

            // Glow effect
            ctx.shadowBlur = 8;
            ctx.shadowColor = fn.color;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw derivative if enabled
            if (fn.showDerivative) {
                ctx.strokeStyle = fn.color + 'AA'; // Slightly transparent
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 4]); // Dashed line
                ctx.beginPath();

                let derivStarted = false;
                const h = 0.0001; // Step for numerical derivative

                for (let screenX = 0; screenX < w; screenX += 2) {
                    const mathX = (screenX - cx) / zoom;
                    const yPlus = evaluateExpression(fn.expression, mathX + h);
                    const yMinus = evaluateExpression(fn.expression, mathX - h);

                    if (yPlus !== null && yMinus !== null) {
                        const derivative = (yPlus - yMinus) / (2 * h);
                        if (isFinite(derivative)) {
                            const screenY = cy - derivative * zoom;
                            if (!derivStarted) {
                                ctx.moveTo(screenX, screenY);
                                derivStarted = true;
                            } else {
                                ctx.lineTo(screenX, screenY);
                            }
                        } else {
                            derivStarted = false;
                        }
                    } else {
                        derivStarted = false;
                    }
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        // Draw trace cursor if active
        if (tracePos) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            // Vertical line
            ctx.beginPath();
            ctx.moveTo(tracePos.x, 0);
            ctx.lineTo(tracePos.x, h);
            ctx.stroke();
            // Horizontal line
            ctx.beginPath();
            ctx.moveTo(0, tracePos.y);
            ctx.lineTo(w, tracePos.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Coordinate label
            ctx.fillStyle = '#EA580C';
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`(${tracePos.mathX.toFixed(2)}, ${tracePos.mathY.toFixed(2)})`, tracePos.x + 10, tracePos.y - 10);
        }

    }, [functions, evaluateExpression, integralFnId, integralA, integralB, tracePos]);

    // Setup canvas and animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resize = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            draw();
        };

        window.addEventListener('resize', resize);
        resize();

        return () => window.removeEventListener('resize', resize);
    }, [draw]);

    // Redraw when functions change
    useEffect(() => {
        draw();
    }, [functions, draw]);

    // Interaction handlers
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomRef.current = Math.min(Math.max(10, zoomRef.current * delta), 200);
        draw();
        setTick(t => t + 1);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Panning
        if (isDraggingRef.current) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            panRef.current.x += dx;
            panRef.current.y += dy;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            draw();
            return;
        }

        // Trace Cursor Logic
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert screen X to math X
        const zoom = zoomRef.current;
        const cx = canvas.width / 2 + panRef.current.x;
        const cy = canvas.height / 2 + panRef.current.y;
        const mathX = (x - cx) / zoom;

        // STRICT SNAP: Only show if close to a function
        let snapY: number | null = null;

        for (const fn of functions) {
            if (fn.visible) {
                const val = evaluateExpression(fn.expression, mathX);
                if (val !== null && isFinite(val)) {
                    // Check if mouse is close to this y (in screen pixels)
                    const screenY = cy - val * zoom;
                    if (Math.abs(screenY - y) < 30) { // 30px snap radius (generous for UX)
                        snapY = val;

                        // Simple Root Detection: If extremely close to 0, snap to 0
                        if (Math.abs(val) < (0.1 / (zoom / 50))) { // Dynamic tolerance based on zoom
                            snapY = 0;
                        }
                        break; // Snap to first found
                    }
                }
            }
        }

        if (snapY !== null) {
            setTracePos({
                x: x,
                y: cy - snapY * zoom,
                mathX: mathX,
                mathY: snapY
            });
        } else {
            setTracePos(null); // Hide cursor if not on graph
        }
        // We need to re-draw to show the cursor, but setTracePos triggers re-render? 
        // Actually, setTracePos updates state, which triggers React render. 
        // BUT our draw() is inside useEffect dependent on tracePos (added in previous step). 
        // So just setting state is enough.
    };

    const handleMouseLeave = () => {
        isDraggingRef.current = false;
        setTracePos(null);
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    const addFunction = () => {
        if (!newExpression.trim()) return;
        const newFn: FunctionEntry = {
            id: Date.now().toString(),
            expression: newExpression.trim(),
            color: COLORS[functions.length % COLORS.length],
            visible: true,
            showDerivative: false,
        };
        setFunctions([...functions, newFn]);
        setNewExpression('');
    };

    const removeFunction = (id: string) => {
        setFunctions(functions.filter(f => f.id !== id));
        if (integralFnId === id) {
            setIntegralFnId('');
            setIntegralResult(null);
        }
    };

    const toggleVisibility = (id: string) => {
        setFunctions(functions.map(f => f.id === id ? { ...f, visible: !f.visible } : f));
    };

    const toggleDerivative = (id: string) => {
        setFunctions(functions.map(f => f.id === id ? { ...f, showDerivative: !f.showDerivative } : f));
    };

    // Numerical integration using Simpson's rule
    const calculateIntegral = useCallback(() => {
        const fn = functions.find(f => f.id === integralFnId);
        if (!fn) return;

        const a = parseFloat(integralA);
        const b = parseFloat(integralB);
        if (isNaN(a) || isNaN(b) || a >= b) {
            setIntegralResult(null);
            return;
        }

        const n = 1000; // Number of intervals
        const h = (b - a) / n;
        let sum = 0;

        for (let i = 0; i <= n; i++) {
            const x = a + i * h;
            const y = evaluateExpression(fn.expression, x);
            if (y === null) {
                setIntegralResult(null);
                return;
            }

            if (i === 0 || i === n) {
                sum += y;
            } else if (i % 2 === 1) {
                sum += 4 * y;
            } else {
                sum += 2 * y;
            }
        }

        setIntegralResult((h / 3) * sum);
    }, [integralFnId, integralA, integralB, functions, evaluateExpression]);

    // Calculate integral when parameters change
    useEffect(() => {
        if (integralFnId && integralA && integralB) {
            calculateIntegral();
        }
    }, [integralFnId, integralA, integralB, calculateIntegral]);

    const resetView = () => {
        zoomRef.current = 50;
        panRef.current = { x: 0, y: 0 };
        draw();
        setTick(t => t + 1);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-background text-aurora-text overflow-hidden">

            {/* Sidebar - Function List */}
            <div className="w-full lg:w-80 bg-background-light border-r border-aurora-border flex flex-col shrink-0">
                <div className="p-4 border-b border-aurora-border">
                    <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="text-primary">f(x)</span> Functions
                    </h2>
                </div>

                {/* Function List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {functions.map(fn => (
                        <div
                            key={fn.id}
                            className={`p-3 rounded-lg border transition-all ${fn.visible ? 'bg-background border-aurora-border' : 'bg-background/50 border-transparent opacity-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleVisibility(fn.id)}
                                    className="size-4 rounded-full shrink-0 border-2"
                                    style={{
                                        backgroundColor: fn.visible ? fn.color : 'transparent',
                                        borderColor: fn.color
                                    }}
                                    title="Toggle visibility"
                                />
                                <span className="flex-1 font-mono text-sm truncate">
                                    y = {fn.expression}
                                </span>
                                <button
                                    onClick={() => toggleDerivative(fn.id)}
                                    className={`p-1 transition-colors rounded ${fn.showDerivative ? 'text-primary bg-primary/20' : 'text-aurora-muted hover:text-primary'}`}
                                    title="Show f'(x)"
                                >
                                    <TrendingUp size={16} />
                                </button>
                                <button
                                    onClick={() => removeFunction(fn.id)}
                                    className="p-1 text-aurora-muted hover:text-aurora-danger transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {fn.showDerivative && (
                                <div className="mt-2 pl-7 text-xs text-aurora-muted font-mono flex items-center gap-1">
                                    <span style={{ color: fn.color + 'AA' }}>---</span> f'(x)
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Function */}
                <div className="p-3 border-t border-aurora-border">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newExpression}
                            onChange={e => setNewExpression(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addFunction()}
                            placeholder="e.g., x^2 + 2*x"
                            className="flex-1 px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm font-mono focus:border-primary focus:outline-none"
                        />
                        <button
                            onClick={addFunction}
                            className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Integral Calculator */}
                <div className="p-3 border-t border-aurora-border bg-background/50">
                    <div className="flex items-center gap-2 mb-3">
                        <Calculator size={16} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">Definite Integral</span>
                    </div>

                    <select
                        value={integralFnId}
                        onChange={e => setIntegralFnId(e.target.value)}
                        className="w-full px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm mb-2 focus:border-primary focus:outline-none"
                    >
                        <option value="">Select function...</option>
                        {functions.filter(f => f.visible).map(fn => (
                            <option key={fn.id} value={fn.id}>y = {fn.expression}</option>
                        ))}
                    </select>

                    <div className="flex gap-2 mb-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-aurora-muted uppercase">From (a)</label>
                            <input
                                type="text"
                                value={integralA}
                                onChange={e => setIntegralA(e.target.value)}
                                placeholder="0"
                                className="w-full px-2 py-1.5 bg-background-dark border border-aurora-border rounded text-sm font-mono focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-aurora-muted uppercase">To (b)</label>
                            <input
                                type="text"
                                value={integralB}
                                onChange={e => setIntegralB(e.target.value)}
                                placeholder="π"
                                className="w-full px-2 py-1.5 bg-background-dark border border-aurora-border rounded text-sm font-mono focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {integralResult !== null && (
                        <div className="p-2 bg-primary/10 border border-primary/30 rounded-lg">
                            <span className="text-xs text-aurora-muted">∫ f(x) dx =</span>
                            <span className="ml-2 font-mono font-bold text-primary">{integralResult.toFixed(6)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                className="flex-1 relative h-full bg-background-dark overflow-hidden cursor-grab active:cursor-grabbing"
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
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-background-light/90 backdrop-blur-md border border-aurora-border shadow-2xl">
                    <button
                        onClick={() => { zoomRef.current = Math.max(10, zoomRef.current * 0.8); draw(); setTick(t => t + 1); }}
                        className="p-3 rounded-xl hover:bg-white/10 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <div className="w-px h-6 bg-aurora-border" />
                    <button
                        onClick={resetView}
                        className="size-12 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover shadow-lg transition-all active:scale-95"
                        title="Reset View"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <div className="w-px h-6 bg-aurora-border" />
                    <button
                        onClick={() => { zoomRef.current = Math.min(200, zoomRef.current * 1.2); draw(); setTick(t => t + 1); }}
                        className="p-3 rounded-xl hover:bg-white/10 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={20} />
                    </button>
                </div>

                {/* View Info */}
                <div className="absolute top-4 right-4 text-xs font-mono text-aurora-muted opacity-50">
                    <div>Zoom: {Math.round(zoomRef.current)}px/unit</div>
                </div>

                {/* Convolution Control Panel */}
                {functions.some(f => f.id === 'conv_result') && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-96 p-4 rounded-xl bg-background-light/95 backdrop-blur-md border border-aurora-border shadow-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                            <span>Convolución (t)</span>
                            <span className="font-mono text-primary">{tracePos?.mathX?.toFixed(2) || "0.00"}</span>
                        </div>
                        <input
                            type="range"
                            min="-10" max="10" step="0.05"
                            defaultValue="0"
                            onInput={(e) => {
                                const t = parseFloat((e.target as HTMLInputElement).value);
                                // Update functions to simulate sliding
                                // We can't easily update 'expression' string for g(t-x) efficiently here without parsing overhead
                                // Instead, we'll use a special global ref for 't' or update a state that the draw loop reads
                                // For this MVP, we will rely on the tracePos or just force a re-render

                                // Actually, let's update the 'g' function expression to be g(t - x) visually? No, that's g(x-t).
                                // Convolution is Integral f(tau)g(t-tau).
                                // We are plotting against 'tau' (x-axis).
                                // So f(x) stays static. g(t-x) moves.

                                // Let's update the expression of the second function directly
                                setFunctions(prev => prev.map(f => {
                                    if (f.id === 'g') {
                                        // g(x) was exp(-x*x), we want g(t-x) -> exp(-(t-x)*(t-x))
                                        // We need to inject the value of t
                                        return { ...f, expression: `Math.exp(-(${t}-x)*(${t}-x))` };
                                        // Note: Users passed "x", we need to replace x with (t-x) in their raw string?
                                        // Too complex for generic raw string.
                                        // For the Demo, we hardcode the known "g" generic form or just update the variable.
                                    }
                                    return f;
                                }));
                            }}
                            className="w-full h-1.5 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="text-[10px] text-aurora-muted text-center mt-1">
                            Desliza para mover la función azul (g) sobre la verde (f)
                        </div>
                    </div>
                )}

                {/* Mode Toggles */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <button
                        onClick={() => {
                            setFunctions([
                                { id: '1', expression: 'sin(x)', color: COLORS[0], visible: true, showDerivative: false },
                                { id: '2', expression: 'cos(x)', color: COLORS[1], visible: true, showDerivative: false },
                            ]);
                        }}
                        className="px-3 py-1.5 bg-background-light/80 backdrop-blur border border-aurora-border rounded-lg text-xs font-bold hover:bg-white/5"
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => {
                            setFunctions([
                                { id: 'f', expression: 'Math.abs(x) < 1 ? 1 : 0', color: '#10B981', visible: true, showDerivative: false },
                                { id: 'g', expression: 'Math.exp(-(0-x)*(0-x))', color: '#3B82F6', visible: true, showDerivative: false },
                                { id: 'conv_result', expression: '0', color: '#F59E0B', visible: false, showDerivative: false } // Hidden placeholder to trigger UI
                            ]);
                        }}
                        className="px-3 py-1.5 bg-background-light/80 backdrop-blur border border-aurora-border rounded-lg text-xs font-bold hover:bg-white/5 text-aurora-primary"
                    >
                        Convolución Demo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StandardGraphing;
