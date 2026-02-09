/**
 * Binary EquaLab - Auth Modal Component
 * 
 * Login/Signup modal with email/password form.
 */
import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { signIn, signUp, signInWithGoogle } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (mode === 'login') {
                const { error } = await signIn(email, password);
                if (error) throw error;
                onClose();
            } else {
                const { error } = await signUp(email, password);
                if (error) throw error;
                setSuccess('Check your email to confirm your account!');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background-light border border-aurora-border rounded-2xl w-full max-w-md p-8 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-aurora-muted hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Social Login */}
                <div className="mb-6 space-y-3">
                    <button
                        onClick={async () => {
                            try {
                                await signInWithGoogle();
                                onClose(); // Usually redirects, but good UX to close if pop-up
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                        className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-aurora-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background-light text-aurora-muted">Or continue with email</span>
                        </div>
                    </div>
                </div>

                {/* Toggle */}
                <div className="flex gap-2 mb-6 p-1 bg-background-dark rounded-xl">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all ${mode === 'login'
                            ? 'bg-primary text-white'
                            : 'text-aurora-muted hover:text-white'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all ${mode === 'signup'
                            ? 'bg-primary text-white'
                            : 'text-aurora-muted hover:text-white'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-aurora-muted" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-background-dark border border-aurora-border rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-aurora-muted focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-aurora-muted" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full bg-background-dark border border-aurora-border rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-aurora-muted focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-aurora-secondary py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="animate-spin">∫</span>
                        ) : mode === 'login' ? (
                            <>
                                <LogIn size={18} />
                                Log In
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-aurora-muted text-sm mt-6">
                    {mode === 'login'
                        ? "Don't have an account? "
                        : "Already have an account? "}
                    <button
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-primary hover:underline"
                    >
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
