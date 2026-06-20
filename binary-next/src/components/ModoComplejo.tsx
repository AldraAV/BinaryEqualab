"use client";
/**
 * Binary EquaLab - Modo Números Complejos
 * 
 * Operaciones con números complejos:
 * - Aritmética: sumar, restar, multiplicar, dividir
 * - Conversiones: rectangular ↔ polar
 * - Operaciones: conjugado, módulo, argumento
 * - Visualización: Diagrama de Argand
 */

import React, { useState, useRef, useEffect, useDeferredValue } from 'react';
import { Calculator, Eye } from 'lucide-react';
import apiService from '../services/apiService';

interface NumeroComplejo {
    re: number;
    im: number;
}

interface FormaPolar {
    r: number;
    theta: number;
    thetaDeg: number;
}

interface PropiedadesCampoNumerico {
    etiquetaAria: string;
    valor: string;
    alCambiar: (nuevoValor: string) => void;
    marcador?: string;
    etiqueta?: string;
    color?: string;
}

const CampoNumericoGlass: React.FC<PropiedadesCampoNumerico> = ({
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
                    className="px-3 py-1.5 hover:bg-white/10 text-aurora-muted hover:text-white transition-colors border-r border-white/5 font-bold cursor-pointer z-10"
                    aria-label={`Restar 1 a ${etiquetaAria}`}
                >
                    −
                </button>
                <input
                    type="text"
                    value={valor}
                    onChange={manejarCambioManual}
                    placeholder={marcador}
                    className="w-16 bg-transparent text-center text-white font-mono focus:outline-none py-1 text-sm z-10"
                    aria-label={etiquetaAria}
                />
                <button
                    type="button"
                    onClick={manejarIncremento}
                    className="px-3 py-1.5 hover:bg-white/10 text-aurora-muted hover:text-white transition-colors border-l border-white/5 font-bold cursor-pointer z-10"
                    aria-label={`Sumar 1 a ${etiquetaAria}`}
                >
                    +
                </button>
            </div>
        </div>
    );
};

const ModoComplejo: React.FC = () => {
    // Modo de entrada
    const [modoEntrada, establecerModoEntrada] = useState<'rectangular' | 'polar'>('rectangular');

    // Entrada Rectangular
    const [z1Real, establecerZ1Real] = useState('3');
    const [z1Imag, establecerZ1Imag] = useState('4');
    const [z2Real, establecerZ2Real] = useState('1');
    const [z2Imag, establecerZ2Imag] = useState('2');

    // Entrada Polar
    const [z1Modulo, establecerZ1Modulo] = useState('5');
    const [z1Angulo, establecerZ1Angulo] = useState('53.13');
    const [z2Modulo, establecerZ2Modulo] = useState('2.24');
    const [z2Angulo, establecerZ2Angulo] = useState('63.43');

    // Operación
    const [operacionActiva, establecerOperacionActiva] = useState<'+' | '-' | '*' | '/'>('*');

    // Resultados
    const [resultadoCalculo, establecerResultadoCalculo] = useState<NumeroComplejo | null>(null);
    const [z1PolarResultado, establecerZ1PolarResultado] = useState<FormaPolar | null>(null);
    const [z2PolarResultado, establecerZ2PolarResultado] = useState<FormaPolar | null>(null);
    const [resultadoPolarFinal, establecerResultadoPolarFinal] = useState<FormaPolar | null>(null);

    // Lienzo para el Diagrama de Argand
    const referenciaLienzo = useRef<HTMLCanvasElement>(null);

    // Valores diferidos para dibujar de manera suave sin bloquear la UI
    const difZ1Real = useDeferredValue(z1Real);
    const difZ1Imag = useDeferredValue(z1Imag);
    const difZ2Real = useDeferredValue(z2Real);
    const difZ2Imag = useDeferredValue(z2Imag);
    const difZ1Modulo = useDeferredValue(z1Modulo);
    const difZ1Angulo = useDeferredValue(z1Angulo);
    const difZ2Modulo = useDeferredValue(z2Modulo);
    const difZ2Angulo = useDeferredValue(z2Angulo);

    const aPolar = (z: NumeroComplejo): FormaPolar => {
        const r = Math.sqrt(z.re * z.re + z.im * z.im);
        const theta = Math.atan2(z.im, z.re);
        return { r, theta, thetaDeg: theta * 180 / Math.PI };
    };

    const aRectangular = (r: number, thetaDeg: number): NumeroComplejo => {
        const theta = thetaDeg * Math.PI / 180;
        return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
    };

    const realizarCalculoComplejo = async () => {
        let numComp1: NumeroComplejo, numComp2: NumeroComplejo;

        if (modoEntrada === 'rectangular') {
            numComp1 = { re: parseFloat(z1Real) || 0, im: parseFloat(z1Imag) || 0 };
            numComp2 = { re: parseFloat(z2Real) || 0, im: parseFloat(z2Imag) || 0 };
        } else {
            numComp1 = aRectangular(parseFloat(z1Modulo) || 0, parseFloat(z1Angulo) || 0);
            numComp2 = aRectangular(parseFloat(z2Modulo) || 0, parseFloat(z2Angulo) || 0);
        }

        try {
            const respuesta = await apiService.calculateComplex(operacionActiva, numComp1, numComp2);
            if (respuesta.success) {
                establecerResultadoCalculo({ re: respuesta.result.re, im: respuesta.result.im });
                establecerZ1PolarResultado(aPolar(numComp1));
                establecerZ2PolarResultado(aPolar(numComp2));
                establecerResultadoPolarFinal({
                    r: respuesta.polar.r,
                    theta: respuesta.polar.theta,
                    thetaDeg: respuesta.polar.theta_deg
                });
            } else {
                console.warn('Backend falló al realizar cálculo de complejos.');
            }
        } catch (error) {
            console.error('Error en backend para números complejos:', error);
        }
    };

    // Dibujar diagrama de Argand
    useEffect(() => {
        const lienzo = referenciaLienzo.current;
        if (!lienzo) return;

        const contexto = lienzo.getContext('2d');
        if (!contexto) return;

        const ancho = lienzo.width;
        const alto = lienzo.height;
        const centroX = ancho / 2;
        const centroY = alto / 2;

        // Limpiar
        contexto.fillStyle = '#0a0a0f';
        contexto.fillRect(0, 0, ancho, alto);

        // Vectores calculados con debounce
        const vector1 = modoEntrada === 'rectangular'
            ? { re: parseFloat(difZ1Real) || 0, im: parseFloat(difZ1Imag) || 0 }
            : aRectangular(parseFloat(difZ1Modulo) || 0, parseFloat(difZ1Angulo) || 0);

        const vector2 = modoEntrada === 'rectangular'
            ? { re: parseFloat(difZ2Real) || 0, im: parseFloat(difZ2Imag) || 0 }
            : aRectangular(parseFloat(difZ2Modulo) || 0, parseFloat(difZ2Angulo) || 0);

        // Función segura de valor absoluto
        const absolutoSeguro = (n: number | undefined | null) => (typeof n === 'number' && isFinite(n) && !isNaN(n) ? Math.abs(n) : 0);

        // Escala robusta
        const valorMaxReales = Math.max(
            5,
            absolutoSeguro(resultadoCalculo?.re),
            absolutoSeguro(resultadoCalculo?.im),
            absolutoSeguro(vector1.re),
            absolutoSeguro(vector1.im),
            absolutoSeguro(vector2.re),
            absolutoSeguro(vector2.im)
        );

        const maximoValorPantalla = valorMaxReales * 1.35;
        const escala = Math.min(ancho, alto) / (2 * maximoValorPantalla);

        // Cuadrícula dinámica
        let pasoDibujo = 1;
        if (maximoValorPantalla > 0 && isFinite(maximoValorPantalla)) {
            const pasoBase = maximoValorPantalla / 5;
            const magnitud = Math.pow(10, Math.floor(Math.log10(pasoBase)));
            const normalizado = pasoBase / magnitud;
            if (normalizado > 5) pasoDibujo = 10 * magnitud;
            else if (normalizado > 2) pasoDibujo = 5 * magnitud;
            else pasoDibujo = 2 * magnitud;
        }
        if (!isFinite(maximoValorPantalla)) return;

        contexto.strokeStyle = '#ffffff10';
        contexto.lineWidth = 1;
        
        // Verticales
        for (let xUnidad = 0; xUnidad <= maximoValorPantalla; xUnidad += pasoDibujo) {
            const pxPositiva = centroX + xUnidad * escala;
            const pxNegativa = centroX - xUnidad * escala;
            
            contexto.beginPath(); contexto.moveTo(pxPositiva, 0); contexto.lineTo(pxPositiva, alto); contexto.stroke();
            if (xUnidad !== 0) {
                contexto.beginPath(); contexto.moveTo(pxNegativa, 0); contexto.lineTo(pxNegativa, alto); contexto.stroke();
            }
        }
        
        // Horizontales
        for (let yUnidad = 0; yUnidad <= maximoValorPantalla; yUnidad += pasoDibujo) {
            const pyPositiva = centroY - yUnidad * escala;
            const pyNegativa = centroY + yUnidad * escala;
            
            contexto.beginPath(); contexto.moveTo(0, pyPositiva); contexto.lineTo(ancho, pyPositiva); contexto.stroke();
            if (yUnidad !== 0) {
                contexto.beginPath(); contexto.moveTo(0, pyNegativa); contexto.lineTo(ancho, pyNegativa); contexto.stroke();
            }
        }

        // Ejes
        contexto.strokeStyle = '#ffffff40';
        contexto.lineWidth = 2;
        contexto.beginPath();
        contexto.moveTo(0, centroY);
        contexto.lineTo(ancho, centroY);
        contexto.moveTo(centroX, 0);
        contexto.lineTo(centroX, alto);
        contexto.stroke();

        // Etiquetas Ejes
        contexto.fillStyle = '#ffffff60';
        contexto.font = '12px monospace';
        contexto.fillText('Re', ancho - 25, centroY - 10);
        contexto.fillText('Im', centroX + 10, 15);

        // Números en Ejes
        contexto.fillStyle = '#ffffff40';
        contexto.font = '10px monospace';
        for (let xUnidad = pasoDibujo; xUnidad <= maximoValorPantalla; xUnidad += pasoDibujo) {
            contexto.fillText(xUnidad.toString(), centroX + xUnidad * escala + 2, centroY + 12);
            contexto.fillText((-xUnidad).toString(), centroX - xUnidad * escala + 2, centroY + 12);
        }
        for (let yUnidad = pasoDibujo; yUnidad <= maximoValorPantalla; yUnidad += pasoDibujo) {
            contexto.fillText(yUnidad.toString(), centroX + 5, centroY - yUnidad * escala + 3);
            contexto.fillText((-yUnidad).toString(), centroX + 5, centroY + yUnidad * escala + 3);
        }

        const dibujarPunto = (z: NumeroComplejo, color: string, etiqueta: string) => {
            if (!isFinite(z.re) || !isFinite(z.im)) return;
            const x = centroX + z.re * escala;
            const y = centroY - z.im * escala;

            contexto.strokeStyle = color + '60';
            contexto.lineWidth = 2;
            contexto.beginPath();
            contexto.moveTo(centroX, centroY);
            contexto.lineTo(x, y);
            contexto.stroke();

            contexto.fillStyle = color;
            contexto.beginPath();
            contexto.arc(x, y, 6, 0, Math.PI * 2);
            contexto.fill();

            contexto.fillStyle = color;
            contexto.font = 'bold 12px sans-serif';
            contexto.fillText(etiqueta, x + 10, y - 10);
        };

        dibujarPunto(vector1, '#4ade80', 'z₁');
        dibujarPunto(vector2, '#60a5fa', 'z₂');

        if (resultadoCalculo) {
            dibujarPunto(resultadoCalculo, '#f472b6', 'z₁' + operacionActiva + 'z₂');
        }

    }, [resultadoCalculo, difZ1Real, difZ1Imag, difZ2Real, difZ2Imag, difZ1Modulo, difZ1Angulo, difZ2Modulo, difZ2Angulo, modoEntrada, operacionActiva]);

    const darFormatoComplejo = (z: NumeroComplejo): string => {
        const signo = z.im >= 0 ? '+' : '';
        return `${z.re.toFixed(4)} ${signo} ${z.im.toFixed(4)}i`;
    };

    return (
        <div className="flex flex-col h-full bg-aurora-bg">
            <div className="flex items-center gap-2 p-3 bg-background-light border-b border-aurora-border">
                <span className="text-xs text-aurora-muted uppercase tracking-wider mr-2">Entrada:</span>
                <button
                    onClick={() => establecerModoEntrada('rectangular')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${modoEntrada === 'rectangular'
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                        }`}
                >
                    Rectangular (a + bi)
                </button>
                <button
                    onClick={() => establecerModoEntrada('polar')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${modoEntrada === 'polar'
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                        }`}
                >
                    Polar (r∠θ)
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-aurora-border">
                    <h2 className="text-xl font-bold text-white mb-4">🔮 Números Complejos</h2>

                    {/* Z1 */}
                    <div className="mb-4">
                        <label className="text-xs text-green-400 uppercase font-bold block mb-2">
                            z₁
                        </label>
                        {modoEntrada === 'rectangular' ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <CampoNumericoGlass
                                    etiquetaAria="Parte real del número complejo z1"
                                    valor={z1Real}
                                    alCambiar={establecerZ1Real}
                                    marcador="Re"
                                    etiqueta="Re"
                                    color="text-green-400"
                                />
                                <CampoNumericoGlass
                                    etiquetaAria="Parte imaginaria del número complejo z1"
                                    valor={z1Imag}
                                    alCambiar={establecerZ1Imag}
                                    marcador="Im(i)"
                                    etiqueta="Im"
                                    color="text-green-400"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                <CampoNumericoGlass
                                    etiquetaAria="Módulo del número complejo z1"
                                    valor={z1Modulo}
                                    alCambiar={establecerZ1Modulo}
                                    marcador="r"
                                    etiqueta="r"
                                    color="text-green-400"
                                />
                                <CampoNumericoGlass
                                    etiquetaAria="Ángulo en grados del número complejo z1"
                                    valor={z1Angulo}
                                    alCambiar={establecerZ1Angulo}
                                    marcador="θ(°)"
                                    etiqueta="θ"
                                    color="text-green-400"
                                />
                            </div>
                        )}
                    </div>

                    {/* Selector de Operación */}
                    <div className="flex items-center gap-2 mb-4">
                        {(['+', '-', '*', '/'] as const).map(op => (
                            <button
                                key={op}
                                onClick={() => establecerOperacionActiva(op)}
                                className={`w-12 h-12 rounded-lg text-xl font-bold transition-all ${operacionActiva === op
                                    ? 'bg-aurora-primary text-white shadow-[0_0_15px_rgba(255,140,66,0.3)]'
                                    : 'bg-white/5 text-aurora-muted border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {op === '*' ? '×' : op === '/' ? '÷' : op}
                            </button>
                        ))}
                    </div>

                    {/* Z2 */}
                    <div className="mb-6">
                        <label className="text-xs text-blue-400 uppercase font-bold block mb-2">
                            z₂
                        </label>
                        {modoEntrada === 'rectangular' ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <CampoNumericoGlass
                                    etiquetaAria="Parte real del número complejo z2"
                                    valor={z2Real}
                                    alCambiar={establecerZ2Real}
                                    marcador="Re"
                                    etiqueta="Re"
                                    color="text-blue-400"
                                />
                                <CampoNumericoGlass
                                    etiquetaAria="Parte imaginaria del número complejo z2"
                                    valor={z2Imag}
                                    alCambiar={establecerZ2Imag}
                                    marcador="Im(i)"
                                    etiqueta="Im"
                                    color="text-blue-400"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                <CampoNumericoGlass
                                    etiquetaAria="Módulo del número complejo z2"
                                    valor={z2Modulo}
                                    alCambiar={establecerZ2Modulo}
                                    marcador="r"
                                    etiqueta="r"
                                    color="text-blue-400"
                                />
                                <CampoNumericoGlass
                                    etiquetaAria="Ángulo en grados del número complejo z2"
                                    valor={z2Angulo}
                                    alCambiar={establecerZ2Angulo}
                                    marcador="θ(°)"
                                    etiqueta="θ"
                                    color="text-blue-400"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={realizarCalculoComplejo}
                        className="w-full py-3 bg-aurora-primary text-white font-bold rounded-lg hover:bg-aurora-primaryHover transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        <Calculator size={18} />
                        Calcular
                    </button>
                </div>

                <div className="hidden lg:flex w-1/2 p-6 flex-col gap-4">
                    {resultadoCalculo && (
                        <>
                            <div className="p-4 bg-aurora-surface border border-aurora-primary/30 rounded-xl">
                                <div className="text-xs text-aurora-muted uppercase mb-1">Resultado Final</div>
                                <div className="text-2xl font-bold text-aurora-primary font-mono">
                                    {darFormatoComplejo(resultadoCalculo)}
                                </div>
                                {resultadoPolarFinal && (
                                    <div className="text-sm text-aurora-muted mt-2 font-mono">
                                        = {resultadoPolarFinal.r.toFixed(4)} ∠ {resultadoPolarFinal.thetaDeg.toFixed(2)}°
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {z1PolarResultado && (
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="text-xs text-aurora-muted uppercase">z₁ polar</div>
                                        <div className="text-sm font-mono text-green-400">
                                            {z1PolarResultado.r.toFixed(2)} ∠ {z1PolarResultado.thetaDeg.toFixed(2)}°
                                        </div>
                                    </div>
                                )}
                                {z2PolarResultado && (
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="text-xs text-aurora-muted uppercase">z₂ polar</div>
                                        <div className="text-sm font-mono text-blue-400">
                                            {z2PolarResultado.r.toFixed(2)} ∠ {z2PolarResultado.thetaDeg.toFixed(2)}°
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-white/10 flex items-center gap-2 bg-black/20">
                            <Eye size={14} className="text-aurora-muted" />
                            <span className="text-xs text-aurora-muted uppercase font-bold tracking-widest">Diagrama de Argand</span>
                        </div>
                        <div className="flex-1 relative bg-[#0a0a0f]">
                            <canvas
                                ref={referenciaLienzo}
                                width={400}
                                height={300}
                                className="w-full h-full absolute inset-0 object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModoComplejo;
