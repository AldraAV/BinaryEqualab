/**
 * Binary EquaLab - Equations Mode (Mejorado)
 * 
 * Resuelve ecuaciones individuales, sistemas y desigualdades:
 * - Single: x² + 2x - 3 = 0
 * - Systems: { 2x + y = 5, x - y = 1 }
 * - Inequalities: x² - 4 > 0, 2x + 1 <= 7
 */

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Play, ArrowRight, Loader2, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import apiService from '../services/apiService';
import MathDisplay from './MathDisplay';

type TipoEcuacion = 'single' | 'system' | 'inequality';
type OperadorDesigualdad = '>' | '<' | '>=' | '<=';

interface Ecuacion {
    id: number;
    lhs: string;
    rhs: string;
}

interface ResultadoSolucion {
    latex: string;
    result: string;
    approx?: string;
    success: boolean;
}

// Presets de ejemplos rápidos por tipo
const PRESETS: Record<TipoEcuacion, { nombre: string; ecuaciones: Ecuacion[]; variable: string; operador?: OperadorDesigualdad }[]> = {
    single: [
        { nombre: 'Cuadrática', ecuaciones: [{ id: 1, lhs: 'x^2 + 2*x - 3', rhs: '0' }], variable: 'x' },
        { nombre: 'Cúbica', ecuaciones: [{ id: 1, lhs: 'x^3 - 6*x^2 + 11*x - 6', rhs: '0' }], variable: 'x' },
        { nombre: 'Trigonométrica', ecuaciones: [{ id: 1, lhs: 'sin(x)', rhs: '1/2' }], variable: 'x' },
        { nombre: 'Exponencial', ecuaciones: [{ id: 1, lhs: 'exp(x) - 3', rhs: '0' }], variable: 'x' },
    ],
    system: [
        { nombre: '2×2 Lineal', ecuaciones: [{ id: 1, lhs: '2*x + y', rhs: '5' }, { id: 2, lhs: 'x - y', rhs: '1' }], variable: 'x, y' },
        { nombre: '3×3 Lineal', ecuaciones: [{ id: 1, lhs: 'x + y + z', rhs: '6' }, { id: 2, lhs: '2*x - y + z', rhs: '3' }, { id: 3, lhs: 'x + 2*y - z', rhs: '2' }], variable: 'x, y, z' },
        { nombre: 'No Lineal', ecuaciones: [{ id: 1, lhs: 'x^2 + y^2', rhs: '25' }, { id: 2, lhs: 'x - y', rhs: '1' }], variable: 'x, y' },
    ],
    inequality: [
        { nombre: 'Cuadrática >', ecuaciones: [{ id: 1, lhs: 'x^2 - 4', rhs: '0' }], variable: 'x', operador: '>' },
        { nombre: 'Lineal <=', ecuaciones: [{ id: 1, lhs: '2*x + 1', rhs: '7' }], variable: 'x', operador: '<=' },
        { nombre: 'Racional >=', ecuaciones: [{ id: 1, lhs: '(x-1)/(x+2)', rhs: '0' }], variable: 'x', operador: '>=' },
    ],
};

const EquationsMode: React.FC = () => {
    const [tipoEcuacion, setTipoEcuacion] = useState<TipoEcuacion>('single');
    const [ecuaciones, setEcuaciones] = useState<Ecuacion[]>([
        { id: 1, lhs: 'x^2 + 2*x - 3', rhs: '0' }
    ]);
    const [variable, setVariable] = useState('x');
    const [operadorDesigualdad, setOperadorDesigualdad] = useState<OperadorDesigualdad>('>');
    const [resultado, setResultado] = useState<ResultadoSolucion | null>(null);
    const [pasos, setPasos] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [mostrarPresets, setMostrarPresets] = useState(false);
    const [mostrarPasos, setMostrarPasos] = useState(true);

    const agregarEcuacion = useCallback(() => {
        const siguienteId = Math.max(...ecuaciones.map(e => e.id), 0) + 1;
        setEcuaciones(prev => [...prev, { id: siguienteId, lhs: '', rhs: '0' }]);
    }, [ecuaciones]);

    const eliminarEcuacion = useCallback((id: number) => {
        if (ecuaciones.length > 1) {
            setEcuaciones(prev => prev.filter(e => e.id !== id));
        }
    }, [ecuaciones.length]);

    const actualizarEcuacion = useCallback((id: number, campo: 'lhs' | 'rhs', valor: string) => {
        setEcuaciones(prev => prev.map(e =>
            e.id === id ? { ...e, [campo]: valor } : e
        ));
    }, []);

    const cargarPreset = useCallback((preset: typeof PRESETS['single'][0]) => {
        setEcuaciones(preset.ecuaciones);
        setVariable(preset.variable);
        if ('operador' in preset && preset.operador) {
            setOperadorDesigualdad(preset.operador);
        }
        setResultado(null);
        setPasos([]);
        setError(null);
        setMostrarPresets(false);
    }, []);

    const validarInputs = (): boolean => {
        for (const eq of ecuaciones) {
            if (!eq.lhs.trim()) {
                setError('Ingresa una expresión en el lado izquierdo de la ecuación');
                return false;
            }
        }
        if (!variable.trim()) {
            setError('Especifica al menos una variable');
            return false;
        }
        return true;
    };

    const resolverEcuacionSimple = async () => {
        const eq = ecuaciones[0];
        const ecuacionCompleta = `${eq.lhs}=${eq.rhs || '0'}`;

        setPasos([
            `Ecuación: ${eq.lhs} = ${eq.rhs || '0'}`,
            `Variable: ${variable}`,
            'Enviando al motor CAS...'
        ]);

        const res = await apiService.solveEquation(ecuacionCompleta, variable);

        setPasos(prev => [
            ...prev.slice(0, 2),
            'Motor CAS procesó la ecuación',
            `Soluciones encontradas: ${res.result}`
        ]);

        return res;
    };

    const resolverSistema = async () => {
        const eqs = ecuaciones.map(eq => `${eq.lhs}=${eq.rhs || '0'}`);
        const vars = variable.split(',').map(v => v.trim()).filter(Boolean);

        setPasos([
            'Sistema de ecuaciones:',
            ...ecuaciones.map((eq, i) => `  (${i + 1}) ${eq.lhs} = ${eq.rhs || '0'}`),
            `Variables: ${vars.join(', ')}`,
            'Enviando al motor CAS...'
        ]);

        const res = await apiService.solveSystem(eqs, vars);

        setPasos(prev => [
            ...prev.slice(0, -1),
            'Motor CAS procesó el sistema',
            `Solución: ${res.result}`
        ]);

        return res;
    };

    const resolverDesigualdad = async () => {
        const eq = ecuaciones[0];
        const expresionCompleta = `${eq.lhs}${operadorDesigualdad}${eq.rhs || '0'}`;

        setPasos([
            `Desigualdad: ${eq.lhs} ${operadorDesigualdad} ${eq.rhs || '0'}`,
            `Variable: ${variable}`,
            'Enviando al motor CAS...'
        ]);

        const res = await apiService.solveInequality(expresionCompleta, variable);

        setPasos(prev => [
            ...prev.slice(0, 2),
            'Motor CAS procesó la desigualdad',
            `Solución (intervalos): ${res.result}`
        ]);

        return res;
    };

    const resolver = async () => {
        if (!validarInputs()) return;

        setResultado(null);
        setPasos([]);
        setError(null);
        setCargando(true);

        try {
            let res: any;
            switch (tipoEcuacion) {
                case 'single':
                    res = await resolverEcuacionSimple();
                    break;
                case 'system':
                    res = await resolverSistema();
                    break;
                case 'inequality':
                    res = await resolverDesigualdad();
                    break;
            }

            setResultado({
                latex: res.latex || res.result,
                result: res.result,
                approx: res.approx,
                success: true
            });
            setError(null);
        } catch (e) {
            const mensaje = e instanceof Error ? e.message : 'Error desconocido al resolver';
            setError(mensaje);
            setResultado(null);
            setPasos(prev => [...prev, `Error: ${mensaje}`]);
        } finally {
            setCargando(false);
        }
    };

    const manejarEnter = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !cargando) {
            resolver();
        }
    };

    const cambiarTipo = (tipo: TipoEcuacion) => {
        setTipoEcuacion(tipo);
        setResultado(null);
        setPasos([]);
        setError(null);

        if (tipo === 'single') {
            setEcuaciones([{ id: 1, lhs: 'x^2 + 2*x - 3', rhs: '0' }]);
            setVariable('x');
        } else if (tipo === 'system') {
            setEcuaciones([
                { id: 1, lhs: '2*x + y', rhs: '5' },
                { id: 2, lhs: 'x - y', rhs: '1' }
            ]);
            setVariable('x, y');
        } else {
            setEcuaciones([{ id: 1, lhs: 'x^2 - 4', rhs: '0' }]);
            setVariable('x');
            setOperadorDesigualdad('>');
        }
    };

    return (
        <div className="flex flex-col h-full bg-aurora-bg">
            {/* Selector de tipo */}
            <div className="flex items-center gap-2 p-3 bg-background-light border-b border-aurora-border overflow-x-auto">
                <span className="text-xs text-aurora-muted uppercase tracking-wider mr-2 shrink-0">Tipo:</span>
                {([
                    { key: 'single' as const, label: 'Ecuación' },
                    { key: 'system' as const, label: 'Sistema' },
                    { key: 'inequality' as const, label: 'Desigualdad' },
                ]).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => cambiarTipo(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tipoEcuacion === key
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                            }`}
                    >
                        {label}
                    </button>
                ))}

                {/* Botón de presets */}
                <div className="ml-auto relative">
                    <button
                        onClick={() => setMostrarPresets(!mostrarPresets)}
                        className="px-3 py-2 rounded-lg text-sm text-aurora-muted hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
                    >
                        <Sparkles size={14} />
                        Ejemplos
                        {mostrarPresets ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {mostrarPresets && (
                        <div className="absolute right-0 top-full mt-1 bg-background-light border border-aurora-border rounded-xl shadow-2xl z-50 min-w-48 overflow-hidden">
                            {PRESETS[tipoEcuacion].map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => cargarPreset(preset)}
                                    className="w-full px-4 py-2.5 text-sm text-left text-aurora-text hover:bg-white/10 hover:text-white transition-colors border-b border-aurora-border/30 last:border-b-0"
                                >
                                    {preset.nombre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Panel de entrada */}
                <div className="w-full lg:w-1/2 p-4 lg:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-aurora-border">
                    <h2 className="text-lg font-bold text-white mb-4">
                        {tipoEcuacion === 'single' && 'Resolver Ecuación'}
                        {tipoEcuacion === 'system' && 'Resolver Sistema'}
                        {tipoEcuacion === 'inequality' && 'Analizar Desigualdad'}
                    </h2>

                    {/* Inputs de ecuaciones */}
                    <div className="space-y-3 mb-4">
                        {ecuaciones.map((eq, idx) => (
                            <div key={eq.id} className="flex items-center gap-2">
                                {tipoEcuacion === 'system' && (
                                    <span className="text-aurora-muted text-xs w-6 shrink-0">({idx + 1})</span>
                                )}
                                <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2 focus-within:border-aurora-primary/50 transition-colors">
                                    <input
                                        type="text"
                                        value={eq.lhs}
                                        onChange={(e) => actualizarEcuacion(eq.id, 'lhs', e.target.value)}
                                        onKeyDown={manejarEnter}
                                        placeholder="x^2 + 2*x"
                                        className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder:text-white/20"
                                        aria-label={`Parte izquierda ecuación ${idx + 1}`}
                                    />
                                    <span className="text-aurora-primary font-bold text-sm shrink-0">
                                        {tipoEcuacion === 'inequality' ? (
                                            <select
                                                value={operadorDesigualdad}
                                                onChange={(e) => setOperadorDesigualdad(e.target.value as OperadorDesigualdad)}
                                                className="bg-transparent text-aurora-primary font-bold text-sm focus:outline-none cursor-pointer"
                                            >
                                                <option value=">">&gt;</option>
                                                <option value="<">&lt;</option>
                                                <option value=">=">&ge;</option>
                                                <option value="<=">&le;</option>
                                            </select>
                                        ) : '='}
                                    </span>
                                    <input
                                        type="text"
                                        value={eq.rhs}
                                        onChange={(e) => actualizarEcuacion(eq.id, 'rhs', e.target.value)}
                                        onKeyDown={manejarEnter}
                                        placeholder="0"
                                        className="w-20 bg-transparent text-white font-mono text-sm focus:outline-none text-right placeholder:text-white/20"
                                        aria-label={`Parte derecha ecuación ${idx + 1}`}
                                    />
                                </div>
                                {ecuaciones.length > 1 && (
                                    <button
                                        onClick={() => eliminarEcuacion(eq.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors shrink-0"
                                        aria-label="Eliminar ecuación"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {tipoEcuacion === 'system' && (
                        <button
                            onClick={agregarEcuacion}
                            className="text-aurora-primary hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors"
                        >
                            <Plus size={14} /> Añadir ecuación
                        </button>
                    )}

                    {/* Variable */}
                    <div className="mb-4">
                        <label htmlFor="entrada-variable" className="text-xs text-aurora-muted uppercase font-bold block mb-1">
                            {tipoEcuacion === 'system' ? 'Variables (separadas por coma)' : 'Variable'}
                        </label>
                        <input
                            type="text"
                            id="entrada-variable"
                            value={variable}
                            onChange={(e) => setVariable(e.target.value)}
                            onKeyDown={manejarEnter}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-aurora-primary/50 transition-colors"
                        />
                    </div>

                    {/* Botón resolver */}
                    <button
                        onClick={resolver}
                        disabled={cargando}
                        className={`w-full py-3 font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                            cargando
                                ? 'bg-aurora-primary/50 text-white/70 cursor-not-allowed'
                                : 'bg-aurora-primary text-white hover:bg-aurora-primaryHover hover:shadow-aurora-primary/30'
                        }`}
                    >
                        {cargando ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Resolviendo...
                            </>
                        ) : (
                            <>
                                <Play size={18} />
                                Resolver
                            </>
                        )}
                    </button>

                    {/* Preview de la ecuación en LaTeX (solo mobile) */}
                    {ecuaciones[0]?.lhs && (
                        <div className="mt-4 p-3 bg-white/3 border border-white/5 rounded-lg">
                            <span className="text-xs text-aurora-muted uppercase block mb-1">Vista previa</span>
                            <MathDisplay
                                expression={
                                    tipoEcuacion === 'inequality'
                                        ? `${ecuaciones[0].lhs} ${operadorDesigualdad === '>=' ? '\\geq' : operadorDesigualdad === '<=' ? '\\leq' : operadorDesigualdad} ${ecuaciones[0].rhs || '0'}`
                                        : `${ecuaciones[0].lhs} = ${ecuaciones[0].rhs || '0'}`
                                }
                            />
                        </div>
                    )}
                </div>

                {/* Panel de resultado — SIEMPRE VISIBLE */}
                <div className="w-full lg:w-1/2 p-4 lg:p-6 flex flex-col overflow-y-auto">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ArrowRight size={20} className="text-aurora-primary" />
                        Solución
                    </h3>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-500/15 border border-red-500/25 rounded-xl text-red-300 mb-4 flex items-start gap-3">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Error al resolver</p>
                                <p className="text-xs text-red-400 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {cargando && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 size={40} className="mx-auto mb-3 text-aurora-primary animate-spin" />
                                <p className="text-aurora-muted text-sm">Procesando en el motor CAS...</p>
                            </div>
                        </div>
                    )}

                    {/* Resultado */}
                    {resultado && !cargando && (
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Resultado principal */}
                            <div className="p-5 bg-aurora-surface border border-aurora-primary/30 rounded-xl shadow-lg shadow-aurora-primary/5">
                                <span className="text-xs text-aurora-muted uppercase font-bold block mb-2">Resultado</span>
                                <MathDisplay expression={resultado.latex} block />
                            </div>

                            {/* Aproximación numérica */}
                            {resultado.approx && resultado.approx !== resultado.result && (
                                <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                                    <span className="text-xs text-aurora-muted uppercase font-bold block mb-1">Aproximación numérica</span>
                                    <p className="text-white font-mono text-sm">{resultado.approx}</p>
                                </div>
                            )}

                            {/* Pasos */}
                            {pasos.length > 0 && (
                                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setMostrarPasos(!mostrarPasos)}
                                        className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-bold text-aurora-muted uppercase hover:bg-white/5 transition-colors"
                                    >
                                        <span>Pasos ({pasos.length})</span>
                                        {mostrarPasos ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    {mostrarPasos && (
                                        <ul className="px-4 pb-3 space-y-1.5 text-sm font-mono">
                                            {pasos.map((paso, i) => (
                                                <li key={i} className="text-aurora-text flex items-start gap-2">
                                                    <span className="text-aurora-primary shrink-0">{i + 1}.</span>
                                                    <span className="break-all">{paso}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado vacío */}
                    {!resultado && !cargando && !error && (
                        <div className="flex-1 flex items-center justify-center text-aurora-muted">
                            <div className="text-center">
                                <div className="text-4xl mb-3 opacity-20">f(x)</div>
                                <p className="text-sm">Ingresa una ecuación y presiona Resolver</p>
                                <p className="text-xs mt-1 opacity-60">o presiona Enter</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Click fuera cierra presets */}
            {mostrarPresets && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMostrarPresets(false)}
                />
            )}
        </div>
    );
};

export default EquationsMode;
