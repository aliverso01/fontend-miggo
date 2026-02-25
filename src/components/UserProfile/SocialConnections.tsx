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

export default function SocialConnections() {
    const { user } = useAuthContext();
    const [clients, setClients] = useState<Client[]>([]);
    const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>([]);
    const [selectedClient, setSelectedClient] = useState<number | "">("");
    const [loading, setLoading] = useState(false);

    // Subscription Check
    const { hasActiveSubscription, loading: subLoading } = useSubscription(selectedClient ? Number(selectedClient) : null);

    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const [integrations, setIntegrations] = useState<any[]>([]);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await fetch("/api/v1/client/list/", {
                    headers: { Authorization: API_KEY },
                });
                if (response.ok) {
                    let data: Client[] = await response.json();
                    if (user?.role === 'client') {
                        data = data.filter(c => c.user === user.id);
                    }
                    setClients(data);
                    if (data.length > 0) {
                        setSelectedClient(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };

        const fetchSocialNetworks = async () => {
            try {
                const response = await fetch("/api/v1/post/social-network/list/", {
                    headers: { Authorization: API_KEY },
                });
                if (response.ok) {
                    const data = await response.json();
                    setSocialNetworks(data);
                } else {
                    // Fallback manual list
                    setSocialNetworks([
                        { id: 1, name: "Instagram", description: "Conecte sua conta do Instagram Business", active: true },
                        { id: 2, name: "LinkedIn", description: "Conecte sua conta do LinkedIn Company", active: true }
                    ]);
                }
            } catch (error) {
                console.error("Error fetching social networks:", error);
                setSocialNetworks([
                    { id: 1, name: "Instagram", description: "Conecte sua conta do Instagram Business", active: true },
                    { id: 2, name: "LinkedIn", description: "Conecte sua conta do LinkedIn Company", active: true }
                ]);
            }
        };

        if (user) {
            fetchClients();
            fetchSocialNetworks();
        }
    }, [user]);

    useEffect(() => {
        if (selectedClient) {
            checkIntegrationStatus();
        }
    }, [selectedClient]);

    const checkIntegrationStatus = async () => {
        if (!selectedClient) return;
        try {
            const response = await fetch(`/api/v1/post/platform-integration/list/?client_id=${selectedClient}`, {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setIntegrations(data);

                // Auto-activate logic for any inactive integration found
                data.forEach(async (integration: any) => {
                    if (integration.status === 'inactive') {
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
                headers: {
                    "Content-Type": "application/json",
                    Authorization: API_KEY
                },
                body: JSON.stringify({ status: "active" })
            });

            if (response.ok) {
                const updated = await response.json();
                setIntegrations(prev => prev.map(p => p.id === id ? updated : p));
            }
        } catch (error) {
            console.error("Failed to activate integration", error);
        }
    };

    const handleConnect = async (platformId: number) => {
        if (!selectedClient) {
            alert("Por favor, selecione um cliente.");
            return;
        }

        setLoading(true);
        try {
            // Check if integration already exists
            const checkResponse = await fetch(`/api/v1/post/platform-integration/list/?client_id=${selectedClient}`, {
                headers: { Authorization: API_KEY },
            });

            if (checkResponse.ok) {
                const existingList = await checkResponse.json();
                const exists = existingList.find((i: any) => i.platform === platformId && i.client === Number(selectedClient));

                if (exists) {
                    alert("Uma integração já existe para esta plataforma/cliente.");
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                profile_id: "",
                status: "inactive",
                connection_url: "",
                client: Number(selectedClient),
                platform: platformId
            };

            const response = await fetch("/api/v1/post/platform-integration/create/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: API_KEY
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Connect response data:", data);

                // Prioritize connection_url, fallback to redirect_url (e.g. for WhatsApp)
                let targetUrl = data.connection_url || data.redirect_url;

                // Manual fallback for WhatsApp if URL is missing but creation succeeded
                if (!targetUrl) {
                    const network = socialNetworks.find(n => n.id === platformId);
                    if (network?.name.toLowerCase().includes('whatsapp')) {
                        // Construct success URL manually
                        // We pass 'whatsapp' as connected param and a dummy profileId/username if not returned
                        const pId = data.profile_id || "whatsapp_user";
                        const pName = data.username || "WhatsApp User";
                        targetUrl = `/whatsapp/success/${selectedClient}?connected=whatsapp&profileId=${pId}&username=${encodeURIComponent(pName)}`;
                    }
                }

                if (targetUrl) {
                    window.location.href = targetUrl;
                } else {
                    console.error("Missing URL in response:", data);
                    alert("Erro: URL de conexão não retornada.");
                }
            } else {
                console.error(await response.text());
                alert("Erro ao iniciar conexão.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao conectar."); ''
        } finally {
            setLoading(false);
        }
    };

    const getIconForPlatform = (name: string) => {
        const n = name.toLowerCase();

        if (n.includes("instagram")) {
            return (
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#285AEB] text-white shadow-sm transition-transform hover:scale-105">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                </div>
            );
        } else if (n.includes("linkedin")) {
            return (
                <div className="flex items-center justify-center w-12 h-12 bg-[#0077B5] rounded-full text-white shadow-sm transition-transform hover:scale-105">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                </div>
            );
        } else if (n.includes("whatsapp")) {
            return (
                <div className="flex items-center justify-center w-12 h-12 bg-[#25D366] rounded-full text-white shadow-sm transition-transform hover:scale-105">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full dark:bg-gray-800">
                <span className="font-bold text-gray-500">{name.substring(0, 2)}</span>
            </div>
        );
    };

    const handleDisconnect = async (integrationId: number | undefined) => {
        if (!selectedClient || !integrationId) return;

        if (!confirm("Tem certeza que deseja desconectar esta conta?")) return;

        setLoading(true);
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
        } catch (error) {
            console.error("Error disconnecting:", error);
            alert("Erro ao desconectar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
                Conexões Sociais
            </h4>
            {user?.role === "admin" && (
                <div className="mb-6">
                    <Label>Cliente</Label>
                    <div className="max-w-md">
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

            <div className="flex flex-col gap-4">
                {selectedClient && !subLoading && !hasActiveSubscription ? (
                    <div className="p-6 text-center border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div className="mb-3 text-brand-500 dark:text-brand-400">
                            <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h5 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Assinatura Necessária</h5>
                        <p className="mb-5 text-gray-500 dark:text-gray-400">
                            Para conectar suas redes sociais e utilizar as integrações, você precisa de uma assinatura ativa.
                        </p>
                        <Link to="/plans">
                            <Button>Ver Planos</Button>
                        </Link>
                    </div>
                ) : (
                    socialNetworks.map((network) => {
                        const integration = integrations.find(i => i.platform === network.id);
                        const isConnected = integration?.status === 'active';

                        return (
                            <div key={network.id} className={`flex items-center justify-between p-4 border border-gray-200 rounded-xl dark:border-gray-800 ${!selectedClient ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="flex items-center gap-4">
                                    {getIconForPlatform(network.name)}
                                    <div>
                                        <h5 className="font-medium text-gray-800 dark:text-white/90">{network.name}</h5>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {isConnected ? 'Conectado' : (network.description || `Conecte sua conta do ${network.name}`)}
                                        </p>
                                    </div>
                                </div>
                                {isConnected ? (
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/30 dark:hover:bg-red-900/20" onClick={() => handleDisconnect(integration?.id)} disabled={loading}>
                                        Desconectar
                                    </Button>
                                ) : (
                                    <Button size="sm" onClick={() => handleConnect(network.id)} disabled={loading || !selectedClient}>
                                        {loading ? "..." : "Conectar"}
                                    </Button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
