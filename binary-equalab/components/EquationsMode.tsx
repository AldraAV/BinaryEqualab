/**
 * Binary EquaLab - Equations Mode
 * 
 * Solve single equations and systems of equations:
 * - Single: x² + 2x - 3 = 0
 * - Systems: { 2x + y = 5, x - y = 1 }
 * - Inequalities: x² - 4 > 0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Play, X, ArrowRight } from 'lucide-react';
import apiService from '../services/apiService';
import MathDisplay from './MathDisplay';

type EquationType = 'single' | 'system' | 'inequality';

interface Equation {
    id: number;
    lhs: string;
    rhs: string;
}

const EquationsMode: React.FC = () => {
    const [eqType, setEqType] = useState<EquationType>('single');
    const [equations, setEquations] = useState<Equation[]>([
        { id: 1, lhs: 'x^2 + 2x - 3', rhs: '0' }
    ]);
    const [variable, setVariable] = useState('x');
    const [result, setResult] = useState<string | null>(null);
    const [steps, setSteps] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const addEquation = () => {
        const nextId = Math.max(...equations.map(e => e.id)) + 1;
        setEquations([...equations, { id: nextId, lhs: '', rhs: '0' }]);
    };

    const removeEquation = (id: number) => {
        if (equations.length > 1) {
            setEquations(equations.filter(e => e.id !== id));
        }
    };

    const updateEquation = (id: number, field: 'lhs' | 'rhs', value: string) => {
        setEquations(equations.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const solveSingle = async () => {
        try {
            const eq = equations[0];
            const fullEq = `${eq.lhs}=${eq.rhs}`;

            setSteps([
                `Ecuación: ${eq.lhs} = ${eq.rhs}`,
                `Resolviendo para ${variable} en Backend...`
            ]);

            const res = await apiService.solveEquation(fullEq, variable);
            setResult(res.latex || res.result);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error solving equation');
            setResult(null);
        }
    };

    const solveSystem = async () => {
        try {
            const eqs = equations.map(eq => `${eq.lhs}=${eq.rhs}`);
            const vars = variable.split(',').map(v => v.trim());

            setSteps([
                'Sistema de ecuaciones:',
                ...equations.map(eq => `  ${eq.lhs} = ${eq.rhs}`),
                `Incógnitas: ${vars.join(', ')}`,
                'Resolviendo en Backend...'
            ]);

            const res = await apiService.solveSystem(eqs, vars);
            setResult(res.latex || res.result);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error solving system');
            setResult(null);
        }
    };

    const solveInequality = async () => {
        try {
            const eq = equations[0];
            const fullExpr = `${eq.lhs}>${eq.rhs}`;

            setSteps([
                `Desigualdad: ${eq.lhs} > ${eq.rhs}`,
                `Analizando intervalos en Backend...`
            ]);

            const res = await apiService.solveInequality(fullExpr, variable);
            setResult(res.latex || res.result);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error analyzing inequality');
            setResult(null);
        }
    };

    const solve = async () => {
        setResult(null);
        setSteps([]);
        setError(null);

        switch (eqType) {
            case 'single':
                await solveSingle();
                break;
            case 'system':
                await solveSystem();
                break;
            case 'inequality':
                await solveInequality();
                break;
        }
    };

    return (
        <div className="flex flex-col h-full bg-aurora-bg">
            {/* Type Selector */}
            <div className="flex items-center gap-2 p-3 bg-background-light border-b border-aurora-border">
                <span className="text-xs text-aurora-muted uppercase tracking-wider mr-2">Tipo:</span>
                {(['single', 'system', 'inequality'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => {
                            setEqType(type);
                            if (type === 'single') {
                                setEquations([{ id: 1, lhs: 'x^2 + 2x - 3', rhs: '0' }]);
                                setVariable('x');
                            } else if (type === 'system') {
                                setEquations([
                                    { id: 1, lhs: '2x + y', rhs: '5' },
                                    { id: 2, lhs: 'x - y', rhs: '1' }
                                ]);
                                setVariable('x, y');
                            } else {
                                setEquations([{ id: 1, lhs: 'x^2 - 4', rhs: '0' }]);
                                setVariable('x');
                            }
                            setResult(null);
                            setSteps([]);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${eqType === type
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                            }`}
                    >
                        {type === 'single' && 'Ecuación'}
                        {type === 'system' && 'Sistema'}
                        {type === 'inequality' && 'Desigualdad'}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-aurora-border">
                    <h2 className="text-xl font-bold text-white mb-4">
                        {eqType === 'single' && '📐 Resolver Ecuación'}
                        {eqType === 'system' && '📊 Resolver Sistema'}
                        {eqType === 'inequality' && '⚖️ Analizar Desigualdad'}
                    </h2>

                    {/* Equations Input */}
                    <div className="space-y-3 mb-6">
                        {equations.map((eq, idx) => (
                            <div key={eq.id} className="flex items-center gap-2">
                                {eqType === 'system' && (
                                    <span className="text-aurora-muted text-xs w-8">({idx + 1})</span>
                                )}
                                <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2">
                                    <input
                                        type="text"
                                        value={eq.lhs}
                                        onChange={(e) => updateEquation(eq.id, 'lhs', e.target.value)}
                                        placeholder="x^2 + 2x"
                                        className="flex-1 bg-transparent text-white font-mono focus:outline-none"
                                        aria-label={`Parte izquierda de la ecuación ${idx + 1}`}
                                    />
                                    <span className="text-aurora-primary font-bold">
                                        {eqType === 'inequality' ? '>' : '='}
                                    </span>
                                    <input
                                        type="text"
                                        value={eq.rhs}
                                        onChange={(e) => updateEquation(eq.id, 'rhs', e.target.value)}
                                        placeholder="0"
                                        className="w-24 bg-transparent text-white font-mono focus:outline-none text-right"
                                        aria-label={`Parte derecha de la ecuación ${idx + 1}`}
                                    />
                                </div>
                                {equations.length > 1 && (
                                    <button
                                        onClick={() => removeEquation(eq.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {eqType === 'system' && (
                        <button
                            onClick={addEquation}
                            className="text-aurora-primary hover:text-white text-sm flex items-center gap-1 mb-6"
                        >
                            <Plus size={14} /> Añadir ecuación
                        </button>
                    )}

                    {/* Variable Input */}
                    <div className="mb-6">
                        <label htmlFor="entrada-variable" className="text-xs text-aurora-muted uppercase font-bold block mb-1">
                            {eqType === 'system' ? 'Variables (separadas por coma)' : 'Variable'}
                        </label>
                        <input
                            type="text"
                            id="entrada-variable"
                            value={variable}
                            onChange={(e) => setVariable(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-aurora-primary"
                        />
                    </div>

                    {/* Solve Button */}
                    <button
                        onClick={solve}
                        className="w-full py-3 bg-aurora-primary text-white font-bold rounded-lg hover:bg-aurora-primaryHover transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        <Play size={18} />
                        Resolver
                    </button>
                </div>

                {/* Result Panel */}
                <div className="hidden lg:flex w-1/2 p-6 flex-col">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ArrowRight size={20} className="text-aurora-primary" />
                        Solución
                    </h3>

                    {error && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 mb-4">
                            {error}
                        </div>
                    )}

                    {result ? (
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Big Result */}
                            <div className="p-6 bg-aurora-surface border border-aurora-primary/30 rounded-xl">
                                <MathDisplay expression={result} />
                            </div>

                            {/* Steps */}
                            {steps.length > 0 && (
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 overflow-y-auto">
                                    <h4 className="text-sm font-bold text-aurora-muted uppercase mb-3">Pasos</h4>
                                    <ul className="space-y-2 text-sm font-mono">
                                        {steps.map((step, i) => (
                                            <li key={i} className="text-aurora-text flex items-start gap-2">
                                                <span className="text-aurora-primary">{i + 1}.</span>
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-aurora-muted">
                            <div className="text-center">
                                <X size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Ingresa una ecuación y presiona Resolver</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EquationsMode;
