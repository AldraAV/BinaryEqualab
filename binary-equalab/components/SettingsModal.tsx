import React, { useState, useEffect } from 'react';
import { X, Server, Cpu, Activity, Info, Volume2, Shield, Settings } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        const checkBackend = async () => {
            const start = Date.now();
            try {
                const url = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
                // Simple ping if endpoint exists, or just fetch root/health
                await fetch(url + '/', { method: 'GET' });
                setBackendStatus('online');
                setLatency(Date.now() - start);
            } catch (e: any) {
                console.error("Backend Check Error:", e);
                setBackendStatus('offline');
                // Temporary: Show error in latency field to debug
                setLatency(e.message || 'Error');
            }
        };
        checkBackend();
    }, [isOpen]);

    const InfoRow = ({ icon: Icon, label, value, status }: any) => (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-aurora-border/50">
            <div className="flex items-center gap-3">
                <Icon size={18} className="text-aurora-secondary" />
                <span className="text-sm text-aurora-text">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${status === 'online' ? 'text-green-400' : status === 'offline' ? 'text-red-400' : 'text-aurora-muted'}`}>
                    {value}
                </span>
                {status === 'online' && <div className="size-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#1a1614] border border-aurora-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-aurora-border bg-white/5">
                    <h2 className="text-lg font-bold text-aurora-text flex items-center gap-2">
                        <Settings size={20} /> System Status
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-aurora-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="text-xs font-bold text-aurora-muted uppercase tracking-wider mb-2">Connectivity</div>

                    <InfoRow
                        icon={Server}
                        label="Backend API"
                        value={backendStatus === 'checking' ? 'Checking...' : backendStatus === 'online' ? `Online (${latency}ms)` : `Offline (${latency})`}
                        status={backendStatus}
                    />

                    <InfoRow
                        icon={Cpu}
                        label="Compute Engine"
                        value="Nerdamer (Client) + SymPy (Cloud)"
                        status="online"
                    />

                    <div className="text-xs font-bold text-aurora-muted uppercase tracking-wider mb-2 mt-6">Application</div>

                    <InfoRow icon={Activity} label="Version" value="v1.0.0-beta" />
                    <InfoRow icon={Volume2} label="Audio Engine" value="Web Audio API (Synth)" />
                    <InfoRow icon={Shield} label="Session" value="Secure" />

                </div>

                <div className="p-4 border-t border-aurora-border bg-white/5 text-center">
                    <p className="text-xs text-aurora-muted">Binary EquaLab &copy; 2026</p>
                </div>
            </div>
        </div>
    );
};

// Export Settings icon for consistency if needed elsewhere
export { Settings };

export default SettingsModal;
