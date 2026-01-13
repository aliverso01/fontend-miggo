import { useRef, useState } from "react";
import { useDrag } from "react-dnd";
import { MoreDotIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";

interface Post {
    id: number;
    subject: string;
    content: string;
    post_date: string;
    post_time: string;
    media: string | null;
    client: number;
    status?: number;
}

interface PostCardProps {
    post: Post;
    movePost?: (id: number, date: string) => void;
    onEdit: (post: Post) => void;
    onDelete: (post: Post) => void;
}

export default function PostCard({ post, onEdit, onDelete }: PostCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: "POST",
        item: { id: post.id, date: post.post_date },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    drag(ref);

    const getStatusLabel = (status?: number) => {
        switch (status) {
            case 1: return { label: "A CRIAR", color: "bg-gray-100 text-gray-600" };
            case 2: return { label: "RASCUNHO", color: "bg-gray-200 text-gray-800" };
            case 3: return { label: "AGENDADO", color: "bg-blue-100 text-blue-800" };
            case 4: return { label: "ENVIADO", color: "bg-indigo-100 text-indigo-800" };
            case 5: return { label: "PENDENTE", color: "bg-orange-100 text-orange-800" };
            case 6: return { label: "PAUSADO", color: "bg-yellow-100 text-yellow-800" };
            case 7: return { label: "FINALIZADO", color: "bg-teal-100 text-teal-800" };
            case 8: return { label: "APROVADO", color: "bg-cyan-100 text-cyan-800" };
            case 9: return { label: "ENVIANDO", color: "bg-purple-100 text-purple-800" };
            case 10: return { label: "PUBLICADO", color: "bg-green-100 text-green-800" };
            case 11: return { label: "CANCELADO", color: "bg-red-100 text-red-800" };
            default: return { label: "DESCONHECIDO", color: "bg-gray-100 text-gray-800" };
        }
    };

    const statusInfo = getStatusLabel(post.status);

    return (
        <div
            ref={ref}
            className={`relative p-4 mb-3 bg-white border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 shadow-sm cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : "opacity-100"
                }`}
            onClick={() => onEdit(post)}
        >
            <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                <button
                    className="dropdown-toggle text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <MoreDotIcon className="w-5 h-5 rotate-90" />
                </button>
                <Dropdown
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    className="w-40 right-0 top-full"
                >
                    <DropdownItem
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 cursor-pointer"
                        onClick={() => { setIsDropdownOpen(false); onEdit(post); }}
                    >
                        <PencilIcon className="w-4 h-4" />
                        Editar
                    </DropdownItem>
                    <DropdownItem
                        className="flex items-center gap-2 px-4 py-2 text-sm text-error-500 hover:bg-red-50 dark:hover:bg-white/5 cursor-pointer"
                        onClick={() => { setIsDropdownOpen(false); onDelete(post); }}
                    >
                        <TrashBinIcon className="w-4 h-4" />
                        Excluir
                    </DropdownItem>
                </Dropdown>
            </div>

            {post.media && (
                <div className="mb-3 overflow-hidden rounded-lg h-32 w-full">
                    <img src={post.media} alt="Post media" className="object-cover w-full h-full" />
                </div>
            )}
            <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90 pr-6">
                {post.subject}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2 dark:text-gray-400 mb-2">
                {post.content}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusInfo.color}`}>
                    {statusInfo.label}
                </span>
                <span>{post.post_time.slice(0, 5)}</span>
            </div>
        </div>
    );
}
