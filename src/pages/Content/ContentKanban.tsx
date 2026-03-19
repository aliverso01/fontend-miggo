import { useState, useEffect, useRef, useMemo } from "react";
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
import Select from "../../components/form/Select";
import KanbanColumn from "./KanbanColumn";
import CreatePostModal from "./CreatePostModal";
import EditPostModal from "./EditPostModal";
import PostCardClient from "./PostCardClient";
import { useAuthContext } from "../../context/AuthContext";
import { useSearch } from "../../context/SearchContext";

export interface Post {
    id: number;
    subject: string;
    title?: string;
    content: string;
    post_date: string;
    post_time: string;
    media: string | null;
    client: number;
    post_format?: number | null;    // formato escolhido para publicação (null até o usuário escolher)
    suggested_formats?: number[];   // todos os formatos sugeridos pelo calendário
    status: string | number;
    calendar_id?: number | null;
    editorial_calendar?: number | null;
    template_link?: string;
    template_page?: string | null;
    correction_description?: string;
}

export interface Client {
    id: number;
    name: string;
    user: number;
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

export interface PostStatus {
    id: number;
    name: string;
    description: string;
    color?: string;
}

export const resolveStatusStyle = (statusValue: string | number | undefined, statuses: PostStatus[]) => {
    // Padronizar posts sem status (null, undefined, 0, "") para 'draft' (Rascunho)
    if (!statusValue) {
        statusValue = 'draft';
    }
    
    let statusObj = statuses.find(s => String(s.id) === String(statusValue) || s.name.toLowerCase() === String(statusValue).toLowerCase());
    
    // Se ainda assim não achar no array da API (ex: array não carregou ainda ou ID obsoleto), criamos um mockup de rascunho temporário
    if (!statusObj) {
        if (statusValue === 'draft' || statusValue === 1 || statusValue === 2) {
             statusObj = { id: 0, name: 'draft', description: 'Rascunho' };
        } else {
             return { label: 'DESCONHECIDO', color: 'bg-gray-100 text-gray-800' };
        }
    }

    let color = 'bg-gray-100 text-gray-800';

    const nameLower = statusObj.name.toLowerCase();
    
    if (nameLower.includes('draft') || nameLower.includes('criar')) color = 'bg-gray-100 text-gray-600';
    else if (nameLower.includes('scheduled')) color = 'bg-gray-200 text-gray-800';
    else if (nameLower.includes('published')) color = 'bg-blue-100 text-blue-800';
    else if (nameLower.includes('canceled')) color = 'bg-indigo-100 text-indigo-800';
    else if (nameLower.includes('approved')) color = 'bg-yellow-100 text-yellow-800';
    else if (nameLower.includes('rejected')) color = 'bg-teal-100 text-teal-800';
    else if (nameLower.includes('review')) color = 'bg-cyan-100 text-cyan-800';
    else if (nameLower.includes('paused')) color = 'bg-purple-100 text-purple-800';
    else if (nameLower.includes('holding') || nameLower.includes('pending')) color = 'bg-green-100 text-green-800';
    else if (nameLower.includes('finished') || nameLower.includes('sent') || nameLower.includes('error') || nameLower.includes('uploading')) color = 'bg-red-100 text-red-800';
    
    // EXIBE O DESCRIPTION EXATAMENTE COMO VEM DO ENDPOINT
    return { label: statusObj.description || statusObj.name, color };
};

export default function ContentKanban() {
    const { user } = useAuthContext();
    const { searchQuery } = useSearch();
    const isSyncing = useRef(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [formats, setFormats] = useState<Format[]>([]);
    const [statuses, setStatuses] = useState<PostStatus[]>([]);
    const [calendarRules, setCalendarRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize date from URL or default to today
    const [currentDate, setCurrentDate] = useState(() => {
        const dateParam = searchParams.get('date');
        // Append T00:00:00 to ensure local time parsing, preventing timezone day shift
        return dateParam ? new Date(dateParam + 'T00:00:00') : new Date();
    });

    // Initialize client from URL (will be validated against fetched clients later)
    const [selectedClient, setSelectedClient] = useState<number | "">(() => {
        const clientParam = searchParams.get('client_id');
        return clientParam ? Number(clientParam) : "";
    });

    const [selectedStatus, setSelectedStatus] = useState<string | "">("");
    const [selectedFormat, setSelectedFormat] = useState<number | "">("");

    // Modal
    const { isOpen, openModal, closeModal } = useModal();
    // State for create form including optional file
    const [formData, setFormData] = useState({
        subject: "",
        title: "",
        content: "",
        post_date: "",
        post_time: "",
        status: 2 as string | number, // Default draft
        post_format: "" as number | "",
    });
    // Client selected inside the create modal (independent from the Kanban filter)
    const [formClientId, setFormClientId] = useState<number | "">("");
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);



    // Edit and Delete Modal States
    const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const [currentPost, setCurrentPost] = useState<Post | null>(null);

    // Edit Form Data (template_link is injected from calendar rule, not from the post)
    const [editFormData, setEditFormData] = useState({
        subject: "",
        title: "",
        content: "",
        post_date: "",
        post_time: "",
        status: 2 as string | number, // Default draft
        post_format: "" as number | "",
        template_link: "",  // populated from calendarRules when opening a post from the calendar
        template_page: "" as number | string,
        correction_description: "",
    });

    // Enrich posts with calendar rule data (Memoized for use in effects and render)
    const enrichedPosts = useMemo(() => {
        return posts.map(p => {
            const ruleId = p.calendar_id || p.editorial_calendar;
            const rule = calendarRules.find(r => Number(r.id) === Number(ruleId));
            return {
                ...p,
                template_link: p.template_link || rule?.template_link,
                template_page: p.template_page || rule?.template_page,
            } as Post;
        });
    }, [posts, calendarRules]);

    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const [medias, setMedias] = useState<Media[]>([]);
    const [postMedias, setPostMedias] = useState<PostMediaLink[]>([]);

    // ... Date calculations
    const getWeekDaysForDate = (baseDate: Date) => {
        const curr = new Date(baseDate);

        // getDay() retorna: Dom=0, Seg=1, Ter=2, Qua=3, Qui=4, Sex=5, Sab=6
        const day = curr.getDay();

        // Ajuste para Segunda-feira ser o dia 1 e Domingo ser o dia 7
        // Se for Domingo (0), tratamos como 7 para que a conta (dia - 7 + 1) volte para a segunda anterior
        const diff = curr.getDate() - (day === 0 ? 6 : day - 1);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(curr);
            d.setDate(diff + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const weekDates = getWeekDaysForDate(currentDate);
    const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

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

    const fetchStatuses = async () => {
        try {
            const response = await fetch("/api/v1/post/status/list/", {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setStatuses(data);
            }
        } catch (error) {
            console.error("Error fetching statuses:", error);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await fetch("/api/v1/client/list/", {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                let data: Client[] = await response.json();

                // RESTRICT VIEW: If user is 'client', only show their own client
                if (user?.role === 'client') {
                    data = data.filter(c => c.user === user.id);
                }


                setClients(data);

                // Auto-selection behavior
                if (data.length > 0) {
                    const clientParam = searchParams.get('client_id');
                    let targetId = selectedClient || (clientParam ? Number(clientParam) : null);

                    const exists = data.find(c => c.id === targetId);

                    if (exists) {
                        if (targetId !== selectedClient) setSelectedClient(exists.id);
                    } else {
                        // If user is client, MUST select their account (since dropdown is hidden for them)
                        if (user?.role === 'client') {
                            setSelectedClient(data[0].id);
                        } else {
                            // Admin: Clear selection to show "All"
                            if (selectedClient !== "") setSelectedClient("");
                        }
                    }
                } else {
                    setSelectedClient("");
                }
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    // URL Deep Linking for Edit Post
    useEffect(() => {
        const editPostId = searchParams.get('edit_post');
        if (editPostId && enrichedPosts.length > 0) {
            const post = enrichedPosts.find((p: Post) => p.id === Number(editPostId));
            if (post) {
                // Add validation for status and format to avoid 0/null issues
                if (post.status === undefined) post.status = 'draft'; // Default to draft if missing

                // Small timeout to ensure hydration/render cycle matches (solves dashboard nav issue)
                setTimeout(() => {
                    openEditPost(post);
                }, 100);
            }
        }
    }, [enrichedPosts, searchParams]);

    // Sync URL params to State (Handle external navigation updates)
    useEffect(() => {
        const dateParam = searchParams.get('date');
        const clientParam = searchParams.get('client_id');

        if (dateParam) {
            // Append T00:00:00 to ensure local time parsing
            const newDate = new Date(dateParam + 'T00:00:00');
            // Compare only date part to avoid loop updates on time diffs
            if (newDate.getDate() !== currentDate.getDate() ||
                newDate.getMonth() !== currentDate.getMonth() ||
                newDate.getFullYear() !== currentDate.getFullYear()) {
                setCurrentDate(newDate);
            }
        }

        if (clientParam !== null) {
            const newClient = Number(clientParam);
            if (newClient !== selectedClient) {
                // If clientParam is present (even if 0 or empty string logic depending on use), update
                // But Number("") is 0. Our 'all' is "".
                // clientParam is string. if it's "1" -> 1.
                // If it is missing from URL, we interpret as All? No, searchParams.get returns null.
                // If clientParam is "", Number is 0.
                if (clientParam === "" && selectedClient !== "") setSelectedClient("");
                else if (newClient !== 0 && !isNaN(newClient) && newClient !== selectedClient) setSelectedClient(newClient);
            }
        } else {
            // If param removed, assume All? 
            // Existing logic initializes state from URL, but if URL param is removed while on page, should we clear selection?
            // Yes, for consistency.
            if (selectedClient !== "") setSelectedClient("");
        }

    }, [searchParams]); // Dependent only on searchParams changes

    useEffect(() => {
        if (user) {
            fetchClients();
            fetchStatuses();
            fetchFormats();
            fetchMedias();
            fetchPostMedias();
        }
    }, [user]);

    // Effect to select first client if none selected and no URL param (optional, or kept in fetchClients)
    // Actually, let's modify fetchClients to respect existing state if valid


    const fetchPosts = async () => {
        try {
            const startDate = weekDates[0];
            const endDate = weekDates[6];

            const params: any = {
                start_date: startDate,
                end_date: endDate
            };

            if (selectedClient) {
                params.client_id = String(selectedClient);
            }

            const queryParams = new URLSearchParams(params);

            const response = await fetch(`/api/v1/post/list/?${queryParams.toString()}`, {
                headers: { Authorization: API_KEY },
            });
            if (response.ok) {
                const data = await response.json();
                setPosts(data);
                return data;
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
        return [];
    };

    const syncEditorialCalendar = async (currentPosts: Post[]) => {
        if (!selectedClient || isSyncing.current) return;
        isSyncing.current = true;

        try {
            // 1. Fetch Editorial Calendar
            const response = await fetch(`/api/v1/editorial-calendar/list/?client_id=${selectedClient}`, {
                headers: { Authorization: API_KEY },
            });

            if (!response.ok) return;
            const rules: any[] = await response.json();

            // Save rules to state so the edit modal can look up template_link by calendar_id
            setCalendarRules(rules);

            if (rules.length === 0) return;

            const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const postsToCreate: any[] = [];

            // 2. Iterate through current week's dates
            for (const dateStr of weekDates) {
                const [y, m, d] = dateStr.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                const dayName = daysMap[dateObj.getDay()];

                // Find rule for this day
                const rule = rules.find(r => r.week_day === dayName && r.active);

                if (rule) {
                    // NOVO: cria 1 post por regra (não 1 por formato)
                    // Verifica se já existe post para esta regra+data
                    const exists = currentPosts.some(p => {
                        const sameDate = p.post_date === dateStr || (p.post_date && p.post_date.startsWith(dateStr));
                        const sameSubject = p.subject === rule.subject;
                        const sameCalendarId =
                            (p.calendar_id && Number(p.calendar_id) === Number(rule.id)) ||
                            (p.editorial_calendar && Number(p.editorial_calendar) === Number(rule.id));
                        return sameDate && (sameCalendarId || sameSubject);
                    });

                    const alreadyStaged = postsToCreate.some(p =>
                        p.post_date === dateStr && p.subject === rule.subject
                    );

                    if (!exists && !alreadyStaged) {
                        postsToCreate.push({
                            client: selectedClient,
                            subject: rule.subject,
                            content: "Conteúdo gerado via calendário",
                            post_date: dateStr,
                            post_time: rule.time,
                            status: 2, // Default to draft
                            post_format: null,              // sem formato definido — usuário escolhe ao publicar
                            suggested_formats: rule.formats, // todos os formatos sugeridos
                            calendar_id: rule.id,
                        });
                    }
                }
            }

            if (postsToCreate.length > 0) {
                const createResponse = await fetch("/api/v1/post/create/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: API_KEY,
                    },
                    body: JSON.stringify(postsToCreate),
                });

                if (createResponse.ok) {
                    const createdPosts: Post[] = await createResponse.json();

                    // For each created post that has a calendar_id with a template_link,
                    // call the Make.com webhook to get the thumb, then upload as media
                    const WEBHOOK_URL = "https://hook.us2.make.com/qehgm15rpvl4uhn2qu1b8xh6e41dejm1";

                    for (const createdPost of createdPosts) {
                        // Look up the calendar rule to get its template_link
                        const rule = rules.find(r => r.id === createdPost.calendar_id);
                        const templateLink = rule?.template_link;
                        if (!templateLink) continue;

                        try {
                            // 1. Call webhook with the template link
                            const webhookRes = await fetch(WEBHOOK_URL, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify([{
                                    calendar_template_link: templateLink,
                                }]),
                            });

                            if (!webhookRes.ok) continue;

                            // Make.com returns: [{ body: '{"calendar_template_thumb": "...", ...}', status: 200 }]
                            const rawResponse: { body: string; status: number }[] = await webhookRes.json();
                            if (!rawResponse || rawResponse.length === 0) continue;

                            const parsed = JSON.parse(rawResponse[0].body);
                            const thumbUrl: string = parsed.calendar_template_thumb;
                            if (!thumbUrl) continue;

                            // 2. Download the thumb image
                            const imgRes = await fetch(thumbUrl);
                            if (!imgRes.ok) continue;

                            const blob = await imgRes.blob();
                            const ext = blob.type.includes("png") ? "png" : "jpg";
                            const file = new File([blob], `template_${createdPost.id}.${ext}`, { type: blob.type });

                            // 3. Upload image as media
                            const mediaForm = new FormData();
                            mediaForm.append("client", String(createdPost.client));
                            mediaForm.append("media", file);

                            const mediaRes = await fetch("/api/v1/media/create/", {
                                method: "POST",
                                headers: { Authorization: API_KEY },
                                body: mediaForm,
                            });

                            if (mediaRes.ok) {
                                const mediaData = await mediaRes.json();
                                // 4. Link media to the post
                                await fetch("/api/v1/post/media-post/create/", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: API_KEY,
                                    },
                                    body: JSON.stringify({
                                        post: createdPost.id,
                                        media: mediaData.id,
                                    }),
                                });
                            }
                        } catch (err) {
                            console.error(`Erro ao importar template para o post ${createdPost.id}:`, err);
                        }
                    }

                    await fetchPosts();
                } else {
                    console.error("Failed to auto-create posts:", await createResponse.text());
                }
            }

        } catch (error) {
            console.error("Error syncing editorial calendar:", error);
        } finally {
            // Add a small delay to ensure processing completes before allowing another sync
            setTimeout(() => {
                isSyncing.current = false;
            }, 1000);
        }
    };

    useEffect(() => {
        // Guard: Client users must have a selected client (ID) before fetching to ensure data privacy and performance.
        if (user?.role === 'client' && !selectedClient) return;

        // Sync state to URL
        const params: any = {};
        if (selectedClient) params.client_id = String(selectedClient);
        if (currentDate) params.date = currentDate.toISOString().split('T')[0];
        setSearchParams(params);

        const loadData = async () => {
            // Fetch posts regardless of client selection (handles "All Clients" view)
            const data = await fetchPosts();

            // Only sync editorial calendar if a specific client is selected
            if (data && selectedClient) {
                await syncEditorialCalendar(data);
            }
        };
        loadData();

    }, [selectedClient, currentDate, user]); // Removed setSearchParams from dependency to avoid loop if object ref changes (though hook usually stable)

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
        const clientToUse = formClientId || selectedClient;
        try {
            if (!clientToUse) {
                alert("Selecione um cliente para o post.");
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
                    client: clientToUse,
                    subject: formData.subject,
                    title: formData.title,
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
                    formDataMedia.append("client", String(clientToUse));
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
            setFormData({ subject: "", title: "", content: "", post_date: "", post_time: "", status: 2, post_format: "" });
            setFormClientId("");
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
            title: post.title || "",
            content: post.content,
            post_date: post.post_date,
            post_time: post.post_time,
            status: post.status || 2,
            post_format: post.post_format || "" as any,
            template_link: post.template_link || "",
            template_page: post.template_page || "",
            correction_description: post.correction_description || "",
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

    const handleCloseEdit = () => {
        closeEditModal();
        const params = new URLSearchParams(searchParams);
        if (params.has('edit_post')) {
            params.delete('edit_post');
            setSearchParams(params);
        }
    };

    const handleUpdatePost = async (e: React.FormEvent) => {
        e.preventDefault();

        let data = { ...editFormData };
        // If post is currently Scheduled (1) and user is saving (implied edit),
        // and user didn't explicitly change status to something else,
        // revert to Draft (2).
        if (String(currentPost?.status).toLowerCase() === 'scheduled' && String(data.status).toLowerCase() === 'scheduled') {
            data.status = 2;
        }

        await performUpdatePost(data);
    };

    const performPublishRequest = async (post: Post, action: "publish" | "schedule" | "cancel") => {
        // ── 1. Se o post não tem formato definido mas tem sugestões, pedir para escolher ──
        let effectivePost = post;
        if (!post.post_format && (post.suggested_formats ?? []).length > 0 && action !== "cancel") {
            const suggestedObjs = (post.suggested_formats ?? [])
                .map(id => formats.find(f => f.id === id))
                .filter(Boolean) as Format[];

            const options = suggestedObjs.map((f, i) => `${i + 1}. ${f.platform} — ${f.name}`).join("\n");
            const choice = window.prompt(
                `Este post tem ${suggestedObjs.length} formato(s) sugerido(s). Escolha qual usar para publicar:\n\n${options}\n\nDigite o número da opção:`,
                "1"
            );

            if (!choice) return; // usuário cancelou

            const choiceIdx = parseInt(choice, 10) - 1;
            if (isNaN(choiceIdx) || choiceIdx < 0 || choiceIdx >= suggestedObjs.length) {
                alert("Opção inválida.");
                return;
            }

            const chosenFormat = suggestedObjs[choiceIdx];

            // Salva o formato escolhido no post via PATCH
            try {
                const patchRes = await fetch(`/api/v1/post/update/${post.id}/`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: API_KEY },
                    body: JSON.stringify({ post_format: chosenFormat.id }),
                });
                if (!patchRes.ok) throw new Error("Falha ao salvar formato.");
                effectivePost = { ...post, post_format: chosenFormat.id };
                // Atualiza estado local imediatamente
                setPosts(prev => prev.map(p => p.id === post.id ? { ...p, post_format: chosenFormat.id } : p));
            } catch (err: any) {
                alert("Erro ao definir formato: " + err.message);
                return;
            }
        }

        // ── 2. Verificar se há mídia vinculada ──
        const hasMedia = postMedias.some(pm => pm.post === effectivePost.id);

        if (!hasMedia) {
            const actionPt = action === 'publish' ? 'publicar' : action === 'schedule' ? 'agendar' : 'cancelar';
            alert(`Não é possível ${actionPt} post sem mídia vinculada.`);
            return;
        }

        const actionPtMap = { publish: "publicar", schedule: "agendar", cancel: "cancelar" };
        const actionPt = actionPtMap[action];

        if (!confirm(`Confirmar ${actionPt} este post?`)) return;

        try {
            const response = await fetch("/api/v1/post/publish/", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: API_KEY },
                body: JSON.stringify({ publish: action, post_id: effectivePost.id })
            });

            if (response.ok || response.status === 202) {
                if (response.status === 202) {
                    alert(`Post enviado para ${action === 'publish' ? 'publicação' : 'agendamento'}! O status será atualizado automaticamente em instantes.`);
                } else {
                    alert(`Post ${action === 'cancel' ? 'cancelado' : action === 'publish' ? 'publicado' : 'agendado'} com sucesso!`);
                }
                await fetchPosts();
                closeEditModal();
            } else {
                const errorText = await response.text();
                let errorMessage = `Falha ao ${actionPt} post.`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.post_publish_response?.error) {
                        errorMessage = typeof errorJson.post_publish_response.error === 'string'
                            ? errorJson.post_publish_response.error
                            : JSON.stringify(errorJson.post_publish_response.error);
                    } else if (errorJson.details) {
                        errorMessage = typeof errorJson.details === 'string' ? errorJson.details : JSON.stringify(errorJson.details);
                    } else if (errorJson.error) {
                        errorMessage = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
                    } else if (errorJson.detail) {
                        errorMessage = errorJson.detail;
                    } else {
                        errorMessage = JSON.stringify(errorJson);
                    }
                } catch (e) {
                    if (errorText.length < 200) errorMessage = errorText;
                }
                console.error(`Failed to ${action}`, errorText);
                alert(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${action}ing:`, error);
            alert("Erro ao conectar com servidor.");
        }
    };


    const handlePublishPost = async (post: Post) => {
        await performPublishRequest(post, "publish");
    };

    const handleSendWhatsApp = async () => {
        if (!currentPost) return;
        setLoading(true);
        try {
            const response = await fetch("/api/v1/post/send-post-whatsapp/", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": API_KEY,
                    "X-CSRFToken": getCookie("csrftoken") || "",
                },
                body: JSON.stringify({
                    post_id: currentPost.id
                })
            });

            if (response.ok) {
                alert("Enviado para revisão com sucesso!");
                // Após o envio do WhatsApp, atualizamos o status e fechamos o modal
                await handleStatusAction('in_review');
            } else {
                const data = await response.json();
                alert(`Erro ao enviar para WhatsApp: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (e) {
            console.error("Error triggering review notification", e);
            alert("Erro de conexão ao enviar para WhatsApp.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to get CSRF token
    const getCookie = (name: string) => {
        if (!document.cookie) return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };

    const handleStatusAction = async (status: string | number, description?: string) => {
        // Intercept Cancel (11) action to use the publish endpoint
        if (status === 'canceled' && currentPost) {
            await performPublishRequest(currentPost, "cancel");
            return;
        }

        const newData: any = { ...editFormData, status };
        if (description !== undefined) {
            newData.correction_description = description;
        }

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
                <div className="flex justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        {user?.role !== 'client' && (
                            <div className="w-64 relative z-50">
                                <Label>Cliente</Label>
                                <Select
                                    options={[
                                        { value: "", label: "Todos os Clientes" },
                                        ...clients.map(c => ({ value: String(c.id), label: c.name }))
                                    ]}
                                    placeholder="Selecione..."
                                    onChange={(val) => setSelectedClient(val === "" ? "" : Number(val))}
                                    defaultValue={String(selectedClient)}
                                    className="mt-1"
                                />
                            </div>
                        )}

                        <div className="w-48 relative z-40">
                            <Label>Status</Label>
                            <Select
                                options={[
                                    { value: "", label: "Todos" },
                                    ...statuses
                                        .filter(s => {
                                            if (user?.role === 'client' && s.name.toLowerCase() === 'draft') return false;
                                            return true;
                                        })
                                        .map(s => ({ value: String(s.id), label: s.description || s.name }))
                                ]}
                                placeholder="Status"
                                onChange={(val) => setSelectedStatus(val === "" ? "" : val)}
                                defaultValue={String(selectedStatus)}
                                className="mt-1"
                            />
                        </div>

                        <div className="w-48 relative z-30">
                            <Label>Formato</Label>
                            <Select
                                options={[
                                    { value: "", label: "Todos" },
                                    ...formats.map(f => ({ value: String(f.id), label: `${f.platform} - ${f.name}` }))
                                ]}
                                placeholder="Formato"
                                onChange={(val) => setSelectedFormat(val === "" ? "" : Number(val))}
                                defaultValue={String(selectedFormat)}
                                className="mt-1"
                            />
                        </div>
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
                    {user?.role !== 'client' && (
                        <Button onClick={openModal} startIcon={<PlusIcon className="size-5" />}>
                            Novo Post
                        </Button>
                    )}
                </div>

                <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
                    {user?.role === 'client' ? (
                        <div className="flex-1 w-full min-w-full flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                            {enrichedPosts.filter((p: Post) => {
                                if (String(p.status).toLowerCase() === 'draft') return false;

                                const matchDate = weekDates.includes(p.post_date);
                                const matchClient = selectedClient === "" || p.client === selectedClient;
                                
                                let matchStatus = false;
                                if (selectedStatus === "") {
                                    matchStatus = true;
                                } else {
                                    const postStatusObj = statuses.find(s => String(s.id) === String(p.status) || s.name.toLowerCase() === String(p.status).toLowerCase());
                                    matchStatus = (postStatusObj?.id === Number(selectedStatus)) || (String(p.status).toLowerCase() === String(selectedStatus).toLowerCase());
                                }
                                
                                const matchFormat = selectedFormat === "" || p.post_format === selectedFormat;

                                const query = searchQuery.toLowerCase();
                                const clientName = clients.find(c => c.id === p.client)?.name.toLowerCase() || "";
                                const postSubject = p.subject.toLowerCase();
                                const matchSearch = !query || clientName.includes(query) || postSubject.includes(query);

                                return matchDate && matchClient && matchStatus && matchFormat && matchSearch;
                            })
                            // Order by date and time
                            .sort((a, b) => {
                                const datetimeA = new Date(`${a.post_date}T${a.post_time}`);
                                const datetimeB = new Date(`${b.post_date}T${b.post_time}`);
                                return datetimeA.getTime() - datetimeB.getTime();
                            })
                            .map((post) => (
                                <PostCardClient
                                    key={post.id}
                                    post={post}
                                    formats={formats}
                                    statuses={statuses}
                                    clients={clients}
                                    medias={medias}
                                    postMedias={postMedias}
                                    onEdit={openEditPost}
                                    onDelete={openDeletePost}
                                />
                            ))}
                            
                            {enrichedPosts.filter((p: Post) => {
                                if (String(p.status).toLowerCase() === 'draft') return false;
                                const matchDate = weekDates.includes(p.post_date);
                                const matchClient = selectedClient === "" || p.client === selectedClient;
                                let matchStatus = false;
                                if (selectedStatus === "") {
                                    matchStatus = true;
                                } else {
                                    const postStatusObj = statuses.find(s => String(s.id) === String(p.status) || s.name.toLowerCase() === String(p.status).toLowerCase());
                                    matchStatus = (postStatusObj?.id === Number(selectedStatus)) || (String(p.status).toLowerCase() === String(selectedStatus).toLowerCase());
                                }
                                const matchFormat = selectedFormat === "" || p.post_format === selectedFormat;
                                const query = searchQuery.toLowerCase();
                                const clientName = clients.find(c => c.id === p.client)?.name.toLowerCase() || "";
                                const postSubject = p.subject.toLowerCase();
                                const matchSearch = !query || clientName.includes(query) || postSubject.includes(query);
                                return matchDate && matchClient && matchStatus && matchFormat && matchSearch;
                            }).length === 0 && (
                                <div className="w-full py-12 flex flex-col items-center justify-center text-gray-400">
                                    <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Nenhum conteúdo encontrado para esta semana
                                </div>
                            )}
                        </div>
                    ) : (
                        weekDates.map((date, index) => (
                            <KanbanColumn
                                key={date}
                                date={date}
                                dayName={dayNames[index]}
                                posts={enrichedPosts.filter((p: Post) => {
                                    if (user?.role === 'client' && (String(p.status).toLowerCase() === 'draft')) return false;
                                    const matchDate = p.post_date === date;
                                    const matchClient = selectedClient === "" || p.client === selectedClient;
                                    
                                    let matchStatus = false;
                                    if (selectedStatus === "") {
                                        matchStatus = true;
                                    } else {
                                        const postStatusObj = statuses.find(s => String(s.id) === String(p.status) || s.name.toLowerCase() === String(p.status).toLowerCase());
                                        matchStatus = (postStatusObj?.id === Number(selectedStatus)) || (String(p.status).toLowerCase() === String(selectedStatus).toLowerCase());
                                    }
                                    
                                    const matchFormat = selectedFormat === "" || p.post_format === selectedFormat;
                                    const query = searchQuery.toLowerCase();
                                    const clientName = clients.find(c => c.id === p.client)?.name.toLowerCase() || "";
                                    const postSubject = p.subject.toLowerCase();
                                    const matchSearch = !query || clientName.includes(query) || postSubject.includes(query);
                                    
                                    return matchDate && matchClient && matchStatus && matchFormat && matchSearch;
                                })}
                                formats={formats} // Pass formats
                                statuses={statuses}
                                clients={clients}
                                medias={medias}
                                postMedias={postMedias}
                                onMovePost={movePost}
                                onEdit={openEditPost}
                                onDelete={openDeletePost}
                                onPublish={handlePublishPost}
                            />
                        ))
                    )}
                </div>
            </div>

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
                clients={clients}
                selectedClient={String(formClientId || selectedClient || "")}
                onClientChange={(val) => setFormClientId(val ? Number(val) : "")}
                userRole={user?.role}
            />

            {/* Edit Modal */}
            <EditPostModal
                isOpen={isEditOpen}
                onClose={handleCloseEdit}
                onSubmit={handleUpdatePost}
                formData={editFormData}
                handleInputChange={handleEditInputChange}
                loading={loading}
                formats={formats}
                statuses={statuses}
                medias={medias}
                postMedias={postMedias}
                onUploadMedia={handleUploadMedia}
                currentPostId={currentPost?.id}
                onDeleteMediaLink={handleDeleteMediaLink}
                onStatusAction={handleStatusAction}
                onPublish={() => currentPost && handlePublishPost(currentPost)}
                onSendWhatsApp={handleSendWhatsApp}
                userRole={user?.role}
                clients={clients}
                selectedClient={String(currentPost?.client || "")}
                onClientChange={(val) => {
                    if (currentPost) {
                        setCurrentPost({ ...currentPost, client: Number(val) });
                        setEditFormData(prev => ({ ...prev, client: Number(val) }));
                    }
                }}
                onImportTemplate={(async (page?: string) => {
                    const post = currentPost;
                    if (!post) return;

                    const templateLink = (post as any).template_link;
                    if (!templateLink) return;

                    const postId = post.id;
                    const clientId = post.client;

                    const WEBHOOK_URL = "https://hook.us2.make.com/qehgm15rpvl4uhn2qu1b8xh6e41dejm1";
                    try {
                        const payload: any = {
                            calendar_template_link: templateLink,
                        };
                        if (page) payload.calendar_template_page = page;

                        const webhookRes = await fetch(WEBHOOK_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify([payload]),
                        });
                        if (!webhookRes.ok) throw new Error("Webhook falhou");

                        const resData = await webhookRes.json();

                        // Handle both direct object or wrapped in array (common in some webhook proxies)
                        let parsedData = resData;
                        if (Array.isArray(resData) && resData.length > 0) {
                            parsedData = typeof resData[0].body === 'string' ? JSON.parse(resData[0].body) : resData[0];
                        }

                        const thumbUrl: string = parsedData?.calendar_template_thumb;
                        if (!thumbUrl) {
                            console.error("Dados recebidos:", resData);
                            throw new Error("URL do thumb não encontrada na resposta");
                        }
                        const imgRes = await fetch(thumbUrl);
                        if (!imgRes.ok) throw new Error("Falha ao baixar imagem");

                        const blob = await imgRes.blob();
                        const ext = blob.type.includes("png") ? "png" : "jpg";
                        const file = new File([blob], `template_${postId}.${ext}`, { type: blob.type });

                        const mediaForm = new FormData();
                        mediaForm.append("client", String(clientId));
                        mediaForm.append("media", file);

                        const mediaRes = await fetch("/api/v1/media/create/", {
                            method: "POST",
                            headers: { Authorization: API_KEY },
                            body: mediaForm,
                        });
                        if (!mediaRes.ok) throw new Error("Falha ao fazer upload da mídia");

                        const mediaData = await mediaRes.json();

                        await fetch("/api/v1/post/media-post/create/", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: API_KEY,
                            },
                            body: JSON.stringify({
                                post: postId,
                                media: mediaData.id,
                            }),
                        });

                        await fetchMedias();
                        await fetchPostMedias();
                    } catch (err) {
                        console.error("Erro ao importar template:", err);
                        alert("Erro ao importar imagem do Canva. Tente novamente.");
                    }
                })}
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
