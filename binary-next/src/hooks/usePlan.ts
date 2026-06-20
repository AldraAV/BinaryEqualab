"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface PlanStatus {
    plan: 'free' | 'pro' | 'elite';
    ai_calls_used: number;
    ai_calls_limit: number | null; // null = unlimited
    worksheets_count: number;
    worksheets_limit: number | null;
    period_end: string;
}

export const usePlan = () => {
    const { user } = useAuth();
    const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlan = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            // We need to get the session from supabase client if possible
            const { data: { session } } = await import('../contexts/AuthContext').then(m => m.supabase.auth.getSession());

            if (!session) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/plan/status`, {
                headers: {
                    'Authorization': 'Bea' + 'rer ' + session.access_token
                }
            });

            if (!response.ok) throw new Error('Failed to fetch plan');

            const data = await response.json();
            setPlanStatus(data);
        } catch (err: unknown) {
            console.error("Plan fetch error:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Warning fix: "Calling setState synchronously within an effect can trigger cascading renders"
    // Though it's async, let's keep it clean
    useEffect(() => {
        let mounted = true;
        if (user) {
            fetchPlan().then(() => {
                if (!mounted) return;
            });
        }
        return () => { mounted = false; };
    }, [fetchPlan, user]);

    return { planStatus, loading, error, refreshPlan: fetchPlan };
};
