"use client";
/**
 * Binary EquaLab - Vectors Mode
 * 
 * Operaciones vectoriales 2D/3D:
 * - Aritmética: suma, resta, escalar
 * - Productos: punto, cruz
 * - Propiedades: magnitud, normalización, ángulo
 * - Visualización: canvas interactivo
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calculator, ArrowRightLeft, Eye, Sparkles } from 'lucide-react';
import apiService from '../services/apiService';

type Dimension = '2d' | '3d';
type OperacionVectorial = 'sumar' | 'restar' | 'punto' | 'cruz' | 'escalar';

interface Vector2D {
    x: number;
    y: number;
}

interface Vector3D {
    x: number;
    y: number;
    z: number;
}

// ─── Componente de Input Numérico Glassmorphism (mismo patrón que ComplexMode) ───
interface PropiedadesCampoVectorial {
    etiquetaAria: string;
    valor: string;
    alCambiar: (nuevoValor: string) => void;
    marcador?: string;
    etiqueta?: string;
    color?: string;
}

const CampoVectorialGlass: React.FC<PropiedadesCampoVectorial> = ({
    etiquetaAria,
    valor,
    alCambiar,
    marcador = '0',
    etiqueta,
    color = 'text-aurora-muted'
}) => {
    const manejarIncremento = () => {
        const valorActual = parseFloat(valor) || 0;
        alCambiar((valorActual + 1).toString());
    };

    const manejarDecremento = () => {
        const valorActual = parseFloat(valor) || 0;
        alCambiar((valorActual - 1).toString());
    };

    const manejarCambioManual = (evento: React.ChangeEvent<HTMLInputElement>) => {
        const entrada = evento.target.value;
        if (entrada === '' || entrada === '-') {
            alCambiar(entrada);
            return;
        }
        const numero = parseFloat(entrada);
        if (!isNaN(numero)) {
            alCambiar(entrada);
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            {etiqueta && (
                <span className={`text-xs font-mono font-bold ${color}`}>{etiqueta}</span>
            )}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden glass-card">
                <button
                    type="button"
                    onClick={manejarDecremento}
                    className="px-3 py-1.5 hover:bg-white/10 text-aurora-muted hover:text-white transition-colors border-r border-white/5 font-bold"
                    aria-label={`Restar 1 a ${etiquetaAria}`}
                >
                    −
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
        </div>
    );
};

const VectorsMode: React.FC = () => {
    const [dimension, setDimension] = useState<Dimension>('2d');
    const [operacion, setOperacion] = useState<OperacionVectorial>('sumar');

    // Vectores 2D como strings para el input glass
    const [v1x, setV1x] = useState('3');
    const [v1y, setV1y] = useState('4');
    const [v2x, setV2x] = useState('1');
    const [v2y, setV2y] = useState('2');

    // Vectores 3D
    const [v1x3, setV1x3] = useState('1');
    const [v1y3, setV1y3] = useState('2');
    const [v1z3, setV1z3] = useState('3');
    const [v2x3, setV2x3] = useState('4');
    const [v2y3, setV2y3] = useState('5');
    const [v2z3, setV2z3] = useState('6');

    const [escalar, setEscalar] = useState('2');

    // Resultados
    const [resultadoVectorial, setResultadoVectorial] = useState<string | null>(null);
    const [resultadoEscalar, setResultadoEscalar] = useState<number | null>(null);
    const [propiedades, setPropiedades] = useState<string[]>([]);
    const [resultadoVector2D, setResultadoVector2D] = useState<Vector2D | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const calcular = async () => {
        setResultadoEscalar(null);
        setResultadoVectorial(null);
        setResultadoVector2D(null);
        setError(null);
        setCargando(true);

        const kVal = parseFloat(escalar) || 0;
        const v1 = dimension === '2d' 
            ? [parseFloat(v1x) || 0, parseFloat(v1y) || 0]
            : [parseFloat(v1x3) || 0, parseFloat(v1y3) || 0, parseFloat(v1z3) || 0];
        const v2 = dimension === '2d'
            ? [parseFloat(v2x) || 0, parseFloat(v2y) || 0]
            : [parseFloat(v2x3) || 0, parseFloat(v2y3) || 0, parseFloat(v2z3) || 0];

        try {
            const respuesta = await apiService.calculateVectors(operacion, v1, v2, kVal);
            
            if (respuesta.success) {
                setPropiedades(respuesta.properties || []);
                
                if (respuesta.result_scalar !== undefined) {
                    setResultadoEscalar(respuesta.result_scalar);
                    setResultadoVectorial(respuesta.text);
                } else if (respuesta.result) {
                    setResultadoVectorial(respuesta.text);
                    if (dimension === '2d') {
                        setResultadoVector2D({ x: respuesta.result[0], y: respuesta.result[1] });
                    }
                }
            } else {
                setError('Error devuelto por el servidor');
                setPropiedades([]);
            }
        } catch (err) {
            console.error('Error calculando vectores en backend:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido al conectar con el backend');
            setPropiedades([]);
        } finally {
            setCargando(false);
        }
    };

    // ─── Canvas 2D ───
    const obtenerV1 = () => ({ x: parseFloat(v1x) || 0, y: parseFloat(v1y) || 0 });
    const obtenerV2 = () => ({ x: parseFloat(v2x) || 0, y: parseFloat(v2y) || 0 });

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

        // Fondo del plano
        ctx.fillStyle = '#0b0e14';
        ctx.fillRect(0, 0, w, h);

        const a = obtenerV1();
        const b = obtenerV2();

        // Calcular la escala de forma robusta e inteligente basada en los vectores
        const valorAbsolutoSeguro = (n: number | undefined | null) => 
            (typeof n === 'number' && isFinite(n) && !isNaN(n) ? Math.abs(n) : 0);

        const maximoValorReal = Math.max(
            5, // Rango de visualización mínimo por defecto
            valorAbsolutoSeguro(a.x),
            valorAbsolutoSeguro(a.y),
            valorAbsolutoSeguro(b.x),
            valorAbsolutoSeguro(b.y),
            valorAbsolutoSeguro(resultadoVector2D?.x),
            valorAbsolutoSeguro(resultadoVector2D?.y)
        );

        const limiteMaximo = maximoValorReal * 1.35; // Mantener un margen del 35%
        const escala = Math.min(w, h) / (2 * limiteMaximo);

        // Calcular el paso de la cuadrícula dinámicamente
        let pasoGrid = 1;
        if (limiteMaximo > 0 && isFinite(limiteMaximo)) {
            const pasoBruto = limiteMaximo / 5;
            const magnitud = Math.pow(10, Math.floor(Math.log10(pasoBruto)));
            const normalizado = pasoBruto / magnitud;
            if (normalizado > 5) pasoGrid = 10 * magnitud;
            else if (normalizado > 2) pasoGrid = 5 * magnitud;
            else pasoGrid = 2 * magnitud;
        }

        if (!isFinite(limiteMaximo)) return;

        // Dibujar las líneas dinámicas de cuadrícula (verticales)
        ctx.strokeStyle = '#ffffff08';
        ctx.lineWidth = 1;
        for (let xUnidad = 0; xUnidad <= limiteMaximo; xUnidad += pasoGrid) {
            const posPx = cx + xUnidad * escala;
            const negPx = cx - xUnidad * escala;
            
            ctx.beginPath(); ctx.moveTo(posPx, 0); ctx.lineTo(posPx, h); ctx.stroke();
            if (xUnidad !== 0) {
                ctx.beginPath(); ctx.moveTo(negPx, 0); ctx.lineTo(negPx, h); ctx.stroke();
            }
        }

        // Dibujar las líneas dinámicas de cuadrícula (horizontales)
        for (let yUnidad = 0; yUnidad <= limiteMaximo; yUnidad += pasoGrid) {
            const posPx = cy - yUnidad * escala;
            const negPx = cy + yUnidad * escala;
            
            ctx.beginPath(); ctx.moveTo(0, posPx); ctx.lineTo(w, posPx); ctx.stroke();
            if (yUnidad !== 0) {
                ctx.beginPath(); ctx.moveTo(0, negPx); ctx.lineTo(w, negPx); ctx.stroke();
            }
        }

        // Dibujar ejes principales graduados
        ctx.strokeStyle = '#ffffff30';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();

        // Etiquetas básicas de ejes
        ctx.fillStyle = '#ffffff60';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText('x', w - 15, cy - 8);
        ctx.fillText('y', cx + 8, 15);

        // Dibujar la numeración de los ejes según el paso del grid
        ctx.fillStyle = '#ffffff30';
        ctx.font = '10px "JetBrains Mono", monospace';
        for (let xUnidad = pasoGrid; xUnidad <= limiteMaximo; xUnidad += pasoGrid) {
            ctx.fillText(xUnidad.toString(), cx + xUnidad * escala + 2, cy + 12);
            ctx.fillText((-xUnidad).toString(), cx - xUnidad * escala + 2, cy + 12);
        }
        for (let yUnidad = pasoGrid; yUnidad <= limiteMaximo; yUnidad += pasoGrid) {
            ctx.fillText(yUnidad.toString(), cx + 5, cy - yUnidad * escala + 3);
            ctx.fillText((-yUnidad).toString(), cx + 5, cy + yUnidad * escala + 3);
        }

        // Función para dibujar un vector con flecha y etiqueta
        const dibujarVector = (v: Vector2D, color: string, label: string, desde = { x: 0, y: 0 }) => {
            const inicioX = cx + desde.x * escala;
            const inicioY = cy - desde.y * escala;
            const finX = cx + (desde.x + v.x) * escala;
            const finY = cy - (desde.y + v.y) * escala;

            // Línea del vector con resplandor (glow)
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(inicioX, inicioY);
            ctx.lineTo(finX, finY);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Cabeza de la flecha
            const angulo = Math.atan2(inicioY - finY, inicioX - finX);
            const largoCabeza = 12;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(finX, finY);
            ctx.lineTo(finX + largoCabeza * Math.cos(angulo - Math.PI / 6), finY + largoCabeza * Math.sin(angulo - Math.PI / 6));
            ctx.lineTo(finX + largoCabeza * Math.cos(angulo + Math.PI / 6), finY + largoCabeza * Math.sin(angulo + Math.PI / 6));
            ctx.closePath();
            ctx.fill();

            // Etiqueta del vector
            ctx.fillStyle = color;
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.fillText(label, finX + 10, finY - 10);
        };

        // Renderizar los vectores
        dibujarVector(a, '#4ade80', 'v₁');
        dibujarVector(b, '#60a5fa', 'v₂');

        if (resultadoVector2D && (operacion === 'sumar' || operacion === 'restar' || operacion === 'escalar')) {
            dibujarVector(resultadoVector2D, '#ff5a1f', 'R');
        }

        // Trazar paralelogramo de la suma de vectores si corresponde
        if (operacion === 'sumar') {
            ctx.strokeStyle = '#ffffff15';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cx + a.x * escala, cy - a.y * escala);
            ctx.lineTo(cx + (a.x + b.x) * escala, cy - (a.y + b.y) * escala);
            ctx.moveTo(cx + b.x * escala, cy - b.y * escala);
            ctx.lineTo(cx + (a.x + b.x) * escala, cy - (a.y + b.y) * escala);
            ctx.stroke();
            ctx.setLineDash([]);
        }

    }, [v1x, v1y, v2x, v2y, resultadoVector2D, dimension, operacion]);

    const operaciones = dimension === '2d'
        ? [
            { id: 'sumar' as OperacionVectorial, label: 'v₁ + v₂', desc: 'Suma' },
            { id: 'restar' as OperacionVectorial, label: 'v₁ − v₂', desc: 'Resta' },
            { id: 'punto' as OperacionVectorial, label: 'v₁ · v₂', desc: 'Punto' },
            { id: 'escalar' as OperacionVectorial, label: 'k × v₁', desc: 'Escalar' },
        ]
        : [
            { id: 'sumar' as OperacionVectorial, label: 'v₁ + v₂', desc: 'Suma' },
            { id: 'restar' as OperacionVectorial, label: 'v₁ − v₂', desc: 'Resta' },
            { id: 'punto' as OperacionVectorial, label: 'v₁ · v₂', desc: 'Punto' },
            { id: 'cruz' as OperacionVectorial, label: 'v₁ × v₂', desc: 'Cruz' },
            { id: 'escalar' as OperacionVectorial, label: 'k × v₁', desc: 'Escalar' },
        ];

    return (
        <div className="flex flex-col h-full">
            {/* Header con selector de dimensión */}
            <div className="flex items-center gap-3 p-3 bg-background-light border-b border-aurora-border">
                <span className="text-xs text-aurora-muted uppercase tracking-wider font-display font-semibold mr-2">Dimensión:</span>
                {(['2d', '3d'] as const).map(dim => (
                    <button
                        key={dim}
                        onClick={() => {
                            setDimension(dim);
                            if (dim === '2d' && operacion === 'cruz') setOperacion('sumar');
                            setResultadoVectorial(null);
                            setResultadoEscalar(null);
                            setResultadoVector2D(null);
                            setPropiedades([]);
                        }}
                        className={`px-5 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-300 ${dimension === dim
                            ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,90,31,0.3)]'
                            : 'bg-white/5 hover:bg-white/10 text-aurora-secondary border border-white/10'
                        }`}
                    >
                        {dim.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Panel de Entrada */}
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-aurora-border custom-scrollbar">
                    <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                        <ArrowRightLeft size={20} className="text-primary" />
                        Vectores {dimension.toUpperCase()}
                    </h2>

                    {/* Inputs de v₁ */}
                    <div className="mb-5">
                        <label className="text-xs text-emerald-400 uppercase font-display font-bold block mb-2">
                            v₁
                        </label>
                        {dimension === '2d' ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <CampoVectorialGlass
                                    etiquetaAria="Componente X del vector v1"
                                    valor={v1x}
                                    alCambiar={setV1x}
                                    marcador="x"
                                    etiqueta="x"
                                    color="text-emerald-400"
                                />
                                <CampoVectorialGlass
                                    etiquetaAria="Componente Y del vector v1"
                                    valor={v1y}
                                    alCambiar={setV1y}
                                    marcador="y"
                                    etiqueta="y"
                                    color="text-emerald-400"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                <CampoVectorialGlass etiquetaAria="X de v1 3D" valor={v1x3} alCambiar={setV1x3} marcador="x" etiqueta="x" color="text-emerald-400" />
                                <CampoVectorialGlass etiquetaAria="Y de v1 3D" valor={v1y3} alCambiar={setV1y3} marcador="y" etiqueta="y" color="text-emerald-400" />
                                <CampoVectorialGlass etiquetaAria="Z de v1 3D" valor={v1z3} alCambiar={setV1z3} marcador="z" etiqueta="z" color="text-emerald-400" />
                            </div>
                        )}
                    </div>

                    {/* Selector de Operación */}
                    <div className="flex items-center gap-2 mb-5">
                        {operaciones.map(op => (
                            <button
                                key={op.id}
                                onClick={() => setOperacion(op.id)}
                                className={`px-3 py-2.5 rounded-xl text-sm font-mono font-bold transition-all duration-300 ${operacion === op.id
                                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,90,31,0.3)]'
                                    : 'bg-white/5 text-aurora-muted border border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                                title={op.desc}
                            >
                                {op.label}
                            </button>
                        ))}
                    </div>

                    {/* Inputs de v₂ */}
                    <div className="mb-5">
                        <label className="text-xs text-blue-400 uppercase font-display font-bold block mb-2">
                            v₂
                        </label>
                        {dimension === '2d' ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <CampoVectorialGlass
                                    etiquetaAria="Componente X del vector v2"
                                    valor={v2x}
                                    alCambiar={setV2x}
                                    marcador="x"
                                    etiqueta="x"
                                    color="text-blue-400"
                                />
                                <CampoVectorialGlass
                                    etiquetaAria="Componente Y del vector v2"
                                    valor={v2y}
                                    alCambiar={setV2y}
                                    marcador="y"
                                    etiqueta="y"
                                    color="text-blue-400"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                <CampoVectorialGlass etiquetaAria="X de v2 3D" valor={v2x3} alCambiar={setV2x3} marcador="x" etiqueta="x" color="text-blue-400" />
                                <CampoVectorialGlass etiquetaAria="Y de v2 3D" valor={v2y3} alCambiar={setV2y3} marcador="y" etiqueta="y" color="text-blue-400" />
                                <CampoVectorialGlass etiquetaAria="Z de v2 3D" valor={v2z3} alCambiar={setV2z3} marcador="z" etiqueta="z" color="text-blue-400" />
                            </div>
                        )}
                    </div>

                    {/* Input de Escalar */}
                    {operacion === 'escalar' && (
                        <div className="mb-5">
                            <label className="text-xs text-orange-400 uppercase font-display font-bold block mb-2">
                                Escalar (k)
                            </label>
                            <CampoVectorialGlass
                                etiquetaAria="Escalar k"
                                valor={escalar}
                                alCambiar={setEscalar}
                                marcador="k"
                                color="text-orange-400"
                            />
                        </div>
                    )}

                    <button
                        onClick={calcular}
                        className="w-full py-3 bg-primary text-white font-brand font-bold rounded-xl hover:bg-primary-hover transition-all duration-300 shadow-[0_0_20px_rgba(255,90,31,0.2)] hover:shadow-[0_0_30px_rgba(255,90,31,0.4)] flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <Calculator size={18} />
                        Calcular
                    </button>
                </div>

                {/* Panel de Resultados */}
                <div className="hidden lg:flex w-1/2 p-6 flex-col gap-4">
                    {/* Resultado Principal */}
                    {resultadoVectorial && (
                        <>
                            <div className="glass-panel rounded-2xl p-5 border-primary/30">
                                <div className="text-xs text-aurora-muted uppercase font-display font-semibold mb-1 flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-primary" />
                                    Resultado
                                </div>
                                <div className="text-2xl font-bold text-primary font-mono">
                                    {resultadoVectorial}
                                </div>
                                {resultadoEscalar !== null && (
                                    <div className="text-sm text-aurora-muted mt-2 font-mono">
                                        Producto escalar (resultado numérico)
                                    </div>
                                )}
                            </div>

                            {/* Propiedades */}
                            {propiedades.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {propiedades.map((prop, i) => (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                            <div className="text-sm font-mono text-aurora-text">
                                                {prop}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Visualización */}
                    {dimension === '2d' && (
                        <div className="flex-1 glass-panel rounded-2xl overflow-hidden">
                            <div className="p-3 border-b border-white/10 flex items-center gap-2">
                                <Eye size={14} className="text-primary" />
                                <span className="text-xs text-aurora-muted uppercase font-display font-bold">Plano Vectorial</span>
                            </div>
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={300}
                                className="w-full h-full"
                            />
                        </div>
                    )}

                    {/* Placeholder cuando no hay resultado */}
                    {!resultadoVectorial && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <ArrowRightLeft size={48} className="text-aurora-muted/30 mx-auto mb-4" />
                                <p className="text-aurora-muted/50 font-display text-sm">
                                    Ingresa vectores y presiona <span className="text-primary font-semibold">Calcular</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VectorsMode;

