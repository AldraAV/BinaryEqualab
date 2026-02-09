import React from 'react';
import { Crown, Sparkles, User } from 'lucide-react';
import { usePlan, PlanStatus } from '../hooks/usePlan';

interface PlanBadgeProps {
    status: PlanStatus | null;
    onClick?: () => void;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ status, onClick }) => {
    // Fallback to free if status is null (e.g. backend offline or loading)
    const effectivePlan = status?.plan || 'free';

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'elite': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none';
            case 'pro': return 'bg-blue-600 text-white border-blue-500';
            case 'free': default: return 'bg-white/5 text-aurora-muted border-aurora-border';
        }
    };

    const getIcon = (plan: string) => {
        switch (plan) {
            case 'elite': return <Crown size={12} className="fill-current" />;
            case 'pro': return <Sparkles size={12} />;
            case 'free': default: return <User size={12} />;
        }
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-2 py-1 rounded-md border text-xs font-semibold transition-transform hover:scale-105 ${getPlanColor(effectivePlan)}`}
        >
            {getIcon(effectivePlan)}
            <span className="uppercase tracking-wider">{effectivePlan}</span>
        </button>
    );
};

export default PlanBadge;
