import Flatpickr from "react-flatpickr";
import { Portuguese } from "flatpickr/dist/l10n/pt";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { Format, Media, PostMediaLink } from "./ContentKanban";
import Select from "../../components/form/Select";
import { useSubscription } from "../../hooks/useSubscription";
import {
    CheckLineIcon,
    CalenderIcon,
    TimeIcon,
    TaskIcon,
    PaperPlaneIcon,
    CloseIcon
} from "../../icons";

interface EditPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: any;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    loading: boolean;
    formats: Format[];
    medias: Media[];
    postMedias: PostMediaLink[];
    currentPostId?: number;
    onDeleteMediaLink: (linkId: number) => void;
    onUploadMedia: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onStatusAction: (status: number) => void;
    onPublish?: () => void;
    userRole?: string;
    onImportTemplate?: (page?: number) => Promise<void>;
    clients?: { id: number; name: string }[];
    selectedClient?: string;
    onClientChange?: (clientId: string) => void;
    onSendWhatsApp?: () => void;
}

export default function EditPostModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    handleInputChange,
    loading,
    formats,
    medias,
    postMedias,
    currentPostId,
    onDeleteMediaLink,
    onUploadMedia,
    onStatusAction,
    onPublish,
    userRole,
    onImportTemplate,
    clients = [],
    selectedClient,
    onClientChange,
    onSendWhatsApp,
}: EditPostModalProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [importingTemplate, setImportingTemplate] = useState(false);
    const [activeTabPlatform, setActiveTabPlatform] = useState<string | null>(null);

    const [schedulingReview, setSchedulingReview] = useState(false);
    const [correctionDescription, setCorrectionDescription] = useState("");

    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const isClient = userRole === 'client';

    const activeClientId = formData.client || selectedClient;
    const { subscription } = useSubscription(activeClientId ? Number(activeClientId) : null);

    const planName = typeof subscription?.plan_price === 'object' ? (subscription.plan_price as any).plan_name?.toLowerCase() : '';
    const allowedNetworks = planName?.includes('instagram + linkedin') ? ['instagram', 'linkedin'] : planName?.includes('linkedin') ? ['linkedin'] : planName?.includes('instagram') ? ['instagram'] : ['instagram', 'linkedin'];

    const allowedFormats = formats.filter(f => allowedNetworks.includes(f.platform.toLowerCase()));

    useEffect(() => {
        let objectUrl: string | null = null;

        if (selectedImage) {
            const ext = selectedImage.split('?')[0].split('.').pop()?.toLowerCase();
            if (ext === 'pdf') {
                fetch(selectedImage)
                    .then(res => res.blob())
                    .then(blob => {
                        objectUrl = URL.createObjectURL(blob);
                        setPdfBlobUrl(objectUrl);
                    })
                    .catch(e => console.error("Failed to load PDF blob", e));
            } else {
                setPdfBlobUrl(null);
            }
        } else {
            setPdfBlobUrl(null);
        }

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [selectedImage]);

    // Filter media for current post and preserve link ID
    const attachedMediaDetails = currentPostId
        ? postMedias
            .filter(pm => pm.post === currentPostId)
            .map(pm => {
                const media = medias.find(m => m.id === pm.media);
                return media ? { ...media, linkId: pm.id } : null;
            })
            .filter(Boolean) as (Media & { linkId: number })[]
        : [];

    const getStatusLabel = (status: number) => {
        switch (status) {
            case 1: return { label: "RASCUNHO", color: "bg-gray-100 text-gray-600" };
            case 2: return { label: "AGENDADO", color: "bg-gray-200 text-gray-800" };
            case 3: return { label: "PUBLICADO", color: "bg-blue-100 text-blue-800" };
            case 4: return { label: "CANCELADO", color: "bg-indigo-100 text-indigo-800" };
            case 5: return { label: "A CRIAR", color: "bg-orange-100 text-orange-800" };
            case 6: return { label: "APROVADO", color: "bg-yellow-100 text-yellow-800" };
            case 7: return { label: "REJEITADO", color: "bg-teal-100 text-teal-800" };
            case 8: return { label: "EM REVISÃO", color: "bg-cyan-100 text-cyan-800" };
            case 9: return { label: "PAUSADO", color: "bg-purple-100 text-purple-800" };
            case 10: return { label: "AGUARDANDO", color: "bg-green-100 text-green-800" };
            case 11: return { label: "FINALIZADO", color: "bg-red-100 text-red-800" };
            case 12: return { label: "ENVIADO", color: "bg-red-100 text-red-800" };
            case 13: return { label: "ERROR", color: "bg-red-100 text-red-800" };
            case 14: return { label: "SUBINDO", color: "bg-red-100 text-red-800" };
            case 15: return { label: "PUBLICANDO", color: "bg-red-100 text-red-800" };
            default: return { label: "DESCONHECIDO", color: "bg-gray-100 text-gray-800" };
        }
    };

    const statusInfo = getStatusLabel(formData.status);

    // Helper to determine media type
    const getMediaType = (url: string) => {
        const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
        if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext || '')) return 'video';
        if (['pdf'].includes(ext || '')) return 'pdf';
        return 'unknown';
    };

    const renderMediaThumbnail = (media: Media & { linkId: number }) => {
        const type = getMediaType(media.media);

        switch (type) {
            case 'video':
                return (
                    <video
                        src={media.media}
                        className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(media.media)}
                    />
                );
            case 'pdf':
                return (
                    <div
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors p-2"
                        onClick={() => setSelectedImage(media.media)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span className="text-xs text-gray-600 font-medium text-center truncate w-full break-all">
                            {media.media.split('/').pop()}
                        </span>
                    </div>
                );
            default: // image
                return (
                    <img
                        src={media.media}
                        alt="Post media"
                        className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(media.media)}
                    />
                );
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-[1000px] mx-4 sm:mx-auto">
                <div className="w-full bg-white rounded-2xl p-4 sm:p-6 dark:bg-gray-900 flex flex-col lg:flex-row gap-8 max-h-[90vh] overflow-y-auto">
                    {/* Main Content (Left) */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6 lg:hidden">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Status:</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
                            {isClient ? "Visualizar Post" : "Editar Post"}
                        </h3>
                        <form id="edit-post-form" onSubmit={onSubmit} className="space-y-6">
                            {!isClient && clients && onClientChange && (
                                <div>
                                    <Label>Cliente</Label>
                                    <Select
                                        options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                                        placeholder="Selecione um cliente"
                                        defaultValue={selectedClient}
                                        onChange={onClientChange}
                                        className="w-full"
                                    />
                                </div>
                            )}
                            <div>
                                <Label>Assunto</Label>
                                <Input
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isClient}
                                />
                            </div>
                            <div>
                                <Label>Título (Opcional)</Label>
                                <Input
                                    name="title"
                                    value={formData.title || ''}
                                    onChange={handleInputChange}
                                    disabled={isClient}
                                />
                            </div>

                            {/* Media Display */}
                            {attachedMediaDetails.length > 0 && (
                                <div>
                                    <Label>Mídia Vinculada</Label>
                                    <div className="grid grid-cols-3 gap-3 mt-1">
                                        {attachedMediaDetails.map(media => (
                                            <div key={media.id} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                                                {renderMediaThumbnail(media)}
                                                {!isClient && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeleteMediaLink(media.linkId)}
                                                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-100 transition-all"
                                                        title="Remover mídia"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isClient && (
                                <div>
                                    <Label>Adicionar Mídia</Label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            multiple
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
                                            onChange={onUploadMedia}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">As imagens serão salvas automaticamente ao selecionar.</p>
                                </div>
                            )}

                            {/* Canva Template Import */}
                            {!isClient && formData.template_link && onImportTemplate && (
                                <div className="rounded-xl border border-brand-200 dark:border-brand-500/30 bg-brand-50/50 dark:bg-brand-500/5 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">Template Canva vinculado</p>
                                            <a
                                                href={formData.template_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-brand-500 hover:underline truncate block max-w-full"
                                            >
                                                {formData.template_link}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-end gap-3">
                                        <div className="flex-1">
                                            <Label>Página do Template</Label>
                                            <Input
                                                type="number"
                                                name="template_page"
                                                placeholder="Página (ex: 1)"
                                                value={formData.template_page}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={importingTemplate || !formData.template_page || Number(formData.template_page) <= 0}
                                            title={!formData.template_page ? "Informe o número da página para baixar" : ""}
                                            onClick={async () => {
                                                setImportingTemplate(true);
                                                try {
                                                    await onImportTemplate(Number(formData.template_page));
                                                } finally {
                                                    setImportingTemplate(false);
                                                }
                                            }}
                                            className="h-11 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2"
                                        >
                                            {importingTemplate ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                    </svg>
                                                    Importando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Baixar Imagem
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label>Conteúdo</Label>
                                <textarea
                                    name="content"
                                    rows={8}
                                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                                    value={formData.content}
                                    onChange={handleInputChange as any}
                                    required
                                    disabled={isClient}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Data</Label>
                                    <Flatpickr
                                        value={formData.post_date}
                                        onChange={([date]) => {
                                            const value = date ? date.toISOString().split('T')[0] : "";
                                            handleInputChange({ target: { name: 'post_date', value } } as any);
                                        }}
                                        options={{
                                            locale: Portuguese,
                                            dateFormat: "Y-m-d",
                                            altInput: true,
                                            altFormat: "d/m/Y",
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                                        placeholder="Selecione a data"
                                        disabled={isClient}
                                    />
                                </div>
                                <div>
                                    <Label>Hora</Label>
                                    <Flatpickr
                                        value={formData.post_time}
                                        onChange={([date]) => {
                                            if (date) {
                                                const hours = String(date.getHours()).padStart(2, '0');
                                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                                const value = `${hours}:${minutes}`;
                                                handleInputChange({ target: { name: 'post_time', value } } as any);
                                            } else {
                                                handleInputChange({ target: { name: 'post_time', value: "" } } as any);
                                            }
                                        }}
                                        options={{
                                            enableTime: true,
                                            noCalendar: true,
                                            dateFormat: "H:i",
                                            time_24hr: true,
                                            locale: Portuguese,
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                                        placeholder="Selecione a hora"
                                        disabled={isClient}
                                    />
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                <Label>Plataforma e Formato</Label>

                                <div className="flex flex-wrap gap-2 mb-3 mt-1">
                                    {Array.from(new Set(allowedFormats.map(f => f.platform))).map(plat => {
                                        const actualPlat = allowedFormats.find(f => f.id === Number(formData.post_format))?.platform;
                                        const currentPlat = activeTabPlatform || actualPlat || (allowedFormats.length > 0 ? Array.from(new Set(allowedFormats.map(fm => fm.platform)))[0] : '');
                                        const isSelected = currentPlat === plat;
                                        return (
                                            <button
                                                key={plat}
                                                type="button"
                                                disabled={isClient}
                                                onClick={() => {
                                                    setActiveTabPlatform(plat);
                                                    // Limpa a seleção do formato ao trocar de plataforma
                                                    handleInputChange({ target: { name: 'post_format', value: '' } } as any);
                                                }}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${isSelected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                            >
                                                {plat}
                                            </button>
                                        );
                                    })}
                                </div>

                                <select
                                    name="post_format"
                                    className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-gray-800"
                                    value={formData.post_format || ''}
                                    onChange={(e) => {
                                        setActiveTabPlatform(null);
                                        handleInputChange(e as any);
                                    }}
                                    required
                                    disabled={isClient}
                                >
                                    <option value="" disabled>Selecione um formato...</option>
                                    {allowedFormats
                                        .filter(f => {
                                            const actualPlat = allowedFormats.find(fmt => fmt.id === Number(formData.post_format))?.platform;
                                            const currentPlat = activeTabPlatform || actualPlat || (allowedFormats.length > 0 ? Array.from(new Set(allowedFormats.map(fm => fm.platform)))[0] : '');
                                            return f.platform === currentPlat;
                                        })
                                        .map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                </select>
                            </div>

                            {/* Correction Info for Admin */}
                            {!isClient && formData.status === 12 && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl dark:bg-red-500/10 dark:border-red-500/30">
                                    <h5 className="text-sm font-bold text-red-800 dark:text-red-400 mb-1">Ajuste solicitado pelo cliente:</h5>
                                    <p className="text-sm text-red-700 dark:text-red-300">{formData.correction_description || "Nenhuma descrição fornecida."}</p>
                                </div>
                            )}

                            {/* Correction Input for Client */}
                            {isClient && formData.status === 5 && (
                                <div className="mt-4">
                                    <Label>Descrição do ajuste solicitado (opcional)</Label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        placeholder="Descreva o que precisa ser ajustado..."
                                        value={correctionDescription}
                                        onChange={(e) => setCorrectionDescription(e.target.value)}
                                    />
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Sidebar Actions (Right) */}
                    <div className="w-full lg:w-72 flex flex-col gap-4 border-l border-gray-100 dark:border-gray-800 pl-0 lg:pl-8">

                        {/* Status Badge Desktop */}
                        <div className="hidden lg:flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-lg">Status:</span>
                            <span className={`px-3 py-1 rounded-md text-sm font-bold uppercase ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>

                        {/* Template Link Banner */}
                        {formData.template_link && (
                            <div className="rounded-xl border border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10 p-3 mb-1">
                                <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">Template disponível</p>
                                <a
                                    href={formData.template_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium truncate"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    <span className="truncate">Abrir no Canva</span>
                                </a>
                                {formData.calendar_template_page && (
                                    <p className="mt-1 text-[11px] text-brand-500 dark:text-brand-400">
                                        Página: <span className="font-bold">{formData.calendar_template_page}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 w-full">

                            {isClient ? (
                                <>
                                    <Button
                                        className="w-full bg-green-500 hover:bg-green-600 text-white justify-start"
                                        startIcon={<CheckLineIcon className="w-5 h-5" />}
                                        onClick={() => { if (onPublish) onPublish(); else onStatusAction(10); }} // Force Publish (was 3 - Agendar)
                                        disabled={loading}
                                    >
                                        Aprovar e Publicar
                                    </Button>

                                    <Button
                                        className="w-full bg-red-500 hover:bg-red-600 text-white justify-start"
                                        startIcon={<CloseIcon className="w-5 h-5" />}
                                        onClick={() => {
                                            // Pass special string 'correction' alongside the ID 12 or use a dedicated handler
                                            (onStatusAction as any)(12, correctionDescription);
                                        }}
                                        disabled={loading}
                                    >
                                        Solicitar ajuste
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        className="w-full bg-[#7ACAC9] hover:bg-[#68b0af] text-white justify-start"
                                        startIcon={<CheckLineIcon className="w-5 h-5" />}
                                        onClick={() => document.getElementById('edit-post-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                                        disabled={loading}
                                    >
                                        Salvar
                                    </Button>


                                    <Button
                                        className="w-full bg-[#7ACAC9] hover:bg-[#68b0af] text-white justify-start"
                                        startIcon={<TimeIcon className="w-5 h-5" />}
                                        onClick={() => onStatusAction(6)} // Pausado
                                        disabled={loading}
                                    >
                                        Pausar envio
                                    </Button>

                                    <Button
                                        className="w-full bg-[#7ACAC9] hover:bg-[#68b0af] text-white justify-start"
                                        startIcon={<TaskIcon className="w-5 h-5" />}
                                        onClick={() => { if (onSendWhatsApp) onSendWhatsApp(); else onStatusAction(5); }} // Pendente (Para Revisão)
                                        disabled={loading}
                                    >
                                        Enviar Para Revisão
                                    </Button>

                                    {/* Agendar Revisão — usa data/hora do post, envia via ManyChat */}
                                    <Button
                                        className="w-full bg-[#7ACAC9] hover:bg-[#68b0af] text-white justify-start"
                                        startIcon={<CalenderIcon className="w-5 h-5" />}
                                        disabled={loading || schedulingReview || !formData.post_date || !formData.post_time}
                                        onClick={async () => {
                                            if (!currentPostId || !formData.post_date || !formData.post_time) {
                                                alert('O post precisa ter data e hora definidas para agendar a revisão.');
                                                return;
                                            }

                                            setSchedulingReview(true);
                                            try {
                                                const res = await fetch(`/api/v1/post/update/${currentPostId}/`, {
                                                    method: 'PATCH',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': API_KEY,
                                                    },
                                                    body: JSON.stringify({
                                                        status: 2
                                                    }),
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    alert(`✅ Post enviado para revisão`);
                                                } else {
                                                    alert(`Erro: ${data.error || 'Não foi possível enviar.'}`);
                                                }
                                            } catch {
                                                alert('Erro de conexão ao enviar post.');
                                            } finally {
                                                setSchedulingReview(false);
                                            }
                                        }}
                                    >
                                        {schedulingReview ? 'Agendando...' : 'Agendar Revisão'}
                                    </Button>

                                    <Button
                                        className="w-full bg-[#7ACAC9] hover:bg-[#68b0af] text-white justify-start"
                                        startIcon={<PaperPlaneIcon className="w-5 h-5" />}
                                        onClick={() => { if (onPublish) onPublish(); else onStatusAction(10); }} // Use onPublish if available
                                        disabled={loading}
                                    >
                                        Publicar
                                    </Button>

                                    <Button
                                        className="w-full bg-slate-500 hover:bg-slate-600 text-white justify-start"
                                        startIcon={<CloseIcon className="w-5 h-5" />}
                                        onClick={() => onStatusAction(11)} // Cancelado
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Lightbox */}
            {selectedImage && createPortal(
                <div
                    className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="absolute top-4 right-4 flex gap-4">
                        <a
                            href={selectedImage}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-gray-300 pointer-events-auto"
                            title="Baixar mídia"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </a>
                        <button
                            className="text-white hover:text-gray-300 pointer-events-auto"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {getMediaType(selectedImage) === 'video' ? (
                        <video
                            src={selectedImage}
                            controls
                            autoPlay
                            className="max-h-full max-w-full rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : getMediaType(selectedImage) === 'pdf' ? (
                        <iframe
                            src={pdfBlobUrl || selectedImage}
                            className="w-full h-[80vh] max-w-4xl bg-white rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                            title="PDF Viewer"
                        />
                    ) : (
                        <img
                            src={selectedImage}
                            alt="Full screen view"
                            className="max-h-full max-w-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>,
                document.body
            )}
        </>
    );
}
