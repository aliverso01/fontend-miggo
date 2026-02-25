import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthContext } from '../../context/AuthContext';

import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Button from '../../components/ui/button/Button';


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

export interface SubscriptionPayload {
    client_id: number;
    plan_price: number;
    start_date: string;
    end_date: string;
    expires_at: string;
    trial: boolean;
    status: string;
}

export default function Plans() {
    const { user } = useAuthContext();
    const [clientId, setClientId] = useState<number | null>(null);

    // const { subscription, hasActiveSubscription } = useSubscription(clientId); // Not needed anymore

    // Fetch Client ID for the current user
    useEffect(() => {
        const fetchClient = async () => {
            if (user?.role === 'client') {
                try {
                    const response = await fetch("/api/v1/client/list/", {
                        headers: { Authorization: import.meta.env.VITE_MIGGO_API_KEY },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const myClient = data.find((c: any) => c.user === user.id);
                        if (myClient) setClientId(myClient.id);
                    }
                } catch (e) {
                    console.error("Failed to fetch client for user", e);
                }
            } else if (user?.role === 'admin') {
                // Determine logic for admin? Maybe query param?
                // For now, focusing on Client role restriction
            }
        };
        fetchClient();
    }, [user]);

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedInterval, setSelectedInterval] = useState<string>('Semestral');

    // Using the same API Key pattern found in ClientsList.tsx
    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // The URL provided is absolute localhost, we can use relative if proxy is set up, 
                // but ClientsList used relative /api/v1... while prompt gave import.meta.env.VITE_API_BASE_URL...
                // I will use relative path /api/v1/subscription/plan/list/ assuming proxy exists
                // If not, I will revert to full URL. ClientsList uses /api/v1/...

                const response = await fetch('/api/v1/subscription/plan/list/', {
                    headers: {
                        'Authorization': API_KEY
                    }
                });

                if (!response.ok) {
                    // Try full URL if relative fails or just throw
                    throw new Error('Failed to fetch plans');
                }
                const data = await response.json();
                setPlans(data);
            } catch (err: any) {
                console.error("Error fetching plans:", err);
                // Fallback attempt with full URL if relative failed (just in case dev setup differs)
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/subscription/plan/list/`, {
                        headers: {
                            'Authorization': API_KEY
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setPlans(data);
                        setError(null);
                    } else {
                        setError(err.message);
                    }
                } catch (retryErr: any) {
                    setError(retryErr.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const getPrice = (plan: Plan) => {
        const price = plan.price.find(p => p.interval === selectedInterval);
        return price;
    };

    const navigate = useNavigate();

    const handleSubscribe = (plan: Plan) => {
        if (!clientId) {
            alert("Erro: Cliente não identificado. Entre em contato com o suporte.");
            return;
        }

        const priceObj = getPrice(plan);
        if (!priceObj) {
            alert("Erro: Preço indisponível para este plano.");
            return;
        }

        // Check for Stripe Price ID in plan_meta
        let stripePriceId = '';
        if (plan.plan_meta) {
            const meta = plan.plan_meta.find(m => m.key === 'plan_price_id');
            if (meta) stripePriceId = meta.value;
        }

        // Navigate to checkout page with state
        navigate('/subscription/checkout', {
            state: {
                plan: plan,
                interval: selectedInterval,
                stripePriceId: stripePriceId
            }
        });
    };

    if (loading) return (
        <>
            <PageMeta title="Planos | Miggo" description="Escolha o melhor plano para você" />
            <div className="p-6 flex justify-center text-gray-500">Carregando planos...</div>
        </>
    );

    if (error) return (
        <>
            <PageMeta title="Planos | Miggo" description="Escolha o melhor plano para você" />
            <div className="p-6 flex justify-center text-red-500">Erro ao carregar planos: {error}</div>
        </>
    );

    return (
        <>
            <PageMeta title="Planos | Miggo" description="Escolha o melhor plano para você" />
            <PageBreadcrumb pageTitle="Planos de Assinatura" />

            <div className="flex flex-col items-center justify-center space-y-8 p-4">

                <div className="flex flex-col items-center justify-center space-y-8 p-4">

                    {/* Plans List */
                        plans.length > 0 && (
                            <>
                                <div className="flex bg-gray-100 p-1 rounded-full dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05]">
                                    <button
                                        onClick={() => setSelectedInterval('Semestral')}
                                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedInterval === 'Semestral'
                                            ? 'bg-white shadow-sm text-brand-500 dark:bg-gray-800 dark:text-brand-400'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        Semestral
                                    </button>
                                    <button
                                        onClick={() => setSelectedInterval('Trimestral')}
                                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedInterval === 'Trimestral'
                                            ? 'bg-white shadow-sm text-brand-500 dark:bg-gray-800 dark:text-brand-400'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        Trimestral
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
                                    {plans.map((plan) => {
                                        const priceObj = getPrice(plan);

                                        return (
                                            <div key={plan.id} className="relative flex flex-col p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-shadow duration-300">
                                                <div className="mb-4">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                                </div>

                                                <div className="mb-6">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                                            R$ {priceObj ? priceObj.price : '--'}
                                                        </span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide">
                                                            /mês
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex-grow space-y-4 mb-8">
                                                    {plan.features
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((feature) => {
                                                            const parts = feature.feature.split(':');
                                                            const hasBullets = parts.length > 1 && parts[1].includes('.');

                                                            return (
                                                                <div key={feature.id} className="flex items-start gap-3">
                                                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mt-0.5">
                                                                        <svg className="w-3 h-3 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                                        {hasBullets ? (
                                                                            <>
                                                                                <span className="font-semibold block mb-1">{parts[0]}:</span>
                                                                                <ul className="list-disc pl-4 space-y-1">
                                                                                    {parts[1].split('.').filter(item => item.trim().length > 0).map((item, idx) => (
                                                                                        <li key={idx} className="pl-1">{item.trim()}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            </>
                                                                        ) : (
                                                                            feature.feature
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>

                                                <Button className="w-full justify-center" onClick={() => handleSubscribe(plan)}>
                                                    Assinar Agora
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                </div>
            </div>
        </>
    );
}
