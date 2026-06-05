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
import apiService from '../services/apiService';

interface Complex {
    re: number;
    im: number;
}

interface PolarForm {
    r: number;
    theta: number;
    thetaDeg: number;
}

interface PropiedadesCampoNumerico {
    etiquetaAria: string;
    valor: string;
    alCambiar: (nuevoValor: string) => void;
    marcador?: string;
    min?: number;
    max?: number;
}

// Componente de input numérico estilizado con Glassmorphism y control de límites
const CampoNumericoGlass: React.FC<PropiedadesCampoNumerico> = ({
    etiquetaAria,
    valor,
    alCambiar,
    marcador = '0',
    min = -100,
    max = 100
}) => {
    const manejarIncremento = () => {
        const valorActual = parseFloat(valor) || 0;
        if (valorActual < max) {
            alCambiar((valorActual + 1).toString());
        }
    };

    const manejarDecremento = () => {
        const valorActual = parseFloat(valor) || 0;
        if (valorActual > min) {
            alCambiar((valorActual - 1).toString());
        }
    };

    const manejarCambioManual = (evento: React.ChangeEvent<HTMLInputElement>) => {
        const entrada = evento.target.value;
        if (entrada === '' || entrada === '-') {
            alCambiar(entrada);
            return;
        }
        const numero = parseFloat(entrada);
        if (!isNaN(numero)) {
            if (numero > max) alCambiar(max.toString());
            else if (numero < min) alCambiar(min.toString());
            else alCambiar(entrada);
        }
    };

    return (
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden glass-card">
            <button
                type="button"
                onClick={manejarDecremento}
                className="px-3 py-1.5 hover:bg-white/10 text-aurora-muted hover:text-white transition-colors border-r border-white/5 font-bold"
                aria-label={`Restar 1 a ${etiquetaAria}`}
            >
                -
            </button>
            <input
                type="text"
                value={valor}
                onChange={manejarCambioManual}
                placeholder={marcador}
                className="w-16 bg-transparent text-center text-white font-mono focus:outline-none py-1 text-sm"
                aria-label={etiquetaAria}
            />
            <button
                type="button"
                onClick={manejarIncremento}
                className="px-3 py-1.5 hover:bg-white/10 text-aurora-muted hover:text-white transition-colors border-l border-white/5 font-bold"
                aria-label={`Sumar 1 a ${etiquetaAria}`}
            >
                +
            </button>
        </div>
    );
};

const ComplexMode: React.FC = () => {
    // Input mode
    const [inputMode, setInputMode] = useState<'rectangular' | 'polar'>('rectangular');

    // Rectangular input
    const [z1Re, setZ1Re] = useState('3');
    const [z1Im, setZ1Im] = useState('4');
    const [z2Re, setZ2Re] = useState('1');
    const [z2Im, setZ2Im] = useState('2');

    // Polar input (estados nuevos en español)
    const [z1R, setZ1R] = useState('5');
    const [z1Theta, setZ1Theta] = useState('53.13');
    const [z2Modulo, setZ2Modulo] = useState('2.24');
    const [z2Angulo, setZ2Angulo] = useState('63.43');

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

    const calcularLocal = () => {
        let numeroComplejo1: Complex, numeroComplejo2: Complex;

        if (inputMode === 'rectangular') {
            numeroComplejo1 = { re: parseFloat(z1Re) || 0, im: parseFloat(z1Im) || 0 };
            numeroComplejo2 = { re: parseFloat(z2Re) || 0, im: parseFloat(z2Im) || 0 };
        } else {
            numeroComplejo1 = toRectangular(parseFloat(z1R) || 0, parseFloat(z1Theta) || 0);
            numeroComplejo2 = toRectangular(parseFloat(z2Modulo) || 0, parseFloat(z2Angulo) || 0);
        }

        let resultadoComplejo: Complex;
        switch (operation) {
            case '+': resultadoComplejo = add(numeroComplejo1, numeroComplejo2); break;
            case '-': resultadoComplejo = subtract(numeroComplejo1, numeroComplejo2); break;
            case '*': resultadoComplejo = multiply(numeroComplejo1, numeroComplejo2); break;
            case '/': resultadoComplejo = divide(numeroComplejo1, numeroComplejo2); break;
        }

        setResult(resultadoComplejo);
        setZ1Polar(toPolar(numeroComplejo1));
        setZ2Polar(toPolar(numeroComplejo2));
        setResultPolar(toPolar(resultadoComplejo));
    };

    const calcularOperacionCompleja = async () => {
        let numeroComplejo1: Complex, numeroComplejo2: Complex;

        if (inputMode === 'rectangular') {
            numeroComplejo1 = { re: parseFloat(z1Re) || 0, im: parseFloat(z1Im) || 0 };
            numeroComplejo2 = { re: parseFloat(z2Re) || 0, im: parseFloat(z2Im) || 0 };
        } else {
            numeroComplejo1 = toRectangular(parseFloat(z1R) || 0, parseFloat(z1Theta) || 0);
            numeroComplejo2 = toRectangular(parseFloat(z2Modulo) || 0, parseFloat(z2Angulo) || 0);
        }

        try {
            const respuesta = await apiService.calculateComplex(operation, numeroComplejo1, numeroComplejo2);
            if (respuesta.success) {
                setResult({ re: respuesta.result.re, im: respuesta.result.im });
                setZ1Polar(toPolar(numeroComplejo1));
                setZ2Polar(toPolar(numeroComplejo2));
                setResultPolar({
                    r: respuesta.polar.r,
                    theta: respuesta.polar.theta,
                    thetaDeg: respuesta.polar.theta_deg
                });
            } else {
                console.warn('Backend falló al realizar cálculo de complejos, usando local.');
                calcularLocal();
            }
        } catch (error) {
            console.warn('Error en backend para números complejos, usando fallback local:', error);
            calcularLocal();
        }
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

        // Dibujar z1 y z2 según el modo de entrada activo
        const vectorZ1 = inputMode === 'rectangular'
            ? { re: parseFloat(z1Re) || 0, im: parseFloat(z1Im) || 0 }
            : toRectangular(parseFloat(z1R) || 0, parseFloat(z1Theta) || 0);

        const vectorZ2 = inputMode === 'rectangular'
            ? { re: parseFloat(z2Re) || 0, im: parseFloat(z2Im) || 0 }
            : toRectangular(parseFloat(z2Modulo) || 0, parseFloat(z2Angulo) || 0);

        // Función auxiliar segura para el valor absoluto
        const safeAbs = (n: number | undefined | null) => (typeof n === 'number' && isFinite(n) && !isNaN(n) ? Math.abs(n) : 0);

        // Calcular la escala de forma robusta utilizando los vectores finales convertidos
        const valMaxReales = Math.max(
            5, // Rango mínimo visible para que no se deforme con números pequeños o colapse
            safeAbs(result?.re),
            safeAbs(result?.im),
            safeAbs(vectorZ1.re),
            safeAbs(vectorZ1.im),
            safeAbs(vectorZ2.re),
            safeAbs(vectorZ2.im)
        );

        const maxVal = valMaxReales * 1.35; // 35% de margen
        const scale = Math.min(w, h) / (2 * maxVal);

        // Grid dinámico basado en la escala: máximo ~10 líneas por eje, resistente a números gigantes
        let step = 1;
        if (maxVal > 0 && isFinite(maxVal)) {
            const rawStep = maxVal / 5;
            const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
            const norm = rawStep / mag;
            if (norm > 5) step = 10 * mag;
            else if (norm > 2) step = 5 * mag;
            else step = 2 * mag;
        }
        if (!isFinite(maxVal)) return; // Prevención total de crashes

        ctx.strokeStyle = '#ffffff10';
        ctx.lineWidth = 1;
        
        // Dibujar líneas verticales
        for (let xUnit = 0; xUnit <= maxVal; xUnit += step) {
            const pxPos = cx + xUnit * scale;
            const pxNeg = cx - xUnit * scale;
            
            ctx.beginPath(); ctx.moveTo(pxPos, 0); ctx.lineTo(pxPos, h); ctx.stroke();
            if (xUnit !== 0) {
                ctx.beginPath(); ctx.moveTo(pxNeg, 0); ctx.lineTo(pxNeg, h); ctx.stroke();
            }
        }
        
        // Dibujar líneas horizontales
        for (let yUnit = 0; yUnit <= maxVal; yUnit += step) {
            const pyPos = cy - yUnit * scale;
            const pyNeg = cy + yUnit * scale;
            
            ctx.beginPath(); ctx.moveTo(0, pyPos); ctx.lineTo(w, pyPos); ctx.stroke();
            if (yUnit !== 0) {
                ctx.beginPath(); ctx.moveTo(0, pyNeg); ctx.lineTo(w, pyNeg); ctx.stroke();
            }
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

        // Etiquetas de ejes base
        ctx.fillStyle = '#ffffff60';
        ctx.font = '12px monospace';
        ctx.fillText('Re', w - 25, cy - 10);
        ctx.fillText('Im', cx + 10, 15);

        // Dibujar números en los ejes para clarificar la escala
        ctx.fillStyle = '#ffffff40';
        ctx.font = '10px monospace';
        for (let xUnit = step; xUnit <= maxVal; xUnit += step) {
            ctx.fillText(xUnit.toString(), cx + xUnit * scale + 2, cy + 12);
            ctx.fillText((-xUnit).toString(), cx - xUnit * scale + 2, cy + 12);
        }
        for (let yUnit = step; yUnit <= maxVal; yUnit += step) {
            ctx.fillText(yUnit.toString(), cx + 5, cy - yUnit * scale + 3);
            ctx.fillText((-yUnit).toString(), cx + 5, cy + yUnit * scale + 3);
        }

        const drawPoint = (z: Complex, color: string, label: string) => {
            if (!isFinite(z.re) || !isFinite(z.im)) return; // Evitar fallos del canvas con NaN o Infinity
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

        // Trazar los puntos de z1 y z2
        drawPoint(vectorZ1, '#4ade80', 'z₁');
        drawPoint(vectorZ2, '#60a5fa', 'z₂');

        // Draw result
        if (result) {
            drawPoint(result, '#f472b6', 'z₁' + operation + 'z₂');
        }

    }, [result, z1Re, z1Im, z2Re, z2Im, z1R, z1Theta, z2Modulo, z2Angulo, inputMode, operation]);

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
                                <CampoNumericoGlass
                                    etiquetaAria="Parte real del número complejo z1"
                                    valor={z1Re}
                                    alCambiar={setZ1Re}
                                    marcador="Re"
                                />
                                <span className="text-aurora-muted">+</span>
                                <CampoNumericoGlass
                                    etiquetaAria="Parte imaginaria del número complejo z1"
                                    valor={z1Im}
                                    alCambiar={setZ1Im}
                                    marcador="Im"
                                />
                                <span className="text-aurora-primary font-bold">i</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CampoNumericoGlass
                                    etiquetaAria="Módulo del número complejo z1"
                                    valor={z1R}
                                    alCambiar={setZ1R}
                                    marcador="r"
                                    min={0}
                                />
                                <span className="text-aurora-primary font-bold">∠</span>
                                <CampoNumericoGlass
                                    etiquetaAria="Ángulo en grados del número complejo z1"
                                    valor={z1Theta}
                                    alCambiar={setZ1Theta}
                                    marcador="θ"
                                    min={-360}
                                    max={360}
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
                                    : 'bg-white/5 text-aurora-muted border border-white/10'
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
                        {inputMode === 'rectangular' ? (
                            <div className="flex items-center gap-2">
                                <CampoNumericoGlass
                                    etiquetaAria="Parte real del número complejo z2"
                                    valor={z2Re}
                                    alCambiar={setZ2Re}
                                    marcador="Re"
                                />
                                <span className="text-aurora-muted">+</span>
                                <CampoNumericoGlass
                                    etiquetaAria="Parte imaginaria del número complejo z2"
                                    valor={z2Im}
                                    alCambiar={setZ2Im}
                                    marcador="Im"
                                />
                                <span className="text-aurora-primary font-bold">i</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CampoNumericoGlass
                                    etiquetaAria="Módulo del número complejo z2"
                                    valor={z2Modulo}
                                    alCambiar={setZ2Modulo}
                                    marcador="r"
                                    min={0}
                                />
                                <span className="text-aurora-primary font-bold">∠</span>
                                <CampoNumericoGlass
                                    etiquetaAria="Ángulo en grados del número complejo z2"
                                    valor={z2Angulo}
                                    alCambiar={setZ2Angulo}
                                    marcador="θ"
                                    min={-360}
                                    max={360}
                                />
                                <span className="text-aurora-muted">°</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={calcularOperacionCompleja}
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
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="text-xs text-aurora-muted uppercase">z₁ polar</div>
                                        <div className="text-sm font-mono text-green-400">
                                            {z1Polar.r.toFixed(2)} ∠ {z1Polar.thetaDeg.toFixed(2)}°
                                        </div>
                                    </div>
                                )}
                                {z2Polar && (
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
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
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
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
