/**
 * Binary EquaLab - Auth Context & Service
 * 
 * Provides authentication state and methods throughout the app.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://sabkqxdnefbspmkglezb.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8Ek4wCcZ15NtsUPncgfvSg_1FGLEuSF';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Types
interface AuthContextType {
    user: SupabaseUser | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
    signInWithGoogle: () => Promise<{ data: any; error: any }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
    };

    const signIn = async (email: string, password: string) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signInWithGoogle = async () => {
        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// Hook
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
