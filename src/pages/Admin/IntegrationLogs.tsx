import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import PageMeta from "../../components/common/PageMeta";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

interface LogEntry {
    id: number;
    client_detail: any;
    service: string;
    path: string;
    method: string;
    response: any;
    status_code: number;
    created_at: string;
    updated_at: string;
    client: number;
}

interface Client {
    id: number;
    name: string;
}

export default function IntegrationLogs() {
    const { user } = useAuthContext();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>("");
    const [serviceFilter, setServiceFilter] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

    useEffect(() => {
        if (user && user.role !== 'admin') {
            // Basic protection, though route protection is better
            window.location.href = "/";
        }
    }, [user]);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await fetch("/api/v1/client/list/", {
                    headers: { Authorization: API_KEY },
                });
                if (response.ok) {
                    const data = await response.json();
                    setClients(data);
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };
        fetchClients();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = "/api/v1/integration/list/";
            const params = new URLSearchParams();

            if (selectedClient) {
                params.append("client_id", selectedClient);
            }
            if (serviceFilter) {
                params.append("service", serviceFilter);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: { Authorization: API_KEY },
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            } else {
                console.error("Failed to fetch logs");
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchLogs();
    }, []);

    // Fetch on filter change? Or manual button? User request implies standard GET with filters.
    // Let's make it reactive or button based. Reactive is usually nicer for admin panels.
    useEffect(() => {
        fetchLogs();
    }, [selectedClient, serviceFilter]);

    if (user?.role !== 'admin') {
        return <div className="p-6">Acesso negado.</div>;
    }

    return (
        <div className="p-6">
            <PageMeta title="Logs de Integração | Miggo" description="Logs de requisições de integração" />

            <div className="flex flex-col gap-6 mb-6 md:flex-row md:items-end">
                <div className="w-full md:w-1/3">
                    <Label>Filtrar por Cliente</Label>
                    <Select
                        options={[{ value: "", label: "Todos os clientes" }, ...clients.map(c => ({ value: String(c.id), label: c.name }))]}
                        onChange={(val) => setSelectedClient(val)}
                        placeholder="Selecione um cliente"
                        defaultValue=""
                    />
                </div>
                <div className="w-full md:w-1/3">
                    <Label>Filtrar por Serviço</Label>
                    <Input
                        placeholder="Ex: instagram"
                        value={serviceFilter}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceFilter(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-auto">
                    <Button onClick={fetchLogs} disabled={loading}>
                        {loading ? "Carregando..." : "Atualizar"}
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden border border-gray-200 rounded-xl dark:border-gray-800">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-900">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Data/Hora</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Cliente</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Serviço</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Método</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Path</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            {log.client_detail?.name || log.client}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {log.service}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                            {log.method}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">
                                            {log.path}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status_code >= 200 && log.status_code < 300
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {Number(log.status_code)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
