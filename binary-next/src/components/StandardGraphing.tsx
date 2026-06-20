"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, RefreshCw, TrendingUp, Calculator } from 'lucide-react';
import apiService from '../services/apiService';
import MathDisplay from './MathDisplay';

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

    const [functions, setFunctions] = useState<FunctionEntry[]>([]);
    const [newExpression, setNewExpression] = useState('');

    const [integralA, setIntegralA] = useState<string>('0');
    const [integralB, setIntegralB] = useState<string>('');
    const [integralFnId, setIntegralFnId] = useState<string>('');

    const [tracePos, setTracePos] = useState<{ x: number; y: number; mathX: number; mathY: number } | null>(null);

    const zoomRef = useRef(50);
    const panRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const [tick, setTick] = useState(0);

    const [graphMode, setGraphMode] = useState<'standard' | 'convolution'>('standard');

    // Server Cache
    const [mathX, setMathX] = useState<number[]>([]);
    const [mathCache, setMathCache] = useState<Record<string, (number | null)[]>>({});
    const [derivCache, setDerivCache] = useState<Record<string, (number | null)[]>>({});

    const [convF, setConvF] = useState<string>('Heaviside(1 - abs(x))');
    const [convG, setConvG] = useState<string>('exp(-x*x)');
    const [convT, setConvT] = useState<number>(0);
    const [convResultCurve, setConvResultCurve] = useState<{ x: number; y: number }[]>([]);
    const [convAreaX, setConvAreaX] = useState<number[]>([]);
    const [convAreaY, setConvAreaY] = useState<number[]>([]);
    const [convCurrentVal, setConvCurrentVal] = useState<number>(0);

    const [isIntegrating, setIsIntegrating] = useState(false);
    const [integralResult, setIntegralResult] = useState<{
        exact?: string;
        latex?: string;
        approx?: number;
        numA?: number;
        numB?: number;
    } | null>(null);

    // Backend Fetch for Standard Mode
    useEffect(() => {
        if (graphMode !== 'standard' || functions.length === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const w = canvas.width;
        const zoom = zoomRef.current;
        const cx = w / 2 + panRef.current.x;
        const left = -cx / zoom;
        const right = (w - cx) / zoom;
        const pts = Math.floor(w / 2);

        const expressions = functions.map(f => f.expression);
        const visibleFuncs = functions.filter(f => f.visible);

        if (visibleFuncs.length > 0) {
            const timeoutId = setTimeout(async () => {
                try {
                    const { translateToEnglish } = await import('../services/functionDefs');
                    const translatedExprs = expressions.map(e => translateToEnglish(e));
                    
                    const res = await apiService.graphicsEvaluate(translatedExprs, left, right, pts);
                    setMathX(res.x);
                    const newCache: Record<string, (number | null)[]> = {};
                    expressions.forEach((expr, idx) => {
                        newCache[expr] = res.y_curves[idx];
                    });
                    setMathCache(newCache);

                    const derivFuncs = functions.filter(f => f.showDerivative);
                    if (derivFuncs.length > 0) {
                        const dCache: Record<string, (number | null)[]> = {};
                        for (const df of derivFuncs) {
                            const translatedDeriv = translateToEnglish(df.expression);
                            const dRes = await apiService.graphicsDerivative(translatedDeriv, left, right, pts);
                            dCache[df.expression] = dRes.y;
                        }
                        setDerivCache(dCache);
                    }
                } catch (e) {
                    console.error("Graphics API error:", e);
                }
            }, 50);
            return () => clearTimeout(timeoutId);
        }
    }, [functions, graphMode, panRef.current.x, panRef.current.y, zoomRef.current, tick]);

    // Backend Fetch for Convolution Mode
    useEffect(() => {
        if (graphMode !== 'convolution') return;
        const timeoutId = setTimeout(async () => {
            try {
                const { translateToEnglish } = await import('../services/functionDefs');
                const tConvF = translateToEnglish(convF);
                const tConvG = translateToEnglish(convG);

                const res = await apiService.graphicsConvolution(tConvF, tConvG, convT);
                const curve = res.curve_x.map((x: number, i: number) => ({ x, y: res.curve_y[i] }));
                setConvResultCurve(curve);
                setConvAreaX(res.area_x);
                setConvAreaY(res.area_y);
                setConvCurrentVal(res.current_val);

                // Eval convF and convG so we can draw them
                const canvas = canvasRef.current;
                if (canvas) {
                    const w = canvas.width;
                    const zoom = zoomRef.current;
                    const cx = w / 2 + panRef.current.x;
                    const left = -cx / zoom;
                    const right = (w - cx) / zoom;
                    const pts = Math.floor(w / 2);
                    
                    const evalRes = await apiService.graphicsEvaluate([tConvF, tConvG], left, right, pts);
                    setMathX(evalRes.x);
                    setMathCache({
                        [convF]: evalRes.y_curves[0],
                        [convG]: evalRes.y_curves[1]
                    });
                }
            } catch (e) {
                console.error("Convolution API error:", e);
            }
        }, 50);
        return () => clearTimeout(timeoutId);
    }, [convF, convG, convT, graphMode, panRef.current.x, panRef.current.y, zoomRef.current, tick]);


    const getCachedY = useCallback((expr: string, targetX: number): number | null => {
        if (!mathCache[expr] || mathX.length === 0) return null;
        let minDiff = Infinity;
        let closestIdx = 0;
        for (let i = 0; i < mathX.length; i++) {
            const diff = Math.abs(mathX[i] - targetX);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
            }
        }
        return mathCache[expr][closestIdx];
    }, [mathCache, mathX]);

    const calculateIntegral = useCallback(async () => {
        const fn = functions.find(f => f.id === integralFnId);
        if (!fn || !integralA || !integralB) return;

        setIsIntegrating(true);
        try {
            const { translateToEnglish } = await import('../services/functionDefs');
            const translatedExpr = translateToEnglish(fn.expression);
            const translatedA = translateToEnglish(integralA);
            const translatedB = translateToEnglish(integralB);
            const response = await apiService.integral(translatedExpr, 'x', translatedA as any, translatedB as any);
            if (response.success && response.result) {
                if (response.result.includes('Error') || response.result.includes('failed')) {
                    throw new Error("Backend math error");
                }
                const approxVal = response.approx ? parseFloat(response.approx) : null;
                setIntegralResult({
                    exact: response.result,
                    latex: response.latex,
                    approx: approxVal !== null && !isNaN(approxVal) ? approxVal : undefined,
                    numA: response.num_a,
                    numB: response.num_b
                });
            } else {
                throw new Error("API failed");
            }
        } catch (e) {
            console.error("Integration error:", e);
            setIntegralResult(null);
        } finally {
            setIsIntegrating(false);
        }
    }, [integralFnId, integralA, integralB, functions]);

    useEffect(() => {
        if (integralFnId && integralA && integralB) {
            const timeoutId = setTimeout(() => {
                calculateIntegral();
            }, 600);
            return () => clearTimeout(timeoutId);
        }
    }, [integralFnId, integralA, integralB, calculateIntegral]);

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

        ctx.fillStyle = '#0C0A09';
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2 + panX;
        const cy = h / 2 + panY;

        const left = -cx / zoom;
        const right = (w - cx) / zoom;
        const top = cy / zoom;
        const bottom = -(h - cy) / zoom;

        const gridStep = zoom > 30 ? 1 : zoom > 15 ? 2 : 5;
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = Math.floor(left / gridStep) * gridStep; x <= right; x += gridStep) {
            const screenX = cx + x * zoom;
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, h);
        }
        for (let y = Math.floor(bottom / gridStep) * gridStep; y <= top; y += gridStep) {
            const screenY = cy - y * zoom;
            ctx.moveTo(0, screenY);
            ctx.lineTo(w, screenY);
        }
        ctx.stroke();

        ctx.strokeStyle = '#57534E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();

        ctx.fillStyle = '#A8A29E';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        for (let x = Math.floor(left / gridStep) * gridStep; x <= right; x += gridStep) {
            if (x === 0) continue;
            const screenX = cx + x * zoom;
            ctx.fillText(x.toString(), screenX, cy + 16);
        }
        ctx.textAlign = 'right';
        for (let y = Math.floor(bottom / gridStep) * gridStep; y <= top; y += gridStep) {
            if (y === 0) continue;
            const screenY = cy - y * zoom;
            ctx.fillText(y.toString(), cx - 8, screenY + 4);
        }

        ctx.textAlign = 'right';
        ctx.fillText('0', cx - 8, cy + 16);

        if (graphMode === 'standard') {
            functions.forEach(fn => {
                if (!fn.visible) return;

                ctx.strokeStyle = fn.color;
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
                ctx.beginPath();

                let started = false;
                const yArr = mathCache[fn.expression];
                if (yArr && mathX.length > 0) {
                    for (let i = 0; i < mathX.length; i++) {
                        const mx = mathX[i];
                        const my = yArr[i];
                        if (my !== null && isFinite(my)) {
                            const screenX = cx + mx * zoom;
                            const screenY = cy - my * zoom;
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
                }
                ctx.stroke();

                ctx.shadowBlur = 8;
                ctx.shadowColor = fn.color;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Dibujar el área de la integral si corresponde
                if (integralFnId === fn.id && integralResult?.numA !== undefined && integralResult?.numB !== undefined) {
                    const { numA, numB } = integralResult;
                    ctx.fillStyle = fn.color + '33'; // 20% opacidad
                    ctx.beginPath();
                    let startedShade = false;
                    
                    const minX = Math.min(numA, numB);
                    const maxX = Math.max(numA, numB);

                    if (yArr && mathX.length > 0) {
                        for (let i = 0; i < mathX.length; i++) {
                            const mx = mathX[i];
                            if (mx >= minX && mx <= maxX) {
                                const my = yArr[i];
                                if (my !== null && isFinite(my)) {
                                    const screenX = cx + mx * zoom;
                                    const screenY = cy - my * zoom;
                                    
                                    if (!startedShade) {
                                        ctx.moveTo(screenX, cy);
                                        ctx.lineTo(screenX, screenY);
                                        startedShade = true;
                                    } else {
                                        ctx.lineTo(screenX, screenY);
                                    }
                                }
                            }
                        }
                        if (startedShade) {
                            // Encontrar el último punto válido y cerrar
                            for (let i = mathX.length - 1; i >= 0; i--) {
                                const mx = mathX[i];
                                if (mx >= minX && mx <= maxX) {
                                    const screenX = cx + mx * zoom;
                                    ctx.lineTo(screenX, cy);
                                    break;
                                }
                            }
                        }
                    }
                    ctx.fill();
                }

                if (fn.showDerivative) {
                    ctx.strokeStyle = fn.color + 'AA';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([6, 4]);
                    ctx.beginPath();

                    let derivStarted = false;
                    const dyArr = derivCache[fn.expression];
                    if (dyArr && mathX.length > 0) {
                        for (let i = 0; i < mathX.length; i++) {
                            const mx = mathX[i];
                            const my = dyArr[i];
                            if (my !== null && isFinite(my)) {
                                const screenX = cx + mx * zoom;
                                const screenY = cy - my * zoom;
                                if (!derivStarted) {
                                    ctx.moveTo(screenX, screenY);
                                    derivStarted = true;
                                } else {
                                    ctx.lineTo(screenX, screenY);
                                }
                            } else {
                                derivStarted = false;
                            }
                        }
                    }
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });
        } else {
            // Convolution Mode
            const yArrF = mathCache[convF];
            if (yArrF && mathX.length > 0) {
                ctx.strokeStyle = '#10B981';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                let startedF = false;
                for (let i = 0; i < mathX.length; i++) {
                    const mx = mathX[i];
                    const my = yArrF[i];
                    if (my !== null && isFinite(my)) {
                        const screenX = cx + mx * zoom;
                        const screenY = cy - my * zoom;
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
            }

            const yArrG = mathCache[convG];
            if (yArrG && mathX.length > 0) {
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                let startedG = false;
                for (let i = 0; i < mathX.length; i++) {
                    const mx = mathX[i];
                    const my = yArrG[i];
                    if (my !== null && isFinite(my)) {
                        const screenX = cx + mx * zoom;
                        const screenY = cy - my * zoom;
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
            }

            // Shade
            ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
            ctx.beginPath();
            let startedShade = false;
            for (let i = 0; i < convAreaX.length; i++) {
                const mx = convAreaX[i];
                const my = convAreaY[i];
                const screenX = cx + mx * zoom;
                const screenY = cy - my * zoom;
                if (Math.abs(my) > 0.001) {
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
            if (startedShade) ctx.lineTo(w, cy);
            ctx.fill();

            // Result curve
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

            const dotScreenX = cx + convT * zoom;
            const dotScreenY = cy - convCurrentVal * zoom;
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
    }, [functions, mathX, mathCache, derivCache, convResultCurve, convAreaX, convAreaY, convT, convCurrentVal, graphMode, convF, convG, integralResult, integralFnId]);

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

    useEffect(() => { draw(); }, [draw, mathCache, derivCache, integralResult]);

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
        if (isDraggingRef.current) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            panRef.current.x += dx;
            panRef.current.y += dy;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            draw();
            return;
        }

        if (graphMode !== 'standard') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const zoom = zoomRef.current;
        const cx = canvas.width / 2 + panRef.current.x;
        const cy = canvas.height / 2 + panRef.current.y;
        const mx = (x - cx) / zoom;

        let snapY: number | null = null;
        for (const fn of functions) {
            if (fn.visible) {
                const val = getCachedY(fn.expression, mx);
                if (val !== null && isFinite(val)) {
                    const screenY = cy - val * zoom;
                    if (Math.abs(screenY - y) < 30) {
                        snapY = val;
                        if (Math.abs(val) < (0.1 / (zoom / 50))) snapY = 0;
                        break;
                    }
                }
            }
        }

        if (snapY !== null) {
            setTracePos({ x: x, y: cy - snapY * zoom, mathX: mx, mathY: snapY });
        } else {
            setTracePos(null);
        }
    };

    const handleMouseLeave = () => { isDraggingRef.current = false; setTracePos(null); };
    const handleMouseUp = () => { isDraggingRef.current = false; };

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

    const resetView = () => {
        zoomRef.current = 50;
        panRef.current = { x: 0, y: 0 };
        draw();
        setTick(t => t + 1);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-background text-aurora-text overflow-hidden">
            {graphMode === 'standard' ? (
                <div className="w-full lg:w-80 bg-background-light border-r border-aurora-border flex flex-col shrink-0">
                    <div className="p-4 border-b border-aurora-border">
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <span className="text-primary">f(x)</span> Funciones
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {functions.map(fn => (
                            <div key={fn.id} className={`p-3 rounded-lg border transition-all ${fn.visible ? 'bg-background border-aurora-border' : 'bg-background/50 border-transparent opacity-50'}`}>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleVisibility(fn.id)} className="size-4 rounded-full shrink-0 border-2" style={{ backgroundColor: fn.visible ? fn.color : 'transparent', borderColor: fn.color }} title="Toggle visibility" />
                                    <span className="flex-1 font-mono text-sm truncate">y = {fn.expression}</span>
                                    <button onClick={() => toggleDerivative(fn.id)} className={`p-1 transition-colors rounded ${fn.showDerivative ? 'text-primary bg-primary/20' : 'text-aurora-muted hover:text-primary'}`} title="Show f'(x)">
                                        <TrendingUp size={16} />
                                    </button>
                                    <button onClick={() => removeFunction(fn.id)} className="p-1 text-aurora-muted hover:text-aurora-danger transition-colors" title="Delete">
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

                    <div className="p-3 border-t border-aurora-border">
                        <div className="flex gap-2">
                            <input type="text" value={newExpression} onChange={e => setNewExpression(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFunction()} placeholder="ej. x^2 + 2*x" className="flex-1 px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm font-mono focus:border-primary focus:outline-none" />
                            <button onClick={addFunction} className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-3 border-t border-aurora-border bg-background/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Calculator size={16} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider">Integral Definida</span>
                        </div>

                        <select value={integralFnId} onChange={e => setIntegralFnId(e.target.value)} className="w-full px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm mb-2 focus:border-primary focus:outline-none">
                            <option value="">Selecciona función...</option>
                            {functions.filter(f => f.visible).map(fn => (
                                <option key={fn.id} value={fn.id}>y = {fn.expression}</option>
                            ))}
                        </select>

                        <div className="flex gap-2 mb-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-aurora-muted uppercase">Desde (a)</label>
                                <input type="text" value={integralA} onChange={e => setIntegralA(e.target.value)} placeholder="0" className="w-full px-2 py-1.5 bg-background-dark border border-aurora-border rounded text-sm font-mono focus:border-primary focus:outline-none" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-aurora-muted uppercase">Hasta (b)</label>
                                <input type="text" value={integralB} onChange={e => setIntegralB(e.target.value)} placeholder="pi" className="w-full px-2 py-1.5 bg-background-dark border border-aurora-border rounded text-sm font-mono focus:border-primary focus:outline-none" />
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
                            <input type="text" value={convF} onChange={e => setConvF(e.target.value)} placeholder="ej. Heaviside(1 - abs(x))" className="w-full px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm font-mono focus:border-primary focus:outline-none" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-aurora-muted uppercase font-bold tracking-wider block">Función g(x) (Desplazable - Azul)</label>
                            <input type="text" value={convG} onChange={e => setConvG(e.target.value)} placeholder="ej. exp(-x*x)" className="w-full px-3 py-2 bg-background-dark border border-aurora-border rounded-lg text-sm font-mono focus:border-primary focus:outline-none" />
                        </div>

                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2 mt-4">
                            <h4 className="text-xs font-bold uppercase text-primary">Información Matemática</h4>
                            <p className="text-[11px] text-aurora-secondary leading-relaxed">
                                La convolución <MathDisplay expression="(f * g)(t)" inline /> representa el área solapada entre <MathDisplay expression="f(	au)" inline /> y la señal reflejada/desplazada <MathDisplay expression="g(t - 	au)" inline /> a lo largo del dominio.
                            </p>
                            <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
                                <div className="flex justify-between font-mono">
                                    <span className="text-aurora-muted">Desplazamiento t:</span>
                                    <span className="text-white font-bold">{convT.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-mono">
                                    <span className="text-aurora-muted">Resultado (f * g)(t):</span>
                                    <span className="text-[#EA580C] font-bold">{convCurrentVal.toFixed(6)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={containerRef} className="flex-1 relative h-full bg-background-dark overflow-hidden cursor-grab active:cursor-grabbing">
                <canvas ref={canvasRef} className="block w-full h-full" onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-background-light/90 backdrop-blur-md border border-aurora-border shadow-2xl">
                    <button onClick={() => { zoomRef.current = Math.max(10, zoomRef.current * 0.8); draw(); setTick(t => t + 1); }} className="p-3 rounded-xl hover:bg-white/10 transition-colors" title="Zoom Out">
                        <ZoomOut size={20} />
                    </button>
                    <div className="w-px h-6 bg-aurora-border" />
                    <button onClick={resetView} className="size-12 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover shadow-lg transition-all active:scale-95" title="Reset View">
                        <RefreshCw size={20} />
                    </button>
                    <div className="w-px h-6 bg-aurora-border" />
                    <button onClick={() => { zoomRef.current = Math.min(200, zoomRef.current * 1.2); draw(); setTick(t => t + 1); }} className="p-3 rounded-xl hover:bg-white/10 transition-colors" title="Zoom In">
                        <ZoomIn size={20} />
                    </button>
                </div>

                <div className="absolute top-4 right-4 text-xs font-mono text-aurora-muted opacity-50">
                    <div>Zoom: {Math.round(zoomRef.current)}px/unit</div>
                </div>

                {graphMode === 'convolution' && (
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-96 p-4 rounded-xl bg-background-light/95 backdrop-blur-md border border-aurora-border shadow-2xl flex flex-col gap-2 z-10">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                            <span>Desplazamiento (t)</span>
                            <span className="font-mono text-primary">{convT.toFixed(2)}</span>
                        </div>
                        <input type="range" min="-10" max="10" step="0.05" value={convT} onChange={(e) => setConvT(parseFloat(e.target.value))} className="w-full h-1.5 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary" />
                        <div className="flex justify-between items-center text-xs font-mono text-aurora-secondary mt-1">
                            <span>(f * g)({convT.toFixed(2)}) =</span>
                            <span className="text-[#EA580C] font-bold">{convCurrentVal.toFixed(6)}</span>
                        </div>
                    </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                    <button onClick={() => setGraphMode('standard')} className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${graphMode === 'standard' ? 'bg-primary text-white border-primary shadow-md' : 'bg-background-light/80 backdrop-blur border-aurora-border text-aurora-text hover:bg-white/5'}`}>
                        Estándar
                    </button>
                    <button onClick={() => setGraphMode('convolution')} className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${graphMode === 'convolution' ? 'bg-primary text-white border-primary shadow-md' : 'bg-background-light/80 backdrop-blur border-aurora-border text-aurora-text hover:bg-white/5'}`}>
                        Convolución Real
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StandardGraphing;
