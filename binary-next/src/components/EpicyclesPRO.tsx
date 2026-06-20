"use client";
/**
 * Binary EquaLab - Epiciclos PRO v3 (Aldraverse Edition)
 * 
 * Motor Fourier ultra-optimizado con:
 * - Renderizado avanzado de resplandor (Bloom multi-capa).
 * - Algoritmos de plantillas matemáticas densas (Estrella, Corazón, Pi).
 * - Nomenclatura 100% en Español.
 * - Estética Lava Neón / Ámbar.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import apiService from '../services/apiService';

import {
    Play, Pause, RefreshCw, ZoomIn, ZoomOut,
    Pencil, Trash2, Move, MousePointer2, Sparkles,
    Heart, Star, Infinity, Sigma, Zap, Hash
} from 'lucide-react';

type TipoOnda = 'cuadrada' | 'triangulo' | 'diente' | 'personalizada';
type ModoEntrada = 'dibujo' | 'animacion' | 'funcion';
type TipoPlantilla = 'corazon' | 'estrella' | 'infinito' | 'espiral' | 'lemniscata' | 'cuadrado' | 'pi';

// El backend devuelve esto en inglés por la estructura interna, lo encapsularemos aquí
interface CoeficienteFourier {
    freq: number;
    amplitude: number;
    phase: number;
}

interface Punto {
    x: number;
    y: number;
}

export default function EpiciclosPRO() {
    const refCanvas = useRef<HTMLCanvasElement>(null);
    const refContenedor = useRef<HTMLDivElement>(null);
    
    // Estado principal
    const [estaReproduciendo, setEstaReproduciendo] = useState(true);
    const [modoEntrada, setModoEntrada] = useState<ModoEntrada>('animacion');
    const [tipoOnda, setTipoOnda] = useState<TipoOnda>('cuadrada');
    const refTipoOnda = useRef<TipoOnda>('cuadrada');
    
    // Estado de Dibujo
    const [estaDibujando, setEstaDibujando] = useState(false);
    const [puntosDibujados, setPuntosDibujados] = useState<Punto[]>([]);
    const refPuntosDibujados = useRef<Punto[]>([]);
    
    // Configuración Matemática
    const [coeficientesFourier, setCoeficientesFourier] = useState<CoeficienteFourier[]>([]);
    const [cantidadCirculos, setCantidadCirculos] = useState(50);
    const refCantidadCirculos = useRef(50);
    const [velocidad, setVelocidad] = useState(1.0);
    const refVelocidad = useRef(1.0);
    
    // Estética
    const [brilloActivado, setBrilloActivado] = useState(true);
    const [longitudRastro, setLongitudRastro] = useState(1000);
    const [expresionFuncion, setExpresionFuncion] = useState('x = cos(t); y = sin(2*t)');
    const [errorFuncion, setErrorFuncion] = useState<string | null>(null);

    // Navegación (Pan & Zoom)
    const refZoom = useRef(1.0);
    const refPan = useRef({x: 0, y: 0});
    const refArrastrando = useRef(false);
    const refUltimaPosicion = useRef({x: 0, y: 0});

    // Estado del Motor Físico
    const refTiempo = useRef({t: 0});
    const refRuta = useRef<Punto[]>([]);
    const [, forzarRender] = useState(0);

    useEffect(() => { refTipoOnda.current = tipoOnda; }, [tipoOnda]);
    useEffect(() => { refCantidadCirculos.current = cantidadCirculos; }, [cantidadCirculos]);
    useEffect(() => { refVelocidad.current = velocidad; }, [velocidad]);

    const limpiarRuta = useCallback(() => {
        refRuta.current = [];
    }, []);

    const manejarInicioDibujo = useCallback((e: React.MouseEvent) => {
        if (modoEntrada !== 'dibujo') return;
        const rect = refCanvas.current?.getBoundingClientRect();
        if (!rect) return;

        const pt = {
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        };
        setEstaDibujando(true);
        setPuntosDibujados([pt]);
        refPuntosDibujados.current = [pt];
    }, [modoEntrada]);

    const manejarMovimientoDibujo = useCallback((e: React.MouseEvent) => {
        if (!estaDibujando || modoEntrada !== 'dibujo') return;
        const rect = refCanvas.current?.getBoundingClientRect();
        if (!rect) return;

        const pt = {
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        };
        setPuntosDibujados(prev => [...prev, pt]);
        refPuntosDibujados.current = [...refPuntosDibujados.current, pt];
    }, [estaDibujando, modoEntrada]);

    const manejarFinDibujo = useCallback(async () => {
        if (!estaDibujando) return;
        setEstaDibujando(false);

        if (puntosDibujados.length > 10) {
            const puntosSuavizados = await aplicarSuavizadoLaplaciano(puntosDibujados, 5);
            const coeficientes = await calcularFFT(puntosSuavizados);
            setCoeficientesFourier(coeficientes);
            setTipoOnda('personalizada');
            setModoEntrada('animacion');
            limpiarRuta();
            refTiempo.current.t = 0;
            setCantidadCirculos(Math.min(100, coeficientes.length));
        }
    }, [estaDibujando, puntosDibujados, limpiarRuta]);

    const aplicarSuavizadoLaplaciano = async (puntos: Punto[], iteraciones: number) => {
        try {
            const respuesta = await apiService.epicyclesSmooth(puntos, iteraciones);
            return respuesta.points || puntos;
        } catch (e) {
            console.error("Error al suavizar", e);
            return puntos;
        }
    };

    const calcularFFT = async (puntos: Punto[]): Promise<CoeficienteFourier[]> => {
        try {
            const respuesta = await apiService.epicyclesFft(puntos);
            return respuesta.coefficients || [];
        } catch (e) {
            console.error("Error en FFT", e);
            return [];
        }
    };

    const aplicarFuncionParametrica = async () => {
        if (!expresionFuncion) return;
        try {
            const { translateToEnglish } = await import('../services/functionDefs');
            const funcionTraducida = translateToEnglish(expresionFuncion);

            const respuesta = await apiService.epicyclesParseParametric(funcionTraducida, 200);
            if (respuesta && respuesta.points && respuesta.points.length > 0) {
                const coeficientes = await calcularFFT(respuesta.points);
                setCoeficientesFourier(coeficientes);
                setTipoOnda('personalizada');
                setModoEntrada('animacion');
                limpiarRuta();
                refTiempo.current.t = 0;
                setCantidadCirculos(Math.min(100, coeficientes.length));
                setErrorFuncion(null);
            }
        } catch (e) {
            console.error("Error al parsear la función:", e);
            setErrorFuncion("Expresión no válida. Verifica la sintaxis.");
        }
    };

    const aplicarPlantillaMatematica = async (tipo: TipoPlantilla) => {
        let puntos: Punto[] = [];
        
        switch (tipo) {
            case 'corazon':
                for (let t = 0; t <= 2 * Math.PI; t += 0.02) {
                    const x = 16 * Math.pow(Math.sin(t), 3);
                    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
                    puntos.push({ x: x * 6, y: y * 6 });
                }
                break;
            case 'estrella':
                for (let t = 0; t <= 2 * Math.PI; t += 0.02) {
                    // Ecuación polar de una estrella de 5 puntas
                    const r = 100 * (1 - 0.5 * Math.sin(2.5 * t)**2);
                    puntos.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
                }
                break;
            case 'infinito':
                for (let t = 0; t <= 2 * Math.PI; t += 0.02) {
                    const divisor = 1 + Math.sin(t) * Math.sin(t);
                    const x = (150 * Math.cos(t)) / divisor;
                    const y = (150 * Math.sin(t) * Math.cos(t)) / divisor;
                    puntos.push({ x, y: -y });
                }
                break;
            case 'espiral':
                for (let t = 0; t <= 8 * Math.PI; t += 0.05) {
                    const r = 5 * t;
                    puntos.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
                }
                break;
            case 'lemniscata':
                for (let t = 0; t <= 2 * Math.PI; t += 0.02) {
                    const r = 120 * Math.sqrt(Math.abs(Math.cos(2 * t)));
                    const limiteR = Math.cos(2 * t) >= 0 ? r : 0; 
                    if(limiteR > 0) {
                       puntos.push({ x: limiteR * Math.cos(t), y: limiteR * Math.sin(t) });
                       puntos.push({ x: -limiteR * Math.cos(t), y: -limiteR * Math.sin(t) }); 
                    }
                }
                const respuestaLem = await apiService.epicyclesSmooth(puntos, 1);
                puntos = respuestaLem.points || puntos;
                break;
            case 'cuadrado':
                const lado = 100;
                for(let x = -lado; x <= lado; x+=5) puntos.push({x, y: -lado});
                for(let y = -lado; y <= lado; y+=5) puntos.push({x: lado, y});
                for(let x = lado; x >= -lado; x-=5) puntos.push({x, y: lado});
                for(let y = lado; y >= -lado; y-=5) puntos.push({x: -lado, y});
                break;
            case 'pi':
                // Barra superior
                for(let x = -60; x <= 60; x+=2) puntos.push({x, y: -50});
                // Pata izquierda
                for(let y = -50; y <= 50; y+=2) puntos.push({x: -30, y});
                // Retroceso pata izquierda
                for(let y = 50; y >= -50; y-=2) puntos.push({x: -20, y});
                // Camino a pata derecha
                for(let x = -20; x <= 30; x+=2) puntos.push({x, y: -40});
                // Pata derecha curva
                for(let t = 0; t <= Math.PI/2; t+=0.1) {
                    puntos.push({x: 30 + 10*Math.cos(t), y: -40 + 90*Math.sin(t)});
                }
                break;
        }
        
        if (puntos.length > 0) {
            const coeficientes = await calcularFFT(puntos);
            setCoeficientesFourier(coeficientes);
            setTipoOnda('personalizada');
            setModoEntrada('animacion');
            limpiarRuta();
            refTiempo.current.t = 0;
            setCantidadCirculos(Math.min(100, coeficientes.length));
        }
    };

    // Obtener ondas por defecto desde el backend
    useEffect(() => {
        if (tipoOnda !== 'personalizada') {
            const ondaIngles = tipoOnda === 'cuadrada' ? 'square' : tipoOnda === 'triangulo' ? 'triangle' : 'sawtooth';
            apiService.epicyclesPresetWave(ondaIngles, 100, 100).then(respuesta => {
                if (respuesta && respuesta.coefficients) {
                    setCoeficientesFourier(respuesta.coefficients);
                    limpiarRuta();
                }
            }).catch(e => console.error("Error al obtener onda predefinida:", e));
        }
    }, [tipoOnda, limpiarRuta]);

    const borrarLienzo = () => {
        setPuntosDibujados([]);
        refPuntosDibujados.current = [];
        setCoeficientesFourier([]);
        limpiarRuta();
        refTiempo.current.t = 0;
    };

    // Control de Rueda del Ratón y Zoom
    const manejarRuedaRaton = (e: React.WheelEvent) => {
        if (modoEntrada === 'dibujo') return;
        refZoom.current = Math.max(0.1, Math.min(10, refZoom.current * (1 - e.deltaY * 0.001)));
        forzarRender(t => t + 1);
    };

    const manejarRatonAbajo = (e: React.MouseEvent) => {
        if (modoEntrada === 'dibujo') {
            manejarInicioDibujo(e);
        } else {
            refArrastrando.current = true;
            refUltimaPosicion.current = { x: e.clientX, y: e.clientY };
        }
    };

    const manejarMovimientoRaton = (e: React.MouseEvent) => {
        if (modoEntrada === 'dibujo') {
            manejarMovimientoDibujo(e);
        } else if (refArrastrando.current) {
            const dx = e.clientX - refUltimaPosicion.current.x;
            const dy = e.clientY - refUltimaPosicion.current.y;
            refPan.current.x += dx;
            refPan.current.y += dy;
            refUltimaPosicion.current = { x: e.clientX, y: e.clientY };
        }
    };

    const manejarRatonArriba = () => {
        if (modoEntrada === 'dibujo') {
            manejarFinDibujo();
        }
        refArrastrando.current = false;
    };

    // Bucle de Animación
    useEffect(() => {
        const lienzo = refCanvas.current;
        const contenedor = refContenedor.current;
        if (!lienzo || !contenedor) return;

        const ctx = lienzo.getContext('2d', { alpha: false }); // Optimización de renderizado
        if (!ctx) return;

        const redimensionar = () => {
            const dpr = window.devicePixelRatio || 1;
            lienzo.width = contenedor.clientWidth * dpr;
            lienzo.height = contenedor.clientHeight * dpr;
            lienzo.style.width = contenedor.clientWidth + 'px';
            lienzo.style.height = contenedor.clientHeight + 'px';
            ctx.scale(dpr, dpr);
        };
        window.addEventListener('resize', redimensionar);
        redimensionar();

        let idAnimacion: number;

        const renderizar = () => {
            if (estaReproduciendo && modoEntrada === 'animacion' && coeficientesFourier.length > 0) {
                const pasoTiempo = (2 * Math.PI / coeficientesFourier.length) * refVelocidad.current;
                refTiempo.current.t += pasoTiempo;

                if (refTiempo.current.t > 2 * Math.PI) {
                    refTiempo.current.t -= 2 * Math.PI;
                    // Prevenir el trazo de unión indeseada de un ciclo a otro
                    const u = refRuta.current;
                    if(u.length > 2) {
                        const ultimo = u[u.length-1];
                        const primero = u[0];
                        const dist = Math.hypot(ultimo.x - primero.x, ultimo.y - primero.y);
                        if(dist > 50) limpiarRuta();
                    }
                }
            }

            dibujarEscena(ctx, contenedor.clientWidth, contenedor.clientHeight, refTiempo.current.t);
            idAnimacion = requestAnimationFrame(renderizar);
        };
        
        idAnimacion = requestAnimationFrame(renderizar);

        return () => {
            window.removeEventListener('resize', redimensionar);
            cancelAnimationFrame(idAnimacion);
        };
    }, [estaReproduciendo, modoEntrada, coeficientesFourier, brilloActivado, longitudRastro, limpiarRuta]);

    // Lógica de Renderizado Multicapa (Brillo Estilo Neón Cereza)
    const dibujarEscena = (ctx: CanvasRenderingContext2D, ancho: number, alto: number, tiempo: number) => {
        const zoom = refZoom.current;
        const pan = refPan.current;

        // Fondo profundo
        ctx.fillStyle = '#050005'; 
        ctx.fillRect(0, 0, ancho, alto);

        ctx.save();
        ctx.translate(ancho / 2 + pan.x, alto / 2 + pan.y);
        ctx.scale(zoom, zoom);

        dibujarCuadricula(ctx, ancho, alto, zoom);

        if (modoEntrada === 'dibujo') {
            const pts = refPuntosDibujados.current;
            if (pts.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = '#FF3366'; // Cereza Neón
                ctx.lineWidth = 3 / zoom;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.moveTo(pts[0].x, pts[0].y);
                for (const pt of pts) ctx.lineTo(pt.x, pt.y);
                ctx.stroke();
            }
        } else {
            let x = 0, y = 0;

            if (coeficientesFourier.length > 0) {
                const limiteCirculos = Math.min(refCantidadCirculos.current, coeficientesFourier.length);

                for (let i = 0; i < coeficientesFourier.length; i++) {
                    const coef = coeficientesFourier[i];
                    const prevX = x, prevY = y;

                    const angulo = coef.freq * tiempo + coef.phase;
                    x += coef.amplitude * Math.cos(angulo);
                    y += coef.amplitude * Math.sin(angulo);

                    if (i < limiteCirculos && coef.amplitude > 0.5) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + (1 - i / limiteCirculos) * 0.1})`;
                        ctx.lineWidth = 1 / zoom;
                        ctx.arc(prevX, prevY, coef.amplitude, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 51, 102, ${0.1 + (1 - i / limiteCirculos) * 0.4})`;
                        ctx.lineWidth = 1.5 / zoom;
                        ctx.moveTo(prevX, prevY);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }
                }
            }

            refRuta.current.push({ x, y });
            if (refRuta.current.length > longitudRastro) {
                refRuta.current.shift();
            }

            if (refRuta.current.length > 1) {
                const p0 = refRuta.current[0];
                const pn = refRuta.current[refRuta.current.length - 1];
                
                let gradiente = null;
                if (isFinite(p0.x) && isFinite(p0.y) && isFinite(pn.x) && isFinite(pn.y)) {
                    gradiente = ctx.createLinearGradient(p0.x, p0.y, pn.x, pn.y);
                    gradiente.addColorStop(0, 'rgba(255, 51, 102, 0)');
                    gradiente.addColorStop(0.2, 'rgba(255, 51, 102, 0.4)');
                    gradiente.addColorStop(1, 'rgba(255, 170, 51, 1)'); // Cereza a Ámbar
                }

                const renderizarTrazo = (anchoTrazo: number, alfa: number) => {
                    ctx.beginPath();
                    ctx.globalAlpha = alfa;
                    ctx.strokeStyle = gradiente || '#FF3366';
                    ctx.lineWidth = anchoTrazo / zoom;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.moveTo(refRuta.current[0].x, refRuta.current[0].y);
                    for (const pt of refRuta.current) ctx.lineTo(pt.x, pt.y);
                    ctx.stroke();
                };

                // Renderizado Multicapa (Bloom optimizado)
                if (brilloActivado) {
                    renderizarTrazo(15, 0.05); // Dispersión
                    renderizarTrazo(6, 0.2);   // Central
                }
                renderizarTrazo(2.5, 1.0);     // Núcleo
                ctx.globalAlpha = 1.0;
            }

            ctx.fillStyle = '#FFAA33'; // Punta Ámbar luminosa
            ctx.beginPath();
            ctx.arc(x, y, 6 / zoom, 0, Math.PI * 2);
            ctx.fill();
            if(brilloActivado) {
                ctx.fillStyle = 'rgba(255, 170, 51, 0.3)';
                ctx.beginPath();
                ctx.arc(x, y, 16 / zoom, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    };

    const dibujarCuadricula = (ctx: CanvasRenderingContext2D, ancho: number, alto: number, zoom: number) => {
        const paso = 50;
        const izq = -ancho / 2 / zoom;
        const der = ancho / 2 / zoom;
        const arriba = -alto / 2 / zoom;
        const abajo = alto / 2 / zoom;

        ctx.lineWidth = 1 / zoom;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();

        for (let i = Math.floor(izq / paso) * paso; i < der; i += paso) {
            ctx.moveTo(i, arriba); ctx.lineTo(i, abajo);
        }
        for (let i = Math.floor(arriba / paso) * paso; i < abajo; i += paso) {
            ctx.moveTo(izq, i); ctx.lineTo(der, i);
        }
        ctx.stroke();

        ctx.lineWidth = 2 / zoom;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(izq, 0); ctx.lineTo(der, 0);
        ctx.moveTo(0, arriba); ctx.lineTo(0, abajo);
        ctx.stroke();
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-[#050005] text-white overflow-hidden font-sans">
            <div className="w-full lg:w-80 bg-[#120010]/80 backdrop-blur-md border-r border-[#FF3366]/20 flex flex-col z-20 shrink-0 shadow-[4px_0_24px_rgba(255,51,102,0.1)] overflow-y-auto">
                <div className="p-5 border-b border-[#FF3366]/20 flex justify-between items-center bg-[#FF3366]/5">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={16} className="text-[#FF3366]" />
                        Epiciclos PRO
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/30 font-mono">
                        {modoEntrada === 'dibujo' ? 'DIBUJO' : modoEntrada === 'funcion' ? 'f(t)' : 'VIVO'}
                    </span>
                </div>

                <div className="p-5 space-y-6 flex-1">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-[#FF3366]/80 uppercase">Modo Operativo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'dibujo' as ModoEntrada, Icono: Pencil, etiqueta: 'A Mano' },
                                { id: 'funcion' as ModoEntrada, Icono: Sigma, etiqueta: 'Fórmulas' },
                                { id: 'animacion' as ModoEntrada, Icono: Play, etiqueta: 'Motor' },
                            ].map(({ id, Icono, etiqueta }) => (
                                <button
                                    key={id}
                                    onClick={() => setModoEntrada(id)}
                                    className={`py-2 px-2 text-[10px] font-bold rounded-lg transition-all border flex flex-col items-center gap-1 ${modoEntrada === id
                                        ? 'bg-gradient-to-br from-[#FF3366] to-[#FF0044] text-white border-[#FF3366] shadow-[0_0_12px_rgba(255,51,102,0.4)]'
                                        : 'bg-transparent text-white/50 border-white/10 hover:bg-[#FF3366]/10'
                                        }`}
                                >
                                    <Icono size={16} />
                                    {etiqueta}
                                </button>
                            ))}
                        </div>
                    </div>

                    {modoEntrada === 'dibujo' && (
                        <div className="p-4 rounded-xl bg-[#FF3366]/10 border border-[#FF3366]/30">
                            <p className="text-sm text-[#FF3366] font-medium leading-relaxed">
                                ✏️ Traza cualquier figura. El motor aplicará suavizado Laplaciano y extraerá las series de Fourier.
                            </p>
                            {puntosDibujados.length > 0 && (
                                <button
                                    onClick={borrarLienzo}
                                    className="mt-4 w-full py-2 text-sm bg-black/40 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Trash2 size={16} />
                                    Eliminar Trazo
                                </button>
                            )}
                        </div>
                    )}

                    {modoEntrada === 'funcion' && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-[#FF3366]/80 uppercase">Ingresar Función f(t)</label>
                            <textarea
                                value={expresionFuncion}
                                onChange={(e) => setExpresionFuncion(e.target.value)}
                                placeholder="x = cos(t); y = sin(2*t)"
                                className="w-full h-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[#FFAA33] font-mono text-sm focus:outline-none focus:border-[#FF3366] resize-none shadow-inner"
                            />
                            {errorFuncion && <p className="text-xs text-red-400">{errorFuncion}</p>}
                            <button
                                onClick={aplicarFuncionParametrica}
                                className="w-full py-2 bg-[#FF3366] text-white font-bold rounded-lg hover:bg-[#FF0044] shadow-[0_0_12px_rgba(255,51,102,0.5)] transition-all"
                            >
                                Graficar Ecuación
                            </button>
                            <div className="text-xs text-white/50 space-y-2 mt-2 p-3 bg-white/5 rounded-lg border border-white/5">
                                <p className="opacity-80 font-bold mb-1">Cálculos sugeridos:</p>
                                <button onClick={() => setExpresionFuncion('x = cos(t); y = sin(2*t)')} className="text-[#FF3366] hover:underline block text-left">Curva de Lissajous</button>
                                <button onClick={() => setExpresionFuncion('r = 1 + 0.5*cos(5*t)')} className="text-[#FF3366] hover:underline block text-left">Rosa Polar</button>
                            </div>
                        </div>
                    )}

                    {modoEntrada === 'animacion' && (
                        <>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-[#FF3366]/80 uppercase">Formas Especiales</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'corazon' as TipoPlantilla, Icono: Heart, etiqueta: 'Corazón' },
                                        { id: 'estrella' as TipoPlantilla, Icono: Star, etiqueta: 'Estrella' },
                                        { id: 'infinito' as TipoPlantilla, Icono: Infinity, etiqueta: 'Infinito' },
                                    ].map(({ id, Icono, etiqueta }) => (
                                        <button
                                            key={id}
                                            onClick={() => aplicarPlantillaMatematica(id)}
                                            className="py-2 px-2 text-[10px] font-bold rounded-lg transition-all border bg-black/40 text-white/70 border-white/10 hover:bg-[#FF3366]/20 hover:border-[#FF3366]/50 flex flex-col items-center gap-1"
                                        >
                                            <Icono size={16} />
                                            {etiqueta}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => aplicarPlantillaMatematica('espiral')} className="py-2 text-[10px] font-bold rounded-lg transition-all border bg-black/40 text-white/70 border-white/10 hover:bg-[#FF3366]/20 hover:text-[#FF3366]">🌀 Espiral</button>
                                    <button onClick={() => aplicarPlantillaMatematica('lemniscata')} className="py-2 text-[10px] font-bold rounded-lg transition-all border bg-black/40 text-white/70 border-white/10 hover:bg-[#FF3366]/20 hover:text-[#FF3366]">∞ Lemnis.</button>
                                    <button onClick={() => aplicarPlantillaMatematica('pi')} className="py-2 text-[10px] font-bold rounded-lg transition-all border bg-black/40 text-white/70 border-white/10 hover:bg-[#FF3366]/20 hover:text-[#FF3366]">𝝅 Símbolo</button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-[#FF3366]/80 uppercase">Ondas Base</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['cuadrada', 'triangulo', 'diente'] as TipoOnda[]).map((tipo) => (
                                        <button
                                            key={tipo}
                                            onClick={() => { setTipoOnda(tipo); limpiarRuta(); refTiempo.current.t = 0; }}
                                            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border ${tipoOnda === tipo && coeficientesFourier.length === 0
                                                ? 'bg-[#FF3366] text-white border-[#FF3366]'
                                                : 'bg-black/40 text-white/60 border-white/10 hover:bg-[#FF3366]/20'
                                                }`}
                                        >
                                            {tipo === 'cuadrada' && '▭ Cuadrada'}
                                            {tipo === 'triangulo' && '△ Triángulo'}
                                            {tipo === 'diente' && '⋸ Diente'}
                                        </button>
                                    ))}
                                    <button
                                        disabled={coeficientesFourier.length === 0}
                                        onClick={() => { setTipoOnda('personalizada'); limpiarRuta(); }}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border ${tipoOnda === 'personalizada' && coeficientesFourier.length > 0
                                            ? 'bg-[#FF3366] text-white border-[#FF3366]'
                                            : coeficientesFourier.length === 0
                                                ? 'bg-transparent text-white/20 border-white/5 cursor-not-allowed'
                                                : 'bg-black/40 text-white/60 border-white/10 hover:bg-[#FF3366]/20'
                                            }`}
                                    >
                                        ✏️ Render Custom
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-black/30 rounded-xl border border-[#FF3366]/10 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-white/60 uppercase">Cant. Armónicos</label>
                                        <span className="text-[#FFAA33] font-mono text-xs">{cantidadCirculos} N</span>
                                    </div>
                                    <input
                                        type="range" min="1" max={tipoOnda === 'personalizada' ? Math.max(coeficientesFourier.length, 100) : 100} step="1"
                                        value={cantidadCirculos}
                                        onChange={(e) => { setCantidadCirculos(parseInt(e.target.value)); limpiarRuta(); }}
                                        className="w-full h-1 bg-[#FF3366]/20 rounded-lg appearance-none cursor-pointer accent-[#FF3366]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-white/60 uppercase">Velocidad</label>
                                        <span className="text-[#FFAA33] font-mono text-xs">{velocidad.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range" min="0.1" max="5.0" step="0.1"
                                        value={velocidad}
                                        onChange={(e) => { setVelocidad(parseFloat(e.target.value)); limpiarRuta(); }}
                                        className="w-full h-1 bg-[#FF3366]/20 rounded-lg appearance-none cursor-pointer accent-[#FF3366]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-[#FF3366]/80 uppercase">Estética Visual</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer hover:text-white transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={brilloActivado}
                                            onChange={(e) => setBrilloActivado(e.target.checked)}
                                            className="accent-[#FF3366] size-4 rounded"
                                        />
                                        Sistema Glow Multinivel
                                    </label>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] text-white/60 uppercase">Longitud de Rastro</span>
                                    <span className="text-[#FFAA33] font-mono text-xs">{longitudRastro} px</span>
                                </div>
                                <input
                                    type="range" min="100" max="3000" step="100"
                                    value={longitudRastro}
                                    onChange={(e) => setLongitudRastro(parseInt(e.target.value))}
                                    className="w-full h-1 bg-[#FF3366]/20 rounded-lg appearance-none cursor-pointer accent-[#FFAA33]"
                                />
                            </div>
                        </>
                    )}

                    {tipoOnda === 'personalizada' && coeficientesFourier.length > 0 && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-gradient-to-b from-[#1a0510] to-[#0a0205] border border-[#FF3366]/20 shadow-inner">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Inspect. Fourier</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-500/20">
                                        {coeficientesFourier.length} Frec.
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {coeficientesFourier.slice(0, 5).map((coef, indice) => (
                                        <div key={indice} className="bg-black/50 p-3 rounded-lg border border-white/5 hover:border-[#FF3366]/30 transition-colors">
                                            <div className="flex justify-between text-[10px] text-white/50 mb-2 font-mono">
                                                <span>f = {coef.freq} Hz</span>
                                                <span className="text-[#FF3366]">Armónico #{indice + 1}</span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex gap-3 items-center">
                                                    <span className="text-[10px] w-8 text-white/70">Amp.</span>
                                                    <input
                                                        type="range" min="0" max="300" step="1"
                                                        value={coef.amplitude}
                                                        onChange={(e) => {
                                                            const nuevosCoefs = [...coeficientesFourier];
                                                            nuevosCoefs[indice].amplitude = parseFloat(e.target.value);
                                                            setCoeficientesFourier(nuevosCoefs);
                                                            limpiarRuta();
                                                        }}
                                                        className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF3366]"
                                                    />
                                                    <span className="text-[10px] w-8 text-right font-mono text-[#FFAA33]">{coef.amplitude.toFixed(0)}</span>
                                                </div>
                                                <div className="flex gap-3 items-center">
                                                    <span className="text-[10px] w-8 text-white/70">Fase</span>
                                                    <input
                                                        type="range" min={-Math.PI} max={Math.PI} step="0.1"
                                                        value={coef.phase}
                                                        onChange={(e) => {
                                                            const nuevosCoefs = [...coeficientesFourier];
                                                            nuevosCoefs[indice].phase = parseFloat(e.target.value);
                                                            setCoeficientesFourier(nuevosCoefs);
                                                            limpiarRuta();
                                                        }}
                                                        className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <span className="text-[10px] w-8 text-right font-mono text-blue-400">{coef.phase.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={borrarLienzo}
                        className="w-full py-3 text-xs border border-white/10 rounded-lg hover:bg-[#FF3366]/20 transition-colors bg-black/20 text-white/70 hover:text-white font-bold tracking-wider uppercase"
                    >
                        <RefreshCw size={14} className="inline mr-2" />
                        Reiniciar Motor
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div
                className="flex-1 relative h-full bg-[#050005] overflow-hidden select-none"
                ref={refContenedor}
                style={{ cursor: modoEntrada === 'dibujo' ? 'crosshair' : 'grab' }}
            >
                <canvas
                    ref={refCanvas}
                    className="block w-full h-full"
                    onWheel={manejarRuedaRaton}
                    onMouseDown={manejarRatonAbajo}
                    onMouseMove={manejarMovimientoRaton}
                    onMouseUp={manejarRatonArriba}
                    onMouseLeave={manejarRatonArriba}
                />

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 rounded-2xl bg-[#120010]/90 backdrop-blur-md border border-[#FF3366]/20 shadow-[0_8px_32px_rgba(255,51,102,0.15)] z-30">
                    <button
                        onClick={() => { refZoom.current = Math.max(0.1, refZoom.current - 0.2); forzarRender(t => t + 1); }}
                        className="p-3 rounded-xl hover:bg-[#FF3366]/10 text-white/80 hover:text-white transition-colors"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <div className="w-px h-8 bg-white/10"></div>
                    <button
                        onClick={() => setEstaReproduciendo(!estaReproduciendo)}
                        className="size-14 rounded-xl bg-gradient-to-br from-[#FF3366] to-[#FF0044] text-white flex items-center justify-center hover:shadow-[0_0_24px_rgba(255,51,102,0.6)] transition-all active:scale-95 border border-[#FFAA33]/30"
                    >
                        {estaReproduciendo ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                    </button>
                    <div className="w-px h-8 bg-white/10"></div>
                    <button
                        onClick={() => { refZoom.current = Math.min(10, refZoom.current + 0.2); forzarRender(t => t + 1); }}
                        className="p-3 rounded-xl hover:bg-[#FF3366]/10 text-white/80 hover:text-white transition-colors"
                    >
                        <ZoomIn size={20} />
                    </button>
                </div>

                <div className="absolute top-8 right-8 flex flex-col items-end pointer-events-none opacity-40">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF3366] to-[#FFAA33] tracking-tighter drop-shadow-lg">
                        EPICICLOS
                    </h1>
                    <span className="text-[#FF3366] font-mono text-[10px] tracking-[0.3em] uppercase bg-[#FF3366]/10 px-2 py-1 rounded mt-1 border border-[#FF3366]/20">
                        Binary EquaLab
                    </span>
                    <div className="flex items-center gap-4 text-white/50 font-mono text-[10px] mt-4 uppercase">
                        {modoEntrada === 'dibujo' ? (
                            <span className="flex items-center gap-1"><Pencil size={12} /> Interpolación Matemática</span>
                        ) : (
                            <>
                                <span className="flex items-center gap-1"><MousePointer2 size={12} /> Desplazar Lienzo</span>
                                <span className="flex items-center gap-1"><Move size={12} /> Zoom Motor</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
