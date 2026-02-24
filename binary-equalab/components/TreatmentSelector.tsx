import React from 'react';
import { Pill, Activity, Scissors, AlertCircle } from 'lucide-react';

interface TreatmentSelectorProps {
    activeTreatment: number;
    setTreatment: (t: number) => void;
}

const TreatmentSelector: React.FC<TreatmentSelectorProps> = ({ activeTreatment, setTreatment }) => {
    const treatments = [
        { id: 0, label: 'Sin Tratamiento', icon: AlertCircle, color: 'gray-500' },
        { id: 1, label: 'Prednisona', icon: Pill, color: 'primary' },
        { id: 2, label: 'Inmunoglobulina (IVIG)', icon: Activity, color: 'blue-500' },
        { id: 3, label: 'Esplenectomía', icon: Scissors, color: 'red-500' },
    ];

    return (
        <div className="bg-background-dark/50 border border-aurora-border rounded-3xl p-6">
            <h3 className="text-sm font-bold text-aurora-muted uppercase tracking-widest mb-4">Protocolo de Intervención</h3>
            <div className="grid grid-cols-1 gap-3">
                {treatments.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTreatment === t.id;
                    
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTreatment(t.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all border text-left
                                ${isActive 
                                    ? `bg-${t.color}/10 border-${t.color}/40 text-${t.color}` 
                                    : 'bg-white/5 border-aurora-border/20 text-aurora-secondary hover:bg-white/10'
                                }
                            `}
                        >
                            <Icon size={18} />
                            <span className="text-sm font-medium">{t.label}</span>
                        </button>
                    );
                })}
            </div>
            
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                <p className="text-[10px] text-aurora-secondary italic">
                    * La eficacia del tratamiento se calcula dinámicamente en el motor EquaCore mediante parámetros farmacodinámicos ($E_{max}$).
                </p>
            </div>
        </div>
    );
};

export default TreatmentSelector;
