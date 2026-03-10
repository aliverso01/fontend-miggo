import { useState, useEffect } from "react";
import Button from "../ui/button/Button";
import { useAuthContext } from "../../context/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { Link } from "react-router";
import Select from "../form/Select";
import Label from "../form/Label";

interface Client {
    id: number;
    name: string;
    user: number;
}

interface SocialNetwork {
    id: number;
    name: string;
    description: string;
    active: boolean;
}

interface Integration {
    id: number;
    platform: number;
    client: number;
    status: string;
    profile_id?: string;
    connection_url?: string;
}

interface SocialConnectionsProps {
    /** Quando fornecido, usa diretamente esse client_id sem buscar lista de clientes */
    clientId?: number;
}

// ─── Ícones ──────────────────────────────────────────────────────────────────

const InstagramIcon = () => (
    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#285AEB] text-white shadow-sm">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    </div>
);

const LinkedInIcon = () => (
    <div className="flex items-center justify-center w-12 h-12 bg-[#0077B5] rounded-full text-white shadow-sm">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
    </div>
);

const WhatsAppIcon = () => (
    <div className="flex items-center justify-center w-12 h-12 bg-[#25D366] rounded-full text-white shadow-sm">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
    </div>
);

function PlatformIcon({ name }: { name: string }) {
    const n = name.toLowerCase();
    if (n.includes("instagram")) return <InstagramIcon />;
    if (n.includes("linkedin")) return <LinkedInIcon />;
    if (n.includes("whatsapp")) return <WhatsAppIcon />;
    return (
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full dark:bg-gray-800">
            <span className="font-bold text-gray-500">{name.substring(0, 2)}</span>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SocialConnections({ clientId: clientIdProp }: SocialConnectionsProps) {
    const { user } = useAuthContext();
    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<number | "">(clientIdProp ?? "");
    const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState<number | null>(null);

    /** Quando clientId vem por prop, não precisamos mostrar o seletor */
    const externalClientId = clientIdProp !== undefined;

    const { hasActiveSubscription, subscription, loading: subLoading } = useSubscription(
        selectedClient ? Number(selectedClient) : null
    );

    // ── Carrega clientes (só quando não há prop de clientId) ──────────────────
    useEffect(() => {
        if (externalClientId) {
            // clientId veio por prop — não precisamos buscar lista
            setSelectedClient(clientIdProp!);
            return;
        }

        const fetchClients = async () => {
            try {
                const response = await fetch("/api/v1/client/list/", {
                    headers: { Authorization: API_KEY },
                });
                if (response.ok) {
                    let data: Client[] = await response.json();
                    if (user?.role === "client") {
                        data = data.filter(c => c.user === user.id);
                    }
                    setClients(data);
                    if (data.length > 0) setSelectedClient(data[0].id);
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };

        if (user) fetchClients();
    }, [user, clientIdProp]);

    // ── Carrega redes sociais ──────────────────────────────────────────────────
    useEffect(() => {
        const fetchSocialNetworks = async () => {
            try {
                const response = await fetch("/api/v1/post/social-network/list/", {
                    headers: { Authorization: API_KEY },
                });
                if (response.ok) {
                    setSocialNetworks(await response.json());
                } else {
                    setSocialNetworks([
                        { id: 1, name: "Instagram", description: "Conecte sua conta do Instagram Business", active: true },
                        { id: 2, name: "LinkedIn", description: "Conecte sua conta do LinkedIn Company", active: true },
                    ]);
                }
            } catch {
                setSocialNetworks([
                    { id: 1, name: "Instagram", description: "Conecte sua conta do Instagram Business", active: true },
                    { id: 2, name: "LinkedIn", description: "Conecte sua conta do LinkedIn Company", active: true },
                ]);
            }
        };

        if (user) fetchSocialNetworks();
    }, [user]);

    // ── Carrega integrações ao mudar de cliente ───────────────────────────────
    useEffect(() => {
        if (selectedClient) checkIntegrationStatus();
    }, [selectedClient]);

    const [verifyingWhatsApp, setVerifyingWhatsApp] = useState<number | null>(null);
    const [verificationCode, setVerificationCode] = useState("");

    const checkIntegrationStatus = async () => {
        if (!selectedClient) return;
        try {
            const response = await fetch(
                `/api/v1/post/platform-integration/list/?client=${selectedClient}`,
                { headers: { Authorization: API_KEY } }
            );
            if (response.ok) {
                const data: Integration[] = await response.json();
                setIntegrations(data);

                // Auto-ativa integrações pendentes (exceto as que estão aguardando código de verificação)
                data.forEach(async (integration) => {
                    const isWhatsApp = socialNetworks.find(n => n.id === integration.platform)?.name.toLowerCase().includes("whatsapp");
                    const isPendingVerification = integration.connection_url?.startsWith("pending_code:");

                    if (integration.status === "inactive" && !(isWhatsApp && isPendingVerification)) {
                        await activateIntegration(integration.id);
                    }
                });
            }
        } catch (error) {
            console.error("Error checking integration status:", error);
        }
    };

    const activateIntegration = async (id: number) => {
        try {
            const response = await fetch(`/api/v1/post/platform-integration/update/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: API_KEY },
                body: JSON.stringify({ status: "active" }),
            });
            if (response.ok) {
                const updated = await response.json();
                setIntegrations(prev => prev.map(p => (p.id === id ? updated : p)));
            }
        } catch (error) {
            console.error("Failed to activate integration", error);
        }
    };

    // ── Conectar WhatsApp (ManyChat) ──────────────────────────────────────────
    const handleConnectWhatsApp = async (platformId: number) => {
        if (!selectedClient) { alert("Por favor, selecione um cliente."); return; }
        setLoading(platformId);
        try {
            const response = await fetch("/api/v1/post/platform-integration/whatsapp/create/", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: API_KEY },
                body: JSON.stringify({ client: Number(selectedClient), platform: platformId }),
            });
            const data = await response.json().catch(() => ({}));

            if (response.status === 202) {
                setVerifyingWhatsApp(platformId);
                alert(data.message || "Insira o código enviado para o seu WhatsApp.");
            } else if (response.ok) {
                await checkIntegrationStatus();
                alert("WhatsApp conectado! As notificações estão habilitadas.");
            } else {
                alert(data.error || "Erro ao conectar o WhatsApp.");
            }
        } catch {
            alert("Erro ao conectar o WhatsApp.");
        } finally {
            setLoading(null);
        }
    };

    // ── Verificar Código WhatsApp ─────────────────────────────────────────────
    const handleVerifyWhatsAppCode = async (platformId: number) => {
        if (!selectedClient || !verificationCode) return;
        setLoading(platformId);
        try {
            const response = await fetch("/api/v1/post/platform-integration/whatsapp/verify/", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: API_KEY },
                body: JSON.stringify({
                    client: Number(selectedClient),
                    platform: platformId,
                    code: verificationCode
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                alert("WhatsApp verificado com sucesso!");
                setVerifyingWhatsApp(null);
                setVerificationCode("");
                await checkIntegrationStatus();
            } else {
                alert(data.error || "Código inválido.");
            }
        } catch {
            alert("Erro ao verificar código.");
        } finally {
            setLoading(null);
        }
    };

    // ── Conectar rede social (Late.dev) ───────────────────────────────────────
    const handleConnectSocial = async (platformId: number) => {
        if (!selectedClient) { alert("Por favor, selecione um cliente."); return; }
        setLoading(platformId);
        try {
            const response = await fetch("/api/v1/post/platform-integration/create/", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: API_KEY },
                body: JSON.stringify({
                    profile_id: "",
                    status: "inactive",
                    connection_url: "",
                    client: Number(selectedClient),
                    platform: platformId,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                const targetUrl = data.connection_url || data.redirect_url;
                if (targetUrl) {
                    window.location.href = targetUrl;
                } else {
                    alert("Erro: URL de conexão não retornada.");
                }
            } else {
                const err = await response.json().catch(() => ({}));
                alert(err.error || "Erro ao iniciar conexão.");
            }
        } catch {
            alert("Erro ao conectar.");
        } finally {
            setLoading(null);
        }
    };

    // ── Desconectar ───────────────────────────────────────────────────────────
    const handleDisconnect = async (integrationId: number | undefined) => {
        if (!selectedClient || !integrationId) return;
        if (!confirm("Tem certeza que deseja desconectar esta conta?")) return;
        setLoading(integrationId);
        try {
            const response = await fetch(`/api/v1/post/platform-integration/delete/${integrationId}/`, {
                method: "DELETE",
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                setIntegrations(prev => prev.filter(p => p.id !== integrationId));
            } else {
                alert("Erro ao desconectar.");
            }
        } catch {
            alert("Erro ao desconectar.");
        } finally {
            setLoading(null);
        }
    };

    // ── Separação lógica ──────────────────────────────────────────────────────
    const whatsappNetworks = socialNetworks.filter(n => n.name.toLowerCase().includes("whatsapp"));
    const postingNetworks = socialNetworks.filter(n => !n.name.toLowerCase().includes("whatsapp"));
    const noSubscription = selectedClient && !subLoading && !hasActiveSubscription;

    // ── Verificação do plano para limitar integrações ─────────────────────────
    const planName = ((subscription?.plan_price as any)?.plan_name || '').toLowerCase();
    const allowedNetworks = planName.includes('instagram + linkedin')
        ? ['instagram', 'linkedin']
        : planName.includes('instagram')
            ? ['instagram']
            : planName.includes('linkedin')
                ? ['linkedin']
                : [];

    return (
        <div className="flex flex-col gap-6">

            {/* Seletor de cliente — só aparece se NÃO foi passado clientId por prop */}
            {!externalClientId && user?.role === "admin" && (
                <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                    <Label>Cliente</Label>
                    <div className="max-w-md mt-2">
                        <Select
                            options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                            placeholder="Selecione um cliente"
                            onChange={(val) => setSelectedClient(Number(val))}
                            defaultValue={String(selectedClient)}
                            disabled={clients.length === 0}
                        />
                    </div>
                </div>
            )}

            {/* ─── Redes Sociais (postagem via Late.dev) ─── */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Redes Sociais</h4>
                </div>
                <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                    Conecte suas contas para agendar e publicar conteúdo.
                </p>

                {noSubscription ? (
                    <div className="p-6 text-center border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div className="mb-3 text-brand-500 dark:text-brand-400">
                            <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h5 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Assinatura Necessária</h5>
                        <p className="mb-5 text-gray-500 dark:text-gray-400">
                            Para conectar suas redes sociais, você precisa de uma assinatura ativa.
                        </p>
                        <Link to="/plans"><Button>Ver Planos</Button></Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {postingNetworks.map((network) => {
                            const integration = integrations.find(i => i.platform === network.id);
                            const isConnected = integration?.status === "active";
                            const isLoading = loading === network.id;
                            const isAllowed = allowedNetworks.includes(network.name.toLowerCase());

                            return (
                                <div
                                    key={network.id}
                                    className={`flex items-center justify-between p-4 border border-gray-200 rounded-xl dark:border-gray-800 transition-opacity ${!selectedClient ? "opacity-50 pointer-events-none" : ""}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <PlatformIcon name={network.name} />
                                        <div>
                                            <h5 className="font-medium text-gray-800 dark:text-white/90">{network.name}</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {!isAllowed ? "Disponível em outro plano" : isConnected ? "✓ Conectado — pronto para publicar" : (network.description || `Conecte sua conta do ${network.name}`)}
                                            </p>
                                        </div>
                                    </div>
                                    {!isAllowed ? (
                                        <Button size="sm" variant="outline" disabled={true} className="opacity-50">
                                            Não habilitado
                                        </Button>
                                    ) : isConnected ? (
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/30 dark:hover:bg-red-900/20" onClick={() => handleDisconnect(integration?.id)} disabled={isLoading}>
                                            {isLoading ? "..." : "Desconectar"}
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={() => handleConnectSocial(network.id)} disabled={isLoading || !selectedClient}>
                                            {isLoading ? "Conectando..." : "Conectar"}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                        {postingNetworks.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">Nenhuma rede social de postagem configurada.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ─── WhatsApp (notificações via ManyChat) ─── */}
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">WhatsApp</h4>
                </div>
                <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                    O WhatsApp é usado exclusivamente para enviar notificações e aprovações de conteúdo.
                </p>

                <div className="flex flex-col gap-3">
                    {whatsappNetworks.map((network) => {
                        const integration = integrations.find(i => i.platform === network.id);
                        const isConnected = integration?.status === "active";
                        const isLoading = loading === network.id;
                        const isVerifying = verifyingWhatsApp === network.id || integration?.connection_url?.startsWith("pending_code:");

                        return (
                            <div key={network.id} className="flex flex-col gap-4 p-4 border border-[#25D366]/30 rounded-xl bg-[#25D366]/5 dark:bg-[#25D366]/10 dark:border-[#25D366]/20 transition-opacity">
                                <div
                                    className={`flex items-center justify-between ${!selectedClient ? "opacity-50 pointer-events-none" : ""}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <WhatsAppIcon />
                                        <div>
                                            <h5 className="font-medium text-gray-800 dark:text-white/90">WhatsApp</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {isConnected ? "✓ Notificações habilitadas" : isVerifying ? "Aguardando código de verificação..." : "Habilite notificações e aprovações via WhatsApp"}
                                            </p>
                                        </div>
                                    </div>
                                    {isConnected ? (
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/30 dark:hover:bg-red-900/20" onClick={() => handleDisconnect(integration?.id)} disabled={isLoading}>
                                            {isLoading ? "..." : "Desconectar"}
                                        </Button>
                                    ) : !isVerifying ? (
                                        <Button size="sm" className="bg-[#25D366] hover:bg-[#128C5E] border-[#25D366] text-white" onClick={() => handleConnectWhatsApp(network.id)} disabled={isLoading || !selectedClient}>
                                            {isLoading ? "Conectando..." : "Habilitar Notificações"}
                                        </Button>
                                    ) : null}
                                </div>

                                {/* Campo de verificação */}
                                {isVerifying && !isConnected && (
                                    <div className="flex flex-col gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-[#25D366]/20">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Um código de ativação foi enviado para o WhatsApp do cliente. Insira-o abaixo:
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                className="flex-1 px-3 py-2 text-sm text-center font-mono tracking-widest bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                            />
                                            <Button size="sm" onClick={() => handleVerifyWhatsAppCode(network.id)} disabled={loading === network.id || verificationCode.length < 6}>
                                                {loading === network.id ? "..." : "Verificar"}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => { setVerifyingWhatsApp(null); handleDisconnect(integration?.id); }}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {whatsappNetworks.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">WhatsApp não está configurado como plataforma.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
