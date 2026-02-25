import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { TrashBinIcon } from "../../icons";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Select from "../../components/form/Select";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../hooks/authHook";

interface Media {
    id: number;
    client_hash: string;
    media_path: string;
    media: string;
    created_at: string;
    updated_at: string;
    user: number;
}

interface Client {
    id: number;
    name: string;
    email: string;
    user: number;
}

export default function MediaLibrary() {
    const { user } = useAuth();
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientUserId, setSelectedClientUserId] = useState<string>("");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const isAdmin = user?.role === 'admin' || user?.is_superuser || user?.is_staff;

    // Fetch Clients (only if Admin)
    useEffect(() => {
        if (isAdmin) {
            const fetchClients = async () => {
                try {
                    const response = await fetch("/api/v1/client/list/", {
                        headers: { Authorization: API_KEY },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setClients(data);

                        const clientIdParam = searchParams.get('client_id');
                        if (clientIdParam) {
                            const foundClient = data.find((c: Client) => c.id === Number(clientIdParam));
                            if (foundClient) {
                                setSelectedClientUserId(String(foundClient.user));
                                return;
                            }
                        }

                        if (data.length > 0 && !selectedClientUserId) {
                            setSelectedClientUserId(String(data[0].user));
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch clients", e);
                }
            };
            fetchClients();
        } else {
            if (user) {
                setSelectedClientUserId(String(user.id));
            }
        }
    }, [isAdmin, user, searchParams]);

    // Fetch Media
    useEffect(() => {
        if (!selectedClientUserId) {
            setMediaList([]);
            return;
        }

        const fetchMedia = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/v1/media/list/?user_id=${selectedClientUserId}`, {
                    headers: { Authorization: API_KEY },
                });
                if (response.ok) {
                    const data = await response.json();
                    setMediaList(data);
                } else {
                    setMediaList([]);
                }
            } catch (e) {
                console.error(e);
                setMediaList([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMedia();
    }, [selectedClientUserId]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja apagar esta imagem?")) return;

        try {
            const response = await fetch(`/api/v1/media/${id}/`, {
                method: "DELETE",
                headers: {
                    Authorization: API_KEY,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setMediaList((prev) => prev.filter((m) => m.id !== id));
                if (selectedMedia?.id === id) {
                    setSelectedMedia(null);
                }
            } else {
                alert("Erro ao apagar imagem.");
            }
        } catch (e) {
            alert("Erro ao apagar imagem.");
        }
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadError(null);
        setUploadSuccess(null);

        let successCount = 0;
        let errorCount = 0;

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append("media", file);

            try {
                const response = await fetch("/api/v1/media/create/", {
                    method: "POST",
                    headers: { Authorization: API_KEY },
                    body: formData,
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error("Upload failed for", file.name);
                }
            } catch (e) {
                errorCount++;
                console.error("Upload error for", file.name, e);
            }
        }

        setUploading(false);

        if (successCount > 0) {
            setUploadSuccess(`${successCount} imagem(ns) enviada(s) com sucesso!`);
            // Refresh the media list
            if (selectedClientUserId) {
                const response = await fetch(`/api/v1/media/list/?user_id=${selectedClientUserId}`, {
                    headers: { Authorization: API_KEY },
                });
                if (response.ok) setMediaList(await response.json());
            }
        }
        if (errorCount > 0) {
            setUploadError(`${errorCount} imagem(ns) com falha no envio.`);
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const clientOptions = clients.map(c => ({ value: String(c.user), label: c.name }));

    return (
        <>
            <PageMeta title="Minhas Imagens | Miggo" description="Faça upload e gerencie suas imagens" />
            <PageBreadcrumb pageTitle="Minhas Imagens" />

            <div className="space-y-6">

                {/* Filtro por cliente (Admin only) */}
                {isAdmin && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="max-w-md">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Selecione um Cliente
                            </label>
                            <Select
                                options={clientOptions}
                                onChange={(value) => setSelectedClientUserId(value)}
                                placeholder="Selecione um cliente..."
                                defaultValue={selectedClientUserId}
                            />
                        </div>
                    </div>
                )}

                {/* Upload Box */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Enviar Imagens</h3>

                    {/* Drag & Drop zone */}
                    <div
                        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            handleUpload(e.dataTransfer.files);
                        }}
                    >
                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Arraste e solte suas imagens aqui, ou{" "}
                            <span className="text-brand-500 hover:text-brand-600 cursor-pointer">clique para selecionar</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF, WEBP até qualquer tamanho</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files)}
                        />
                    </div>

                    {/* Upload status */}
                    {uploading && (
                        <div className="mt-3 flex items-center gap-2 text-brand-600 dark:text-brand-400 text-sm">
                            <div className="border-gray-300 h-4 w-4 animate-spin rounded-full border-2 border-t-brand-500" />
                            Enviando imagens...
                        </div>
                    )}
                    {uploadSuccess && (
                        <p className="mt-3 text-sm font-medium text-green-600 dark:text-green-400">{uploadSuccess}</p>
                    )}
                    {uploadError && (
                        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{uploadError}</p>
                    )}
                </div>

                {/* Gallery */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Galeria
                        {mediaList.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                ({mediaList.length} imagem{mediaList.length > 1 ? "ns" : ""})
                            </span>
                        )}
                    </h3>

                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="border-gray-300 h-8 w-8 animate-spin rounded-full border-4 border-t-brand-500" />
                        </div>
                    )}

                    {!loading && mediaList.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <svg className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Nenhuma imagem encontrada. Faça upload das suas imagens acima!
                        </div>
                    )}

                    {!loading && mediaList.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {mediaList.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer"
                                    onClick={() => setSelectedMedia(item)}
                                >
                                    <img
                                        src={item.media}
                                        alt={`Imagem ${item.id}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-white">
                                        <div className="flex justify-end">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id);
                                                }}
                                                className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
                                                title="Apagar imagem"
                                            >
                                                <TrashBinIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs font-medium truncate">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Viewer Modal */}
            <Modal
                isOpen={!!selectedMedia}
                onClose={() => setSelectedMedia(null)}
                className="max-w-4xl w-full p-0 overflow-hidden bg-transparent shadow-none"
                showCloseButton={false}
            >
                <div className="relative flex justify-center items-center bg-black/90 p-4 rounded-xl">
                    <button
                        onClick={() => setSelectedMedia(null)}
                        className="absolute right-4 top-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    {selectedMedia && (
                        <button
                            onClick={() => handleDelete(selectedMedia.id)}
                            className="absolute left-4 top-4 z-50 p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                            title="Apagar imagem"
                        >
                            <TrashBinIcon className="w-6 h-6" />
                        </button>
                    )}
                    {selectedMedia && (
                        <img
                            src={selectedMedia.media}
                            alt="Visualização"
                            className="max-h-[85vh] max-w-full object-contain rounded-lg"
                        />
                    )}
                </div>
            </Modal>
        </>
    );
}
