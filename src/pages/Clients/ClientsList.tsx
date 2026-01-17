import { useState, useEffect } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow
} from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { PencilIcon, TrashBinIcon, PlusIcon, CalenderIcon, VideoIcon } from "../../icons";

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    company: string | null;
    active: boolean;
    created_at: string;
    user: number; // Linked user ID
}

export default function ClientsList() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
    const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

    // Form states
    const [currentClient, setCurrentClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "", // Only for creation
        company: "", // For update if needed, though creation doesn't seem to take it in the prompt example
    });

    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/v1/client/list/", {
                headers: { Authorization: API_KEY },
            });
            if (!response.ok) throw new Error("Failed to fetch clients");
            const data = await response.json();
            setClients(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Add Client (Create Account)
    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/v1/account/create/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: API_KEY,
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    // company? The prompt create body doesn't show company, so omitting or checking.
                    // User provided example body: name, phone, email, password.
                }),
            });

            if (!response.ok) throw new Error("Failed to create client");
            await fetchClients();
            closeAddModal();
            setFormData({ name: "", phone: "", email: "", password: "", company: "" });
        } catch (err: any) {
            console.error(err);
            // Check if err is an object and has message property, otherwise convert to string
            const errorMessage = err instanceof Error ? err.message : String(err);
            alert("Error adding client: " + errorMessage);
        }
    };

    // Edit Client
    const onEditClick = (client: Client) => {
        setCurrentClient(client);
        setFormData({
            name: client.name,
            email: client.email,
            phone: client.phone,
            password: "", // Not editing password here usually
            company: client.company || "",
        });
        openEditModal();
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentClient) return;
        try {
            // Prompt says update endpoint: http://localhost:8000/api/v1/client/update/id::/
            // Assuming it means /api/v1/client/update/${id}/
            const response = await fetch(`/api/v1/client/update/${currentClient.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: API_KEY,
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    // Update allows company? Assuming yes based on response structure having it.
                    // But prompt didn't strictly say it's in the update body, but it's safe to send if API ignores or accepts.
                }),
            });

            if (!response.ok) throw new Error("Failed to update client");
            await fetchClients();
            closeEditModal();
        } catch (err: any) {
            console.error(err);
            alert("Error updating client: " + err.message);
        }
    };

    // Delete Client
    const onDeleteClick = (client: Client) => {
        setCurrentClient(client);
        openDeleteModal();
    };

    const handleDeleteSubmit = async () => {
        if (!currentClient) return;
        try {
            const response = await fetch(`/api/v1/account/delete/${currentClient.user}/`, {
                method: "DELETE",
                headers: { Authorization: API_KEY },
            });

            if (!response.ok) throw new Error("Failed to delete client");
            await fetchClients();
            closeDeleteModal();
        } catch (err: any) {
            console.error(err);
            alert("Error deleting client: " + err.message);
        }
    };

    return (
        <>
            <PageMeta title="Clientes | Miggo" description="Lista de clientes" />
            <PageBreadcrumb pageTitle="Clientes" />

            <div className="space-y-6">
                <div className="flex justify-end">
                    <Button onClick={() => { setFormData({ name: "", phone: "", email: "", password: "", company: "" }); openAddModal(); }} startIcon={<PlusIcon className="size-5" />}>
                        Adicionar Cliente
                    </Button>
                </div>

                {error && <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">{error}</div>}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Nome</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Telefone</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ativo</TableCell>
                                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Ações</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90 font-medium">
                                            <Link to={`/briefing?client_id=${client.id}`} className="hover:text-brand-500 transition-colors">
                                                {client.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{client.email}</TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{client.phone}</TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{client.active ? "Sim" : "Não"}</TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Link to={`/editorial-calendar?client_id=${client.id}`} className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Calendário Editorial">
                                                    <CalenderIcon className="size-5" />
                                                </Link>
                                                <Link to={`/media-library?client_id=${client.id}`} className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Biblioteca de Midias">
                                                    <VideoIcon className="size-5" />
                                                </Link>
                                                <button onClick={() => onEditClick(client)} className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Editar">
                                                    <PencilIcon className="size-5" />
                                                </button>
                                                <button onClick={() => onDeleteClick(client)} className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400" title="Excluir">
                                                    <TrashBinIcon className="size-5" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {clients.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-5 py-4 text-center text-gray-500">Nenhum cliente encontrado.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div >

            {/* Add Modal */}
            < Modal isOpen={isAddOpen} onClose={closeAddModal} className="max-w-[600px] m-4" >
                <div className="w-full bg-white rounded-2xl p-6 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Novo Cliente</h3>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div>
                            <Label>Nome</Label>
                            <Input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label>Telefone</Label>
                            <Input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label>Senha</Label>
                            <Input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={closeAddModal} type="button">Cancelar</Button>
                            <Button type="submit">Criar</Button>
                        </div>
                    </form>
                </div>
            </Modal >

            {/* Edit Modal */}
            < Modal isOpen={isEditOpen} onClose={closeEditModal} className="max-w-[600px] m-4" >
                <div className="w-full bg-white rounded-2xl p-6 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Editar Cliente</h3>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <Label>Nome</Label>
                            <Input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label>Telefone</Label>
                            <Input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={closeEditModal} type="button">Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </div>
            </Modal >

            {/* Delete Modal */}
            < Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} className="max-w-[400px] m-4" >
                <div className="w-full bg-white rounded-2xl p-6 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Excluir Cliente</h3>
                    <p className="text-gray-500 mb-6">Tem certeza que deseja excluir o cliente <strong>{currentClient?.name}</strong>? Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={closeDeleteModal} type="button">Cancelar</Button>
                        <Button onClick={handleDeleteSubmit} className="bg-error-500 hover:bg-error-600 text-white">Excluir</Button>
                    </div>
                </div>
            </Modal >
        </>
    );
}
