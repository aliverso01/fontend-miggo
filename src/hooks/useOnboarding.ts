import { useState, useEffect, useCallback } from 'react';

export interface OnboardingSteps {
    account_verified: boolean;
    plan_selected: boolean;
    social_connected: boolean;
    brandkit_uploaded: boolean;
}

export interface OnboardingStatus {
    onboarding_step: number;
    is_onboarding_complete: boolean;
    steps: OnboardingSteps;
}

/**
 * Cache simples em memória para evitar race condition entre
 * OnboardingGuard e OnboardingFlow ao navegar após completar o onboarding.
 */
let _cachedStatus: OnboardingStatus | null = null;
let _cachedClientId: number | null = null;

export const clearOnboardingCache = () => {
    _cachedStatus = null;
    _cachedClientId = null;
};

export const useOnboarding = (clientId: number | null | undefined) => {
    const hasClient = !!clientId;

    // Inicializa `loading` como true se temos clientId e ainda não há cache
    const hasCache = _cachedClientId === clientId && _cachedStatus !== null;
    const [status, setStatus] = useState<OnboardingStatus | null>(hasCache ? _cachedStatus : null);
    const [loading, setLoading] = useState(hasClient && !hasCache);
    const [error, setError] = useState<string | null>(null);

    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const fetchStatus = useCallback(async () => {
        if (!clientId) {
            setStatus(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/v1/client/onboarding-status/${clientId}/`, {
                credentials: 'include',
                headers: { Authorization: API_KEY },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch onboarding status');
            }

            const data: OnboardingStatus = await response.json();
            // Atualiza cache
            _cachedStatus = data;
            _cachedClientId = clientId;
            setStatus(data);
        } catch (err: any) {
            console.error('Error fetching onboarding status:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clientId, API_KEY]);

    useEffect(() => {
        // Só busca se não houver cache válido para este clientId
        if (!clientId) return;
        if (_cachedClientId === clientId && _cachedStatus !== null) {
            setStatus(_cachedStatus);
            setLoading(false);
            return;
        }
        fetchStatus();
    }, [fetchStatus, clientId]);

    return {
        status,
        loading,
        error,
        refetch: fetchStatus,
        isComplete: status?.is_onboarding_complete ?? false,
        currentStep: status?.onboarding_step ?? 0,
    };
};
