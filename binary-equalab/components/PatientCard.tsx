import React from 'react';
import { User, Calendar, ShieldAlert, HeartPulse } from 'lucide-react';

const PatientCard: React.FC = () => {
    return (
        <div className="bg-background-dark/50 border border-aurora-border rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-4 mb-2">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <User size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">José M.</h3>
                    <div className="flex items-center gap-2 text-aurora-muted text-xs">
                        <Calendar size={12} />
                        <span>12 años, Masculino</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-aurora-secondary">Diagnóstico:</span>
                    <span className="text-red-400 font-bold px-2 py-0.5 bg-red-400/10 rounded">PTI Severa</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-aurora-secondary">Peso:</span>
                    <span className="text-white">42 kg</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-aurora-secondary">Estado Inmune:</span>
                    <span className="text-orange-400 flex items-center gap-1">
                        <ShieldAlert size={14} /> Reactivo
                    </span>
                </div>
            </div>

            <div className="pt-4 border-t border-aurora-border/20">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase mb-2">
                    <HeartPulse size={14} />
                    Simbología Médica
                </div>
                <p className="text-[10px] text-aurora-muted leading-relaxed">
                    $P(t)$: Recuento de plaquetas poblacional.<br/>
                    $A(t)$: Anticuerpos anti-plaquetarios activos.
                </p>
            </div>
        </div>
    );
};

export default PatientCard;
