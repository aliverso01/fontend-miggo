import { useState, useEffect, useCallback } from 'react';

interface Subscription {
    id: number;
    client: number;
    plan_price: number | { id: number;[key: string]: any };
    start_date: string;
    end_date: string;
    expires_at: string;
    trial: boolean;
    status: string; // 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
    plan_meta: {
        id: number;
        key: string;
        value: string;
        plan: number;
    }[];
}

export const useSubscription = (clientId: number | undefined | null) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const fetchSubscription = useCallback(async () => {
        if (!clientId) {
            setSubscription(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/v1/subscription/list/?client_id=${clientId}`, {
                credentials: 'include',
                headers: {
                    'Authorization': API_KEY
                }
            });

            if (!response.ok) {
                setSubscription(null);
                return;
            }

            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                // Prioridade: ACTIVE > TRIAL > qualquer outra
                const activeSub = data.find((s: Subscription) => s.status === 'ACTIVE')
                    || data.find((s: Subscription) => s.status === 'TRIAL')
                    || data[0];
                setSubscription(activeSub);
            } else {
                setSubscription(null);
            }
        } catch (err: any) {
            console.error("Error fetching subscription:", err);
            setError(err.message);
            setSubscription(null);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    // Trial expirado = é trial, mas expires_at já passou
    const isTrialExpired = !!(
        subscription?.trial &&
        subscription.status === 'TRIAL' &&
        new Date(subscription.expires_at) < new Date()
    );

    const hasActiveSubscription = !!(
        subscription &&
        (subscription.status === 'ACTIVE' ||
            (subscription.status === 'TRIAL' && !isTrialExpired))
    );

    return {
        subscription,
        loading,
        error,
        hasActiveSubscription,
        isTrialExpired,
        checkSubscription: fetchSubscription
    };
};
