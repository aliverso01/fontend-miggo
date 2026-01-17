import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import DatePicker from "../../components/form/date-picker";

interface HistoryItem {
    id: number;
    action: string;
    model_name: string;
    object_id: string;
    description: string;
    created_at: string;
}

const ACTION_OPTIONS = [
    { value: "", label: "Todos" },
    { value: "CREATE", label: "CRIADO" },
    { value: "UPDATE", label: "ALTERADO" },
    { value: "DELETE", label: "DELETADO" },
];

const MODEL_OPTIONS = [
    { value: "", label: "Todos" },
    { value: "Client", label: "Cliente" },
    { value: "Post", label: "Publicação" },
    { value: "Editorial Calendar", label: "Calendário Editorial" },
];

export default function HistoryList() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        action: "",
        model_name: "",
        object_id: "",
        description: "",
        date: "",
        time: ""
    });

    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const isClient = user.role === 'client';
            let url = "/api/v1/history/list/";
            if (isClient && user.id) {
                url += `?user_id=${user.id}`;
            }

            const response = await fetch(url, {
                headers: { Authorization: API_KEY },
            });
            if (!response.ok) throw new Error("Failed to fetch history");
            const data = await response.json();
            setHistory(data);
        } catch (err: any) {
            console.error("Error fetching history:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (dateStr: string) => {
        setFilters(prev => ({ ...prev, date: dateStr }));
    };

    // Derived state for filtered items
    const filteredHistory = history.filter(item => {
        const itemAction = item.action || "";
        const itemModel = item.model_name || "";

        // Exact match for Selects if value is present
        const matchAction = filters.action ? itemAction === filters.action : true;
        const matchModel = filters.model_name ? itemModel === filters.model_name : true;

        const matchObjectId = item.object_id.toString().toLowerCase().includes(filters.object_id.toLowerCase());
        const matchDescription = item.description.toLowerCase().includes(filters.description.toLowerCase());

        const itemDateObj = new Date(item.created_at);
        const itemDateStr = item.created_at.split('T')[0];

        let matchDate = true;
        if (filters.date) {
            matchDate = itemDateStr === filters.date;
        }

        let matchTime = true;
        if (filters.time) {
            // Filter by HH:MM (starts with) or exact minute
            // item time string "HH:MM:SS"
            const itemTimeStr = itemDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            // Compare HH:MM
            matchTime = itemTimeStr.startsWith(filters.time);
        }

        return matchAction && matchModel && matchObjectId && matchDescription && matchDate && matchTime;
    });

    // Translation Helpers
    const translateAction = (action: string) => {
        const map: Record<string, string> = {
            'CREATE': 'CRIADO',
            'UPDATE': 'ALTERADO',
            'DELETE': 'DELETADO'
        };
        return map[action] || action;
    };

    const translateModel = (model: string) => {
        const map: Record<string, string> = {
            'Client': 'Cliente',
            'Post': 'Publicação', // Changed from 'Conteúdo' to 'Publicação' to match MODEL_OPTIONS
            'Editorial Calendar': 'Calendário Editorial',
            'EditorialCalendar': 'Calendário Editorial'
        };
        // Normalize backend model names if needed
        return map[model] || model;
    };

    return (
        <>
            <PageMeta title="Histórico | Miggo" description="Histórico de ações do sistema" />
            <PageBreadcrumb pageTitle="Histórico de Ações" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Filtros
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <div>
                        <Label>Ação</Label>
                        <Select
                            options={ACTION_OPTIONS}
                            placeholder="Todos"
                            onChange={(val) => handleSelectChange('action', val)}
                            defaultValue={filters.action}
                        />
                    </div>
                    <div>
                        <Label>Modelo</Label>
                        <Select
                            options={MODEL_OPTIONS}
                            placeholder="Todos"
                            onChange={(val) => handleSelectChange('model_name', val)}
                            defaultValue={filters.model_name}
                        />
                    </div>
                    <div>
                        <Label>Object ID</Label>
                        <Input
                            type="text"
                            placeholder="ID"
                            name="object_id"
                            value={filters.object_id}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <Label>Descrição</Label>
                        <Input
                            type="text"
                            placeholder="Buscar..."
                            name="description"
                            value={filters.description}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <Label>Data</Label>
                        <DatePicker
                            id="filter-date"
                            placeholder="dd/mm/aaaa"
                            onChange={(_, dateStr) => handleDateChange(dateStr)}
                            defaultDate={filters.date}
                        />
                    </div>
                    <div>
                        <Label>Hora</Label>
                        <Input
                            type="time"
                            name="time"
                            value={filters.time}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pb-6">
                <div className="flex flex-col">
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden">
                                {loading ? (
                                    <div className="p-4 text-center text-gray-500">Carregando histórico...</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableCell isHeader className="w-[60px] text-left">Data/Hora</TableCell>
                                                <TableCell isHeader className="w-[60px] text-left">Ação</TableCell>
                                                <TableCell isHeader className="w-[60px] text-left">Página</TableCell>
                                                <TableCell isHeader className="w-[60px] text-left">ID Objeto</TableCell>
                                                <TableCell isHeader className="w-[60px] text-left">Descrição</TableCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredHistory.length === 0 ? (
                                                <TableRow>
                                                    <TableCell className="text-center py-4" colSpan={5}>
                                                        Nenhum registro encontrado.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredHistory.map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-800 dark:text-white/90">
                                                                    {new Date(item.created_at).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded uppercase
                                                                ${item.action === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                                                    item.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                                                        item.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                                                                            'bg-gray-100 text-gray-700'}`}>
                                                                {translateAction(item.action)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                                                                {translateModel(item.model_name)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                                {item.object_id}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 min-w-[200px]" title={item.description}>
                                                                {item.description}
                                                            </p>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
