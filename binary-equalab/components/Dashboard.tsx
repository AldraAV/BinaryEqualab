import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Crown, Sparkles, Zap, CheckCircle, AlertTriangle, ArrowRight, Shield, Globe, Cpu } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

const Dashboard: React.FC = () => {
    const { planStatus: estadoPlan, loading: cargando, refreshPlan: recargarPlan } = usePlan();
    const [mostrarModalMejora, setMostrarModalMejora] = React.useState(false);

    const { user } = useAuth();

    // Redirigir o bloquear si no hay sesión iniciada
    if (!user) {
        return (
            <div className="flex-1 overflow-auto bg-background p-6 lg:p-8 flex items-center justify-center">
                <div className="bg-aurora-surface p-8 rounded-xl border border-aurora-border text-center max-w-md">
                    <Shield className="w-16 h-16 text-aurora-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-space font-bold text-aurora-text mb-2">Acceso Denegado</h2>
                    <p className="text-aurora-text/70 mb-6">Inicia sesión o crea una cuenta para ver y gestionar tu panel de control personalizado.</p>
                </div>
            </div>
        );
    }

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
                        alert(`¡Mejora Exitosa! Bienvenido al plan ${data.plan.toUpperCase()}.`);
                        recargarPlan(); // Reload plan hooks
                        // Clean URL
                        window.history.replaceState({}, '', '/dashboard');
                    }
                })
                .catch(err => console.error("La verificación falló", err));
        }
    }, [recargarPlan]);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
                <Crown className="w-16 h-16 text-aurora-muted mb-4 opacity-50" />
                <h2 className="text-2xl font-brand text-white mb-2">Inicia Sesión</h2>
                <p className="text-aurora-muted max-w-md">Para acceder a tu panel de control y ver tus planes, límites de IA y hojas de trabajo, necesitas iniciar sesión.</p>
            </div>
        );
    }

    if (cargando || !estadoPlan) {
        return <div className="p-10 text-center animate-pulse text-aurora-muted font-inter">Cargando tu panel de control...</div>;
    }

    const { plan, ai_calls_used: llamadasIaUsadas, ai_calls_limit: limiteLlamadasIa, worksheets_count: conteoHojas, worksheets_limit: limiteHojas } = estadoPlan;

    // Lógica de límites
    const obtenerTextoLimite = (limite: number | null) => limite === null ? '∞' : limite;
    const obtenerPorcentajeUso = (usado: number, limite: number | null) => {
        if (limite === null) return 0;
        return Math.min(100, (usado / limite) * 100);
    };

    const porcentajeIa = obtenerPorcentajeUso(llamadasIaUsadas, limiteLlamadasIa);
    const porcentajeHojas = obtenerPorcentajeUso(conteoHojas, limiteHojas);

    // Color dinámico según plan (Orange Sunrise para elite)
    const planColor = plan === 'elite' ? 'from-orange-500 via-amber-500 to-red-500' :
        plan === 'pro' ? 'from-blue-500 to-cyan-500' :
            'from-gray-500 to-gray-700';

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Encabezado */}
                <header className="flex justify-between items-end border-b border-aurora-border/30 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight font-space">Panel de Control</h1>
                        <p className="text-aurora-secondary text-lg font-inter">Tu centro de comando para la computación simbólica.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm text-aurora-muted font-inter">Reinicio del Ciclo de Facturación</p>
                        <p className="text-white font-mono font-jetbrains">{new Date(estadoPlan.period_end).toLocaleDateString()}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLUMNA IZQUIERDA: Estado del Plan y Mejoras */}
                    <div className="space-y-6">
                        {/* Current Plan Card */}
                        <div className="bg-white/5 border border-aurora-border rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50 transition-colors duration-500">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${planColor} opacity-20 blur-3xl rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700`} />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${planColor} shadow-lg shadow-orange-500/20`}>
                                        {plan === 'elite' ? <Crown size={32} className="text-white" /> :
                                            plan === 'pro' ? <Sparkles size={32} className="text-white" /> :
                                                <Zap size={32} className="text-white" />}
                                    </div>
                                    <div>
                                        <p className="text-aurora-muted text-xs uppercase tracking-widest font-bold font-inter">Plan Actual</p>
                                        <h2 className="text-3xl font-bold text-white capitalize font-space">Licencia {plan}</h2>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <FilaCaracteristica icon={Cpu} text={`${obtenerTextoLimite(limiteLlamadasIa)} Consultas IA / mes`} active={true} />
                                    <FilaCaracteristica icon={Globe} text={`${obtenerTextoLimite(limiteHojas)} Hojas en la Nube`} active={true} />
                                    <FilaCaracteristica icon={Shield} text={plan === 'free' ? 'Soporte Comunitario' : 'Soporte Prioritario'} active={plan !== 'free'} />
                                </div>

                                <button
                                    onClick={() => setMostrarModalMejora(true)}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] font-poppins"
                                >
                                    Administrar Suscripción
                                </button>
                            </div>
                        </div>

                        {/* Mensaje de Mejora (Solo para Gratis/Pro) */}
                        {plan !== 'elite' && (
                            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 relative overflow-hidden">
                                <h3 className="text-xl font-bold text-white mb-2 font-space">Desbloquea más poder</h3>
                                <p className="text-aurora-secondary text-sm mb-6 font-inter">Mejora a {plan === 'free' ? 'Pro' : 'Elite'} para límites más altos y procesamiento rápido.</p>
                                <button
                                    onClick={() => setMostrarModalMejora(true)}
                                    className="flex items-center gap-2 text-primary font-bold hover:text-white transition-colors group font-poppins"
                                >
                                    Ver Planes <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: Métricas de uso y visualización */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Cuadrícula de uso */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <TarjetaDeUso
                                title="Procesamiento IA"
                                used={llamadasIaUsadas}
                                limit={limiteLlamadasIa}
                                percent={porcentajeIa}
                                icon={<Cpu size={20} />}
                            />
                            <TarjetaDeUso
                                title="Almacenamiento en la Nube"
                                used={conteoHojas}
                                limit={limiteHojas}
                                percent={porcentajeHojas}
                                icon={<Globe size={20} />}
                            />
                        </div>

                        {/* Gráfica Analítica */}
                        <div className="bg-background-dark/50 border border-aurora-border rounded-3xl p-8 h-96 flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 font-space">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Analítica de Uso
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Peticiones IA', used: llamadasIaUsadas, limit: limiteLlamadasIa || 100 },
                                        { name: 'Hojas', used: conteoHojas, limit: limiteHojas || 10 }
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

                {/* Integración del Modal de Mejora */}
                <UpgradeModal
                    isOpen={mostrarModalMejora}
                    onClose={() => setMostrarModalMejora(false)}
                    currentPlan={plan}
                />
            </div>
        </div>
    );
};

// Sub-componentes
const FilaCaracteristica = ({ icon: Icon, text, active }: { icon: any, text: string, active: boolean }) => (
    <div className={`flex items-center gap-3 font-inter ${active ? 'text-white' : 'text-aurora-muted/50'}`}>
        <Icon size={18} />
        <span className="text-sm font-medium">{text}</span>
        {active && <CheckCircle size={14} className="text-primary ml-auto" />}
    </div>
);

const TarjetaDeUso = ({ title, used, limit, percent, icon }: { title: string, used: number, limit: number | null, percent: number, icon: any }) => (
    <div className="bg-background-dark/50 border border-aurora-border rounded-3xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/5 rounded-lg text-aurora-text">{icon}</div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full font-jetbrains ${percent >= 100 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {percent.toFixed(0)}%
            </span>
        </div>
        <h3 className="text-aurora-muted text-sm font-medium mb-1 font-inter">{title}</h3>
        <p className="text-3xl font-bold text-white mb-4 font-jetbrains">
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

// aria-label
