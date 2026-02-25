import { useState, useEffect } from "react";
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
    id: number; // This is the Profile ID usually, but we need User ID for the filter
    name: string;
    email: string;
    user: number; // Linked User ID
}

export default function MediaLibrary() {
    const { user } = useAuth();
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientUserId, setSelectedClientUserId] = useState<string>("");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();

    // Using the API Key found in other files
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

                        // Check for client_id in URL
                        const clientIdParam = searchParams.get('client_id');
                        if (clientIdParam) {
                            const foundClient = data.find((c: Client) => c.id === Number(clientIdParam));
                            if (foundClient) {
                                setSelectedClientUserId(String(foundClient.user));
                                return; // Skip default selection
                            }
                        }

                        // If there are clients, maybe select the first one by default?
                        // Or leave it empty to force selection.
                        // Let's leave it empty unless we want to autoshow something.
                        if (data.length > 0 && !selectedClientUserId) {
                            // If no param and no existing selection, default to first?
                            // Prompt didn't specify default behavior for admin, but previous code did this:
                            setSelectedClientUserId(String(data[0].user));
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch clients", e);
                }
            };
            fetchClients();
        } else {
            // If not admin, the user acts as the client
            if (user) {
                setSelectedClientUserId(String(user.id));
            }
        }
    }, [isAdmin, user, searchParams]);

    // Fetch Media
    useEffect(() => {
        // If no user selected (and is admin), don't fetch anything or allow "all"? 
        // Prompt says: "Admin deve poder escolher de quem ele quer ver". 
        // It implies viewing one user's media.
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
                    console.error("Failed to fetch media");
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
        if (!window.confirm("Tem certeza que deseja apagar esta mídia?")) return;

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
                console.error("Failed to delete media");
                alert("Erro ao apagar mídia.");
            }
        } catch (e) {
            console.error("Error deleting media:", e);
            alert("Erro ao apagar mídia.");
        }
    };

    // Map clients to options for the Select component
    // Value is the USER ID, Label is the Name
    const clientOptions = clients.map(c => ({ value: String(c.user), label: c.name }));

    return (
        <>
            <PageMeta title="Biblioteca de Mídia | Miggo" description="Visualize a biblioteca de mídia" />
            <PageBreadcrumb pageTitle="Biblioteca de Mídia" />

            <div className="space-y-6">
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

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Arquivos</h3>

                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="border-gray-300 h-8 w-8 animate-spin rounded-full border-4 border-t-brand-500" />
                        </div>
                    )}

                    {!loading && mediaList.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            Nenhuma mídia encontrada para este usuário.
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
                                        alt={`Media ${item.id}`}
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
                                                title="Apagar mídia"
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

            {/* Media Viewer Modal */}
            <Modal
                isOpen={!!selectedMedia}
                onClose={() => setSelectedMedia(null)}
                className="max-w-4xl w-full p-0 overflow-hidden bg-transparent shadow-none"
                showCloseButton={false} // We can add our own or use the default. Default puts it in top right of 'content'. 
            // But since we want image centric, maybe we want custom styling. 
            // Let's rely on default close button but style the container to be transparent if possible?
            // The Modal component forces white/bg-gray-900 on 'contentClasses' unless isFullscreen.
            // Let's use standard modal style first, it's safer.
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
                            title="Apagar mídia"
                        >
                            <TrashBinIcon className="w-6 h-6" />
                        </button>
                    )}
                    {selectedMedia && (
                        <img
                            src={selectedMedia.media}
                            alt="Full view"
                            className="max-h-[85vh] max-w-full object-contain rounded-lg"
                        />
                    )}
                </div>
            </Modal>
        </>
    );
}
