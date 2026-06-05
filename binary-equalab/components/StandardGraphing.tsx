import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, RefreshCw, TrendingUp, Calculator } from 'lucide-react';
import apiService from '../services/apiService';
import MathDisplay from './MathDisplay';
import { translateToEnglish } from '../services/functionDefs';

interface FunctionEntry {
    id: string;
    expression: string;
    color: string;
    visible: boolean;
    showDerivative: boolean;
}

const COLORS = ['#EA580C', '#10B981', '#3B82F6', '#14B8A6', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4'];

const StandardGraphing: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Functions list
    const [functions, setFunctions] = useState<FunctionEntry[]>([]);
    const [newExpression, setNewExpression] = useState('');

    // Integral state
    const [integralA, setIntegralA] = useState<string>('0');
    const [integralB, setIntegralB] = useState<string>('');
    const [integralFnId, setIntegralFnId] = useState<string>('');
    //const [integralResult, setIntegralResult] = useState<number | null>(null);

    // Trace mode
    const [tracePos, setTracePos] = useState<{ x: number; y: number; mathX: number; mathY: number } | null>(null);

    // Viewport state
    const zoomRef = useRef(50); // pixels per unit
    const panRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const [, setTick] = useState(0);

    // Modes & states
    const [graphMode, setGraphMode] = useState<'standard' | 'convolution'>('standard');
    const [convF, setConvF] = useState<string>('abs(x) < 1 ? 1 : 0');
    const [convG, setConvG] = useState<string>('exp(-x*x)');
    const [convT, setConvT] = useState<number>(0);
    const [convResultCurve, setConvResultCurve] = useState<{ x: number; y: number }[]>([]);
    const [isIntegrating, setIsIntegrating] = useState(false);
    
    // Exact/Approx integral state
    const [integralResult, setIntegralResult] = useState<{
        exact?: string;
        latex?: string;
        approx?: number;
    } | null>(null);

    // Parse and evaluate mathematical expression
    const evaluateExpression = useCallback((expr: string, x: number): number | null => {
        try {
            // Translate Spanish definitions to English standard for Math functions
            let englishExpr = translateToEnglish(expr);
            // Handle specific case for "seno"
            englishExpr = englishExpr.replace(/seno/gi, 'sin');

            // Replace common math functions
            let parsed = englishExpr
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

    // Parse limits like -pi, pi, 2*e, etc.
    const parseLimit = useCallback((val: string): number => {
        if (!val.trim()) return NaN;
        try {
            const parsed = val.replace(/pi/gi, 'Math.PI').replace(/e/gi, 'Math.E').replace(/\^/g, '**');
            const fn = new Function(`return ${parsed}`);
            const result = fn();
            return isFinite(result) ? result : NaN;
        } catch {
            return parseFloat(val);
        }
    }, []);

    // Simpson's rule over [-10, 10] for current convT
    const getConvolutionValueAtT = useCallback((): number => {
        const n = 100;
        const h = (10 - (-10)) / n;
        let sum = 0;
        for (let j = 0; j <= n; j++) {
            const tau = -10 + j * h;
            const fVal = evaluateExpression(convF, tau) ?? 0;
            const gVal = evaluateExpression(convG, convT - tau) ?? 0;
            const product = fVal * gVal;
            if (j === 0 || j === n) {
                sum += product;
            } else if (j % 2 === 1) {
                sum += 4 * product;
            } else {
                sum += 2 * product;
            }
        }
        return (h / 3) * sum;
    }, [convF, convG, convT, evaluateExpression]);

    // Precompute the entire convolution curve (f * g)(x)
    const calculateConvolutionCurve = useCallback(() => {
        const points: { x: number; y: number }[] = [];
        const minX = -10;
        const maxX = 10;
        const steps = 100;
        const stepSize = (maxX - minX) / steps;

        for (let i = 0; i <= steps; i++) {
            const t = minX + i * stepSize;
            
            const n = 60;
            const h = (10 - (-10)) / n;
            let sum = 0;

            for (let j = 0; j <= n; j++) {
                const tau = -10 + j * h;
                const fVal = evaluateExpression(convF, tau) ?? 0;
                const gVal = evaluateExpression(convG, t - tau) ?? 0;
                const product = fVal * gVal;

                if (j === 0 || j === n) {
                    sum += product;
                } else if (j % 2 === 1) {
                    sum += 4 * product;
                } else {
                    sum += 2 * product;
                }
            }
            const convVal = (h / 3) * sum;
            if (isFinite(convVal)) {
                points.push({ x: t, y: convVal });
            }
        }
        setConvResultCurve(points);
    }, [convF, convG, evaluateExpression]);

    useEffect(() => {
        if (graphMode === 'convolution') {
            calculateConvolutionCurve();
        }
    }, [graphMode, convF, convG, calculateConvolutionCurve]);

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
                const a = parseLimit(integralA);
                const b = parseLimit(integralB);
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
        if (graphMode === 'standard') {
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
        } else {
            // CONVOLUTION MODE DRAWING
            // 1. Draw static f(tau) in green (#10B981)
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            let startedF = false;
            for (let screenX = 0; screenX < w; screenX += 2) {
                const mathX = (screenX - cx) / zoom;
                const mathY = evaluateExpression(convF, mathX);
                if (mathY !== null && isFinite(mathY)) {
                    const screenY = cy - mathY * zoom;
                    if (!startedF) {
                        ctx.moveTo(screenX, screenY);
                        startedF = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                } else {
                    startedF = false;
                }
            }
            ctx.stroke();
            
            // 2. Draw moving g(t - tau) in blue (#3B82F6)
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            let startedG = false;
            for (let screenX = 0; screenX < w; screenX += 2) {
                const mathX = (screenX - cx) / zoom;
                const mathY = evaluateExpression(convG, convT - mathX);
                if (mathY !== null && isFinite(mathY)) {
                    const screenY = cy - mathY * zoom;
                    if (!startedG) {
                        ctx.moveTo(screenX, screenY);
                        startedG = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                } else {
                    startedG = false;
                }
            }
            ctx.stroke();

            // 3. Draw shaded area of f(tau) * g(t - tau) (orange #F59E0B)
            ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
            ctx.beginPath();
            let startedShade = false;
            for (let screenX = 0; screenX < w; screenX += 2) {
                const mathX = (screenX - cx) / zoom;
                const fVal = evaluateExpression(convF, mathX) ?? 0;
                const gVal = evaluateExpression(convG, convT - mathX) ?? 0;
                const mathY = fVal * gVal;
                
                const screenY = cy - mathY * zoom;
                if (Math.abs(mathY) > 0.001) {
                    if (!startedShade) {
                        ctx.moveTo(screenX, cy);
                        ctx.lineTo(screenX, screenY);
                        startedShade = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                } else {
                    if (startedShade) {
                        ctx.lineTo(screenX, cy);
                        startedShade = false;
                    }
                }
            }
            if (startedShade) {
                ctx.lineTo(w, cy);
            }
            ctx.fill();

            // 4. Draw the convolution result curve (orange #EA580C)
            ctx.strokeStyle = '#EA580C';
            ctx.lineWidth = 3;
            ctx.beginPath();
            let startedC = false;
            convResultCurve.forEach(pt => {
                const screenX = cx + pt.x * zoom;
                const screenY = cy - pt.y * zoom;
                if (screenX >= 0 && screenX <= w) {
                    if (!startedC) {
                        ctx.moveTo(screenX, screenY);
                        startedC = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                }
            });
            ctx.stroke();

            // 5. Draw highlighted dot at current t
            const dotScreenX = cx + convT * zoom;
            const currentConvVal = getConvolutionValueAtT();
            const dotScreenY = cy - currentConvVal * zoom;
            if (dotScreenX >= 0 && dotScreenX <= w && isFinite(dotScreenY)) {
                ctx.fillStyle = '#EA580C';
                ctx.beginPath();
                ctx.arc(dotScreenX, dotScreenY, 6, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
    }, [functions, evaluateExpression, integralFnId, integralA, integralB, tracePos, graphMode, convF, convG, convT, convResultCurve, getConvolutionValueAtT]);

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

        // Trace Cursor Logic - Only active in Standard mode
        if (graphMode !== 'standard') return;

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

    // Definite integration via backend (fallback to Simpson's rule if offline/error)
    const calculateIntegral = useCallback(async () => {
        const fn = functions.find(f => f.id === integralFnId);
        if (!fn) return;

        const a = parseLimit(integralA);
        const b = parseLimit(integralB);
        if (isNaN(a) || isNaN(b) || a >= b) {
            setIntegralResult(null);
            return;
        }

        setIsIntegrating(true);
        try {
            // Translate the expression to English math syntax for the backend
            let translatedExpr = translateToEnglish(fn.expression);
            translatedExpr = translatedExpr.replace(/seno\b/gi, 'sin');

            const response = await apiService.integral(translatedExpr, 'x', a, b);
            if (response.success && response.result) {
                if (response.result.includes('Error') || response.result.includes('failed')) {
                    throw new Error("Backend math error");
                }
                const approxVal = response.approx ? parseFloat(response.approx) : null;
                setIntegralResult({
                    exact: response.result,
                    latex: response.latex,
                    approx: approxVal !== null && !isNaN(approxVal) ? approxVal : undefined
                });
            } else {
                throw new Error("API failed");
            }
        } catch (e) {
            console.warn("Definite integration via backend failed, using numerical fallback:", e);
            const n = 1000;
            const h = (b - a) / n;
            let sum = 0;
            for (let i = 0; i <= n; i++) {
                const x = a + i * h;
                const y = evaluateExpression(fn.expression, x);
                if (y === null) {
                    setIntegralResult(null);
                    setIsIntegrating(false);
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
            const numRes = (h / 3) * sum;
            setIntegralResult({
                approx: numRes
            });
        } finally {
            setIsIntegrating(false);
        }
    }, [integralFnId, integralA, integralB, functions, evaluateExpression, parseLimit]);

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

            {/* Sidebar - Conditional Panel */}
            {graphMode === 'standard' ? (
                <div className="w-full lg:w-80 bg-background-light border-r border-aurora-border flex flex-col shrink-0">
                    <div className="p-4 border-b border-aurora-border">
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <span className="text-primary">f(x)</span> Funciones
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
                                placeholder="ej. x^2 + 2*x"
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
                            <span className="text-xs font-bold uppercase tracking-wider">Integral Definida</span>
                        </div>

                        <select
                            value={integralFnId}
                            onChange={e => setIntegralFnId(e.target.value)}
                            className="w-full px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm mb-2 focus:border-primary focus:outline-none"
                        >
                            <option value="">Selecciona función...</option>
                            {functions.filter(f => f.visible).map(fn => (
                                <option key={fn.id} value={fn.id}>y = {fn.expression}</option>
                            ))}
                        </select>

                        <div className="flex gap-2 mb-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-aurora-muted uppercase">Desde (a)</label>
                                <input
                                    type="text"
                                    value={integralA}
                                    onChange={e => setIntegralA(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-2 py-1.5 bg-background-dark border border-aurora-border rounded text-sm font-mono focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-aurora-muted uppercase">Hasta (b)</label>
                                <input
                                    type="text"
                                    value={integralB}
                                    onChange={e => setIntegralB(e.target.value)}
                                    placeholder="pi"
                                    className="w-full px-2 py-1.5 bg-background-dark border border-aurora-border rounded text-sm font-mono focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        {isIntegrating && (
                            <div className="text-xs text-aurora-muted py-1 flex items-center gap-1.5">
                                <span className="animate-spin text-primary font-bold">↻</span> Calculando área exacta...
                            </div>
                        )}

                        {integralResult && !isIntegrating && (
                            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg space-y-1.5">
                                <div className="text-[10px] text-aurora-muted uppercase tracking-wider">Área bajo la curva:</div>
                                {integralResult.latex && (
                                    <div className="font-mono text-sm flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
                                        <span className="text-primary font-bold">Exacto:</span>
                                        <span className="text-white flex items-center">
                                            <MathDisplay expression={integralResult.latex} isResult inline />
                                        </span>
                                    </div>
                                )}
                                {integralResult.approx !== undefined && (
                                    <div className="font-mono text-xs flex items-center gap-1">
                                        <span className="text-aurora-secondary">≈ Decimal:</span>
                                        <span className="text-[#ffaa00] font-bold">
                                            {integralResult.approx.toFixed(6)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-full lg:w-80 bg-background-light border-r border-aurora-border flex flex-col shrink-0">
                    <div className="p-4 border-b border-aurora-border">
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <span className="text-[#EA580C]">Convolución</span> Real
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-aurora-muted uppercase font-bold tracking-wider block">Función f(x) (Estática - Verde)</label>
                            <input
                                type="text"
                                value={convF}
                                onChange={e => setConvF(e.target.value)}
                                placeholder="ej. abs(x) < 1 ? 1 : 0"
                                className="w-full px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm font-mono focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-aurora-muted uppercase font-bold tracking-wider block">Función g(x) (Desplazable - Azul)</label>
                            <input
                                type="text"
                                value={convG}
                                onChange={e => setConvG(e.target.value)}
                                placeholder="ej. exp(-x*x)"
                                className="w-full px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm font-mono focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2 mt-4">
                            <h4 className="text-xs font-bold uppercase text-primary">Información Matemática</h4>
                            <p className="text-[11px] text-aurora-secondary leading-relaxed">
                                La convolución <MathDisplay expression="(f * g)(t)" inline /> representa el área solapada entre <MathDisplay expression="f(\tau)" inline /> y la señal reflejada/desplazada <MathDisplay expression="g(t - \tau)" inline /> a lo largo del dominio.
                            </p>
                            <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
                                <div className="flex justify-between font-mono">
                                    <span className="text-aurora-muted">Desplazamiento t:</span>
                                    <span className="text-white font-bold">{convT.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-mono">
                                    <span className="text-aurora-muted">Resultado (f * g)(t):</span>
                                    <span className="text-[#EA580C] font-bold">{getConvolutionValueAtT().toFixed(6)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                {graphMode === 'convolution' && (
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-96 p-4 rounded-xl bg-background-light/95 backdrop-blur-md border border-aurora-border shadow-2xl flex flex-col gap-2 z-10">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                            <span>Desplazamiento (t)</span>
                            <span className="font-mono text-primary">{convT.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="-10" max="10" step="0.05"
                            value={convT}
                            onChange={(e) => setConvT(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between items-center text-xs font-mono text-aurora-secondary mt-1">
                            <span>(f * g)({convT.toFixed(2)}) =</span>
                            <span className="text-[#EA580C] font-bold">{getConvolutionValueAtT().toFixed(6)}</span>
                        </div>
                    </div>
                )}

                {/* Mode Toggles */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <button
                        onClick={() => setGraphMode('standard')}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                            graphMode === 'standard'
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-background-light/80 backdrop-blur border-aurora-border text-aurora-text hover:bg-white/5'
                        }`}
                    >
                        Estándar
                    </button>
                    <button
                        onClick={() => setGraphMode('convolution')}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                            graphMode === 'convolution'
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-background-light/80 backdrop-blur border-aurora-border text-aurora-text hover:bg-white/5'
                        }`}
                    >
                        Convolución Real
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StandardGraphing;
