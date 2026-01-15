import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";

export default function InstagramSuccess() {
    const { clientId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    let connected = searchParams.get("connected");

    // Fallback detection from path if param is missing
    if (!connected) {
        if (location.pathname.includes("/linkedin/")) connected = "linkedin";
        else if (location.pathname.includes("/instagram/")) connected = "instagram";
    }

    const profileId = searchParams.get("profileId");
    const username = searchParams.get("username");

    // Map platform slugs to IDs
    const PLATFORM_MAP: Record<string, number> = {
        'instagram': 1,
        'linkedin': 2
    };

    // Auto-activate integration logic would ideally happen here if we knew the ID
    // But since we don't know the integration ID easily from URL (only client and profile),
    // we rely on the Profile page to auto-activate "inactive" integrations when user returns there.
    // HOWEVER, the user request says: "Só depois que voltar do backurl que ele faz o patch pra active"
    // This implies THIS page or the return action should do it.
    // If the Profile page logic already does "Auto-activate if inactive", then redirecting to Profile is enough.
    // BUT checking the Profile page logic, it does: find inactive -> activate. 
    // So simply landing back on Profile page will trigger the activation.

    // Update: User said "o status da conexão deve ser atualizado com o back_url... Se tiver inative coloca active".
    // This page IS the back_url destination.
    // So let's try to activate here visually or just rely on the navigate back to profile.

    // Let's implement robust activation here if possible, searching by client/platform
    useEffect(() => {
        const activate = async () => {
            if (clientId && connected && profileId) {
                const platformId = PLATFORM_MAP[connected.toLowerCase()];
                if (!platformId) return;

                try {
                    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";
                    // 1. Find the integration for this client
                    const listRes = await fetch(`/api/v1/post/platform-integration/list/?client_id=${clientId}`, {
                        headers: { Authorization: API_KEY },
                    });

                    if (listRes.ok) {
                        const data = await listRes.json();

                        // Find latest inactive integration for this platform
                        // Sort by ID desc to get the most recent attempt
                        const integration = data
                            .filter((i: any) => i.platform === platformId && i.client === Number(clientId) && i.status === 'inactive')
                            .sort((a: any, b: any) => b.id - a.id)[0];

                        if (integration) {
                            // 2. Activate
                            await fetch(`/api/v1/post/platform-integration/update/${integration.id}/`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: API_KEY
                                },
                                body: JSON.stringify({ status: "active", profile_id: profileId })
                            });
                        }
                    }
                } catch (e) {
                    console.error("Activation failed", e);
                }
            }
        };
        activate();
    }, [clientId, connected, profileId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <PageMeta title="Conexão Realizada | Miggo" description="Status da conexão social" />

            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg dark:bg-gray-800 text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full dark:bg-green-900/20">
                    <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">
                    Conexão realizada com sucesso!
                </h2>

                <p className="mb-6 text-gray-600 dark:text-gray-300">
                    O perfil <strong>@{username || "usuário"}</strong> foi conectado.
                </p>

                <div className="space-y-3">
                    <Button className="w-full justify-center" onClick={() => navigate("/profile")}>
                        Voltar para o Perfil
                    </Button>
                    <Button variant="outline" className="w-full justify-center" onClick={() => navigate("/content")}>
                        Ir para Conteúdos
                    </Button>
                </div>
            </div>
        </div>
    );
}
