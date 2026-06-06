import React, { useState, useEffect } from 'react';
import { Plus, Minus, RotateCcw, Lightbulb, X, Calculator, ArrowRightLeft } from 'lucide-react';
import MathDisplay from './MathDisplay';
import apiService from '../services/apiService';
import { useCalculator } from '../CalculatorContext';
import { supabase } from '../contexts/AuthContext';
import AIResponseRenderer from './AIResponseRenderer';
import { usarAutocompletado } from '../hooks/usarAutocompletado';

const MATRIX_NAMES = ['A', 'B', 'C', 'D', 'E'] as const;
type MatrixName = typeof MATRIX_NAMES[number];

const MatrixMode: React.FC = () => {
    const { matricesCalculadora, guardarEnMatriz } = useCalculator();
    
    // Selecciones de las dos matrices visibles
    const [activeM1, setActiveM1] = useState<MatrixName>('A');
    const [activeM2, setActiveM2] = useState<MatrixName>('B');
    
    // Operación personalizada
    const [customOperation, setCustomOperation] = useState('');

    const [results, setResults] = useState<{ id: number, command: string; result: string; exprRaw: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Autocomplete UI hook
    const [cursorPos, setCursorPos] = useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const autocompletado = usarAutocompletado(customOperation, cursorPos);

    // Modal Explain
    const [explainModalOpen, setExplainModalOpen] = useState(false);
    const [explainContent, setExplainContent] = useState('');
    const [explainLoading, setExplainLoading] = useState(false);
    const [currentExplainContext, setCurrentExplainContext] = useState('');

    const matrixToString = (m: number[][]): string => {
        return `Matrix(${JSON.stringify(m)})`;
    };

    const handleUpdateMatrix = (matrixKey: MatrixName, row: number, col: number, valueStr: string) => {
        const matrix = matricesCalculadora[matrixKey];
        const newValues = matrix.map(r => [...r]);
        // Permitir temporalmente NaN si está vacío, luego se corregirá a 0 al evaluar
        const val = parseFloat(valueStr);
        newValues[row][col] = isNaN(val) ? 0 : val;
        guardarEnMatriz(matrixKey, newValues);
    };

    const handleResizeMatrix = (matrixKey: MatrixName, newRows: number, newCols: number) => {
        const current = matricesCalculadora[matrixKey];
        const newValues = Array(newRows).fill(0).map(() => Array(newCols).fill(0));
        
        for (let r = 0; r < Math.min(current.length, newRows); r++) {
            for (let c = 0; c < Math.min(current[0].length, newCols); c++) {
                newValues[r][c] = current[r]?.[c] || 0;
            }
        }
        guardarEnMatriz(matrixKey, newValues);
    };

    const resetMatrix = (matrixKey: MatrixName) => {
        guardarEnMatriz(matrixKey, [[0, 0], [0, 0]]);
    };

    const executeOperation = async (operationStr: string, isCross: boolean = false) => {
        setLoading(true);
        try {
            let expr = '';
            let displayCmd = operationStr;
            const m1 = matricesCalculadora[activeM1];
            const m2 = matricesCalculadora[activeM2];

            const strM1 = matrixToString(m1);
            const strM2 = matrixToString(m2);

            switch (operationStr) {
                // Individuales (aplican a M1)
                case 'det':
                    expr = `${strM1}.det()`;
                    displayCmd = `det(${activeM1})`;
                    break;
                case 'inv':
                    expr = `${strM1}.inv()`;
                    displayCmd = `${activeM1}^{-1}`;
                    break;
                case 'transpose':
                    expr = `${strM1}.T`;
                    displayCmd = `${activeM1}^{T}`;
                    break;
                case 'eigenvals':
                    expr = `${strM1}.eigenvals()`;
                    displayCmd = `\\text{eigen}(${activeM1})`;
                    break;
                case 'rref':
                    expr = `${strM1}.rref()`;
                    displayCmd = `\\text{rref}(${activeM1})`;
                    break;
                case 'trace':
                    expr = `${strM1}.trace()`;
                    displayCmd = `\\text{tr}(${activeM1})`;
                    break;
                // Cruzadas (M1 y M2)
                case 'A * B':
                    expr = `${strM1} * ${strM2}`;
                    displayCmd = `${activeM1} \\times ${activeM2}`;
                    break;
                case 'A + B':
                    expr = `${strM1} + ${strM2}`;
                    displayCmd = `${activeM1} + ${activeM2}`;
                    break;
                case 'A - B':
                    expr = `${strM1} - ${strM2}`;
                    displayCmd = `${activeM1} - ${activeM2}`;
                    break;
                default:
                    expr = operationStr;
            }

            const response = await apiService.evaluate(expr);
            setResults(prev => [...prev, { 
                id: Date.now(), 
                command: displayCmd, 
                result: response.latex || response.result,
                exprRaw: expr // Para mandarlo a explicar si es necesario
            }]);
        } catch (error: any) {
            setResults(prev => [...prev, { 
                id: Date.now(), 
                command: operationStr, 
                result: `\\text{Error: Formato inválido}`,
                exprRaw: ''
            }]);
        } finally {
            setLoading(false);
        }
    };

    const executeCustomOperation = async () => {
        if (!customOperation.trim()) return;
        setLoading(true);
        try {
            let expr = customOperation;
            // Sustituir A, B, C, D, E por sus representaciones de string (JSON) para SymPy
            MATRIX_NAMES.forEach(name => {
                const regexNombre = new RegExp(`\\b${name}\\b`, 'g');
                expr = expr.replace(regexNombre, matrixToString(matricesCalculadora[name]));
            });
            
            const response = await apiService.evaluate(expr);
            setResults(prev => [...prev, { 
                id: Date.now(), 
                command: customOperation, 
                result: response.latex || response.result,
                exprRaw: expr 
            }]);
            setCustomOperation('');
        } catch (error: any) {
            setResults(prev => [...prev, { 
                id: Date.now(), 
                command: customOperation, 
                result: `\\text{Error de cálculo. Revisa las dimensiones.}`,
                exprRaw: '' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const simplificarOperacionPersonalizada = async () => {
        if (!customOperation.trim()) return;
        setLoading(true);
        try {
            let expr = customOperation;
            MATRIX_NAMES.forEach(name => {
                const regexNombre = new RegExp(`\\b${name}\\b`, 'g');
                expr = expr.replace(regexNombre, matrixToString(matricesCalculadora[name]));
            });
            
            const response = await apiService.evaluate(`simplify(${expr})`);
            setResults(prev => [...prev, { 
                id: Date.now(), 
                command: `\\text{simplificar}(${customOperation})`, 
                result: response.latex || response.result,
                exprRaw: `simplify(${expr})` 
            }]);
        } catch (error: any) {
            setResults(prev => [...prev, { 
                id: Date.now(), 
                command: `\\text{simplificar}(${customOperation})`, 
                result: `\\text{Error al simplificar.}`,
                exprRaw: '' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleExplain = async (command: string, exprRaw: string) => {
        setExplainModalOpen(true);
        setExplainLoading(true);
        setCurrentExplainContext(`Explicando paso a paso la operación: ${command}`);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            
            const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}/api/ai/explain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ query: `explica paso a paso cómo resolver esto: ${exprRaw}` })
            });
            const data = await response.json();
            setExplainContent(data.explanation || 'No se pudo generar explicación.');
        } catch (error) {
            setExplainContent('Error al conectar con la IA de explicación.');
        } finally {
            setExplainLoading(false);
        }
    };

    const MatrixEditor = ({ matrixKey }: { matrixKey: MatrixName }) => {
        const matrix = matricesCalculadora[matrixKey];
        const rows = matrix.length;
        const cols = matrix[0]?.length || 1;

        return (
            <div className="bg-background-light rounded-xl border border-aurora-border overflow-hidden flex flex-col shadow-sm relative group">
                {/* Botón flotante superior derecho para guardar si fuera a historial, pero en este caso son matrices de estado, así que lo omitimos o usamos para clear */}
                <div className="px-4 py-3 border-b border-aurora-border bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded bg-primary/20 text-primary flex items-center justify-center font-bold font-mono shadow-inner">
                            {matrixKey}
                        </div>
                        <select 
                            value={matrixKey} 
                            onChange={(e) => matrixKey === activeM1 ? setActiveM1(e.target.value as MatrixName) : setActiveM2(e.target.value as MatrixName)}
                            className="bg-transparent text-white font-bold outline-none cursor-pointer hover:text-primary transition-colors"
                        >
                            {MATRIX_NAMES.map(m => (
                                <option key={m} value={m} className="bg-background text-white">Matriz {m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleResizeMatrix(matrixKey, Math.max(1, rows - 1), cols)}
                            className="p-1.5 hover:bg-white/10 rounded text-aurora-muted transition-colors"
                            title="Quitar Fila"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="text-xs text-aurora-muted font-mono w-10 text-center">{rows} × {cols}</span>
                        <button
                            onClick={() => handleResizeMatrix(matrixKey, rows + 1, cols)}
                            className="p-1.5 hover:bg-white/10 rounded text-aurora-muted transition-colors"
                            title="Añadir Fila"
                        >
                            <Plus size={14} />
                        </button>
                        <button onClick={() => resetMatrix(matrixKey)} title="Limpiar Matriz" className="ml-2 text-aurora-muted hover:text-red-400 p-1 rounded transition-colors">
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 flex items-center justify-center bg-background min-h-[200px] overflow-auto relative">
                    <div className="flex relative before:absolute before:inset-y-0 before:-left-3 before:w-3 before:border-2 before:border-r-0 before:border-primary/40 before:rounded-l-lg after:absolute after:inset-y-0 after:-right-3 after:w-3 after:border-2 after:border-l-0 after:border-primary/40 after:rounded-r-lg shadow-2xl">
                        <div
                            className="grid gap-2 p-1"
                            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                        >
                            {matrix.map((rowArr, r) =>
                                rowArr.map((val, c) => (
                                    <input
                                        key={`${matrixKey}-${r}-${c}`}
                                        type="number"
                                        value={val.toString()}
                                        onChange={(e) => handleUpdateMatrix(matrixKey, r, c, e.target.value)}
                                        className="w-16 h-12 bg-white/5 border border-aurora-border rounded text-center text-white font-mono focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-4 py-2 border-t border-aurora-border bg-white/5 flex justify-end gap-3">
                    <button
                        onClick={() => handleResizeMatrix(matrixKey, rows, Math.max(1, cols - 1))}
                        className="text-xs text-aurora-muted hover:text-white transition-colors"
                    >
                        - Col
                    </button>
                    <button
                        onClick={() => handleResizeMatrix(matrixKey, rows, cols + 1)}
                        className="text-xs text-aurora-muted hover:text-white transition-colors"
                    >
                        + Col
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background p-6 lg:p-8 overflow-y-auto relative">
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
                <header className="flex justify-between items-end border-b border-aurora-border/50 pb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Calculator className="text-primary size-8" />
                            Álgebra Lineal
                        </h2>
                        <p className="text-aurora-muted mt-2">Gestiona matrices y realiza operaciones avanzadas con explicaciones paso a paso.</p>
                    </div>
                </header>

                {/* Editores */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                    <MatrixEditor matrixKey={activeM1} />
                    <MatrixEditor matrixKey={activeM2} />
                    
                    {/* Decorativo en el centro */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-10 rounded-full bg-background border border-aurora-border items-center justify-center text-aurora-muted shadow-lg z-10">
                        <ArrowRightLeft size={18} />
                    </div>
                </div>

                {/* Toolbar Operaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Individuales */}
                    <div className="bg-background-light border border-aurora-border rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                            Op. Individuales ({activeM1})
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { op: 'det', label: 'Determinante' },
                                { op: 'inv', label: 'Inversa' },
                                { op: 'transpose', label: 'Transpuesta' },
                                { op: 'trace', label: 'Traza' },
                                { op: 'rref', label: 'Escalonada (RREF)' },
                                { op: 'eigenvals', label: 'Eigenvalores' }
                            ].map(item => (
                                <button
                                    key={item.op}
                                    onClick={() => executeOperation(item.op)}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/50 text-aurora-muted text-sm font-medium transition-all border border-transparent shadow-sm disabled:opacity-50"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cruzadas */}
                    <div className="bg-background-light border border-aurora-border rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <div className="size-2 rounded-full bg-secondary animate-pulse"></div>
                            Op. Cruzadas ({activeM1} y {activeM2})
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                            {['A * B', 'A + B', 'A - B'].map(op => (
                                <button
                                    key={op}
                                    onClick={() => executeOperation(op, true)}
                                    disabled={loading}
                                    className="px-5 py-2 rounded-lg bg-white/5 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/50 text-aurora-muted text-sm font-bold font-mono transition-all border border-transparent shadow-sm disabled:opacity-50"
                                >
                                    {op.replace('A', activeM1).replace('B', activeM2)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Input de Expresión Libre */}
                <div className="bg-background-light border border-aurora-border rounded-xl p-5 shadow-sm mt-2">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                        <div className="size-2 rounded-full bg-cyan-400 animate-pulse"></div>
                        Expresión Personalizada
                    </h3>
                    <div className="flex gap-3 relative">
                        <input 
                            type="text"
                            ref={inputRef}
                            value={customOperation}
                            onChange={(e) => {
                                setCustomOperation(e.target.value);
                                setCursorPos(e.target.selectionStart || 0);
                            }}
                            onKeyUp={(e) => {
                                setCursorPos(e.currentTarget.selectionStart || 0);
                            }}
                            onClick={(e) => {
                                setCursorPos(e.currentTarget.selectionStart || 0);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (autocompletado.sugerencias.length > 0) {
                                        e.preventDefault();
                                        const nuevovalor = autocompletado.aplicarSugerencia(autocompletado.sugerencias[0]);
                                        setCustomOperation(nuevovalor);
                                        setTimeout(() => {
                                            if (inputRef.current) {
                                                const nuevaPos = nuevovalor.length;
                                                inputRef.current.setSelectionRange(nuevaPos, nuevaPos);
                                                setCursorPos(nuevaPos);
                                            }
                                        }, 0);
                                    } else {
                                        executeCustomOperation();
                                    }
                                } else if (e.key === 'Tab') {
                                    if (autocompletado.sugerencias.length > 0) {
                                        e.preventDefault();
                                        const nuevovalor = autocompletado.aplicarSugerencia(autocompletado.sugerencias[0]);
                                        setCustomOperation(nuevovalor);
                                        setTimeout(() => {
                                            if (inputRef.current) {
                                                const nuevaPos = nuevovalor.length;
                                                inputRef.current.setSelectionRange(nuevaPos, nuevaPos);
                                                setCursorPos(nuevaPos);
                                            }
                                        }, 0);
                                    }
                                }
                            }}
                            placeholder="Ej. det(A) + inv(B) o A^2"
                            className="flex-1 bg-background border border-aurora-border rounded-lg px-4 py-2 text-white font-mono focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                        />
                        {/* Panel de Sugerencias */}
                        {autocompletado.sugerencias.length > 0 && (
                            <div className="absolute left-0 bottom-full mb-1 bg-background border border-aurora-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                {autocompletado.sugerencias.map((sug, idx) => (
                                    <div
                                        key={sug.nombre}
                                        onClick={() => {
                                            const nuevovalor = autocompletado.aplicarSugerencia(sug);
                                            setCustomOperation(nuevovalor);
                                            setTimeout(() => {
                                                if (inputRef.current) {
                                                    const nuevaPos = nuevovalor.length;
                                                    inputRef.current.setSelectionRange(nuevaPos, nuevaPos);
                                                    setCursorPos(nuevaPos);
                                                    inputRef.current.focus();
                                                }
                                            }, 0);
                                        }}
                                        className={`px-3 py-2 cursor-pointer hover:bg-white/10 border-b border-aurora-border/30 last:border-0 ${idx === 0 ? 'bg-white/5' : ''}`}
                                    >
                                        <div className="flex justify-between items-center gap-4">
                                            <span className="text-primary font-bold">{sug.nombre}</span>
                                            <span className="text-xs text-aurora-muted italic">{sug.descripcion}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button 
                            onClick={simplificarOperacionPersonalizada}
                            disabled={loading || !customOperation.trim()}
                            className="bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
                            title="Simplificar Expresión"
                        >
                            Simplificar
                        </button>
                        <button 
                            onClick={executeCustomOperation}
                            disabled={loading || !customOperation.trim()}
                            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
                        >
                            Calcular
                        </button>
                    </div>
                    
                    {/* Panel de botones rápidos */}
                    <div className="mt-4 pt-4 border-t border-aurora-border/50 flex flex-col gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-aurora-muted uppercase font-bold mr-2">Matrices Activas:</span>
                            {MATRIX_NAMES.filter(m => matricesCalculadora[m] && matricesCalculadora[m].some(row => row.some(val => val !== 0))).map(m => (
                                <button
                                    key={`btn-mat-${m}`}
                                    onClick={() => {
                                        setCustomOperation(prev => prev + m);
                                        inputRef.current?.focus();
                                    }}
                                    className="size-8 rounded bg-primary/20 hover:bg-primary/40 text-primary font-bold font-mono transition-colors shadow-inner flex items-center justify-center"
                                    title={`Insertar Matriz ${m}`}
                                >
                                    {m}
                                </button>
                            ))}
                            {MATRIX_NAMES.filter(m => matricesCalculadora[m] && matricesCalculadora[m].some(row => row.some(val => val !== 0))).length === 0 && (
                                <span className="text-xs text-aurora-muted italic">Todas están vacías (0)</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-aurora-muted uppercase font-bold mr-2">Operadores:</span>
                            {['+', '-', '*', '^', '(', ')'].map(sym => (
                                <button
                                    key={`btn-sym-${sym}`}
                                    onClick={() => {
                                        setCustomOperation(prev => prev + sym);
                                        inputRef.current?.focus();
                                    }}
                                    className="size-8 rounded bg-white/5 hover:bg-white/20 text-white font-mono transition-colors border border-aurora-border flex items-center justify-center"
                                >
                                    {sym}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setCustomOperation(prev => prev + 'det(');
                                    inputRef.current?.focus();
                                }}
                                className="px-3 h-8 rounded bg-white/5 hover:bg-white/20 text-white font-mono text-sm transition-colors border border-aurora-border flex items-center justify-center"
                            >
                                det()
                            </button>
                            <button
                                onClick={() => {
                                    setCustomOperation(prev => prev + 'inv(');
                                    inputRef.current?.focus();
                                }}
                                className="px-3 h-8 rounded bg-white/5 hover:bg-white/20 text-white font-mono text-sm transition-colors border border-aurora-border flex items-center justify-center"
                            >
                                inv()
                            </button>
                            <button
                                onClick={() => {
                                    setCustomOperation(prev => prev + '.T');
                                    inputRef.current?.focus();
                                }}
                                className="px-3 h-8 rounded bg-white/5 hover:bg-white/20 text-white font-mono text-sm transition-colors border border-aurora-border flex items-center justify-center title='Transpuesta'"
                            >
                                .T
                            </button>
                            <button
                                onClick={() => {
                                    setCustomOperation(prev => prev.slice(0, -1));
                                    inputRef.current?.focus();
                                }}
                                className="px-3 h-8 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-sm transition-colors ml-auto flex items-center justify-center"
                                title="Borrar último"
                            >
                                ←
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resultados / Consola */}
                <div className="bg-white/5 rounded-xl border border-aurora-border overflow-hidden shadow-lg mt-4 flex flex-col">
                    <div className="px-5 py-3 border-b border-aurora-border bg-background-light flex justify-between items-center">
                        <span className="text-xs font-bold text-aurora-muted uppercase tracking-wider">Historial de Resultados</span>
                        <button onClick={() => setResults([])} className="text-xs text-aurora-muted hover:text-red-400 transition-colors">
                            Limpiar Historial
                        </button>
                    </div>
                    <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto bg-background/50">
                        {results.length === 0 ? (
                            <div className="text-center py-10 opacity-50 flex flex-col items-center">
                                <Calculator size={32} className="mb-3" />
                                <p className="text-sm font-mono">Selecciona una operación para comenzar...</p>
                            </div>
                        ) : (
                            results.map((r) => (
                                <div key={r.id} className="bg-background border border-aurora-border rounded-lg p-4 relative group hover:border-primary/30 transition-colors">
                                    {/* Botón flotante de Explain - esquina derecha */}
                                    {r.exprRaw && !r.result.includes('Error') && (
                                        <button 
                                            onClick={() => handleExplain(r.command, r.exprRaw)}
                                            className="absolute top-3 right-3 p-1.5 rounded bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 flex items-center gap-1 text-xs font-bold shadow-sm"
                                            title="Explicar Paso a Paso"
                                        >
                                            <Lightbulb size={14} />
                                            <span>Explicar</span>
                                        </button>
                                    )}
                                    <div className="flex gap-2 text-aurora-muted text-sm mb-2 font-mono items-center">
                                        <span className="text-primary">&gt;</span>
                                        <MathDisplay expression={r.command} inline />
                                    </div>
                                    <div className="pl-4 text-white font-bold mt-2 overflow-x-auto pb-2 custom-scrollbar">
                                        <MathDisplay expression={`= ${r.result}`} inline />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Explain */}
            {explainModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => !explainLoading && setExplainModalOpen(false)}></div>
                    <div className="relative bg-background border border-aurora-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
                        <div className="px-6 py-4 border-b border-aurora-border flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Lightbulb className="text-primary" size={20} />
                                Explicación Paso a Paso
                            </h3>
                            <button 
                                onClick={() => setExplainModalOpen(false)}
                                className="text-aurora-muted hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gradient-to-b from-background to-background-light">
                            {explainLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full"></div>
                                    <p className="text-aurora-muted font-mono animate-pulse">{currentExplainContext}</p>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <AIResponseRenderer content={explainContent} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatrixMode;
