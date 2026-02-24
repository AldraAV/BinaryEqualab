import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, Thermometer, User, 
  ChevronRight, Play, RefreshCw, BookOpen, 
  Stethoscope, Info, AlertCircle
} from 'lucide-react';
import PlateletsGraph from './PlateletsGraph';
import PatientCard from './PatientCard';
import TreatmentSelector from './TreatmentSelector';
import MedicalReasoningPanel from './MedicalReasoningPanel';

const PTISimulator: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [simulationData, setSimulationData] = useState<any>(null);
    const [params, setParams] = useState({
        production_rate: 50000,
        destruction_rate: 0.1,
        antibody_production: 0.05,
        treatment: 0,
        treatment_efficacy: 0.8,
        mode: 'student'
    });

    const runSimulation = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/septima/bio/pti', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    t_start: 0,
                    t_end: 30,
                    dt: 0.1,
                    y0: [15000.0, 1.0], // 15k plaquetas (crítico), 1.0 anticuerpos
                    params: params,
                    mode: params.mode
                })
            });
            const data = await response.json();
            setSimulationData(data);
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runSimulation();
    }, []);

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-8 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Séptima */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-aurora-border/20 pb-6">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Activity size={20} className="animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest">Bio-Simulation Mode</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">Séptima: Párpura Trombocitopénica Inmune</h1>
                        <p className="text-aurora-secondary">Simulación dinámica de homeóstasis plaquetaria - Caso José (12 años)</p>
                    </div>
                    
                    <button 
                        onClick={runSimulation}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
                        Ejecutar Simulación
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Panel Izquierdo: Paciente y Controles */}
                    <div className="lg:col-span-1 space-y-6">
                        <PatientCard />
                        <TreatmentSelector 
                            activeTreatment={params.treatment} 
                            setTreatment={(t) => setParams({...params, treatment: t})} 
                        />
                    </div>

                    {/* Panel Central: Gráfica y Datos */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-background-dark/50 border border-aurora-border rounded-3xl p-6 min-h-[400px]">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Heart className="text-red-500" size={20} />
                                Dinámica de Plaquetas (30 días)
                            </h3>
                            <PlateletsGraph data={simulationData} loading={loading} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MedicalReasoningPanel 
                                narrative={simulationData?.ai_narrative} 
                                steps={simulationData?.symbolic_steps}
                                interpretation={simulationData?.interpretation}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PTISimulator;
