/**
 * Binary EquaLab - Vectors Mode
 * 
 * Vector operations:
 * - 2D and 3D vectors
 * - Arithmetic: add, subtract, scale
 * - Products: dot, cross
 * - Properties: magnitude, normalize, angle
 * - Visualization
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calculator, ArrowRight, Eye, Plus, Minus } from 'lucide-react';

type Dimension = '2d' | '3d';
type VectorOp = 'add' | 'subtract' | 'dot' | 'cross' | 'scale';

interface Vector2D {
    x: number;
    y: number;
}

interface Vector3D {
    x: number;
    y: number;
    z: number;
}

const VectorsMode: React.FC = () => {
    const [dimension, setDimension] = useState<Dimension>('2d');
    const [operation, setOperation] = useState<VectorOp>('add');

    // 2D Vectors
    const [v1, setV1] = useState<Vector2D>({ x: 3, y: 4 });
    const [v2, setV2] = useState<Vector2D>({ x: 1, y: 2 });
    const [scalar, setScalar] = useState(2);

    // 3D Vectors
    const [v1_3d, setV1_3d] = useState<Vector3D>({ x: 1, y: 2, z: 3 });
    const [v2_3d, setV2_3d] = useState<Vector3D>({ x: 4, y: 5, z: 6 });

    // Results
    const [result2D, setResult2D] = useState<Vector2D | null>(null);
    const [result3D, setResult3D] = useState<Vector3D | null>(null);
    const [scalarResult, setScalarResult] = useState<number | null>(null);
    const [properties, setProperties] = useState<string[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Vector operations
    const add2D = (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x + b.x, y: a.y + b.y });
    const sub2D = (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x - b.x, y: a.y - b.y });
    const dot2D = (a: Vector2D, b: Vector2D): number => a.x * b.x + a.y * b.y;
    const scale2D = (v: Vector2D, s: number): Vector2D => ({ x: v.x * s, y: v.y * s });
    const mag2D = (v: Vector2D): number => Math.sqrt(v.x * v.x + v.y * v.y);
    const angle2D = (a: Vector2D, b: Vector2D): number => {
        const d = dot2D(a, b);
        const m = mag2D(a) * mag2D(b);
        return Math.acos(d / m) * 180 / Math.PI;
    };

    const add3D = (a: Vector3D, b: Vector3D): Vector3D => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
    const sub3D = (a: Vector3D, b: Vector3D): Vector3D => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
    const dot3D = (a: Vector3D, b: Vector3D): number => a.x * b.x + a.y * b.y + a.z * b.z;
    const cross3D = (a: Vector3D, b: Vector3D): Vector3D => ({
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    });
    const scale3D = (v: Vector3D, s: number): Vector3D => ({ x: v.x * s, y: v.y * s, z: v.z * s });
    const mag3D = (v: Vector3D): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

    const calculate = () => {
        const props: string[] = [];
        setScalarResult(null);

        if (dimension === '2d') {
            let res: Vector2D | null = null;

            switch (operation) {
                case 'add':
                    res = add2D(v1, v2);
                    break;
                case 'subtract':
                    res = sub2D(v1, v2);
                    break;
                case 'dot':
                    setScalarResult(dot2D(v1, v2));
                    break;
                case 'scale':
                    res = scale2D(v1, scalar);
                    break;
            }

            setResult2D(res);

            // Properties
            props.push(`|v₁| = ${mag2D(v1).toFixed(4)}`);
            props.push(`|v₂| = ${mag2D(v2).toFixed(4)}`);
            if (res) props.push(`|resultado| = ${mag2D(res).toFixed(4)}`);
            props.push(`Ángulo entre v₁ y v₂ = ${angle2D(v1, v2).toFixed(2)}°`);

        } else {
            let res: Vector3D | null = null;

            switch (operation) {
                case 'add':
                    res = add3D(v1_3d, v2_3d);
                    break;
                case 'subtract':
                    res = sub3D(v1_3d, v2_3d);
                    break;
                case 'dot':
                    setScalarResult(dot3D(v1_3d, v2_3d));
                    break;
                case 'cross':
                    res = cross3D(v1_3d, v2_3d);
                    break;
                case 'scale':
                    res = scale3D(v1_3d, scalar);
                    break;
            }

            setResult3D(res);

            // Properties
            props.push(`|v₁| = ${mag3D(v1_3d).toFixed(4)}`);
            props.push(`|v₂| = ${mag3D(v2_3d).toFixed(4)}`);
            if (res) props.push(`|resultado| = ${mag3D(res).toFixed(4)}`);
        }

        setProperties(props);
    };

    // Draw 2D vectors
    useEffect(() => {
        if (dimension !== '2d') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Clear
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#ffffff10';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * w / 10, 0);
            ctx.lineTo(i * w / 10, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * h / 10);
            ctx.lineTo(w, i * h / 10);
            ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = '#ffffff40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();

        // Scale
        const maxVal = Math.max(
            Math.abs(v1.x), Math.abs(v1.y),
            Math.abs(v2.x), Math.abs(v2.y),
            Math.abs(result2D?.x || 0), Math.abs(result2D?.y || 0)
        ) * 1.5 || 5;

        const scale = Math.min(w, h) / (2 * maxVal);

        const drawVector = (v: Vector2D, color: string, label: string, offset = { x: 0, y: 0 }) => {
            const startX = cx + offset.x * scale;
            const startY = cy - offset.y * scale;
            const endX = cx + (offset.x + v.x) * scale;
            const endY = cy - (offset.y + v.y) * scale;

            // Line
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(startY - endY, startX - endX);
            const headLen = 12;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX + headLen * Math.cos(angle - Math.PI / 6), endY + headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(endX + headLen * Math.cos(angle + Math.PI / 6), endY + headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();

            // Label
            ctx.fillStyle = color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(label, endX + 10, endY - 10);
        };

        // Draw vectors
        drawVector(v1, '#4ade80', 'v₁');
        drawVector(v2, '#60a5fa', 'v₂');

        if (result2D && (operation === 'add' || operation === 'subtract' || operation === 'scale')) {
            drawVector(result2D, '#f472b6', 'R');
        }

        // Show parallelogram for addition
        if (operation === 'add') {
            ctx.strokeStyle = '#ffffff20';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(cx + v1.x * scale, cy - v1.y * scale);
            ctx.lineTo(cx + (v1.x + v2.x) * scale, cy - (v1.y + v2.y) * scale);
            ctx.moveTo(cx + v2.x * scale, cy - v2.y * scale);
            ctx.lineTo(cx + (v1.x + v2.x) * scale, cy - (v1.y + v2.y) * scale);
            ctx.stroke();
            ctx.setLineDash([]);
        }

    }, [v1, v2, result2D, dimension, operation]);

    const VectorInput = ({ label, vector, onChange, color }: {
        label: string;
        vector: Vector2D | Vector3D;
        onChange: (v: any) => void;
        color: string;
    }) => (
        <div className="mb-4">
            <label className="text-xs uppercase font-bold block mb-2" style={{ color }}>
                {label}
            </label>
            <div className="flex items-center gap-2">
                <span className="text-aurora-muted text-xs">x:</span>
                <input
                    type="number"
                    value={vector.x}
                    onChange={(e) => onChange({ ...vector, x: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-aurora-panel border border-white/10 rounded px-2 py-1 text-white font-mono"
                />
                <span className="text-aurora-muted text-xs">y:</span>
                <input
                    type="number"
                    value={vector.y}
                    onChange={(e) => onChange({ ...vector, y: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-aurora-panel border border-white/10 rounded px-2 py-1 text-white font-mono"
                />
                {dimension === '3d' && 'z' in vector && (
                    <>
                        <span className="text-aurora-muted text-xs">z:</span>
                        <input
                            type="number"
                            value={(vector as Vector3D).z}
                            onChange={(e) => onChange({ ...vector, z: parseFloat(e.target.value) || 0 })}
                            className="w-16 bg-aurora-panel border border-white/10 rounded px-2 py-1 text-white font-mono"
                        />
                    </>
                )}
            </div>
        </div>
    );

    const operations = dimension === '2d'
        ? [
            { id: 'add' as VectorOp, label: 'v₁ + v₂', icon: Plus },
            { id: 'subtract' as VectorOp, label: 'v₁ - v₂', icon: Minus },
            { id: 'dot' as VectorOp, label: 'v₁ · v₂', icon: Calculator },
            { id: 'scale' as VectorOp, label: 'k × v₁', icon: ArrowRight },
        ]
        : [
            { id: 'add' as VectorOp, label: 'v₁ + v₂', icon: Plus },
            { id: 'subtract' as VectorOp, label: 'v₁ - v₂', icon: Minus },
            { id: 'dot' as VectorOp, label: 'v₁ · v₂', icon: Calculator },
            { id: 'cross' as VectorOp, label: 'v₁ × v₂', icon: ArrowRight },
            { id: 'scale' as VectorOp, label: 'k × v₁', icon: ArrowRight },
        ];

    return (
        <div className="flex flex-col h-full bg-aurora-bg">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 bg-background-light border-b border-aurora-border">
                <span className="text-xs text-aurora-muted uppercase tracking-wider mr-2">Dimensión:</span>
                {(['2d', '3d'] as const).map(dim => (
                    <button
                        key={dim}
                        onClick={() => setDimension(dim)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dimension === dim
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                            }`}
                    >
                        {dim.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-aurora-border">
                    <h2 className="text-xl font-bold text-white mb-4">🎯 Vectores {dimension.toUpperCase()}</h2>

                    {/* Vector Inputs */}
                    {dimension === '2d' ? (
                        <>
                            <VectorInput label="v₁" vector={v1} onChange={setV1} color="#4ade80" />
                            <VectorInput label="v₂" vector={v2} onChange={setV2} color="#60a5fa" />
                        </>
                    ) : (
                        <>
                            <VectorInput label="v₁" vector={v1_3d} onChange={setV1_3d} color="#4ade80" />
                            <VectorInput label="v₂" vector={v2_3d} onChange={setV2_3d} color="#60a5fa" />
                        </>
                    )}

                    {/* Operation Selector */}
                    <div className="mb-4">
                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-2">Operación</label>
                        <div className="flex flex-wrap gap-2">
                            {operations.map(op => (
                                <button
                                    key={op.id}
                                    onClick={() => setOperation(op.id)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${operation === op.id
                                            ? 'bg-aurora-primary text-white'
                                            : 'bg-aurora-panel text-aurora-muted border border-white/10'
                                        }`}
                                >
                                    {op.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scalar Input */}
                    {operation === 'scale' && (
                        <div className="mb-4">
                            <label className="text-xs text-aurora-muted uppercase font-bold block mb-2">Escalar (k)</label>
                            <input
                                type="number"
                                value={scalar}
                                onChange={(e) => setScalar(parseFloat(e.target.value) || 0)}
                                className="w-24 bg-aurora-panel border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                            />
                        </div>
                    )}

                    <button
                        onClick={calculate}
                        className="w-full py-3 bg-aurora-primary text-white font-bold rounded-lg hover:bg-aurora-primaryHover transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        <Calculator size={18} />
                        Calcular
                    </button>
                </div>

                {/* Results Panel */}
                <div className="hidden lg:flex w-1/2 p-6 flex-col gap-4">
                    {/* Result */}
                    {(result2D || result3D || scalarResult !== null) && (
                        <div className="p-4 bg-aurora-surface border border-aurora-primary/30 rounded-xl">
                            <div className="text-xs text-aurora-muted uppercase mb-1">Resultado</div>
                            <div className="text-2xl font-bold text-aurora-primary font-mono">
                                {scalarResult !== null ? (
                                    scalarResult.toFixed(4)
                                ) : result2D ? (
                                    `(${result2D.x.toFixed(4)}, ${result2D.y.toFixed(4)})`
                                ) : result3D ? (
                                    `(${result3D.x.toFixed(4)}, ${result3D.y.toFixed(4)}, ${result3D.z.toFixed(4)})`
                                ) : null}
                            </div>
                        </div>
                    )}

                    {/* Properties */}
                    {properties.length > 0 && (
                        <div className="bg-aurora-panel border border-white/10 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-aurora-muted uppercase mb-2">Propiedades</h4>
                            <ul className="space-y-1 text-sm font-mono text-aurora-text">
                                {properties.map((prop, i) => (
                                    <li key={i}>› {prop}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Visualization */}
                    {dimension === '2d' && (
                        <div className="flex-1 bg-aurora-panel border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-2 border-b border-white/10 flex items-center gap-2">
                                <Eye size={14} className="text-aurora-muted" />
                                <span className="text-xs text-aurora-muted uppercase font-bold">Visualización</span>
                            </div>
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={300}
                                className="w-full h-full"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VectorsMode;
