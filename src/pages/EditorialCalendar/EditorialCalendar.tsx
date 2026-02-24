
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import { Portuguese } from "flatpickr/dist/l10n/pt";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { useAuthContext } from "../../context/AuthContext";

interface Format {
    id: number;
    name: string;
    platform: string;
}

interface CalendarEntry {
    id?: number;
    client: number;
    week_day: string;
    subject: string;
    formats: number[];
    time: string;
    active: boolean;
    template_link?: string | null;
}

interface ExistingEntry extends CalendarEntry {
    id: number;
}

const DAYS_OF_WEEK = [
    { key: "Monday", label: "Segunda-feira" },
    { key: "Tuesday", label: "Terça-feira" },
    { key: "Wednesday", label: "Quarta-feira" },
    { key: "Thursday", label: "Quinta-feira" },
    { key: "Friday", label: "Sexta-feira" },
    { key: "Saturday", label: "Sábado" },
    { key: "Sunday", label: "Domingo" },
];

const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

export default function EditorialCalendar() {
    const [searchParams] = useSearchParams();
    const clientId = searchParams.get("client_id") ? Number(searchParams.get("client_id")) : null;

    const { user } = useAuthContext();
    const isAdmin = user?.is_superuser || user?.role === 'admin';

    const [formats, setFormats] = useState<Format[]>([]);
    const [calendarData, setCalendarData] = useState<Record<string, CalendarEntry>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [clientName, setClientName] = useState("");

    useEffect(() => {
        fetchFormats();
        if (clientId) {
            fetchClientName();
            fetchCalendarData();
        }
    }, [clientId]);

    const fetchClientName = async () => {
        try {
            const res = await fetch("/api/v1/client/list/", { headers: { Authorization: API_KEY } });
            if (res.ok) {
                const data: any[] = await res.json();
                const client = data.find((c: any) => c.id === clientId);
                if (client) setClientName(client.name);
            }
        } catch (err) {
            console.error("Error fetching client:", err);
        }
    };

    const fetchFormats = async () => {
        try {
            const res = await fetch("/api/v1/post/format/list/", { headers: { Authorization: API_KEY } });
            if (res.ok) setFormats(await res.json());
        } catch (err) {
            console.error("Error fetching formats:", err);
        }
    };

    const fetchCalendarData = async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/editorial-calendar/list/?client_id=${clientId}`, {
                headers: { Authorization: API_KEY },
            });
            if (res.ok) {
                const data: ExistingEntry[] = await res.json();

                const initialData: Record<string, CalendarEntry> = {};
                DAYS_OF_WEEK.forEach(day => {
                    initialData[day.key] = {
                        client: clientId,
                        week_day: day.key,
                        subject: "",
                        formats: [],
                        time: "08:00",
                        active: false,
                        template_link: null,
                    };
                });
                data.forEach(entry => {
                    initialData[entry.week_day] = { ...entry };
                });
                setCalendarData(initialData);
            }
        } catch (err) {
            console.error("Error fetching calendar:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEntryChange = (dayKey: string, field: string, value: any) => {
        if (!isAdmin) return;
        setCalendarData(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], [field]: value }
        }));
    };

    const toggleFormat = (dayKey: string, formatId: number) => {
        if (!isAdmin) return;
        setCalendarData(prev => {
            const cur = prev[dayKey].formats || [];
            const next = cur.includes(formatId) ? cur.filter(id => id !== formatId) : [...cur, formatId];
            return { ...prev, [dayKey]: { ...prev[dayKey], formats: next } };
        });
    };

    const handleSave = async () => {
        if (!clientId) return;
        setSaving(true);
        try {
            const promises: Promise<any>[] = [];
            const newEntries: any[] = [];

            for (const day of DAYS_OF_WEEK) {
                const entry = calendarData[day.key];

                if (entry.id) {
                    if (!entry.active) {
                        // Deactivated → delete
                        promises.push(
                            fetch(`/api/v1/editorial-calendar/delete/${entry.id}/`, {
                                method: "DELETE",
                                headers: { Authorization: API_KEY },
                            })
                        );
                    } else {
                        // Update existing
                        promises.push(
                            fetch(`/api/v1/editorial-calendar/update/${entry.id}/`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: API_KEY,
                                },
                                body: JSON.stringify({
                                    subject: entry.subject,
                                    time: entry.time,
                                    formats: entry.formats,
                                    active: entry.active,
                                    week_day: entry.week_day,
                                    template_link: entry.template_link || null,
                                }),
                            })
                        );
                    }
                } else if (entry.active) {
                    // New entry
                    newEntries.push({
                        client: clientId,
                        week_day: entry.week_day,
                        subject: entry.subject,
                        formats: entry.formats,
                        time: entry.time,
                        active: true,
                        template_link: entry.template_link || null,
                    });
                }
            }

            if (newEntries.length > 0) {
                promises.push(
                    fetch("/api/v1/editorial-calendar/create/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: API_KEY,
                        },
                        body: JSON.stringify(newEntries),
                    })
                );
            }

            await Promise.all(promises);
            await fetchCalendarData();
            alert("Calendário atualizado com sucesso!");
        } catch (err) {
            console.error("Error saving calendar:", err);
            alert("Erro ao salvar o calendário.");
        } finally {
            setSaving(false);
        }
    };

    if (!clientId) {
        return (
            <div className="p-6">
                <PageMeta title="Calendário Editorial | Miggo" description="Calendário Editorial do Cliente" />
                <div className="text-center text-gray-500">Nenhum cliente selecionado.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6">
                <PageMeta title="Calendário Editorial | Miggo" description="Calendário Editorial do Cliente" />
                <div className="text-center text-gray-500">Carregando...</div>
            </div>
        );
    }

    return (
        <div>
            <PageMeta title="Calendário Editorial | Miggo" description={`Calendário Editorial - ${clientName}`} />
            <PageBreadcrumb pageTitle={clientName ? `Calendário Editorial - ${clientName}` : "Calendário Editorial"} />

            <div className="flex justify-end mb-6">
                {isAdmin && (
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {DAYS_OF_WEEK.map(day => {
                    const entry = calendarData[day.key] || {} as CalendarEntry;
                    const isActive = !!entry.active;

                    return (
                        <div
                            key={day.key}
                            className={`rounded-2xl border p-5 transition-all ${isActive
                                ? "border-brand-500 bg-brand-50/10 dark:border-brand-500/50"
                                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                                }`}
                        >
                            {/* Header: Day name + toggle */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{day.label}</h3>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isActive}
                                        onChange={e => handleEntryChange(day.key, "active", e.target.checked)}
                                        disabled={!isAdmin}
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600" />
                                </label>
                            </div>

                            {isActive && (
                                <div className="space-y-4">
                                    {/* Subject */}
                                    <div>
                                        <Label>Assunto</Label>
                                        <Input
                                            value={entry.subject || ""}
                                            onChange={e => handleEntryChange(day.key, "subject", e.target.value)}
                                            disabled={!isAdmin}
                                            placeholder="Ex: Post institucional"
                                        />
                                    </div>

                                    {/* Time */}
                                    <div>
                                        <Label>Horário</Label>
                                        <Flatpickr
                                            value={entry.time}
                                            options={{
                                                enableTime: true,
                                                noCalendar: true,
                                                dateFormat: "H:i",
                                                time_24hr: true,
                                                locale: Portuguese,
                                            }}
                                            onChange={([date]) => {
                                                if (date) {
                                                    const hh = String(date.getHours()).padStart(2, "0");
                                                    const mm = String(date.getMinutes()).padStart(2, "0");
                                                    handleEntryChange(day.key, "time", `${hh}:${mm}`);
                                                }
                                            }}
                                            disabled={!isAdmin}
                                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        />
                                    </div>

                                    {/* Template Link */}
                                    <div>
                                        <Label>Link do Template</Label>
                                        <Input
                                            value={entry.template_link || ""}
                                            onChange={e => handleEntryChange(day.key, "template_link", e.target.value || null)}
                                            disabled={!isAdmin}
                                            placeholder="https://www.canva.com/..."
                                        />
                                        {entry.template_link && (
                                            <a
                                                href={entry.template_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 hover:underline"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                Abrir template
                                            </a>
                                        )}
                                    </div>

                                    {/* Formats */}
                                    <div>
                                        <Label>Formatos</Label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-lg dark:border-gray-800">
                                            {formats.map(fmt => (
                                                <div key={fmt.id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`fmt-${day.key}-${fmt.id}`}
                                                        checked={(entry.formats || []).includes(fmt.id)}
                                                        onChange={() => toggleFormat(day.key, fmt.id)}
                                                        disabled={!isAdmin}
                                                        className="w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                    <label
                                                        htmlFor={`fmt-${day.key}-${fmt.id}`}
                                                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                                                    >
                                                        {fmt.platform} - {fmt.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
