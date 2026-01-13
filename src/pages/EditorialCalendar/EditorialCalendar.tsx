
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

// Interfaces
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
    formats: number[]; // Array of format IDs
    time: string;
    active: boolean;
}

interface ExistingEntry extends CalendarEntry {
    id: number;
}

// Fixed Days of the Week
const DAYS_OF_WEEK = [
    { key: "Monday", label: "Segunda-feira" },
    { key: "Tuesday", label: "Terça-feira" },
    { key: "Wednesday", label: "Quarta-feira" },
    { key: "Thursday", label: "Quinta-feira" },
    { key: "Friday", label: "Sexta-feira" },
    { key: "Saturday", label: "Sábado" },
    { key: "Sunday", label: "Domingo" },
];

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

    // API Key (Taken from other files, usually should be env or context, but hardcoded here as per existing code)
    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

    useEffect(() => {
        fetchFormats();
        if (clientId) {
            fetchClientName();
            fetchCalendarData();
        }
    }, [clientId]);

    const fetchClientName = async () => {
        try {
            const response = await fetch("/api/v1/client/list/", {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data: any[] = await response.json();
                const client = data.find((c: any) => c.id === clientId);
                if (client) {
                    setClientName(client.name);
                }
            }
        } catch (error) {
            console.error("Error fetching client:", error);
        }
    };

    const fetchFormats = async () => {
        try {
            const response = await fetch("/api/v1/post/format/list/", {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setFormats(data);
            }
        } catch (error) {
            console.error("Error fetching formats:", error);
        }
    };

    const fetchCalendarData = async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/editorial-calendar/list/?client_id=${clientId}`, {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data: ExistingEntry[] = await response.json();

                // Map to state by day
                const initialData: Record<string, CalendarEntry> = {};

                // Initialize all days
                DAYS_OF_WEEK.forEach(day => {
                    initialData[day.key] = {
                        client: clientId,
                        week_day: day.key,
                        subject: "",
                        formats: [],
                        time: "08:00",
                        active: false
                    };
                });

                // Fill with fetched data
                data.forEach(entry => {
                    initialData[entry.week_day] = {
                        ...entry
                    };
                });

                setCalendarData(initialData);
            }
        } catch (error) {
            console.error("Error fetching calendar:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEntryChange = (dayKey: string, field: keyof CalendarEntry, value: any) => {
        if (!isAdmin) return; // Read-only for non-admins

        setCalendarData(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                [field]: value
            }
        }));
    };

    const toggleFormat = (dayKey: string, formatId: number) => {
        if (!isAdmin) return;
        setCalendarData(prev => {
            const currentFormats = prev[dayKey].formats || [];
            const newFormats = currentFormats.includes(formatId)
                ? currentFormats.filter(id => id !== formatId)
                : [...currentFormats, formatId];

            return {
                ...prev,
                [dayKey]: {
                    ...prev[dayKey],
                    formats: newFormats
                }
            };
        });
    };

    const handleSave = async () => {
        if (!clientId) return;
        setSaving(true);
        try {
            const promises: Promise<any>[] = [];
            const newEntries: CalendarEntry[] = [];

            for (const day of DAYS_OF_WEEK) {
                const entry = calendarData[day.key];

                if (entry.id) {
                    // Update or Delete
                    if (!entry.active) {
                        // Delete
                        promises.push(
                            fetch(`/api/v1/editorial-calendar/delete/${entry.id}/`, {
                                method: 'DELETE',
                                headers: { Authorization: API_KEY }
                            })
                        );
                    } else {
                        // Update (PATCH)
                        promises.push(
                            fetch(`/api/v1/post/editorial-calendar/${entry.id}/`, {
                                method: 'PATCH',
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: API_KEY,
                                },
                                body: JSON.stringify({
                                    subject: entry.subject,
                                    time: entry.time,
                                    formats: entry.formats,
                                    active: entry.active,
                                    week_day: entry.week_day
                                })
                            })
                        );
                    }
                } else {
                    // Create if active
                    if (entry.active) {
                        newEntries.push({
                            client: clientId,
                            week_day: entry.week_day,
                            subject: entry.subject,
                            formats: entry.formats,
                            time: entry.time,
                            active: true
                        });
                    }
                }
            }

            // Execute Creates
            if (newEntries.length > 0) {
                promises.push(
                    fetch("/api/v1/editorial-calendar/create/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: API_KEY,
                        },
                        body: JSON.stringify(newEntries)
                    })
                );
            }

            // Wait for all
            await Promise.all(promises);
            await fetchCalendarData(); // Refresh
            alert("Calendário atualizado com sucesso!");

        } catch (error) {
            console.error("Error saving calendar:", error);
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
                    const entry = calendarData[day.key] || {};
                    const isActive = entry.active;

                    return (
                        <div key={day.key} className={`rounded-2xl border p-5 transition-all ${isActive ? "border-brand-500 bg-brand-50/10 dark:border-brand-500/50" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{day.label}</h3>
                                <div className="flex items-center gap-2">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isActive}
                                            onChange={(e) => handleEntryChange(day.key, "active", e.target.checked)}
                                            disabled={!isAdmin}
                                        />
                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                    </label>
                                </div>
                            </div>

                            {isActive && (
                                <div className="space-y-4">
                                    {/* Subject */}
                                    <div>
                                        <Label>Assunto</Label>
                                        <Input
                                            value={entry.subject}
                                            onChange={(e) => handleEntryChange(day.key, "subject", e.target.value)}
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
                                                    const hours = String(date.getHours()).padStart(2, '0');
                                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                                    handleEntryChange(day.key, "time", `${hours}:${minutes}`);
                                                }
                                            }}
                                            disabled={!isAdmin}
                                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        />
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
                                                    <label htmlFor={`fmt-${day.key}-${fmt.id}`} className="test-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
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
