import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/authHook";
import { useClient } from "../hooks/useClient";
import { useOnboarding } from "../hooks/useOnboarding";

/**
 * OnboardingGuard — garante que o cliente completa o onboarding antes de acessar o app.
 * Fica entre ProtectedRoute e SubscriptionGuard na hierarquia de rotas.
 * Se o onboarding não estiver completo, redireciona para /onboarding.
 * Usuários admin/staff não são afetados.
 */
export default function OnboardingGuard() {
    const { user, loading: authLoading } = useAuth();
    const { clientId, loading: clientLoading } = useClient();
    const { isComplete, loading: onboardingLoading } = useOnboarding(
        user?.role === 'client' ? clientId : null
    );
    const location = useLocation();

    // Não redirecionar se já está na página de onboarding ou nas páginas de assinatura necessárias pro step 2
    const allowedPaths = [
        '/onboarding',
        '/plans',
        '/subscription/checkout',
        '/subscription/success',
        '/subscription/cancel',
        '/billing'
    ];
    if (allowedPaths.some(p => location.pathname.startsWith(p))) {
        return <Outlet />;
    }

    // Ainda carregando auth — aguardar
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    // Admins e staff não precisam de onboarding
    if (user?.role !== 'client') {
        return <Outlet />;
    }

    // Aguardar carregamento do client e onboarding
    // IMPORTANTE: onboardingLoading inicia true, então nunca vamos redirecionar prematuramente
    if (clientLoading || onboardingLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    <span className="text-sm text-gray-400">Verificando configuração...</span>
                </div>
            </div>
        );
    }

    // Se o onboarding não está completo, redireciona para /onboarding
    if (!isComplete) {
        return <Navigate to="/onboarding" state={{ from: location.pathname }} replace />;
    }

    return <Outlet />;
}
