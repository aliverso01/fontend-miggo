import { useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/authHook";
import { useClient } from "../hooks/useClient";
import { useSubscription } from "../hooks/useSubscription";
import { useEffect } from "react";


export default function SubscriptionGuard() {
    const { user, loading: authLoading } = useAuth();
    const { clientId, loading: clientLoading } = useClient();
    const { hasActiveSubscription, loading: subLoading, checkSubscription } = useSubscription(clientId);
    const location = useLocation();

    // Re-checar assinatura ao mudar de rota, caso ainda não tenha uma ativa
    // Isso garante que após assinar e navegar, o guard perceba a mudança
    useEffect(() => {
        if (!hasActiveSubscription && clientId && !authLoading) {
            checkSubscription();
        }
    }, [location.pathname, clientId, hasActiveSubscription, authLoading, checkSubscription]);

    // Se ainda carregando auth ou info do cliente/sub, mostramos loader
    if (authLoading || (user?.role === "client" && (clientLoading || subLoading))) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                <span className="ml-3 text-gray-400">Verificando plano...</span>
            </div>
        );
    }

    // Se o usuário não for do tipo 'client' (ex: admin ou editor), não restringimos por plano por enquanto
    if (user?.role !== "client") {
        return <Outlet />;
    }


    // Se não tem assinatura ativa/trial e não está em uma rota pública de assinatura, permitimos o acesso ao dashboard
    // mas não forçamos mais o redirecionamento. Deixamos a lógica de UI gerenciar o que o usuário pode ver sem plano.
    // if (!hasActiveSubscription && !isPublicRoute) {
    //     return <Navigate to="/plans" state={{ from: location.pathname }} replace />;
    // }

    return <Outlet />;
}
