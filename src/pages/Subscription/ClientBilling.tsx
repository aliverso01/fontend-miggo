import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import SubscriptionDashboard from './SubscriptionDashboard';

export interface Feature {
    id: number;
    feature: string;
    order: number;
    plan: number;
}

export interface Price {
    id: number;
    price: string;
    currency: string;
    interval: string;
    plan: number;
}

export interface Plan {
    id: number;
    name: string;
    features: Feature[];
    price: Price[];
    plan_meta?: {
        id: number;
        key: string;
        value: string;
        plan: number;
    }[];
}

export default function ClientBilling() {
    const { user } = useAuthContext();
    const [clientId, setClientId] = useState<number | null>(null);
    const { subscription } = useSubscription(clientId);
    const [plans, setPlans] = useState<Plan[]>([]);

    // Using the same API Key pattern
    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    // Fetch Client ID for the current user
    useEffect(() => {
        const fetchClient = async () => {
            if (user?.role === 'client') {
                try {
                    const response = await fetch("/api/v1/client/list/", {
                        headers: { Authorization: API_KEY },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const myClient = data.find((c: any) => c.user === user.id);
                        if (myClient) setClientId(myClient.id);
                    }
                } catch (e) {
                    console.error("Failed to fetch client for user", e);
                }
            }
        };
        fetchClient();
    }, [user]);

    // Fetch Plans (needed for SubscriptionDashboard to show plan details)
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch('/api/v1/subscription/plan/list/', {
                    headers: { 'Authorization': API_KEY }
                });

                if (response.ok) {
                    const data = await response.json();
                    setPlans(data);
                } else {
                    // Fallback purely for dev/consistency with Plans.tsx
                    const retryResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/subscription/plan/list/`, {
                        headers: { 'Authorization': API_KEY }
                    });
                    if (retryResponse.ok) {
                        const data = await retryResponse.json();
                        setPlans(data);
                    }
                }
            } catch (err) {
                console.error("Error fetching plans:", err);
            }
        };

        fetchPlans();
    }, []);

    if (!clientId) {
        return <div className="p-6 text-center text-gray-500">Carregando informações do cliente...</div>;
    }

    if (!subscription) {
        return (
            <>
                <PageMeta title="Faturamento | Miggo" description="Gerencie sua assinatura e pagamentos" />
                <PageBreadcrumb pageTitle="Faturamento" />
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma assinatura ativa</h2>
                    <p className="text-gray-500 mb-6">Você ainda não possui uma assinatura ativa.</p>
                    <a href="/plans" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700">
                        Ver Planos
                    </a>
                </div>
            </>
        );
    }

    return (
        <>
            <PageMeta title="Faturamento | Miggo" description="Gerencie sua assinatura e pagamentos" />
            <PageBreadcrumb pageTitle="Faturamento" />

            <div className="flex flex-col items-center justify-center space-y-8 p-4">
                <SubscriptionDashboard subscription={subscription} plans={plans} />
            </div>
        </>
    );
}
