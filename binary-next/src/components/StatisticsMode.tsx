"use client";
/**
 * Binary EquaLab - Statistics Mode
 * 
 * Statistical analysis delegated to FastAPI backend.
 */

import React, { useState, useCallback } from 'react';
import { BarChart3, TrendingUp, Calculator, Plus, Trash2, LineChart, Loader2, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/apiService';

type StatTab = 'descriptive' | 'regression' | 'probability';
type ProbDist = 'normal' | 'binomial' | 'poisson';

interface DataPoint {
    id: number;
    x: number;
    y?: number;
}

const StatisticsMode: React.FC = () => {
    const [activeTab, setActiveTab] = useState<StatTab>('descriptive');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Descriptive data
    const [dataInput, setDataInput] = useState('1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10');
    const [descResult, setDescResult] = useState<any>(null);

    // Regression data
    const [regPoints, setRegPoints] = useState<DataPoint[]>([
        { id: 1, x: 1, y: 2.1 },
        { id: 2, x: 2, y: 3.9 },
        { id: 3, x: 3, y: 6.2 },
        { id: 4, x: 4, y: 8.0 },
        { id: 5, x: 5, y: 9.8 },
    ]);
    const [regResult, setRegResult] = useState<any>(null);

    // Probability data
    const [distType, setDistType] = useState<ProbDist>('normal');
    const [probResult, setProbResult] = useState<any>(null);

    // Normal
    const [probMean, setProbMean] = useState('0');
    const [probStd, setProbStd] = useState('1');
    const [probX, setProbX] = useState('1.96');
    const [probP, setProbP] = useState(''); // Para Inversa

    // Binomial
    const [binN, setBinN] = useState('10');
    const [binP, setBinP] = useState('0.5');
    const [binX, setBinX] = useState('5');

    // Poisson
    const [poiLam, setPoiLam] = useState('2');
    const [poiX, setPoiX] = useState('3');

    const parseData = (input: string): number[] => {
        return input.split(/[\s,]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    };

    const calculateDescriptive = async () => {
        const data = parseData(dataInput);
        if (data.length === 0) return;
        setCargando(true);
        setError(null);
        try {
            const listStr = `[${data.join(',')}]`;
            // Ejecutamos consultas individuales al CAS
            const [meanRes, medianRes, varRes, stdRes] = await Promise.all([
                apiService.evaluate(`media(${listStr})`),
                apiService.evaluate(`mediana(${listStr})`),
                apiService.evaluate(`varianza(${listStr})`),
                apiService.evaluate(`desviacion(${listStr})`)
            ]);
            
            setDescResult({
                count: data.length,
                sum: data.reduce((a,b) => a+b, 0),
                mean: parseFloat(meanRes.aproximacion || meanRes.resultado),
                median: parseFloat(medianRes.aproximacion || medianRes.resultado),
                mode: [], // No implementado en el parser simple actual
                min: Math.min(...data),
                max: Math.max(...data),
                range: Math.max(...data) - Math.min(...data),
                variance: parseFloat(varRes.aproximacion || varRes.resultado),
                std: parseFloat(stdRes.aproximacion || stdRes.resultado),
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al calcular en CAS');
        } finally {
            setCargando(false);
        }
    };

    const calculateRegression = async () => {
        const points = regPoints.filter(p => p.y !== undefined).map(p => ({ x: p.x, y: p.y! }));
        if (points.length < 2) return;
        setCargando(true);
        setError(null);
        try {
            const res = await apiService.statRegression(points);
            setRegResult(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al calcular');
        } finally {
            setCargando(false);
        }
    };

    const calculateProbability = async () => {
        setCargando(true);
        setError(null);
        try {
            let res: any = {};
            if (distType === 'normal') {
                const xVal = probX.trim() ? parseFloat(probX) : 0;
                // Para normal usamos normalcdf para la acumulada (X <= x)
                // y normalpdf para la exacta (si tiene sentido, aunque continua)
                const evalPdf = await apiService.evaluate(`normalpdf(${xVal}, ${probMean}, ${probStd})`);
                const evalCdf = await apiService.evaluate(`normalcdf(${xVal}, ${probMean}, ${probStd})`);
                const evalZ = await apiService.evaluate(`(${xVal} - ${probMean}) / ${probStd}`);
                
                res = {
                    type: 'normal',
                    pdf: parseFloat(evalPdf.aproximacion || evalPdf.resultado),
                    cdf: parseFloat(evalCdf.aproximacion || evalCdf.resultado),
                    greater_than: 1 - parseFloat(evalCdf.aproximacion || evalCdf.resultado),
                    z_score: parseFloat(evalZ.aproximacion || evalZ.resultado)
                };
            } else if (distType === 'binomial') {
                const evalPmf = await apiService.evaluate(`binomialpmf(${binX}, ${binN}, ${binP})`);
                const evalCdf = await apiService.evaluate(`binomialcdf(${binX}, ${binN}, ${binP})`);
                res = {
                    type: 'binomial',
                    pdf: parseFloat(evalPmf.aproximacion || evalPmf.resultado),
                    cdf: parseFloat(evalCdf.aproximacion || evalCdf.resultado),
                    greater_than: 1 - parseFloat(evalCdf.aproximacion || evalCdf.resultado)
                };
            } else if (distType === 'poisson') {
                const evalPmf = await apiService.evaluate(`poissonpmf(${poiX}, ${poiLam})`);
                const evalCdf = await apiService.evaluate(`poissoncdf(${poiX}, ${poiLam})`);
                res = {
                    type: 'poisson',
                    pdf: parseFloat(evalPmf.aproximacion || evalPmf.resultado),
                    cdf: parseFloat(evalCdf.aproximacion || evalCdf.resultado),
                    greater_than: 1 - parseFloat(evalCdf.aproximacion || evalCdf.resultado)
                };
            }
            res._type = distType;
            setProbResult(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al calcular en CAS');
        } finally {
            setCargando(false);
        }
    };

    const addRegPoint = () => {
        const nextId = Math.max(...regPoints.map(p => p.id)) + 1;
        setRegPoints([...regPoints, { id: nextId, x: regPoints.length + 1, y: 0 }]);
    };

    const removeRegPoint = (id: number) => {
        if (regPoints.length > 2) {
            setRegPoints(regPoints.filter(p => p.id !== id));
        }
    };

    const updateRegPoint = (id: number, field: 'x' | 'y', value: number) => {
        setRegPoints(regPoints.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const tabs = [
        { id: 'descriptive' as StatTab, label: 'Descriptiva', icon: BarChart3 },
        { id: 'regression' as StatTab, label: 'Regresión', icon: TrendingUp },
        { id: 'probability' as StatTab, label: 'Probabilidad', icon: LineChart },
    ];

    return (
        <div className="flex flex-col h-full bg-aurora-bg">
            {/* Tabs & Header */}
            <div className="flex items-center justify-between p-3 bg-background-light border-b border-aurora-border">
                <div className="flex items-center gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
                {/* CAS Powered Indicator */}
                <div className="flex items-center gap-2 px-3 py-1 bg-aurora-surface/50 border border-aurora-primary/20 rounded-full" title="Cálculos matemáticos delegados al motor CAS de la consola unificada">
                    <div className="w-2 h-2 rounded-full bg-aurora-primary animate-pulse"></div>
                    <span className="text-[10px] uppercase font-bold text-aurora-primary tracking-wider">CAS Powered</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-aurora-border">
                    
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3 text-red-200">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-red-400" />
                            <div>
                                <p className="font-bold text-sm">Error en el motor estadístico</p>
                                <p className="text-xs opacity-80 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Descriptive Tab */}
                    {activeTab === 'descriptive' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">📊 Estadística Descriptiva</h2>
                                <p className="text-sm text-aurora-muted">
                                    Cálculos precisos vía backend Python/Scipy. Ingresa datos separados por comas.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-aurora-muted uppercase font-bold block mb-2">
                                    Datos
                                </label>
                                <textarea
                                    value={dataInput}
                                    onChange={(e) => setDataInput(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-aurora-primary resize-none"
                                    placeholder="1, 2, 3, 4, 5..."
                                />
                            </div>

                            <button
                                onClick={calculateDescriptive}
                                disabled={cargando}
                                className={`w-full py-3 font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                                    cargando ? 'bg-aurora-primary/50 text-white/70' : 'bg-aurora-primary text-white hover:bg-aurora-primaryHover'
                                }`}
                            >
                                {cargando ? <Loader2 size={18} className="animate-spin" /> : 'Calcular Estadísticas'}
                            </button>
                        </div>
                    )}

                    {/* Regression Tab */}
                    {activeTab === 'regression' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">📈 Regresión Lineal</h2>
                                <p className="text-sm text-aurora-muted">y = mx + b</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-aurora-muted uppercase font-bold">Puntos (x, y)</label>
                                    <button
                                        onClick={addRegPoint}
                                        className="text-aurora-primary hover:text-white text-sm flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Añadir
                                    </button>
                                </div>

                                {regPoints.map((point) => (
                                    <div key={point.id} className="flex items-center gap-2">
                                        <span className="text-aurora-muted text-xs">x:</span>
                                        <input
                                            type="number"
                                            value={point.x}
                                            onChange={(e) => updateRegPoint(point.id, 'x', parseFloat(e.target.value) || 0)}
                                            className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-mono"
                                        />
                                        <span className="text-aurora-muted text-xs">y:</span>
                                        <input
                                            type="number"
                                            value={point.y}
                                            onChange={(e) => updateRegPoint(point.id, 'y', parseFloat(e.target.value) || 0)}
                                            className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-mono"
                                        />
                                        {regPoints.length > 2 && (
                                            <button
                                                onClick={() => removeRegPoint(point.id)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={calculateRegression}
                                disabled={cargando}
                                className={`w-full py-3 font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                                    cargando ? 'bg-aurora-primary/50 text-white/70' : 'bg-aurora-primary text-white hover:bg-aurora-primaryHover'
                                }`}
                            >
                                {cargando ? <Loader2 size={18} className="animate-spin" /> : 'Calcular Regresión'}
                            </button>
                        </div>
                    )}

                    {/* Probability Tab */}
                    {activeTab === 'probability' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">🎲 Distribuciones</h2>
                                <p className="text-sm text-aurora-muted">Normal, Binomial y Poisson delegadas al motor CAS.</p>
                            </div>

                            <div className="flex bg-white/5 rounded-lg p-1 gap-1 border border-white/10">
                                {['normal', 'binomial', 'poisson'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setDistType(type as ProbDist)}
                                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded transition-colors ${distType === type ? 'bg-aurora-primary text-white' : 'text-aurora-muted hover:text-white hover:bg-white/5'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {distType === 'normal' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">μ (media)</label>
                                        <input type="number" value={probMean} onChange={(e) => setProbMean(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">σ (std)</label>
                                        <input type="number" value={probStd} onChange={(e) => setProbStd(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-white/10">
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">Opción A: Calcular Probabilidad dado X</label>
                                        <input type="number" value={probX} onChange={(e) => {setProbX(e.target.value); setProbP('');}} placeholder="Valor X" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">Opción B: Normal Inversa (Dado P, calcular X)</label>
                                        <input type="number" value={probP} onChange={(e) => {setProbP(e.target.value); setProbX('');}} placeholder="Probabilidad P (0 a 1)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                </div>
                            )}

                            {distType === 'binomial' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">n (ensayos)</label>
                                        <input type="number" value={binN} onChange={(e) => setBinN(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">p (prob éxito)</label>
                                        <input type="number" step="0.1" value={binP} onChange={(e) => setBinP(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">x (éxitos)</label>
                                        <input type="number" value={binX} onChange={(e) => setBinX(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                </div>
                            )}

                            {distType === 'poisson' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">λ (media)</label>
                                        <input type="number" value={poiLam} onChange={(e) => setPoiLam(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-aurora-muted uppercase font-bold block mb-1">x (eventos)</label>
                                        <input type="number" value={poiX} onChange={(e) => setPoiX(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono" />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={calculateProbability}
                                disabled={cargando}
                                className={`w-full py-3 font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                                    cargando ? 'bg-aurora-primary/50 text-white/70' : 'bg-aurora-primary text-white hover:bg-aurora-primaryHover'
                                }`}
                            >
                                {cargando ? <Loader2 size={18} className="animate-spin" /> : 'Calcular Probabilidad'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="hidden lg:flex w-1/2 p-6 flex-col">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calculator size={20} className="text-aurora-primary" />
                        Resultados Analíticos
                    </h3>

                    {activeTab === 'descriptive' && descResult && (
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2">
                            {[
                                ['n', descResult.count],
                                ['Σ', descResult.sum.toFixed(4)],
                                ['Media (x̄)', descResult.mean.toFixed(4)],
                                ['Mediana', descResult.median.toFixed(4)],
                                ['Moda', descResult.mode.join(', ')],
                                ['Mín', descResult.min],
                                ['Máx', descResult.max],
                                ['Rango', descResult.range.toFixed(4)],
                                ['Varianza (σ²)', descResult.variance.toFixed(4)],
                                ['Desv. Est. (σ)', descResult.std.toFixed(4)],
                                ['Q1', descResult.q1?.toFixed(4)],
                                ['Q3', descResult.q3?.toFixed(4)],
                                ['IQR', descResult.iqr?.toFixed(4)],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <div className="text-xs text-aurora-muted uppercase">{label}</div>
                                    <div className="text-lg font-bold text-aurora-primary font-mono">{value}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'regression' && regResult && (
                        <div className="space-y-4">
                            <div className="p-6 bg-aurora-surface border border-aurora-primary/30 rounded-xl">
                                <div className="text-2xl font-bold text-aurora-primary font-mono text-center">
                                    {regResult.equation}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <div className="text-xs text-aurora-muted uppercase">Pendiente (m)</div>
                                    <div className="text-lg font-bold text-white font-mono">{regResult.slope.toFixed(6)}</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <div className="text-xs text-aurora-muted uppercase">Intercepto (b)</div>
                                    <div className="text-lg font-bold text-white font-mono">{regResult.intercept.toFixed(6)}</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3 col-span-2">
                                    <div className="text-xs text-aurora-muted uppercase">Coeficiente R²</div>
                                    <div className="text-xl font-bold text-aurora-primary font-mono">{regResult.r2.toFixed(6)}</div>
                                    <div className="text-xs text-aurora-muted mt-1">
                                        {regResult.r2 >= 0.9 ? '✓ Muy buen ajuste' :
                                            regResult.r2 >= 0.7 ? '○ Ajuste aceptable' :
                                                '✗ Ajuste débil'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'probability' && probResult && (
                        <div className="space-y-4">
                            <div className="p-6 bg-aurora-surface border border-aurora-primary/30 rounded-xl text-center">
                                <div className="text-sm text-aurora-muted uppercase tracking-wider mb-2 font-bold">
                                    Distribución {probResult._type}
                                </div>
                                
                                {probResult.type === 'inverse' ? (
                                    <div className="text-3xl font-bold text-aurora-primary font-mono mt-4">
                                        X = {probResult.x.toFixed(6)}
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-aurora-primary font-mono">
                                            P(X = x) = {(probResult.pdf ?? probResult.pd).toExponential(4)}
                                        </div>
                                    </>
                                )}
                            </div>

                            {probResult.type !== 'inverse' && (
                                <div className="grid grid-cols-2 gap-3">
                                    {probResult.z_score !== undefined && (
                                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 col-span-2">
                                            <div className="text-xs text-aurora-muted uppercase">Puntaje Z</div>
                                            <div className="text-xl font-bold text-white font-mono">{probResult.z_score.toFixed(6)}</div>
                                        </div>
                                    )}
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="text-xs text-aurora-muted uppercase">CD (X ≤ x)</div>
                                        <div className="text-lg font-bold text-white font-mono">
                                            {(probResult.cdf ?? probResult.cd).toFixed(6)}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="text-xs text-aurora-muted uppercase">Cola Sup (X &gt; x)</div>
                                        <div className="text-lg font-bold text-white font-mono">
                                            {probResult.greater_than.toFixed(6)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!descResult && !regResult && !probResult && !cargando && (
                        <div className="flex-1 flex items-center justify-center text-aurora-muted">
                            <div className="text-center">
                                <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Ingresa datos y presiona Calcular</p>
                                <p className="text-xs opacity-50 mt-2">Cálculos respaldados por Scipy / EquaCore</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatisticsMode;
