/**
 * Binary EquaLab - Accounting Mode PRO
 * 
 * Professional financial calculator with tabs:
 * - VAN/NPV Calculator
 * - TIR/IRR Calculator  
 * - Depreciation Schedule
 * - Interest Calculator (Simple/Compound)
 * - Financial Ratios
 * - Transaction Ledger (legacy)
 */

import React, { useState } from 'react';
import {
    Calculator, TrendingUp, Calendar, Percent, PieChart,
    FileText, Plus, Trash2, RefreshCw, DollarSign
} from 'lucide-react';
import {
    van, tir, depreciar, interesSimple, interesCompuesto,
    flujoCaja, ratioLiquidez, ratioEndeudamiento, roi,
    FinanceResult
} from '../services/financeFunctions';

type TabType = 'van' | 'tir' | 'depreciation' | 'interest' | 'ratios';

interface CashFlow {
    id: number;
    period: number;
    value: number;
}

const AccountingMode: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('van');
    const [result, setResult] = useState<FinanceResult | null>(null);

    // VAN State
    const [vanRate, setVanRate] = useState('10');
    const [vanFlows, setVanFlows] = useState<CashFlow[]>([
        { id: 0, period: 0, value: -10000 },
        { id: 1, period: 1, value: 3000 },
        { id: 2, period: 2, value: 4000 },
        { id: 3, period: 3, value: 5000 },
    ]);

    // TIR State - same flows

    // Depreciation State
    const [depCost, setDepCost] = useState('50000');
    const [depResidual, setDepResidual] = useState('5000');
    const [depYears, setDepYears] = useState('5');

    // Interest State
    const [intCapital, setIntCapital] = useState('10000');
    const [intRate, setIntRate] = useState('5');
    const [intTime, setIntTime] = useState('3');
    const [intType, setIntType] = useState<'simple' | 'compound'>('compound');
    const [intPeriods, setIntPeriods] = useState('12'); // annual periods for compound

    // Ratios State
    const [ratioType, setRatioType] = useState<'liquidez' | 'endeudamiento' | 'roi'>('roi');
    const [ratioA, setRatioA] = useState('15000');
    const [ratioB, setRatioB] = useState('10000');

    const addCashFlow = () => {
        const nextId = Math.max(...vanFlows.map(f => f.id)) + 1;
        const nextPeriod = vanFlows.length;
        setVanFlows([...vanFlows, { id: nextId, period: nextPeriod, value: 0 }]);
    };

    const removeCashFlow = (id: number) => {
        if (vanFlows.length > 2) {
            setVanFlows(vanFlows.filter(f => f.id !== id));
        }
    };

    const updateCashFlow = (id: number, value: number) => {
        setVanFlows(vanFlows.map(f => f.id === id ? { ...f, value } : f));
    };

    const calculateVAN = () => {
        const rate = parseFloat(vanRate) / 100;
        const flows = vanFlows.map(f => f.value);
        setResult(van(rate, flows));
    };

    const calculateTIR = () => {
        const flows = vanFlows.map(f => f.value);
        setResult(tir(flows));
    };

    const calculateDepreciation = () => {
        setResult(depreciar(
            parseFloat(depCost),
            parseFloat(depResidual),
            parseInt(depYears)
        ));
    };

    const calculateInterest = () => {
        const capital = parseFloat(intCapital);
        const rate = parseFloat(intRate) / 100;
        const time = parseFloat(intTime);

        if (intType === 'simple') {
            setResult(interesSimple(capital, rate, time));
        } else {
            const periods = parseInt(intPeriods);
            setResult(interesCompuesto(capital, rate, periods, time));
        }
    };

    const calculateRatio = () => {
        const a = parseFloat(ratioA);
        const b = parseFloat(ratioB);

        switch (ratioType) {
            case 'liquidez':
                setResult(ratioLiquidez(a, b));
                break;
            case 'endeudamiento':
                setResult(ratioEndeudamiento(a, b));
                break;
            case 'roi':
                setResult(roi(a, b));
                break;
        }
    };

    const tabs = [
        { id: 'van' as TabType, label: 'VAN', icon: TrendingUp },
        { id: 'tir' as TabType, label: 'TIR', icon: Percent },
        { id: 'depreciation' as TabType, label: 'Depreciación', icon: Calendar },
        { id: 'interest' as TabType, label: 'Interés', icon: DollarSign },
        { id: 'ratios' as TabType, label: 'Ratios', icon: PieChart },
    ];

    const InputField = ({ label, value, onChange, prefix = '', suffix = '' }: {
        label: string;
        value: string;
        onChange: (v: string) => void;
        prefix?: string;
        suffix?: string;
    }) => (
        <div className="space-y-1">
            <label className="text-xs text-aurora-muted uppercase font-bold">{label}</label>
            <div className="flex items-center bg-aurora-panel border border-white/10 rounded-lg px-3">
                {prefix && <span className="text-aurora-muted mr-1">{prefix}</span>}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-transparent text-white text-lg font-mono w-full py-2 focus:outline-none"
                />
                {suffix && <span className="text-aurora-muted ml-1">{suffix}</span>}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-aurora-bg">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-3 bg-background-light border-b border-aurora-border overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setResult(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Calculator Panel */}
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-aurora-border">

                    {/* VAN Tab */}
                    {activeTab === 'van' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Valor Actual Neto (VAN)</h2>
                                <p className="text-sm text-aurora-muted">
                                    VAN = Σ(Ft / (1 + r)^t) para t = 0 hasta n
                                </p>
                            </div>

                            <InputField
                                label="Tasa de Descuento"
                                value={vanRate}
                                onChange={setVanRate}
                                suffix="%"
                            />

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-aurora-muted uppercase font-bold">Flujos de Caja</label>
                                    <button
                                        onClick={addCashFlow}
                                        className="text-aurora-primary hover:text-white text-sm flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Añadir
                                    </button>
                                </div>

                                {vanFlows.map((flow, idx) => (
                                    <div key={flow.id} className="flex items-center gap-2">
                                        <span className="text-aurora-muted text-xs w-8">t={flow.period}</span>
                                        <div className="flex-1 flex items-center bg-aurora-panel border border-white/10 rounded-lg px-3">
                                            <span className="text-aurora-muted mr-1">$</span>
                                            <input
                                                type="number"
                                                value={flow.value}
                                                onChange={(e) => updateCashFlow(flow.id, parseFloat(e.target.value) || 0)}
                                                className="bg-transparent text-white font-mono w-full py-2 focus:outline-none"
                                            />
                                        </div>
                                        {idx > 0 && (
                                            <button
                                                onClick={() => removeCashFlow(flow.id)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={calculateVAN}
                                className="w-full py-3 bg-aurora-primary text-white font-bold rounded-lg hover:bg-aurora-primaryHover transition-colors shadow-lg"
                            >
                                Calcular VAN
                            </button>
                        </div>
                    )}

                    {/* TIR Tab */}
                    {activeTab === 'tir' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Tasa Interna de Retorno (TIR)</h2>
                                <p className="text-sm text-aurora-muted">
                                    Encuentra r donde VAN = 0 (método Newton-Raphson)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-aurora-muted uppercase font-bold">Flujos de Caja</label>
                                {vanFlows.map((flow, idx) => (
                                    <div key={flow.id} className="flex items-center gap-2">
                                        <span className="text-aurora-muted text-xs w-8">t={flow.period}</span>
                                        <div className="flex-1 flex items-center bg-aurora-panel border border-white/10 rounded-lg px-3">
                                            <span className="text-aurora-muted mr-1">$</span>
                                            <input
                                                type="number"
                                                value={flow.value}
                                                onChange={(e) => updateCashFlow(flow.id, parseFloat(e.target.value) || 0)}
                                                className="bg-transparent text-white font-mono w-full py-2 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={calculateTIR}
                                className="w-full py-3 bg-aurora-primary text-white font-bold rounded-lg hover:bg-aurora-primaryHover transition-colors shadow-lg"
                            >
                                Calcular TIR
                            </button>
                        </div>
                    )}

                    {/* Depreciation Tab */}
                    {activeTab === 'depreciation' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Depreciación (Línea Recta)</h2>
                                <p className="text-sm text-aurora-muted">
                                    D = (Costo - Valor Residual) / Vida Útil
                                </p>
                            </div>

                            <InputField label="Costo del Activo" value={depCost} onChange={setDepCost} prefix="$" />
                            <InputField label="Valor Residual" value={depResidual} onChange={setDepResidual} prefix="$" />
                            <InputField label="Vida Útil (años)" value={depYears} onChange={setDepYears} />

                            <button
                                onClick={calculateDepreciation}
                                className="w-full py-3 bg-aurora-primary text-white font-bold rounded-lg hover:bg-aurora-primaryHover transition-colors shadow-lg"
                            >
                                Calcular Depreciación
                            </button>
                        </div>
                    )}

                    {/* Interest Tab */}
                    {activeTab === 'interest' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Calculadora de Interés</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIntType('simple')}
                                    className={`py-2 rounded-lg font-bold text-sm transition-all ${intType === 'simple'
                                            ? 'bg-aurora-primary text-white'
                                            : 'bg-aurora-panel text-aurora-muted border border-white/10'
                                        }`}
                                >
                                    Simple
                                </button>
                                <button
                                    onClick={() => setIntType('compound')}
                                    className={`py-2 rounded-lg font-bold text-sm transition-all ${intType === 'compound'
                                            ? 'bg-aurora-primary text-white'
                                            : 'bg-aurora-panel text-aurora-muted border border-white/10'
                                        }`}
                                >
                                    Compuesto
                                </button>
                            </div>

                            <InputField label="Capital Inicial" value={intCapital} onChange={setIntCapital} prefix="$" />
                            <InputField label="Tasa Anual" value={intRate} onChange={setIntRate} suffix="%" />
                            <InputField label="Tiempo (años)" value={intTime} onChange={setIntTime} />

                            {intType === 'compound' && (
                                <InputField label="Capitalizaciones/año" value={intPeriods} onChange={setIntPeriods} />
                            )}

                            <button
                                onClick={calculateInterest}
                                className="w-full py-3 bg-aurora-primary text-white font-bold rounded-lg hover:bg-aurora-primaryHover transition-colors shadow-lg"
                            >
                                Calcular {intType === 'simple' ? 'Interés Simple' : 'Interés Compuesto'}
                            </button>
                        </div>
                    )}

                    {/* Ratios Tab */}
                    {activeTab === 'ratios' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Ratios Financieros</h2>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {(['liquidez', 'endeudamiento', 'roi'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setRatioType(type)}
                                        className={`py-2 rounded-lg font-bold text-xs transition-all capitalize ${ratioType === type
                                                ? 'bg-aurora-primary text-white'
                                                : 'bg-aurora-panel text-aurora-muted border border-white/10'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <InputField
                                label={ratioType === 'liquidez' ? 'Activo Corriente' : ratioType === 'endeudamiento' ? 'Pasivo Total' : 'Ganancia'}
                                value={ratioA}
                                onChange={setRatioA}
                                prefix="$"
                            />
                            <InputField
                                label={ratioType === 'liquidez' ? 'Pasivo Corriente' : ratioType === 'endeudamiento' ? 'Patrimonio' : 'Inversión'}
                                value={ratioB}
                                onChange={setRatioB}
                                prefix="$"
                            />

                            <button
                                onClick={calculateRatio}
                                className="w-full py-3 bg-aurora-primary text-white font-bold rounded-lg hover:bg-aurora-primaryHover transition-colors shadow-lg"
                            >
                                Calcular Ratio
                            </button>
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="hidden lg:flex w-1/2 p-6 flex-col">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calculator size={20} className="text-aurora-primary" />
                        Resultado
                    </h3>

                    {result ? (
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Big Result */}
                            <div className="p-6 bg-aurora-surface border border-aurora-primary/30 rounded-xl">
                                <div className="text-4xl font-bold text-aurora-primary font-mono">
                                    {result.formatted}
                                </div>
                            </div>

                            {/* Breakdown */}
                            {result.breakdown && result.breakdown.length > 0 && (
                                <div className="flex-1 bg-aurora-panel border border-white/10 rounded-xl p-4 overflow-y-auto">
                                    <h4 className="text-sm font-bold text-aurora-muted uppercase mb-3">Desglose</h4>
                                    <ul className="space-y-2 text-sm font-mono">
                                        {result.breakdown.map((line, i) => (
                                            <li key={i} className="text-aurora-text flex items-start gap-2">
                                                <span className="text-aurora-primary">›</span>
                                                {line}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-aurora-muted">
                            <div className="text-center">
                                <Calculator size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Ingresa los valores y presiona Calcular</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountingMode;
