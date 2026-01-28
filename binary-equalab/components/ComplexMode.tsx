/**
 * Binary EquaLab - Complex Numbers Mode
 * 
 * Operations with complex numbers:
 * - Arithmetic: add, subtract, multiply, divide
 * - Conversions: rectangular ↔ polar
 * - Operations: conjugate, modulus, argument
 * - Visualization: Argand diagram
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Repeat, Eye } from 'lucide-react';
import MathDisplay from './MathDisplay';

interface Complex {
    re: number;
    im: number;
}

interface PolarForm {
    r: number;
    theta: number;
    thetaDeg: number;
}

const ComplexMode: React.FC = () => {
    // Input mode
    const [inputMode, setInputMode] = useState<'rectangular' | 'polar'>('rectangular');

    // Rectangular input
    const [z1Re, setZ1Re] = useState('3');
    const [z1Im, setZ1Im] = useState('4');
    const [z2Re, setZ2Re] = useState('1');
    const [z2Im, setZ2Im] = useState('2');

    // Polar input
    const [z1R, setZ1R] = useState('5');
    const [z1Theta, setZ1Theta] = useState('53.13');

    // Operation
    const [operation, setOperation] = useState<'+' | '-' | '*' | '/'>('*');

    // Results
    const [result, setResult] = useState<Complex | null>(null);
    const [z1Polar, setZ1Polar] = useState<PolarForm | null>(null);
    const [z2Polar, setZ2Polar] = useState<PolarForm | null>(null);
    const [resultPolar, setResultPolar] = useState<PolarForm | null>(null);

    // Canvas for Argand diagram
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Complex operations
    const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
    const subtract = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
    const multiply = (a: Complex, b: Complex): Complex => ({
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re
    });
    const divide = (a: Complex, b: Complex): Complex => {
        const denom = b.re * b.re + b.im * b.im;
        return {
            re: (a.re * b.re + a.im * b.im) / denom,
            im: (a.im * b.re - a.re * b.im) / denom
        };
    };

    const toPolar = (z: Complex): PolarForm => {
        const r = Math.sqrt(z.re * z.re + z.im * z.im);
        const theta = Math.atan2(z.im, z.re);
        return { r, theta, thetaDeg: theta * 180 / Math.PI };
    };

    const toRectangular = (r: number, thetaDeg: number): Complex => {
        const theta = thetaDeg * Math.PI / 180;
        return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
    };

    const calculate = () => {
        let z1: Complex, z2: Complex;

        if (inputMode === 'rectangular') {
            z1 = { re: parseFloat(z1Re) || 0, im: parseFloat(z1Im) || 0 };
            z2 = { re: parseFloat(z2Re) || 0, im: parseFloat(z2Im) || 0 };
        } else {
            z1 = toRectangular(parseFloat(z1R) || 0, parseFloat(z1Theta) || 0);
            z2 = { re: 1, im: 0 }; // Default for single number operations
        }

        let res: Complex;
        switch (operation) {
            case '+': res = add(z1, z2); break;
            case '-': res = subtract(z1, z2); break;
            case '*': res = multiply(z1, z2); break;
            case '/': res = divide(z1, z2); break;
        }

        setResult(res);
        setZ1Polar(toPolar(z1));
        setZ2Polar(toPolar(z2));
        setResultPolar(toPolar(res));
    };

    // Draw Argand diagram
    useEffect(() => {
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

        // Labels
        ctx.fillStyle = '#ffffff60';
        ctx.font = '12px monospace';
        ctx.fillText('Re', w - 25, cy - 5);
        ctx.fillText('Im', cx + 5, 15);

        // Scale
        const maxVal = Math.max(
            Math.abs(result?.re || 5),
            Math.abs(result?.im || 5),
            Math.abs(parseFloat(z1Re) || 5),
            Math.abs(parseFloat(z1Im) || 5),
            Math.abs(parseFloat(z2Re) || 5),
            Math.abs(parseFloat(z2Im) || 5)
        ) * 1.5;

        const scale = Math.min(w, h) / (2 * maxVal);

        const drawPoint = (z: Complex, color: string, label: string) => {
            const x = cx + z.re * scale;
            const y = cy - z.im * scale;

            // Line from origin
            ctx.strokeStyle = color + '60';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Point
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(label, x + 10, y - 10);
        };

        // Draw z1
        const z1 = { re: parseFloat(z1Re) || 0, im: parseFloat(z1Im) || 0 };
        drawPoint(z1, '#4ade80', 'z₁');

        // Draw z2
        const z2 = { re: parseFloat(z2Re) || 0, im: parseFloat(z2Im) || 0 };
        drawPoint(z2, '#60a5fa', 'z₂');

        // Draw result
        if (result) {
            drawPoint(result, '#f472b6', 'z₁' + operation + 'z₂');
        }

    }, [result, z1Re, z1Im, z2Re, z2Im, operation]);

    const formatComplex = (z: Complex): string => {
        const sign = z.im >= 0 ? '+' : '';
        return `${z.re.toFixed(4)} ${sign} ${z.im.toFixed(4)}i`;
    };

    return (
        <div className="flex flex-col h-full bg-aurora-bg">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 bg-background-light border-b border-aurora-border">
                <span className="text-xs text-aurora-muted uppercase tracking-wider mr-2">Entrada:</span>
                <button
                    onClick={() => setInputMode('rectangular')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${inputMode === 'rectangular'
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                        }`}
                >
                    Rectangular (a + bi)
                </button>
                <button
                    onClick={() => setInputMode('polar')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${inputMode === 'polar'
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                        }`}
                >
                    Polar (r∠θ)
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-aurora-border">
                    <h2 className="text-xl font-bold text-white mb-4">🔮 Números Complejos</h2>

                    {/* Z1 Input */}
                    <div className="mb-4">
                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-2">
                            z₁
                        </label>
                        {inputMode === 'rectangular' ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={z1Re}
                                    onChange={(e) => setZ1Re(e.target.value)}
                                    className="w-24 bg-aurora-panel border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                    placeholder="Re"
                                />
                                <span className="text-aurora-muted">+</span>
                                <input
                                    type="number"
                                    value={z1Im}
                                    onChange={(e) => setZ1Im(e.target.value)}
                                    className="w-24 bg-aurora-panel border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                    placeholder="Im"
                                />
                                <span className="text-aurora-primary font-bold">i</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={z1R}
                                    onChange={(e) => setZ1R(e.target.value)}
                                    className="w-24 bg-aurora-panel border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                    placeholder="r"
                                />
                                <span className="text-aurora-primary font-bold">∠</span>
                                <input
                                    type="number"
                                    value={z1Theta}
                                    onChange={(e) => setZ1Theta(e.target.value)}
                                    className="w-24 bg-aurora-panel border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                    placeholder="θ"
                                />
                                <span className="text-aurora-muted">°</span>
                            </div>
                        )}
                    </div>

                    {/* Operation Selector */}
                    <div className="flex items-center gap-2 mb-4">
                        {(['+', '-', '*', '/'] as const).map(op => (
                            <button
                                key={op}
                                onClick={() => setOperation(op)}
                                className={`w-12 h-12 rounded-lg text-xl font-bold transition-all ${operation === op
                                        ? 'bg-aurora-primary text-white'
                                        : 'bg-aurora-panel text-aurora-muted border border-white/10'
                                    }`}
                            >
                                {op === '*' ? '×' : op === '/' ? '÷' : op}
                            </button>
                        ))}
                    </div>

                    {/* Z2 Input */}
                    <div className="mb-6">
                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-2">
                            z₂
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={z2Re}
                                onChange={(e) => setZ2Re(e.target.value)}
                                className="w-24 bg-aurora-panel border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                placeholder="Re"
                            />
                            <span className="text-aurora-muted">+</span>
                            <input
                                type="number"
                                value={z2Im}
                                onChange={(e) => setZ2Im(e.target.value)}
                                className="w-24 bg-aurora-panel border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                placeholder="Im"
                            />
                            <span className="text-aurora-primary font-bold">i</span>
                        </div>
                    </div>

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
                    {/* Result Display */}
                    {result && (
                        <>
                            <div className="p-4 bg-aurora-surface border border-aurora-primary/30 rounded-xl">
                                <div className="text-xs text-aurora-muted uppercase mb-1">Resultado</div>
                                <div className="text-2xl font-bold text-aurora-primary font-mono">
                                    {formatComplex(result)}
                                </div>
                                {resultPolar && (
                                    <div className="text-sm text-aurora-muted mt-2 font-mono">
                                        = {resultPolar.r.toFixed(4)} ∠ {resultPolar.thetaDeg.toFixed(2)}°
                                    </div>
                                )}
                            </div>

                            {/* Conversions */}
                            <div className="grid grid-cols-2 gap-3">
                                {z1Polar && (
                                    <div className="bg-aurora-panel border border-white/10 rounded-lg p-3">
                                        <div className="text-xs text-aurora-muted uppercase">z₁ polar</div>
                                        <div className="text-sm font-mono text-green-400">
                                            {z1Polar.r.toFixed(2)} ∠ {z1Polar.thetaDeg.toFixed(2)}°
                                        </div>
                                    </div>
                                )}
                                {z2Polar && (
                                    <div className="bg-aurora-panel border border-white/10 rounded-lg p-3">
                                        <div className="text-xs text-aurora-muted uppercase">z₂ polar</div>
                                        <div className="text-sm font-mono text-blue-400">
                                            {z2Polar.r.toFixed(2)} ∠ {z2Polar.thetaDeg.toFixed(2)}°
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Argand Diagram */}
                    <div className="flex-1 bg-aurora-panel border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-2 border-b border-white/10 flex items-center gap-2">
                            <Eye size={14} className="text-aurora-muted" />
                            <span className="text-xs text-aurora-muted uppercase font-bold">Diagrama de Argand</span>
                        </div>
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={300}
                            className="w-full h-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplexMode;
