import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import questionsData from "../../data/briefingQuestions.json";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { AngleLeftIcon, AngleRightIcon, CheckLineIcon, PencilIcon } from "../../icons";

const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

interface Question {
    meta_key: string;
    title: string;
    type: string;
    placeholder?: string;
    options?: { text: string; image?: string | null }[];
}

interface MetaResponse {
    id: number;
    user: number;
    key: string;
    value: string;
}

interface Client {
    id: number;
    name: string;
}

export default function Briefing() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<{ [key: string]: string }>({});
    const [metaIds, setMetaIds] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [viewMode, setViewMode] = useState(false);

    // Determine target client
    const [selectedClient, setSelectedClient] = useState<number | "">(() => {
        const p = searchParams.get("client_id");
        return p ? Number(p) : "";
    });

    const questions: Question[] = questionsData;
    const currentQuestion = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;

    // Load Clients (for Admin selector)
    useEffect(() => {
        fetchClients();
    }, []);

    // Load Answers when client changes
    useEffect(() => {
        if (selectedClient) {
            fetchClientMeta(selectedClient);
            setSearchParams({ client_id: String(selectedClient) });
        } else {
            setResponses({});
            setViewMode(false);
        }
    }, [selectedClient]);

    const fetchClients = async () => {
        try {
            const res = await fetch("/api/v1/client/list/", {
                headers: { Authorization: API_KEY }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data);
                if (!selectedClient && data.length > 0) {
                    const p = searchParams.get("client_id");
                    if (!p) setSelectedClient(data[0].id);
                }
            }
        } catch (e) {
            console.error("Error fetching clients", e);
        }
    };

    const fetchClientMeta = async (clientId: number) => {
        setLoading(true);
        setResponses({});
        setMetaIds({});
        setViewMode(false);

        try {
            const res = await fetch(`/api/v1/client/client-meta/list/?client_id=${clientId}`, {
                headers: { Authorization: API_KEY }
            });
            if (res.ok) {
                const data: MetaResponse[] = await res.json();
                const newResponses: any = {};
                const newIds: any = {};
                data.forEach(item => {
                    newResponses[item.key] = item.value;
                    newIds[item.key] = item.id;
                });
                setResponses(newResponses);
                setMetaIds(newIds);

                // If we have distinct answers, default to View Mode
                if (Object.keys(newResponses).length > 0) {
                    setViewMode(true);
                } else {
                    setViewMode(false);
                }
            }
        } catch (e) {
            console.error("Error fetching meta", e);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleResponseChange = (val: string) => {
        setResponses(prev => ({
            ...prev,
            [currentQuestion.meta_key]: val
        }));
    };

    const handleMultiSelect = (option: string) => {
        const currentVal = responses[currentQuestion.meta_key] || "";
        let selected = currentVal ? currentVal.split(", ").filter(Boolean) : [];
        if (selected.includes(option)) {
            selected = selected.filter(s => s !== option);
        } else {
            selected.push(option);
        }
        handleResponseChange(selected.join(", "));
    };

    const saveChanges = async () => {
        if (!selectedClient) return;
        setSaving(true);

        try {
            // Update existing
            const updates = [];
            const creates = [];

            for (const key in responses) {
                const value = responses[key];
                const id = metaIds[key];

                // Only save if defined
                if (value !== undefined) {
                    if (id) {
                        updates.push(fetch(`/api/v1/client/client-meta/update/${id}/`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
                            body: JSON.stringify({ user: selectedClient, key, value })
                        }));
                    } else {
                        creates.push({ user: selectedClient, key, value });
                    }
                }
            }

            await Promise.all(updates);
            if (creates.length > 0) {
                await fetch(`/api/v1/client/client-meta/create/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
                    body: JSON.stringify(creates)
                });
            }

            // Refresh data to get new IDs
            await fetchClientMeta(selectedClient); // Refresh
            alert("Salvo com sucesso!");
            setViewMode(true); // Switch to View Mode

        } catch (e) {
            console.error("Error saving", e);
            alert("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    // Render Input Helpers
    const renderInput = () => {
        const q = currentQuestion;
        const val = responses[q.meta_key] || "";

        switch (q.type) {
            case 'text':
                return (
                    <Input
                        value={val}
                        onChange={(e) => handleResponseChange(e.target.value)}
                        placeholder={q.placeholder}
                        className="text-lg py-4"
                        autoFocus
                    />
                );
            case 'textarea':
                return (
                    <textarea
                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-lg outline-none focus:border-brand-500 min-h-[150px] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        value={val}
                        onChange={(e) => handleResponseChange(e.target.value)}
                        placeholder={q.placeholder}
                        autoFocus
                    />
                );
            case 'radio':
                return (
                    <div className="flex flex-col gap-3">
                        {q.options?.map((opt, i) => (
                            <label key={i} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${val === opt.text ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 hover:border-brand-300 dark:border-gray-700'}`}>
                                <input
                                    type="radio"
                                    name={q.meta_key}
                                    value={opt.text}
                                    checked={val === opt.text}
                                    onChange={(e) => handleResponseChange(e.target.value)}
                                    className="w-5 h-5 text-brand-600 focus:ring-brand-500"
                                />
                                <span className="text-lg font-medium text-gray-700 dark:text-gray-200">{opt.text}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'check':
                return (
                    <div className="flex flex-col gap-3">
                        {q.options?.map((opt, i) => {
                            const selected = val.split(", ").includes(opt.text);
                            return (
                                <label key={i} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${selected ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 hover:border-brand-300 dark:border-gray-700'}`}>
                                    <input
                                        type="checkbox"
                                        value={opt.text}
                                        checked={selected}
                                        onChange={() => handleMultiSelect(opt.text)}
                                        className="w-5 h-5 text-brand-600 focus:ring-brand-500 rounded"
                                    />
                                    <span className="text-lg font-medium text-gray-700 dark:text-gray-200">{opt.text}</span>
                                </label>
                            );
                        })}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderSummary = () => (
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Resumo do Briefing</h2>
                <Button onClick={() => setViewMode(false)} startIcon={<PencilIcon className="size-4" />}>
                    Editar Respostas
                </Button>
            </div>
            <div className="space-y-8">
                {questions.map((q, i) => (
                    <div key={i} className="border-b border-gray-50 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {i + 1}. {q.title}
                        </h3>
                        <div className="text-lg text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {responses[q.meta_key] || <span className="text-gray-400 italic">Não respondido</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderWizard = () => (
        <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-12 relative overflow-hidden transition-all animate-fadeIn">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 dark:bg-gray-700">
                <div
                    className="h-full bg-brand-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        Pergunta {currentStep + 1} de {questions.length}
                    </span>
                    {viewMode === false && Object.keys(metaIds).length > 0 && (
                        <button onClick={() => setViewMode(true)} className="text-sm text-gray-400 hover:text-gray-600 underline">
                            Cancelar e Voltar
                        </button>
                    )}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-3 leading-tight">
                    {currentQuestion.title}
                </h2>
            </div>

            <div className="mb-10 min-h-[200px]">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Carregando...</div>
                ) : (
                    renderInput()
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
                <Button
                    variant="outline"
                    disabled={currentStep === 0}
                    onClick={handlePrev}
                    className={`${currentStep === 0 ? 'opacity-50' : ''}`}
                >
                    <AngleLeftIcon className="w-4 h-4 mr-2" />
                    Anterior
                </Button>

                <div className="flex gap-3">
                    <Button
                        onClick={() => saveChanges()}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {saving ? 'Salvando...' : 'Salvar e Continuar'}
                    </Button>

                    {currentStep < questions.length - 1 ? (
                        <Button
                            onClick={handleNext}
                            className="bg-brand-600 hover:bg-brand-700 text-white fill-current"
                        >
                            Próxima
                            <AngleRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={saveChanges}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            Finalizar
                            <CheckLineIcon className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center text-gray-400 text-sm">
                Pressione <strong>Enter</strong> para avançar
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 flex flex-col items-center">

            {/* Header / Client Selector */}
            <div className="w-full max-w-3xl flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Briefing</h1>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Cliente:</span>
                    <select
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(Number(e.target.value))}
                    >
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {viewMode ? renderSummary() : renderWizard()}

        </div>
    );
}
