import React from 'react';
import { usePlan } from '../hooks/usePlan';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Crown, Sparkles, Zap, CheckCircle, AlertTriangle, ArrowRight, Shield, Globe, Cpu } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

const Dashboard: React.FC = () => {
    const { planStatus, loading, refreshPlan } = usePlan();
    const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

    // Verify Stripe Payment
    React.useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const sessionId = query.get('session_id');

        if (sessionId) {
            console.log("Verifying payment...", sessionId);
            fetch(`http://localhost:8000/api/verify-session/${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert(`Upgrade Successful! Welcome to ${data.plan.toUpperCase()}.`);
                        refreshPlan(); // Reload plan hooks
                        // Clean URL
                        window.history.replaceState({}, '', '/dashboard');
                    }
                })
                .catch(err => console.error("Verification failed", err));
        }
    }, [refreshPlan]);

    if (loading || !planStatus) {
        return <div className="p-10 text-center animate-pulse text-aurora-muted">Loading your dashboard...</div>;
    }

    const { plan, ai_calls_used, ai_calls_limit, worksheets_count, worksheets_limit } = planStatus;

    // Limits Display Logic
    const getLimitText = (limit: number | null) => limit === null ? '∞' : limit;
    const getUsagePercent = (used: number, limit: number | null) => {
        if (limit === null) return 0;
        return Math.min(100, (used / limit) * 100);
    };

    const aiPercent = getUsagePercent(ai_calls_used, ai_calls_limit);
    const worksheetsPercent = getUsagePercent(worksheets_count, worksheets_limit);

    // Dynamic color based on plan
    const planColor = plan === 'elite' ? 'from-purple-500 to-pink-500' :
        plan === 'pro' ? 'from-blue-500 to-cyan-500' :
            'from-gray-500 to-gray-700';

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <header className="flex justify-between items-end border-b border-aurora-border/30 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Dashboard</h1>
                        <p className="text-aurora-secondary text-lg">Your command center for symbolic computation.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm text-aurora-muted">Billing Cycle Resets</p>
                        <p className="text-white font-mono">{new Date(planStatus.period_end).toLocaleDateString()}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Plan Status & Upsell */}
                    <div className="space-y-6">
                        {/* Current Plan Card */}
                        <div className="bg-white/5 border border-aurora-border rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50 transition-colors duration-500">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${planColor} opacity-20 blur-3xl rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700`} />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${planColor} shadow-lg shadow-purple-500/20`}>
                                        {plan === 'elite' ? <Crown size={32} className="text-white" /> :
                                            plan === 'pro' ? <Sparkles size={32} className="text-white" /> :
                                                <Zap size={32} className="text-white" />}
                                    </div>
                                    <div>
                                        <p className="text-aurora-muted text-xs uppercase tracking-widest font-bold">Current Plan</p>
                                        <h2 className="text-3xl font-bold text-white capitalize">{plan} License</h2>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <FeatureRow icon={Cpu} text={`${getLimitText(ai_calls_limit)} AI Queries / mo`} active={true} />
                                    <FeatureRow icon={Globe} text={`${getLimitText(worksheets_limit)} Cloud Worksheets`} active={true} />
                                    <FeatureRow icon={Shield} text={plan === 'free' ? 'Community Support' : 'Priority Support'} active={plan !== 'free'} />
                                </div>

                                <button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Manage Subscription
                                </button>
                            </div>
                        </div>

                        {/* Upgrade Prompt (Only for Free/Pro) */}
                        {plan !== 'elite' && (
                            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 relative overflow-hidden">
                                <h3 className="text-xl font-bold text-white mb-2">Unlock More Power</h3>
                                <p className="text-aurora-secondary text-sm mb-6">Upgrade to {plan === 'free' ? 'Pro' : 'Elite'} for higher limits and faster processing.</p>
                                <button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="flex items-center gap-2 text-primary font-bold hover:text-white transition-colors group"
                                >
                                    View Plans <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Usage Metrics & Visualization */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Usage Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <UsageCard
                                title="AI Processing"
                                used={ai_calls_used}
                                limit={ai_calls_limit}
                                percent={aiPercent}
                                icon={<Cpu size={20} />}
                            />
                            <UsageCard
                                title="Cloud Storage"
                                used={worksheets_count}
                                limit={worksheets_limit}
                                percent={worksheetsPercent}
                                icon={<Globe size={20} />}
                            />
                        </div>

                        {/* Analytic Chart */}
                        <div className="bg-background-dark/50 border border-aurora-border rounded-3xl p-8 h-96 flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Usage Analytics
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'AI Requests', used: ai_calls_used, limit: ai_calls_limit || 100 },
                                        { name: 'Worksheets', used: worksheets_count, limit: worksheets_limit || 10 }
                                    ]} barSize={40}>
                                        <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#1a1614', borderColor: '#333', borderRadius: '12px' }}
                                        />
                                        <Bar dataKey="used" radius={[6, 6, 0, 0]}>
                                            {
                                                [0, 1].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ff6b00' : '#3b82f6'} />
                                                ))
                                            }
                                        </Bar>
                                        <Bar dataKey="limit" fill="#333" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integration with UpgradeModal */}
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    currentPlan={plan}
                />
            </div>
        </div>
    );
};

// Sub-components for cleaner code
const FeatureRow = ({ icon: Icon, text, active }: { icon: any, text: string, active: boolean }) => (
    <div className={`flex items-center gap-3 ${active ? 'text-white' : 'text-aurora-muted/50'}`}>
        <Icon size={18} />
        <span className="text-sm font-medium">{text}</span>
        {active && <CheckCircle size={14} className="text-primary ml-auto" />}
    </div>
);

const UsageCard = ({ title, used, limit, percent, icon }: { title: string, used: number, limit: number | null, percent: number, icon: any }) => (
    <div className="bg-background-dark/50 border border-aurora-border rounded-3xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/5 rounded-lg text-aurora-text">{icon}</div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${percent >= 100 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {percent.toFixed(0)}%
            </span>
        </div>
        <h3 className="text-aurora-muted text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white mb-4">
            {used} <span className="text-lg text-aurora-muted/50">/ {limit === null ? '∞' : limit}</span>
        </p>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-orange-400'}`}
                style={{ width: `${percent}%` }}
            />
        </div>
    </div>
);

export default Dashboard;
