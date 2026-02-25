import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthContext } from '../../context/AuthContext';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import Button from '../../components/ui/button/Button';
import { Plan } from './Plans';

export default function Checkout() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(false);

    // Provide default values or redirect if state is missing
    const plan: Plan = state?.plan;
    const interval: string = state?.interval;
    const priceObj = plan?.price.find(p => p.interval === interval);

    useEffect(() => {
        if (!plan || !interval || !priceObj) {
            navigate('/plans');
        }
    }, [plan, interval, priceObj, navigate]);

    if (!plan || !interval || !priceObj) return null;

    const handleCheckout = async () => {
        setLoading(true);
        try {
            // NOTE: Ideally you should fetch the client ID here or pass it in state if needed by backend.
            // Assuming your backend can infer user from Authorization token or you pass client_id.
            // For consistency with Plans.tsx, let's try to pass what's needed.
            // However, typical Stripe Checkout implementation only needs price_id and success/cancel URLs.

            // Prefer Stripe ID if available, otherwise fallback to internal ID if backend supports it
            const stripePriceId = state?.stripePriceId;
            const priceIdPayload = stripePriceId ? stripePriceId : priceObj.id;

            const response = await fetch('/api/v1/subscription/create-checkout-session/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': import.meta.env.VITE_MIGGO_API_KEY // Using same key as Plans.tsx
                },
                body: JSON.stringify({
                    plan_price_id: priceIdPayload, // Using variable which holds Stripe ID if found
                    user_id: user?.id, // Optional, depending on backend logic
                    success_url: window.location.origin + '/subscription/success',
                    cancel_url: window.location.origin + '/subscription/cancel',
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                } else {
                    alert("Erro: URL de checkout não retornada pelo servidor.");
                }
            } else {
                const errorData = await response.json();
                console.error("Checkout Error:", errorData);
                alert("Falha ao iniciar checkout. Tente novamente.");
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageMeta title="Checkout | Miggo" description="Finalize sua assinatura" />
            <PageBreadcrumb pageTitle="Checkout" />

            <div className="flex justify-center p-6">
                <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resumo do Pedido</h2>
                        <p className="text-sm text-gray-500 mt-1">Revise os detalhes antes do pagamento.</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{plan.name}</h3>
                                <span className="text-sm text-gray-500 capitalize">{interval}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-brand-600 dark:text-brand-400">
                                    R$ {priceObj.price}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>R$ {priceObj.price}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                                <span>Taxas</span>
                                <span>R$ 0,00</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-end">
                                <span className="text-base font-bold text-gray-900 dark:text-white">Total a pagar</span>
                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                    R$ {priceObj.price}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Button
                                className="w-full py-4 text-lg justify-center shadow-lg hover:shadow-xl transition-all"
                                onClick={handleCheckout}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processando...
                                    </span>
                                ) : (
                                    <>Ir para Pagamento Seguro (Stripe)</>
                                )}
                            </Button>
                            <p className="text-center text-xs text-gray-400 mt-4">
                                Ambiente seguro. Seus dados estão protegidos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
