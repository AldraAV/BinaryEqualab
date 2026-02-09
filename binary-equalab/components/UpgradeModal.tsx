import React from 'react';
import { X, Check } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan?: 'free' | 'pro' | 'elite';
}

import { useAuth } from '../contexts/AuthContext';

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, currentPlan = 'free' }) => {
    const { user } = useAuth();
    const [loading, setLoading] = React.useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async (plan: 'pro' | 'elite') => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan,
                    user_id: user.id,
                    email: user.email
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe
            } else {
                alert('Error initiating checkout');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to payment server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-[#1a1614] border border-aurora-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-aurora-muted hover:text-white z-10 p-1 hover:bg-white/10 rounded-full">
                    <X size={24} />
                </button>

                {/* Free Plan */}
                <div className="flex-1 p-8 flex flex-col border-b md:border-b-0 md:border-r border-aurora-border/50 bg-white/[0.02]">
                    <h3 className="text-xl font-bold text-aurora-text mb-2">Free</h3>
                    <div className="text-3xl font-bold text-white mb-6">$0<span className="text-sm font-normal text-aurora-muted">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm text-aurora-secondary"><Check size={16} className="text-green-500" /> Basic Math Engine</li>
                        <li className="flex gap-2 text-sm text-aurora-secondary"><Check size={16} className="text-green-500" /> 20 AI Calls / month</li>
                        <li className="flex gap-2 text-sm text-aurora-secondary"><Check size={16} className="text-green-500" /> 5 Cloud Worksheets</li>
                    </ul>
                    <button disabled className="w-full py-2 rounded-lg bg-white/10 text-aurora-muted text-sm font-semibold cursor-not-allowed">
                        {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="flex-1 p-8 flex flex-col border-b md:border-b-0 md:border-r border-aurora-border/50 bg-white/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Pro</h3>
                    <div className="text-3xl font-bold text-white mb-6">$4.99<span className="text-sm font-normal text-aurora-muted">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm text-aurora-text"><Check size={16} className="text-blue-500" /> Fast Math Engine</li>
                        <li className="flex gap-2 text-sm text-aurora-text"><Check size={16} className="text-blue-500" /> 200 AI Calls / month</li>
                        <li className="flex gap-2 text-sm text-aurora-text"><Check size={16} className="text-blue-500" /> 50 Cloud Worksheets</li>
                        <li className="flex gap-2 text-sm text-aurora-text"><Check size={16} className="text-blue-500" /> Priority Support</li>
                    </ul>
                    <button
                        onClick={() => handleUpgrade('pro')}
                        disabled={currentPlan === 'pro' || loading}
                        className={`w-full py-2 rounded-lg text-white text-sm font-semibold transition-colors shadow-lg ${currentPlan === 'pro' ? 'bg-white/10 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
                    >
                        {loading ? 'Processing...' : currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                    </button>
                </div>

                {/* Elite Plan */}
                <div className="flex-1 p-8 flex flex-col bg-gradient-to-b from-purple-900/20 to-transparent">
                    <h3 className="text-xl font-bold text-purple-400 mb-2">Elite</h3>
                    <div className="text-3xl font-bold text-white mb-6">$14.99<span className="text-sm font-normal text-aurora-muted">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm text-aurora-text"><Check size={16} className="text-purple-500" /> Everything in Pro</li>
                        <li className="flex gap-2 text-sm text-aurora-text font-bold"><Check size={16} className="text-purple-500" /> Unlimited AI</li>
                        <li className="flex gap-2 text-sm text-aurora-text"><Check size={16} className="text-purple-500" /> Unlimited Worksheets</li>
                        <li className="flex gap-2 text-sm text-aurora-text"><Check size={16} className="text-purple-500" /> Teacher Mode (Docs)</li>
                    </ul>
                    <button
                        onClick={() => handleUpgrade('elite')}
                        disabled={currentPlan === 'elite' || loading}
                        className={`w-full py-2 rounded-lg text-white text-sm font-bold transition-all shadow-lg ${currentPlan === 'elite' ? 'bg-white/10 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-purple-900/20'}`}
                    >
                        {loading ? 'Processing...' : currentPlan === 'elite' ? 'Current Plan' : 'Get Elite'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UpgradeModal;
