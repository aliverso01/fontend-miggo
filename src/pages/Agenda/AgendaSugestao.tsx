import { useState, useEffect, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { useAuthContext } from "../../context/AuthContext";
import { useClient } from "../../hooks/useClient";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";

const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

interface Format {
    id: number;
    name: string;
    platform?: string;
}

interface Suggestion {
    id: number;
    client: number;
    client_name: string;
    title: string;
    description: string;
    suggested_date: string;
    post_format: number | null;
    post_format_name: string | null;
    media: string | null;
    media_url: string | null;
    status: "pending" | "approved" | "rejected";
    admin_notes: string | null;
    created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Reprovado",
};

const emptyForm = {
    title: "",
    description: "",
    suggested_date: "",
    post_format: "",
    admin_notes: "",
};

export default function AgendaSugestao() {
    const { user } = useAuthContext();
    const { clientId } = useClient();
    const isAdmin = user?.is_superuser || user?.is_staff || user?.role === "admin";

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [formats, setFormats] = useState<Format[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [viewItem, setViewItem] = useState<Suggestion | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
    const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const { isOpen: isViewOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();

    useEffect(() => {
        fetchFormats();
    }, []);

    useEffect(() => {
        if (isAdmin || clientId) {
            fetchSuggestions();
        }
    }, [clientId, isAdmin]);

    const fetchFormats = async () => {
        try {
            const res = await fetch("/api/v1/post/format/list/", {
                credentials: "include",
                headers: { Authorization: API_KEY },
            });
            if (res.ok) setFormats(await res.json());
        } catch (err) {
            console.error("Error fetching formats:", err);
        }
    };

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const params = isAdmin ? "" : clientId ? `?client_id=${clientId}` : "";
            const res = await fetch(`/api/v1/agenda/list/${params}`, {
                credentials: "include",
                headers: { Authorization: API_KEY },
            });
            if (res.ok) setSuggestions(await res.json());
        } catch (err) {
            console.error("Error fetching suggestions:", err);
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setMediaFile(null);
        openFormModal();
    };

    const openEdit = (item: Suggestion) => {
        setEditingId(item.id);
        setFormData({
            title: item.title,
            description: item.description,
            suggested_date: item.suggested_date,
            post_format: item.post_format ? String(item.post_format) : "",
            admin_notes: item.admin_notes || "",
        });
        setMediaFile(null);
        openFormModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin && !clientId) {
            alert("Aguardando identificação do cliente.");
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            if (!isAdmin && clientId) fd.append("client", String(clientId));
            fd.append("title", formData.title);
            fd.append("description", formData.description);
            fd.append("suggested_date", formData.suggested_date);
            if (formData.post_format) fd.append("post_format", formData.post_format);
            if (isAdmin && formData.admin_notes) fd.append("admin_notes", formData.admin_notes);
            if (mediaFile) fd.append("media", mediaFile);

            const url = editingId
                ? `/api/v1/agenda/update/${editingId}/`
                : "/api/v1/agenda/create/";
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                credentials: "include",
                headers: { Authorization: API_KEY },
                body: fd,
            });

            if (res.ok) {
                await fetchSuggestions();
                closeFormModal();
            } else {
                const err = await res.json();
                alert("Error: " + JSON.stringify(err));
            }
        } catch (err) {
            console.error(err);
            alert("Connection error.");
        } finally {
            setSaving(false);
        }
    };

    const openDeleteConfirm = (id: number) => {
        setDeletingId(id);
        openDeleteModal();
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            const res = await fetch(`/api/v1/agenda/delete/${deletingId}/`, {
                method: "DELETE",
                credentials: "include",
                headers: { Authorization: API_KEY },
            });
            if (res.ok || res.status === 204) {
                await fetchSuggestions();
                closeDeleteModal();
            } else {
                const err = await res.json();
                alert("Error: " + (err.error || "Could not delete."));
            }
        } catch (err) {
            alert("Connection error.");
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/v1/agenda/update/${id}/`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: API_KEY,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) await fetchSuggestions();
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    };

    if (loading) {
        return (
            <div className="p-6">
                <PageMeta title="Sugestão de Pauta | Miggo" description="Sugira pautas para seu calendário editorial" />
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <svg className="animate-spin h-8 w-8 mr-3 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Carregando sugestões...
                </div>
            </div>
        );
    }

    return (
        <>
            <PageMeta title="Sugestão de Pauta | Miggo" description="Sugira pautas para seu calendário editorial" />
            <PageBreadcrumb pageTitle="Sugestão de Pauta" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isAdmin
                            ? "Visualize e gerencie todas as sugestões enviadas pelos clientes."
                            : "Envie suas ideias de pauta para a equipe revisar e incluir no seu calendário."}
                    </p>
                    {!isAdmin && (
                        <Button startIcon={<PlusIcon className="size-5" />} onClick={openNew}>
                            Nova Sugestão
                        </Button>
                    )}
                </div>

                {/* Cards grid */}
                {suggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma sugestão enviada ainda.</p>
                        {!isAdmin && (
                            <p className="text-sm text-gray-400 mt-1">Clique em <strong>Nova Sugestão</strong> para começar!</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {suggestions.map((item) => (
                            <div
                                key={item.id}
                                className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                            >
                                {/* Status badge */}
                                <div className="absolute top-4 right-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                                        {STATUS_LABELS[item.status]}
                                    </span>
                                </div>

                                {/* Media preview */}
                                {item.media_url && (
                                    <div className="w-full h-40 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex flex-col flex-1 p-5">
                                    <div className="mb-3">
                                        {isAdmin && (
                                            <p className="text-xs text-gray-400 mb-1">
                                                Cliente: <span className="font-medium text-gray-600 dark:text-gray-300">{item.client_name}</span>
                                            </p>
                                        )}
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug pr-16">{item.title}</h3>
                                    </div>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{item.description}</p>

                                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(item.suggested_date)}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => { setViewItem(item); openViewModal(); }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                                                title="Ver detalhes"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            {(isAdmin || item.status === "pending") && (
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                                                    title="Editar"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            {(isAdmin || item.status === "pending") && (
                                                <button
                                                    onClick={() => openDeleteConfirm(item.id)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <TrashBinIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <select
                                                    value={item.status}
                                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                    className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                                >
                                                    <option value="pending">Pendente</option>
                                                    <option value="approved">Aprovado</option>
                                                    <option value="rejected">Reprovado</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Form Modal ── */}
            <Modal isOpen={isFormOpen} onClose={closeFormModal} className="max-w-[640px] m-4">
                <div className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {editingId ? "Editar Sugestão" : "Nova Sugestão de Pauta"}
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">Preencha os detalhes da sua ideia de conteúdo.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <Label>Título da Ideia *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Post sobre lançamento da nova coleção"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label>Descrição *</Label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descreva a ideia com detalhes, contexto, referências..."
                                rows={4}
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-gray-400 resize-none"
                            />
                        </div>

                        {/* Suggested date */}
                        <div>
                            <Label>Data Sugerida para Publicação *</Label>
                            <Input
                                type="date"
                                value={formData.suggested_date}
                                onChange={(e) => setFormData({ ...formData, suggested_date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Post format (optional) */}
                        {formats.length > 0 && (
                            <div>
                                <Label>Formato de Post (opcional)</Label>
                                <select
                                    value={formData.post_format}
                                    onChange={(e) => setFormData({ ...formData, post_format: e.target.value })}
                                    className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                >
                                    <option value="">-- Selecionar --</option>
                                    {formats.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.platform ? `${f.platform} - ${f.name}` : f.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Media upload */}
                        <div>
                            <Label>Mídia (Imagem, Vídeo ou PDF)</Label>
                            <div
                                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50/30 dark:hover:border-brand-500 dark:hover:bg-brand-500/5 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                                />
                                {mediaFile ? (
                                    <div className="flex items-center justify-center gap-2 text-brand-600 dark:text-brand-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm font-medium truncate max-w-xs">{mediaFile.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm">
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Clique para enviar ou arraste o arquivo aqui
                                        <p className="text-xs mt-1 text-gray-300">Imagem, vídeo ou PDF (máx. 50MB)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin notes (admin only) */}
                        {isAdmin && (
                            <div>
                                <Label>Observação para o Cliente</Label>
                                <textarea
                                    value={formData.admin_notes}
                                    onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                                    placeholder="Feedback ou comentários sobre a sugestão..."
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-gray-400 resize-none"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={closeFormModal}>Cancelar</Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Enviando..." : editingId ? "Salvar Alterações" : "Enviar Sugestão"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── View Modal ── */}
            <Modal isOpen={isViewOpen} onClose={closeViewModal} className="max-w-[560px] m-4">
                {viewItem && (
                    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{viewItem.title}</h3>
                            <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[viewItem.status]}`}>
                                {STATUS_LABELS[viewItem.status]}
                            </span>
                        </div>

                        {isAdmin && (
                            <p className="text-sm text-gray-500">
                                Cliente: <span className="font-semibold text-gray-700 dark:text-gray-300">{viewItem.client_name}</span>
                            </p>
                        )}

                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descrição</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{viewItem.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Data Sugerida</p>
                                <p className="text-gray-700 dark:text-gray-300">{formatDate(viewItem.suggested_date)}</p>
                            </div>
                            {viewItem.post_format_name && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Post Format</p>
                                    <p className="text-gray-700 dark:text-gray-300">{viewItem.post_format_name}</p>
                                </div>
                            )}
                        </div>

                        {viewItem.media_url && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mídia</p>
                                <img src={viewItem.media_url} alt={viewItem.title} className="w-full max-h-60 rounded-lg object-cover" />
                            </div>
                        )}

                        {viewItem.admin_notes && (
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">💬 Feedback da Equipe</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{viewItem.admin_notes}</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button variant="outline" onClick={closeViewModal}>Fechar</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} className="max-w-[400px] m-4">
                <div className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Excluir Sugestão</h3>
                    <p className="text-sm text-gray-500 mb-6">Tem certeza que deseja excluir esta sugestão? Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={closeDeleteModal}>Cancelar</Button>
                        <Button onClick={handleDelete} className="bg-error-500 hover:bg-error-600 text-white">Excluir</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
