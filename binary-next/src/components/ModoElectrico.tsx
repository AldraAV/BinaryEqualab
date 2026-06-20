"use client";
import React, { useState, useEffect } from 'react';
import { Zap, Calculator, ArrowRightLeft, Cpu, Lightbulb, Settings2, Activity } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

type SubModo = 'ohm' | 'led' | 'conversor' | 'kirchhoff';

// Componente Entrada Diferida
const EntradaDiferida = ({ valor, alCambiar, textoGuia, clases, esTexto = false }: { valor: string, alCambiar: (v: string) => void, textoGuia: string, clases: string, esTexto?: boolean }) => {
    const [valorLocal, establecerValorLocal] = useState(valor);

    useEffect(() => {
        establecerValorLocal(valor);
    }, [valor]);

    useEffect(() => {
        const manejador = setTimeout(() => {
            if (valorLocal !== valor) alCambiar(valorLocal);
        }, 300);
        return () => clearTimeout(manejador);
    }, [valorLocal, alCambiar, valor]);

    return (
        <input
            type={esTexto ? "text" : "number"}
            value={valorLocal}
            onChange={(e) => establecerValorLocal(e.target.value)}
            placeholder={textoGuia}
            className={clases}
        />
    );
};

const ModoElectrico: React.FC = () => {
    const [pestanaActiva, setPestanaActiva] = useState<SubModo>('ohm');

    // Estado Ley de Ohm
    const [valoresOhm, setValoresOhm] = useState({ v: '', i: '', r: '' });

    // Estado LED
    const [valoresLed, setValoresLed] = useState({ vs: '5', vf: '2.2', i: '20' });

    // Estado Conversor Base Refactorizado
    const [conversor, setConversor] = useState({
        origen: 10,
        destino: 2,
        entrada: '',
        salida: ''
    });

    // Estado Kirchhoff
    const [valoresKirchhoff, setValoresKirchhoff] = useState({
        tipo: 'lkc' as 'lkc' | 'lkv',
        entran: '',
        salen: ''
    });

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

    // Conversor de bases numéricas (Rediseñado)
    const handleConversionChange = (campo: 'origen' | 'destino' | 'entrada', valor: any) => {
        const nuevo = { ...conversor, [campo]: valor };
        
        // Validación en tiempo real del input según la base origen
        if (campo === 'entrada') {
            let regex;
            switch(nuevo.origen) {
                case 2: regex = /^[01]*$/; break;
                case 8: regex = /^[0-7]*$/; break;
                case 10: regex = /^[0-9]*$/; break;
                case 16: regex = /^[0-9A-Fa-f]*$/; break;
                default: regex = /^[0-9A-Za-z]*$/;
            }
            if (!regex.test(valor)) return; // Bloquear si no es válido
        }

        setConversor(nuevo);

        if (!nuevo.entrada) {
            setConversor(p => ({ ...p, [campo]: valor, salida: '' }));
            return;
        }

        try {
            const dec = parseInt(nuevo.entrada, nuevo.origen);
            if (isNaN(dec)) throw new Error();
            let res = dec.toString(nuevo.destino);
            if (nuevo.destino === 16) res = res.toUpperCase();
            setConversor(p => ({ ...p, [campo]: valor, salida: res }));
        } catch {
            setConversor(p => ({ ...p, [campo]: valor, salida: 'ERR' }));
        }
    };

    // Calculadora Kirchhoff
    const calcularKirchhoff = () => {
        try {
            const sumIn = valoresKirchhoff.entran.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)).reduce((a, b) => a + b, 0);
            const sumOut = valoresKirchhoff.salen.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)).reduce((a, b) => a + b, 0);
            
            const hasXIn = valoresKirchhoff.entran.toLowerCase().includes('x');
            const hasXOut = valoresKirchhoff.salen.toLowerCase().includes('x');

            if (hasXIn && !hasXOut) {
                return `x = ${(sumOut - sumIn).toFixed(2)}`;
            } else if (hasXOut && !hasXIn) {
                return `x = ${(sumIn - sumOut).toFixed(2)}`;
            } else if (!hasXIn && !hasXOut) {
                if (valoresKirchhoff.entran === '' && valoresKirchhoff.salen === '') return '---';
                return sumIn === sumOut ? 'BALANCE: OK' : `Δ: ${Math.abs(sumIn - sumOut).toFixed(2)}`;
            } else {
                return 'ERR: MÚLTIPLES INCÓGNITAS';
            }
        } catch (e) {
            return '---';
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    };

    return (
        <div className="flex flex-col h-full bg-[#111111] text-aurora-text font-inter selection:bg-[#FF8C42]/30">
            {/* Navegación - Precisión Instrumental */}
            <div className="flex items-center gap-1 p-2 bg-[#1A1A1A] border-b border-[#333333] overflow-x-auto shadow-md relative z-10">
                <div className="flex items-center gap-2 px-3 border-r border-[#333333] mr-2">
                    <Activity size={18} className="text-[#FF8C42]" />
                    <span className="text-[10px] text-[#888888] uppercase tracking-[0.2em] font-jetbrains">Instrumentos</span>
                </div>
                {[
                    { id: 'ohm', etiqueta: 'LEY DE OHM', icono: Zap },
                    { id: 'led', etiqueta: 'DIODOS LED', icono: Lightbulb },
                    { id: 'kirchhoff', etiqueta: 'KIRCHHOFF', icono: Cpu },
                    { id: 'conversor', etiqueta: 'CONVERSOR BASE', icono: ArrowRightLeft }
                ].map((pestana) => (
                    <button
                        key={pestana.id}
                        onClick={() => setPestanaActiva(pestana.id as SubModo)}
                        className={`relative px-4 py-2 text-xs font-jetbrains uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 overflow-hidden
                            ${pestanaActiva === pestana.id
                                ? 'text-[#FF8C42]'
                                : 'text-[#777777] hover:text-[#CCCCCC] hover:bg-[#222222]'
                            } rounded-sm`}
                    >
                        {pestanaActiva === pestana.id && (
                            <motion.div 
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF8C42] shadow-[0_0_8px_#FF8C42]"
                            />
                        )}
                        <pestana.icono size={14} className={pestanaActiva === pestana.id ? 'drop-shadow-[0_0_5px_rgba(255,140,66,0.8)]' : ''} />
                        {pestana.etiqueta}
                    </button>
                ))}
            </div>

            {/* Contenedor Principal */}
            <div className="flex-1 p-4 lg:p-8 overflow-y-auto relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <AnimatePresence mode="wait">
                        
                        {/* --- LEY DE OHM --- */}
                        {pestanaActiva === 'ohm' && (
                            <motion.div key="ohm" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-white font-space tracking-wide flex items-center gap-3">
                                            <Zap className="text-[#FF8C42]" size={20} />
                                            CÁLCULO SÍNCRONO V-I-R
                                        </h2>
                                        <p className="text-[#888] font-jetbrains text-[10px] uppercase tracking-widest mt-1">
                                            Monitor de Ley de Ohm en Tiempo Real
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#333]"></div>
                                        <div className="w-2 h-2 rounded-full bg-[#FF8C42] animate-pulse"></div>
                                    </div>
                                </div>

                                {/* Esquema Triángulo VIR */}
                                <div className="flex justify-center mb-8">
                                    <div className="relative w-48 h-48 flex flex-col items-center justify-center font-jetbrains select-none opacity-80 hover:opacity-100 transition-opacity drop-shadow-[0_0_15px_rgba(255,140,66,0.1)]">
                                        {/* Triángulo SVG */}
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#444]">
                                            <polygon points="50,10 10,90 90,90" fill="#1A1A1A" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                            {/* Línea horizontal */}
                                            <line x1="30" y1="55" x2="70" y2="55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                                            {/* Línea vertical */}
                                            <line x1="50" y1="55" x2="50" y2="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                                        </svg>
                                        
                                        {/* Letras */}
                                        <div className="absolute top-[22%] text-yellow-500 font-bold text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">V</div>
                                        <div className="absolute bottom-[18%] left-[28%] text-blue-500 font-bold text-2xl drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">I</div>
                                        <div className="absolute bottom-[18%] right-[28%] text-green-500 font-bold text-2xl drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">R</div>
                                        
                                        {/* Operadores */}
                                        <div className="absolute top-[48%] left-[32%] text-[#FF8C42] text-sm font-bold bg-[#1A1A1A] px-1 rounded-full leading-none z-10">÷</div>
                                        <div className="absolute top-[48%] right-[32%] text-[#FF8C42] text-sm font-bold bg-[#1A1A1A] px-1 rounded-full leading-none z-10">÷</div>
                                        <div className="absolute bottom-[20%] left-[47%] text-[#FF8C42] text-sm font-bold bg-[#1A1A1A] px-1 rounded-full leading-none z-10">×</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mx-auto">
                                    {/* Voltaje */}
                                    <div className="bg-[#1A1A1A] p-5 rounded border border-t-2 border-[#333] border-t-yellow-500 shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        <label className="flex items-center justify-between text-[10px] font-bold text-yellow-500 uppercase font-jetbrains tracking-widest mb-3">
                                            <span>Voltaje (V)</span>
                                            <span className="text-[#555]">Volts</span>
                                        </label>
                                        <div className="bg-[#0D0D0D] p-3 rounded-sm border border-[#2A2A2A] shadow-inner relative">
                                            <EntradaDiferida
                                                valor={valoresOhm.v}
                                                alCambiar={v => calcularOhm('v', v)}
                                                textoGuia="0.00"
                                                clases="w-full bg-transparent text-yellow-400 font-mono focus:outline-none font-jetbrains text-3xl text-right placeholder:text-[#333]"
                                            />
                                        </div>
                                    </div>

                                    {/* Corriente */}
                                    <div className="bg-[#1A1A1A] p-5 rounded border border-t-2 border-[#333] border-t-blue-500 shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        <label className="flex items-center justify-between text-[10px] font-bold text-blue-500 uppercase font-jetbrains tracking-widest mb-3">
                                            <span>Corriente (I)</span>
                                            <span className="text-[#555]">Amps</span>
                                        </label>
                                        <div className="bg-[#0D0D0D] p-3 rounded-sm border border-[#2A2A2A] shadow-inner relative">
                                            <EntradaDiferida
                                                valor={valoresOhm.i}
                                                alCambiar={v => calcularOhm('i', v)}
                                                textoGuia="0.00"
                                                clases="w-full bg-transparent text-blue-400 font-mono focus:outline-none font-jetbrains text-3xl text-right placeholder:text-[#333]"
                                            />
                                        </div>
                                    </div>

                                    {/* Resistencia */}
                                    <div className="bg-[#1A1A1A] p-5 rounded border border-t-2 border-[#333] border-t-green-500 shadow-xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        <label className="flex items-center justify-between text-[10px] font-bold text-green-500 uppercase font-jetbrains tracking-widest mb-3">
                                            <span>Resistencia (R)</span>
                                            <span className="text-[#555]">Ohms</span>
                                        </label>
                                        <div className="bg-[#0D0D0D] p-3 rounded-sm border border-[#2A2A2A] shadow-inner relative">
                                            <EntradaDiferida
                                                valor={valoresOhm.r}
                                                alCambiar={v => calcularOhm('r', v)}
                                                textoGuia="0.00"
                                                clases="w-full bg-transparent text-green-400 font-mono focus:outline-none font-jetbrains text-3xl text-right placeholder:text-[#333]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 flex justify-center">
                                    <button 
                                        onClick={() => setValoresOhm({ v: '', i: '', r: '' })} 
                                        className="px-8 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#444] text-[#888] hover:text-white rounded transition-all text-xs font-jetbrains uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        [ PURGAR DATOS ]
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* --- RESISTENCIA LED --- */}
                        {pestanaActiva === 'led' && (
                            <motion.div key="led" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-white font-space tracking-wide flex items-center gap-3">
                                            <Lightbulb className="text-[#FF8C42]" size={20} />
                                            PROTECCIÓN DE DIODOS
                                        </h2>
                                        <p className="text-[#888] font-jetbrains text-[10px] uppercase tracking-widest mt-1">
                                            Cálculo de Resistencia Limitadora
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#FF8C42] animate-pulse"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                    <div className="space-y-4 bg-[#1A1A1A] p-6 rounded border border-[#333] shadow-xl relative">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#FF8C42] opacity-80 rounded-l"></div>
                                        <h3 className="font-jetbrains text-[10px] text-[#888] uppercase tracking-[0.2em] mb-6 border-b border-[#333] pb-2 flex items-center gap-2">
                                            <Settings2 size={12} />
                                            Parámetros del Circuito
                                        </h3>
                                        
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-[#CCC] uppercase font-jetbrains tracking-widest">Voltaje de Fuente (Vs)</label>
                                            <div className="flex items-center bg-[#0D0D0D] border border-[#2A2A2A] rounded-sm shadow-inner group focus-within:border-[#FF8C42] transition-colors">
                                                <EntradaDiferida valor={valoresLed.vs} alCambiar={v => calcularLed('vs', v)} textoGuia="0.0" clases="w-full bg-transparent px-4 py-3 text-white font-mono focus:outline-none font-jetbrains text-lg" />
                                                <span className="text-[#666] font-jetbrains text-xs w-10 text-center border-l border-[#2A2A2A] h-full flex items-center justify-center">V</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1 pt-2">
                                            <div className="flex justify-between items-end">
                                                <label className="block text-[10px] font-bold text-[#CCC] uppercase font-jetbrains tracking-widest">Caída del Diodo (Vf)</label>
                                                <span className="text-[9px] text-[#DC143C] font-jetbrains border border-[#DC143C]/30 bg-[#DC143C]/10 px-1 rounded">Rojo:~2V</span>
                                            </div>
                                            <div className="flex items-center bg-[#0D0D0D] border border-[#2A2A2A] rounded-sm shadow-inner group focus-within:border-[#FF8C42] transition-colors">
                                                <EntradaDiferida valor={valoresLed.vf} alCambiar={v => calcularLed('vf', v)} textoGuia="0.0" clases="w-full bg-transparent px-4 py-3 text-white font-mono focus:outline-none font-jetbrains text-lg" />
                                                <span className="text-[#666] font-jetbrains text-xs w-10 text-center border-l border-[#2A2A2A] h-full flex items-center justify-center">V</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1 pt-2">
                                            <div className="flex justify-between items-end">
                                                <label className="block text-[10px] font-bold text-[#CCC] uppercase font-jetbrains tracking-widest">Corriente Objetivo (I)</label>
                                                <span className="text-[9px] text-[#FF8C42] font-jetbrains border border-[#FF8C42]/30 bg-[#FF8C42]/10 px-1 rounded">STD: 20mA</span>
                                            </div>
                                            <div className="flex items-center bg-[#0D0D0D] border border-[#2A2A2A] rounded-sm shadow-inner group focus-within:border-[#FF8C42] transition-colors">
                                                <EntradaDiferida valor={valoresLed.i} alCambiar={v => calcularLed('i', v)} textoGuia="0" clases="w-full bg-transparent px-4 py-3 text-white font-mono focus:outline-none font-jetbrains text-lg" />
                                                <span className="text-[#666] font-jetbrains text-xs w-10 text-center border-l border-[#2A2A2A] h-full flex items-center justify-center">mA</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#121212] border border-[#333] rounded p-6 flex flex-col shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,140,66,0.05)_0%,transparent_70%)] pointer-events-none"></div>
                                        <div className="absolute top-3 right-3 flex gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C42] animate-pulse shadow-[0_0_5px_#FF8C42]"></div>
                                        </div>
                                        <h3 className="font-jetbrains text-[10px] text-[#888] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            Monitor de Resistencia
                                        </h3>
                                        
                                        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                                            <div className="bg-[#050505] border border-[#222] w-full py-12 rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center mb-6 relative overflow-hidden">
                                                <div className="absolute left-0 top-0 w-full h-[1px] bg-[#333]"></div>
                                                <div className="absolute left-0 bottom-0 w-full h-[1px] bg-[#333]"></div>
                                                <div className="text-5xl lg:text-6xl font-mono font-bold text-white flex items-end justify-center gap-3 font-jetbrains tracking-tight">
                                                    {obtenerResistenciaLed()} <span className="text-3xl text-[#FF8C42] font-jetbrains mb-1">Ω</span>
                                                </div>
                                            </div>
                                            <div className="bg-[#1A1A1A] px-4 py-2 rounded text-[#888] font-jetbrains text-[10px] uppercase tracking-widest border border-[#333] flex items-center gap-2">
                                                <Calculator size={12} className="text-[#FF8C42]" />
                                                R = (Vs - Vf) / I
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* --- CONVERSOR NUMÉRICO --- */}
                        {pestanaActiva === 'conversor' && (
                            <motion.div key="conversor" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-white font-space tracking-wide flex items-center gap-3">
                                            <ArrowRightLeft className="text-[#FF8C42]" size={20} />
                                            TRADUCTOR DE BASE
                                        </h2>
                                        <p className="text-[#888] font-jetbrains text-[10px] uppercase tracking-widest mt-1">
                                            Sistemas Numéricos en Tiempo Real
                                        </p>
                                    </div>
                                </div>

                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="bg-[#1A1A1A] p-6 rounded border border-[#333] shadow-xl">
                                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                                            <div className="flex-1 space-y-2">
                                                <label className="block text-[10px] font-bold text-[#888] uppercase font-jetbrains tracking-widest">Base de Origen</label>
                                                <select 
                                                    value={conversor.origen} 
                                                    onChange={e => handleConversionChange('origen', parseInt(e.target.value))}
                                                    className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-white p-3 rounded-sm font-jetbrains text-sm focus:outline-none focus:border-[#FF8C42]"
                                                >
                                                    <option value={2}>Binario (Base 2)</option>
                                                    <option value={8}>Octal (Base 8)</option>
                                                    <option value={10}>Decimal (Base 10)</option>
                                                    <option value={16}>Hexadecimal (Base 16)</option>
                                                </select>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <label className="block text-[10px] font-bold text-[#888] uppercase font-jetbrains tracking-widest">Base de Destino</label>
                                                <select 
                                                    value={conversor.destino} 
                                                    onChange={e => handleConversionChange('destino', parseInt(e.target.value))}
                                                    className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-white p-3 rounded-sm font-jetbrains text-sm focus:outline-none focus:border-[#FF8C42]"
                                                >
                                                    <option value={2}>Binario (Base 2)</option>
                                                    <option value={8}>Octal (Base 8)</option>
                                                    <option value={10}>Decimal (Base 10)</option>
                                                    <option value={16}>Hexadecimal (Base 16)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-[#FF8C42] uppercase font-jetbrains tracking-widest">Valor de Entrada</label>
                                            <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-sm shadow-inner group focus-within:border-[#FF8C42] transition-colors">
                                                <input 
                                                    type="text"
                                                    value={conversor.entrada}
                                                    onChange={e => handleConversionChange('entrada', e.target.value)}
                                                    placeholder="Ingresa el valor..."
                                                    className="w-full bg-transparent px-4 py-3 text-white font-mono focus:outline-none font-jetbrains text-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-[#333] space-y-2">
                                            <label className="block text-[10px] font-bold text-green-500 uppercase font-jetbrains tracking-widest">Resultado</label>
                                            <div className="bg-[#050505] border border-[#222] rounded-sm py-6 px-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                                                <div className="text-3xl font-mono font-bold text-green-400 font-jetbrains tracking-tight text-center break-all">
                                                    {conversor.salida || '---'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* --- LEYES DE KIRCHHOFF --- */}
                        {pestanaActiva === 'kirchhoff' && (
                            <motion.div key="kirchhoff" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-white font-space tracking-wide flex items-center gap-3">
                                            <Cpu className="text-[#DC143C]" size={20} />
                                            ANÁLISIS KIRCHHOFF
                                        </h2>
                                        <p className="text-[#888] font-jetbrains text-[10px] uppercase tracking-widest mt-1">
                                            Módulo de Precisión LKC / LKV
                                        </p>
                                    </div>
                                    <div className="flex gap-1 border border-[#333] bg-[#1A1A1A] p-1 rounded-sm">
                                        <button
                                            onClick={() => setValoresKirchhoff(p => ({ ...p, tipo: 'lkc' }))}
                                            className={`px-4 py-1 text-[10px] font-jetbrains uppercase tracking-widest transition-colors ${valoresKirchhoff.tipo === 'lkc' ? 'bg-[#DC143C] text-white' : 'text-[#888] hover:text-white'}`}
                                        >
                                            LKC (Nodos)
                                        </button>
                                        <button
                                            onClick={() => setValoresKirchhoff(p => ({ ...p, tipo: 'lkv' }))}
                                            className={`px-4 py-1 text-[10px] font-jetbrains uppercase tracking-widest transition-colors ${valoresKirchhoff.tipo === 'lkv' ? 'bg-[#DC143C] text-white' : 'text-[#888] hover:text-white'}`}
                                        >
                                            LKV (Mallas)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                    <div className="space-y-6 bg-[#1A1A1A] p-6 rounded border border-[#333] shadow-xl relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DC143C] to-transparent opacity-30"></div>
                                        <h3 className="font-jetbrains text-[10px] text-[#888] uppercase tracking-[0.2em] border-b border-[#333] pb-2">Vectores de Entrada</h3>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-[#FF8C42] uppercase font-jetbrains tracking-widest">
                                                {valoresKirchhoff.tipo === 'lkc' ? 'Σ I (Entran) [A]' : 'Σ V (Subida) [V]'}
                                            </label>
                                            <div className="relative bg-[#0D0D0D] border border-[#2A2A2A] rounded-sm shadow-inner group focus-within:border-[#FF8C42] transition-colors">
                                                <input
                                                    type="text"
                                                    value={valoresKirchhoff.entran}
                                                    onChange={e => setValoresKirchhoff(p => ({ ...p, entran: e.target.value }))}
                                                    placeholder="Ej: 5, 2.5, x"
                                                    className="w-full bg-transparent px-4 py-3 text-white font-mono focus:outline-none font-jetbrains text-lg placeholder:text-[#333]"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FF8C42] opacity-50 group-focus-within:opacity-100 group-focus-within:animate-pulse"></div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <label className="block text-[10px] font-bold text-[#FF6B35] uppercase font-jetbrains tracking-widest">
                                                {valoresKirchhoff.tipo === 'lkc' ? 'Σ I (Salen) [A]' : 'Σ V (Caída) [V]'}
                                            </label>
                                            <div className="relative bg-[#0D0D0D] border border-[#2A2A2A] rounded-sm shadow-inner group focus-within:border-[#FF6B35] transition-colors">
                                                <input
                                                    type="text"
                                                    value={valoresKirchhoff.salen}
                                                    onChange={e => setValoresKirchhoff(p => ({ ...p, salen: e.target.value }))}
                                                    placeholder="Ej: 3, x"
                                                    className="w-full bg-transparent px-4 py-3 text-white font-mono focus:outline-none font-jetbrains text-lg placeholder:text-[#333]"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FF6B35] opacity-50 group-focus-within:opacity-100 group-focus-within:animate-pulse"></div>
                                            </div>
                                        </div>

                                        <div className="bg-[#0D0D0D] text-[#888] text-[9px] p-3 rounded-sm font-jetbrains border border-[#222] flex items-start gap-2">
                                            <span className="text-[#DC143C]">!</span>
                                            <p>Separa los valores por comas. Usa la letra "x" para declarar la variable a resolver.</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#121212] border border-[#333] rounded p-6 flex flex-col shadow-2xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,20,60,0.03)_0%,transparent_70%)] pointer-events-none"></div>
                                        <div className="absolute top-3 right-3 flex gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#DC143C] animate-pulse shadow-[0_0_5px_#DC143C]"></div>
                                        </div>
                                        <h3 className="font-jetbrains text-[10px] text-[#888] uppercase tracking-[0.2em] mb-4">Salida del Analizador</h3>
                                        
                                        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                                            <div className="bg-[#050505] border border-[#222] w-full py-16 rounded shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] flex items-center justify-center mb-6 relative overflow-hidden">
                                                {/* Scanline effect */}
                                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                                                <div className="text-4xl lg:text-5xl font-mono font-bold text-[#DC143C] flex items-center justify-center font-jetbrains tracking-tight drop-shadow-[0_0_8px_rgba(220,20,60,0.5)]">
                                                    {calcularKirchhoff()}
                                                </div>
                                            </div>
                                            <div className="bg-[#1A1A1A] px-4 py-2 rounded text-[#888] font-jetbrains text-[10px] uppercase tracking-widest border border-[#333]">
                                                {valoresKirchhoff.tipo === 'lkc' ? 'LKC: Σ I(in) = Σ I(out)' : 'LKV: Σ V(up) = Σ V(down)'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ModoElectrico;
