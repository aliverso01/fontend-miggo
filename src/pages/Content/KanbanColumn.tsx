import { useDrop } from "react-dnd";
import PostCard from "./PostCard";

interface Post {
    id: number;
    subject: string;
    content: string;
    post_date: string;
    post_time: string;
    media: string | null;
    client: number;
}

interface KanbanColumnProps {
    date: string;
    dayName: string;
    posts: Post[];
    onMovePost: (id: number, date: string) => void;
    onEdit: (post: Post) => void;
    onDelete: (post: Post) => void;
}

export default function KanbanColumn({ date, dayName, posts, onMovePost, onEdit, onDelete }: KanbanColumnProps) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: "POST",
        drop: (item: { id: number; date: string }) => {
            if (item.date !== date) {
                onMovePost(item.id, date);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    // Format date to show "dd/MM/yyyy"
    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');

    return (
        <div
            ref={drop as unknown as React.RefObject<HTMLDivElement>}
            className={`flex-shrink-0 w-72 flex flex-col h-full rounded-xl transition-colors ${isOver ? "bg-gray-100 dark:bg-white/[0.05]" : "bg-gray-50 dark:bg-white/[0.02]"
                }`}
        >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-white/90 capitalize">
                        {dayName}
                    </h3>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {displayDate}
                    </span>
                </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    );
}
