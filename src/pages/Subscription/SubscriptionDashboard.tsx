import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plan } from './Plans';
import Button from '../../components/ui/button/Button';
import { useInvoices } from '../../hooks/useInvoices';
import InvoiceList from '../../components/Subscription/InvoiceList';

interface SubscriptionDashboardProps {
    subscription: any;
    plans: Plan[];
}

export default function SubscriptionDashboard({ subscription, plans }: SubscriptionDashboardProps) {
    const navigate = useNavigate();
    const [canceling, setCanceling] = useState(false);
    const { invoices, loading: loadingInvoices, error: errorInvoices } = useInvoices(subscription.client);

    // Identify current plan
    const priceId = (typeof subscription.plan_price === 'object' && subscription.plan_price !== null)
        ? (subscription.plan_price as any).id
        : subscription.plan_price as number;

    let currentPlan: Plan | undefined;
    let currentPrice: any;

    for (const p of plans) {
        const price = p.price.find(pr => pr.id === priceId);
        if (price) {
            currentPlan = p;
            currentPrice = price;
            break;
        }
    }

    const handleCancel = async () => {
        if (!confirm("Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso aos recursos premium ao final do período atual.")) return;

        setCanceling(true);
        try {
            // Updated to use relative path for proxy
            const response = await fetch('/api/v1/subscription/cancel/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': import.meta.env.VITE_MIGGO_API_KEY
                },
                body: JSON.stringify({ subscription_id: subscription.id })
            });

            if (response.ok) {
                alert("Assinatura cancelada com sucesso.");
                window.location.reload(); // Simple reload to refresh state
            } else {
                alert("Erro ao cancelar assinatura. Tente novamente ou contate o suporte.");
            }
        } catch (error) {
            console.error("Cancel Error:", error);
            alert("Erro de conexão.");
        } finally {
            setCanceling(false);
        }
    };

    const handleManagePayment = () => {
        // Check for Stripe Price ID in plan_meta or currentPlan
        let stripePriceId = '';
        const metaSource = subscription.plan_meta || currentPlan?.plan_meta;
        if (metaSource) {
            const meta = metaSource.find((m: any) => m.key === 'plan_price_id');
            if (meta) stripePriceId = meta.value;
        }

        if (currentPlan && stripePriceId) {
            navigate('/subscription/checkout', {
                state: {
                    plan: currentPlan,
                    interval: currentPrice?.interval || 'Mensal',
                    stripePriceId: stripePriceId
                }
            });
        } else {
            alert("Redirecionando para portal de pagamento...");
            // If we had a portal URL from backend, we would use it here.
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Assinatura</h2>
                        <p className="text-gray-500">Detalhes do seu plano atual e pagamentos.</p>
                    </div>
                    <span className={`mt-4 md:mt-0 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${subscription.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        subscription.status === 'trial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {subscription.trial ? 'Trial' : subscription.status.toUpperCase()}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Plano Atual</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {currentPlan ? currentPlan.name : 'Plano Desconhecido'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {currentPrice ? `R$ ${currentPrice.price} / ${currentPrice.interval}` : ''}
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Próxima Cobrança</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {new Date(subscription.expires_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Renovação automática
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Método de Pagamento</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            •••• •••• •••• 4242
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Stripe Secure Payment</p>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col sm:flex-row gap-4">
                    {subscription.trial && (
                        <Button className="flex-1 justify-center bg-green-600 hover:bg-green-700 text-white" onClick={handleManagePayment}>
                            Efetivar Assinatura (Pagar Agora)
                        </Button>
                    )}

                    {!subscription.trial && (
                        <Button variant="outline" className="flex-1 justify-center" onClick={() => alert("Funcionalidade de alterar plano em breve.")}>
                            Alterar Plano
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        className="flex-1 justify-center border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                        onClick={handleCancel}
                        disabled={canceling}
                    >
                        {canceling ? 'Cancelando...' : 'Cancelar Assinatura'}
                    </Button>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Histórico de Faturas</h3>
                <InvoiceList invoices={invoices} loading={loadingInvoices} error={errorInvoices} />
            </div>
        </div>
    );
}
