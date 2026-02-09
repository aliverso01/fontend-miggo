import { useState, useEffect, useCallback } from 'react';

interface Subscription {
    id: number;
    client: number;
    plan_price: number | { id: number;[key: string]: any };
    start_date: string;
    end_date: string;
    expires_at: string;
    trial: boolean;
    status: string;
    plan_meta: {
        id: number;
        key: string;
        value: string;
        plan: number;
    }[];
    // Add other fields as needed
}

export const useSubscription = (clientId: number | undefined | null) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

    const fetchSubscription = useCallback(async () => {
        if (!clientId) {
            setSubscription(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/v1/subscription/list/?client_id=${clientId}`, {
                headers: {
                    'Authorization': API_KEY
                }
            });

            if (!response.ok) {
                // If 404 or empty list logic
                setSubscription(null);
                return;
            }

            const data = await response.json();
            // Assuming data is a list, we take the active one
            // We should check for status 'active' or 'trialing'
            // For now, take the first one found or filtering
            if (Array.isArray(data) && data.length > 0) {
                // Sort by ID desc or expiration? Assuming latest is what we want.
                // Or filter by status.
                const activeSub = data.find((s: Subscription) => s.status === 'active' || s.trial);
                setSubscription(activeSub || data[0]); // Fallback to first if explicit active not found but exists
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

    return {
        subscription,
        loading,
        error,
        hasActiveSubscription: !!subscription && (subscription.status === 'active' || subscription.trial === true),
        checkSubscription: fetchSubscription
    };
};
