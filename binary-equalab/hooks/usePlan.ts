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
            const token = localStorage.getItem('sb-access-token'); // Or however auth token is stored, assuming supabase handling
            // Actually, request to backend needs Auth header if using @get_current_user depending on implementation.
            // Assuming the backend auth middleware handles the Supabase token passed in headers.

            // We need to get the session from supabase client if possible, or just assume the cookie/header logic if on same domain (unlikely if separate backend).
            // For now, let's try a direct fetch. The backend likely expects an Authorization header with the Bearer token.

            const { data: { session } } = await (import('../contexts/AuthContext').then(m => m.supabase.auth.getSession()));

            if (!session) return;

            const response = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000'}/api/plan/status`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch plan');

            const data = await response.json();
            setPlanStatus(data);
        } catch (err: any) {
            console.error("Plan fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    return { planStatus, loading, error, refreshPlan: fetchPlan };
};
