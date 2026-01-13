import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { PlusIcon, AngleLeftIcon, AngleRightIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";

import Label from "../../components/form/Label";
import KanbanColumn from "./KanbanColumn";
import CreatePostModal from "./CreatePostModal";
import EditPostModal from "./EditPostModal";

interface Post {
    id: number;
    subject: string;
    content: string;
    post_date: string;
    post_time: string;
    media: string | null;
    client: number;
    post_format?: number;
    status?: number;
}

interface Client {
    id: number;
    name: string;
}

export interface Format {
    id: number;
    name: string;
    description: string;
    platform: string;
}

export interface Media {
    id: number;
    media: string;
    media_path?: string;
    client_hash?: string;
    // user?
}

export interface PostMediaLink {
    id: number;
    post: number;
    media: number;
}

export default function ContentKanban() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [formats, setFormats] = useState<Format[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize date from URL or default to today
    const [currentDate, setCurrentDate] = useState(() => {
        const dateParam = searchParams.get('date');
        return dateParam ? new Date(dateParam) : new Date();
    });

    // Initialize client from URL (will be validated against fetched clients later)
    const [selectedClient, setSelectedClient] = useState<number | "">(() => {
        const clientParam = searchParams.get('client_id');
        return clientParam ? Number(clientParam) : "";
    });

    // Modal
    const { isOpen, openModal, closeModal } = useModal();
    // State for create form including optional file
    const [formData, setFormData] = useState({
        subject: "",
        content: "",
        post_date: "",
        post_time: "",
        status: 2, // Default draft
        post_format: "" as number | "",
    });
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);



    // Edit and Delete Modal States
    const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const [currentPost, setCurrentPost] = useState<Post | null>(null);

    // Edit Form Data
    const [editFormData, setEditFormData] = useState({
        subject: "",
        content: "",
        post_date: "",
        post_time: "",
        status: 2,
        post_format: "" as number | "",
    });

    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

    const [medias, setMedias] = useState<Media[]>([]);
    const [postMedias, setPostMedias] = useState<PostMediaLink[]>([]);

    // ... Date calculations
    const getWeekDaysForDate = (baseDate: Date) => {
        const curr = new Date(baseDate); // Copy to avoid mutation
        const first = curr.getDate() - curr.getDay(); // Sunday
        const days = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(curr.getTime());
            next.setDate(first + i); // Correct logic: reset to 'first' then add 'i'
            // We need to ensure we are working with the correct month/year rollover
            // Simple way:
            const d = new Date(curr);
            d.setDate(first + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const weekDates = getWeekDaysForDate(currentDate);
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    const handlePrevWeek = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() - 7);
            return newDate;
        });
    };

    const handleNextWeek = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + 7);
            return newDate;
        });
    };

    useEffect(() => {
        fetchClients();
        fetchFormats();
        fetchMedias();
        fetchPostMedias();
    }, []);

    // Effect to select first client if none selected and no URL param (optional, or kept in fetchClients)
    // Actually, let's modify fetchClients to respect existing state if valid


    useEffect(() => {
        // Sync state to URL
        const params: any = {};
        if (selectedClient) params.client_id = String(selectedClient);
        if (currentDate) params.date = currentDate.toISOString().split('T')[0];
        setSearchParams(params);

        if (selectedClient) {
            fetchPosts();
        } else {
            setPosts([]);
        }
    }, [selectedClient, currentDate]); // Removed setSearchParams from dependency to avoid loop if object ref changes (though hook usually stable)

    const fetchFormats = async () => {
        try {
            const response = await fetch("/api/v1/post/format/list/", {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setFormats(data);
                // Default format? User didn't specify, likely user selects
            }
        } catch (error) {
            console.error("Error fetching formats:", error);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await fetch("/api/v1/client/list/", {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setClients(data);

                // If no client selected yet (and not in URL), select the first one
                if (!selectedClient && data.length > 0) {
                    // Check if URL has it (in case state init happened before)
                    const clientParam = searchParams.get('client_id');
                    if (!clientParam) {
                        setSelectedClient(data[0].id);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    const fetchPosts = async () => {
        if (!selectedClient) return;
        try {
            const startDate = weekDates[0];
            const endDate = weekDates[6];
            const queryParams = new URLSearchParams({
                client_id: String(selectedClient),
                start_date: startDate,
                end_date: endDate
            });

            const response = await fetch(`/api/v1/post/list/?${queryParams.toString()}`, {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    };

    const fetchMedias = async () => {
        try {
            const response = await fetch("/api/v1/media/list/", {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setMedias(data);
            }
        } catch (error) {
            console.error("Error fetching medias:", error);
        }
    };

    const fetchPostMedias = async () => {
        try {
            const response = await fetch("/api/v1/post/media-post/list/", {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setPostMedias(data);
            }
        } catch (error) {
            console.error("Error fetching post medias:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setMediaFiles(Array.from(e.target.files));
        }
    };

    const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !currentPost) return;

        const files = Array.from(e.target.files);
        setLoading(true);

        try {
            for (const file of files) {
                const formDataMedia = new FormData();
                formDataMedia.append("client", String(currentPost.client));
                formDataMedia.append("media", file);

                const mediaResponse = await fetch("/api/v1/media/create/", {
                    method: "POST",
                    headers: { Authorization: API_KEY },
                    body: formDataMedia
                });

                if (mediaResponse.ok) {
                    const mediaData = await mediaResponse.json();
                    await fetch("/api/v1/post/media-post/create/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: API_KEY,
                        },
                        body: JSON.stringify({
                            post: currentPost.id,
                            media: mediaData.id
                        })
                    });
                }
            }
            await fetchMedias();
            await fetchPostMedias();
        } catch (error) {
            console.error(error);
            alert("Erro ao fazer upload da mídia.");
        } finally {
            setLoading(false);
            // Clear input if needed, though React state reset handles UI
            e.target.value = "";
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!selectedClient) {
                alert("Selecione um cliente.");
                return;
            }

            // 1. Create Post
            const postResponse = await fetch("/api/v1/post/create/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: API_KEY,
                },
                body: JSON.stringify({
                    client: selectedClient,
                    subject: formData.subject,
                    content: formData.content,
                    post_date: formData.post_date,
                    post_time: formData.post_time,
                    status: formData.status,
                    post_format: formData.post_format
                }),
            });

            if (!postResponse.ok) throw new Error("Failed to create post");
            const postData = await postResponse.json();

            if (mediaFiles.length > 0) {
                for (const file of mediaFiles) {
                    const formDataMedia = new FormData();
                    formDataMedia.append("client", String(selectedClient));
                    formDataMedia.append("media", file);

                    const mediaResponse = await fetch("/api/v1/media/create/", {
                        method: "POST",
                        headers: {
                            Authorization: API_KEY,
                        },
                        body: formDataMedia
                    });

                    if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        await fetch("/api/v1/post/media-post/create/", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: API_KEY,
                            },
                            body: JSON.stringify({
                                post: postData.id,
                                media: mediaData.id
                            })
                        });
                    }
                }
            }

            await fetchPosts();
            await fetchMedias();
            await fetchPostMedias();
            closeModal();
            setFormData({ subject: "", content: "", post_date: "", post_time: "", status: 2, post_format: "" });
            setMediaFiles([]); // Reset file input

        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            alert("Erro ao criar post: " + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const movePost = async (id: number, date: string) => {
        // Optimistic update
        setPosts(prevPosts => {
            return prevPosts.map(p => p.id === id ? { ...p, post_date: date } : p);
        });

        try {
            await fetch(`/api/v1/post/update/${id}/`, { // Assuming generic update or specific endpoint
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: API_KEY,
                },
                body: JSON.stringify({ post_date: date })
            });
            // Ideally refetch or handle error revert
        } catch (error) {
            console.error("Failed to move post", error);
            // Revert state if needed
            fetchPosts();
        }
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const openEditPost = (post: Post) => {
        setCurrentPost(post);
        setEditFormData({
            subject: post.subject,
            content: post.content,
            post_date: post.post_date,
            post_time: post.post_time,
            status: post.status || 2,
            post_format: post.post_format || "" as any
        });
        openEditModal();
    };

    const openDeletePost = (post: Post) => {
        setCurrentPost(post);
        openDeleteModal();
    };

    const performUpdatePost = async (data: any) => {
        if (!currentPost) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/post/update/${currentPost.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: API_KEY,
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error("Failed to update post");

            await fetchPosts();
            await fetchMedias(); // Refresh medias list to include newly uploaded files
            await fetchPostMedias(); // Refresh links
            closeEditModal();
        } catch (err: any) {
            alert("Error updating post: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        await performUpdatePost(editFormData);
    };

    const handleStatusAction = async (status: number) => {
        const newData = { ...editFormData, status };
        setEditFormData(newData);
        await performUpdatePost(newData);
    };

    const handleDeletePost = async () => {
        if (!currentPost) return;
        try {
            const response = await fetch(`/api/v1/post/delete/${currentPost.id}/`, {
                method: "DELETE",
                headers: { Authorization: API_KEY },
            });

            if (!response.ok) throw new Error("Failed to delete post");
            await fetchPosts();
            closeDeleteModal();
        } catch (err: any) {
            alert("Error deleting post: " + err.message);
        }
    };

    const handleDeleteMediaLink = async (linkId: number) => {
        if (!confirm("Tem certeza que deseja remover esta mídia deste post?")) return;
        try {
            const response = await fetch(`/api/v1/post/media-post/delete/${linkId}/`, {
                method: "DELETE",
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                await fetchPostMedias(); // Refresh links
            } else {
                alert("Erro ao remover mídia");
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao remover mídia");
        }
    };



    return (
        <DndProvider backend={HTML5Backend}>
            <PageMeta title="Conteúdos | Miggo" description="Kanban de conteúdos" />
            <PageBreadcrumb pageTitle="Conteúdos" />

            <div className="flex flex-col h-[calc(100vh-200px)]">
                <div className="flex justify-between items-center mb-6">
                    <div className="w-64">
                        <Label>Cliente</Label>
                        <select
                            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(Number(e.target.value))}
                        >
                            <option value="" disabled>Selecione...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name} </option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                        <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                            <AngleLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {new Date(weekDates[0] + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            {" - "}
                            {new Date(weekDates[6] + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <button onClick={handleNextWeek} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                            <AngleRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <Button onClick={openModal} startIcon={<PlusIcon className="size-5" />}>
                        Novo Post
                    </Button>
                </div>


                <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
                    {weekDates.map((date, index) => (
                        <KanbanColumn
                            key={date}
                            date={date}
                            dayName={dayNames[index]}
                            posts={posts.filter(p => p.post_date === date && (selectedClient ? p.client === selectedClient : true))}
                            onMovePost={movePost}
                            onEdit={openEditPost}
                            onDelete={openDeletePost}
                        />
                    ))}
                </div>
            </div>

            {/* Create Modal */}
            {/* Create Modal */}
            <CreatePostModal
                isOpen={isOpen}
                onClose={closeModal}
                onSubmit={handleCreatePost}
                formData={formData}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                loading={loading}
                formats={formats}
                mediaFiles={mediaFiles}
            />

            {/* Edit Modal */}
            <EditPostModal
                isOpen={isEditOpen}
                onClose={closeEditModal}
                onSubmit={handleUpdatePost}
                formData={editFormData}
                handleInputChange={handleEditInputChange}
                loading={loading}
                formats={formats}
                medias={medias}
                postMedias={postMedias}
                onUploadMedia={handleUploadMedia}
                currentPostId={currentPost?.id}
                onDeleteMediaLink={handleDeleteMediaLink}
                onStatusAction={handleStatusAction}
            />

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} className="max-w-[400px] m-4">
                <div className="w-full bg-white rounded-2xl p-6 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Excluir Post</h3>
                    <p className="text-gray-500 mb-6">Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={closeDeleteModal} type="button">Cancelar</Button>
                        <Button onClick={handleDeletePost} className="bg-error-500 hover:bg-error-600 text-white">Excluir</Button>
                    </div>
                </div>
            </Modal>
        </DndProvider >
    );
}
