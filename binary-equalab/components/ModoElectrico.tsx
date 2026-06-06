import React, { useState } from 'react';
import { Zap, Calculator, ArrowRightLeft, Cpu, Lightbulb, Settings2 } from 'lucide-react';

type SubModo = 'ohm' | 'led' | 'conversor';

const ModoElectrico: React.FC = () => {
    const [pestanaActiva, setPestanaActiva] = useState<SubModo>('ohm');

    // Estado Ley de Ohm
    const [valoresOhm, setValoresOhm] = useState({ v: '', i: '', r: '' });

    // Estado LED
    const [valoresLed, setValoresLed] = useState({ vs: '5', vf: '2.2', i: '20' });

    // Estado Conversor Base
    const [valoresBase, setValoresBase] = useState({ dec: '', bin: '', hex: '', oct: '' });

    // Calculadora Ley de Ohm
    const calcularOhm = (campo: 'v' | 'i' | 'r', valor: string) => {
        const nuevos = { ...valoresOhm, [campo]: valor };
        setValoresOhm(nuevos);

        const v = parseFloat(nuevos.v);
        const i = parseFloat(nuevos.i);
        const r = parseFloat(nuevos.r);

        // Si tenemos 2, calculamos el 3ro
        if (campo !== 'v' && !isNaN(i) && !isNaN(r)) nuevos.v = (i * r).toString();
        else if (campo !== 'i' && !isNaN(v) && !isNaN(r) && r !== 0) nuevos.i = (v / r).toString();
        else if (campo !== 'r' && !isNaN(v) && !isNaN(i) && i !== 0) nuevos.r = (v / i).toString();

        setValoresOhm(nuevos);
    };

    // Calculadora Resistencia LED
    const calcularLed = (campo: 'vs' | 'vf' | 'i', valor: string) => {
        const nuevos = { ...valoresLed, [campo]: valor };
        setValoresLed(nuevos);
    };

    const obtenerResistenciaLed = () => {
        const vs = parseFloat(valoresLed.vs);
        const vf = parseFloat(valoresLed.vf);
        const i = parseFloat(valoresLed.i) / 1000; // mA a A
        if (isNaN(vs) || isNaN(vf) || isNaN(i) || i === 0 || vs <= vf) return '---';
        return ((vs - vf) / i).toFixed(2);
    };

    // Conversor de bases numéricas
    const convertirBase = (campo: 'dec' | 'bin' | 'hex' | 'oct', valor: string) => {
        if (!valor) {
            setValoresBase({ dec: '', bin: '', hex: '', oct: '' });
            return;
        }

        try {
            let valorDecimal = 0;
            if (campo === 'dec') valorDecimal = parseInt(valor, 10);
            if (campo === 'bin') valorDecimal = parseInt(valor, 2);
            if (campo === 'hex') valorDecimal = parseInt(valor, 16);
            if (campo === 'oct') valorDecimal = parseInt(valor, 8);

            if (isNaN(valorDecimal)) throw new Error('Inválido');

            setValoresBase({
                dec: valorDecimal.toString(10),
                bin: valorDecimal.toString(2),
                hex: valorDecimal.toString(16).toUpperCase(),
                oct: valorDecimal.toString(8)
            });
        } catch (e) {
            setValoresBase(prev => ({ ...prev, [campo]: valor })); // Dejar escribir
        }
    };

    return (
        <div className="flex flex-col h-full bg-aurora-bg">
            <div className="flex items-center gap-2 p-3 bg-background-light border-b border-aurora-border overflow-x-auto">
                <span className="text-xs text-aurora-muted uppercase tracking-wider mr-2 shrink-0">Módulo:</span>
                {[
                    { id: 'ohm', etiqueta: 'Ley de Ohm', icono: Zap },
                    { id: 'led', etiqueta: 'Resistencia LED', icono: Lightbulb },
                    { id: 'conversor', etiqueta: 'Sistemas Numéricos', icono: ArrowRightLeft }
                ].map((pestana) => (
                    <button
                        key={pestana.id}
                        onClick={() => setPestanaActiva(pestana.id as SubModo)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                            pestanaActiva === pestana.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
                        }`}
                    >
                        <pestana.icono size={16} />
                        {pestana.etiqueta}
                    </button>
                ))}
            </div>

            <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    
                    {/* --- LEY DE OHM --- */}
                    {pestanaActiva === 'ohm' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2 font-space">Triángulo VIR (Ley de Ohm)</h2>
                                <p className="text-aurora-muted font-inter">Ingresa dos valores para calcular automáticamente el tercero.</p>
                            </div>

                            <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
                                {/* Triángulo VIR Visual */}
                                <div className="relative w-full max-w-lg aspect-square flex flex-col justify-between py-12 px-8">
                                    {/* Fondo de Triángulo CSS */}
                                    <div className="absolute inset-0 z-0 flex justify-center items-end pointer-events-none opacity-20 filter drop-shadow-[0_0_20px_rgba(255,90,31,0.5)]">
                                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                            <polygon points="50,10 0,90 100,90" fill="url(#gradienteOhm)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                                            <defs>
                                                <linearGradient id="gradienteOhm" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.8" />
                                                    <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0.1" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>

                                    {/* Decoración T divisora central */}
                                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none pt-8">
                                        <div className="w-full h-full relative flex items-center justify-center">
                                            <div className="absolute w-3/4 h-[2px] bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full"></div>
                                            <div className="absolute h-1/2 w-[2px] bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full translate-y-1/4"></div>
                                        </div>
                                    </div>

                                    {/* V (Arriba) */}
                                    <div className="z-10 flex justify-center w-full">
                                        <div className="bg-aurora-bg/80 border border-yellow-500/50 rounded-2xl p-4 w-48 relative overflow-hidden group liquid-glass text-center shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                                            <label className="block text-sm font-bold text-yellow-500 uppercase mb-2 font-inter tracking-widest">Voltaje (V)</label>
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    value={valoresOhm.v}
                                                    onChange={e => calcularOhm('v', e.target.value)}
                                                    placeholder="12"
                                                    className="w-full bg-transparent text-4xl font-mono text-white focus:outline-none placeholder:text-white/20 font-jetbrains text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* I y R (Abajo) */}
                                    <div className="z-10 flex justify-between w-full">
                                        {/* Corriente */}
                                        <div className="bg-aurora-bg/80 border border-blue-500/50 rounded-2xl p-4 w-48 relative overflow-hidden group liquid-glass text-center shadow-[0_0_25px_rgba(59,130,246,0.3)]">
                                            <label className="block text-sm font-bold text-blue-500 uppercase mb-2 font-inter tracking-widest">Corriente (I)</label>
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    value={valoresOhm.i}
                                                    onChange={e => calcularOhm('i', e.target.value)}
                                                    placeholder="2"
                                                    className="w-full bg-transparent text-4xl font-mono text-white focus:outline-none placeholder:text-white/20 font-jetbrains text-center"
                                                />
                                            </div>
                                        </div>

                                        {/* Resistencia */}
                                        <div className="bg-aurora-bg/80 border border-green-500/50 rounded-2xl p-4 w-48 relative overflow-hidden group liquid-glass text-center shadow-[0_0_25px_rgba(34,197,94,0.3)]">
                                            <label className="block text-sm font-bold text-green-500 uppercase mb-2 font-inter tracking-widest">Resistencia (R)</label>
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    value={valoresOhm.r}
                                                    onChange={e => calcularOhm('r', e.target.value)}
                                                    placeholder="6"
                                                    className="w-full bg-transparent text-4xl font-mono text-white focus:outline-none placeholder:text-white/20 font-jetbrains text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-center">
                                <button onClick={() => setValoresOhm({ v: '', i: '', r: '' })} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-poppins">
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- RESISTENCIA LED --- */}
                    {pestanaActiva === 'led' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2 font-space">Calculadora de Resistencia para LED</h2>
                                <p className="text-aurora-muted font-inter">Protege tus LEDs calculando la resistencia adecuada.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 glass-panel">
                                        <label className="block text-sm font-bold text-aurora-muted mb-2 font-inter">Voltaje de la Fuente (Vs)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={valoresLed.vs} onChange={e => calcularLed('vs', e.target.value)} className="w-full bg-background-light px-4 py-2 rounded-lg text-white font-mono focus:outline-none focus:border-primary border border-transparent font-jetbrains" />
                                            <span className="text-white/50 w-8 font-poppins">V</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 glass-panel">
                                        <label className="block text-sm font-bold text-aurora-muted mb-2 font-inter">Caída de Voltaje del LED (Vf)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={valoresLed.vf} onChange={e => calcularLed('vf', e.target.value)} className="w-full bg-background-light px-4 py-2 rounded-lg text-white font-mono focus:outline-none focus:border-primary border border-transparent font-jetbrains" />
                                            <span className="text-white/50 w-8 font-poppins">V</span>
                                        </div>
                                        <p className="text-xs text-aurora-muted mt-2 font-inter">Rojo: ~2V, Azul/Blanco: ~3.3V</p>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 glass-panel">
                                        <label className="block text-sm font-bold text-aurora-muted mb-2 font-inter">Corriente deseada (I)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={valoresLed.i} onChange={e => calcularLed('i', e.target.value)} className="w-full bg-background-light px-4 py-2 rounded-lg text-white font-mono focus:outline-none focus:border-primary border border-transparent font-jetbrains" />
                                            <span className="text-white/50 w-8 font-poppins">mA</span>
                                        </div>
                                        <p className="text-xs text-aurora-muted mt-2 font-inter">Estándar: 20mA</p>
                                    </div>
                                </div>

                                <div className="bg-aurora-surface border border-primary/30 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-lg shadow-primary/10 relative overflow-hidden liquid-glass">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-3xl rounded-full"></div>
                                    <Settings2 size={48} className="text-primary mb-4 relative z-10 opacity-80" />
                                    <h3 className="text-lg font-bold text-aurora-muted uppercase mb-4 relative z-10 font-space">Resistencia Necesaria</h3>
                                    <div className="text-6xl font-mono font-bold text-white mb-2 relative z-10 flex items-end justify-center gap-2 font-jetbrains">
                                        {obtenerResistenciaLed()} <span className="text-3xl text-primary mb-1 font-poppins">Ω</span>
                                    </div>
                                    <p className="text-sm text-aurora-muted relative z-10 mt-4 max-w-xs font-inter">
                                        R = (Vs - Vf) / I
                                        <br />
                                        Utiliza el valor comercial más cercano por encima.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CONVERSOR NUMÉRICO --- */}
                    {pestanaActiva === 'conversor' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2 font-space">Sistemas Numéricos</h2>
                                <p className="text-aurora-muted font-inter">Escribe en cualquier base y conviértelo instantáneamente.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 glass-panel">
                                    <label className="block text-sm font-bold text-green-400 uppercase tracking-widest mb-2 font-inter">Decimal (Base 10)</label>
                                    <input 
                                        type="text" 
                                        value={valoresBase.dec} 
                                        onChange={e => convertirBase('dec', e.target.value)} 
                                        placeholder="0-9"
                                        className="w-full bg-transparent text-2xl font-mono text-white focus:outline-none placeholder:text-white/10 font-jetbrains" 
                                    />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 glass-panel">
                                    <label className="block text-sm font-bold text-blue-400 uppercase tracking-widest mb-2 font-inter">Binario (Base 2)</label>
                                    <input 
                                        type="text" 
                                        value={valoresBase.bin} 
                                        onChange={e => convertirBase('bin', e.target.value)} 
                                        placeholder="0-1"
                                        className="w-full bg-transparent text-2xl font-mono text-white focus:outline-none placeholder:text-white/10 font-jetbrains" 
                                    />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 glass-panel">
                                    <label className="block text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2 font-inter">Hexadecimal (Base 16)</label>
                                    <input 
                                        type="text" 
                                        value={valoresBase.hex} 
                                        onChange={e => convertirBase('hex', e.target.value)} 
                                        placeholder="0-9, A-F"
                                        className="w-full bg-transparent text-2xl font-mono text-white focus:outline-none placeholder:text-white/10 uppercase font-jetbrains" 
                                    />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 glass-panel">
                                    <label className="block text-sm font-bold text-orange-400 uppercase tracking-widest mb-2 font-inter">Octal (Base 8)</label>
                                    <input 
                                        type="text" 
                                        value={valoresBase.oct} 
                                        onChange={e => convertirBase('oct', e.target.value)} 
                                        placeholder="0-7"
                                        className="w-full bg-transparent text-2xl font-mono text-white focus:outline-none placeholder:text-white/10 font-jetbrains" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ModoElectrico;

// aria-label
