import { useState, useEffect } from "react";
import Button from "../ui/button/Button";
import { useAuthContext } from "../../context/AuthContext";
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
    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

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
                if (data.connection_url) {
                    window.location.href = data.connection_url;
                } else {
                    alert("Erro: URL de conexão não retornada.");
                }
            } else {
                console.error(await response.text());
                alert("Erro ao iniciar conexão.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao conectar.");
        } finally {
            setLoading(false);
        }
    };

    const getIconForPlatform = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("instagram")) {
            return (
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full dark:bg-pink-900/20">
                    <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.047-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.315 2zm-1.008 5.378c-1.964 0-3.321 1.637-3.321 3.868 0 2.43 1.597 4.12 3.657 4.12 1.83 0 3.178-1.503 3.178-3.793 0-2.583-1.545-4.195-3.514-4.195zm0 6.649c-1.22 0-2.007-1.12-2.007-2.433 0-1.284.81-2.457 2.05-2.457 1.14 0 1.884 1.12 1.884 2.506 0 1.258-.87 2.384-1.927 2.384zm4.84-5.32c-.466 0-.829.351-.829.778 0 .44.339.778.805.778.49 0 .852-.351.852-.778 0-.44-.351-.778-.828-.778z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        } else if (n.includes("linkedin")) {
            return (
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900/20">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
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

            <div className="flex flex-col gap-4">
                {socialNetworks.map((network) => {
                    const integration = integrations.find(i => i.platform === network.id);
                    const isConnected = integration?.status === 'active';

                    return (
                        <div key={network.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl dark:border-gray-800">
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
                })}
            </div>
        </div>
    );
}
