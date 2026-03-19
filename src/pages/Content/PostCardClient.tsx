import { useState } from "react";
import { MoreDotIcon, PencilIcon, TrashBinIcon, PaperPlaneIcon } from "../../icons";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { Client, Format, Media, Post, PostMediaLink, PostStatus, resolveStatusStyle } from "./ContentKanban";

interface PostCardProps {
    post: Post;
    formats?: Format[];
    statuses?: PostStatus[];
    clients?: Client[];
    medias?: Media[];
    postMedias?: PostMediaLink[];
    onEdit: (post: Post) => void;
    onDelete: (post: Post) => void;
    onPublish?: (post: Post) => void;
}

export default function PostCardClient({ post, formats, statuses, clients, medias, postMedias, onEdit, onDelete, onPublish }: PostCardProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const statusInfo = resolveStatusStyle(post.status, statuses || []);

    const chosenFormatObj = post.post_format ? formats?.find(f => f.id === post.post_format) : null;
    const suggestedFormatObjs = (post.suggested_formats ?? [])
        .map(id => formats?.find(f => f.id === id))
        .filter(Boolean) as Format[];

    const clientName = clients?.find(c => c.id === post.client)?.name || "Cliente";

    let displayMedia: Media | string | null = null;
    let displayMediaType: 'image' | 'video' | 'pdf' | 'unknown' = 'unknown';

    if (postMedias && medias) {
        const link = postMedias.find(pm => pm.post === post.id);
        if (link) {
            const mediaObj = medias.find(m => m.id === link.media);
            if (mediaObj) {
                displayMedia = mediaObj;
                const ext = mediaObj.media.split('.').pop()?.toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) displayMediaType = 'image';
                else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) displayMediaType = 'video';
                else if (['pdf'].includes(ext || '')) displayMediaType = 'pdf';
            }
        }
    }

    if (!displayMedia && post.media) {
        displayMedia = post.media;
        const ext = post.media.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) displayMediaType = 'image';
        else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) displayMediaType = 'video';
        else if (['pdf'].includes(ext || '')) displayMediaType = 'pdf';
    }

    const renderMediaContent = () => {
        if (!displayMedia) {
            return (
                <div className="w-full h-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <span className="text-sm text-gray-400">Sem mídia</span>
                </div>
            );
        }

        const url = typeof displayMedia === 'string' ? displayMedia : displayMedia.media;

        switch (displayMediaType) {
            case 'video':
                return (
                    <div className="relative w-full h-full bg-black shrink-0 flex items-center justify-center group overflow-hidden">
                        <video src={url} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                );
            case 'pdf':
                return (
                    <div className="w-full h-full bg-red-50 dark:bg-white/5 flex flex-col items-center justify-center p-4 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <span className="text-xs text-gray-500 font-medium truncate w-full text-center">
                            {url.split('/').pop()}
                        </span>
                    </div>
                );
            default: // image
                return (
                    <div className="w-full h-full bg-gray-100 shrink-0 overflow-hidden">
                        <img src={url} alt="Media" className="w-full h-full object-cover" />
                    </div>
                );
        }
    };

    const displayDate = new Date(post.post_date + 'T00:00:00').toLocaleDateString('pt-BR');

    return (
        <div 
            className="flex flex-col sm:flex-row w-full bg-white border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 shadow-sm overflow-hidden mb-4 hover:shadow-md transition-shadow cursor-pointer min-h-[220px]"
            onClick={() => onEdit(post)}
        >
            {/* Visual Media */}
            <div className="h-56 sm:h-auto sm:w-[280px] shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
                {renderMediaContent()}
            </div>

            {/* Content & Details */}
            <div className="flex-1 p-5 relative flex flex-col justify-between">

                {/* Dropdown Options */}
                <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="dropdown-toggle text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 bg-gray-50 dark:bg-gray-700 rounded-full"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <MoreDotIcon className="w-5 h-5 rotate-90" />
                    </button>
                    <Dropdown
                        isOpen={isDropdownOpen}
                        onClose={() => setIsDropdownOpen(false)}
                        className="w-40 right-0 top-full mt-2"
                    >
                        {onPublish && post.status !== 10 && (
                            <DropdownItem
                                className="flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-white/5 cursor-pointer"
                                onClick={() => { setIsDropdownOpen(false); onPublish(post); }}
                            >
                                <PaperPlaneIcon className="w-4 h-4" />
                                Publicar
                            </DropdownItem>
                        )}
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

                {/* Top Headers */}
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3 pr-12">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {displayDate} às {post.post_time.slice(0, 5)}
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {post.subject} {post.title ? ` - ${post.title}` : ""}
                    </h3>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Cliente: <span className="text-gray-700 dark:text-gray-300">{clientName}</span>
                    </h4>

                    {String(post.status).toLowerCase() === 'rejected' && post.correction_description && (
                         <div className="mb-4 bg-red-50/50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg p-3">
                            <p className="text-sm text-error-600 dark:text-error-400">
                                <strong>Feedback / Correção: </strong> {post.correction_description}
                            </p>
                        </div>
                    )}

                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                        {post.content}
                    </p>
                </div>

                {/* Bottom Badges */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        {chosenFormatObj ? (
                            <>
                                <span className="text-xs font-semibold text-gray-400">Formato:</span>
                                <span className="text-xs uppercase font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded">
                                    {chosenFormatObj.platform} — {chosenFormatObj.name}
                                </span>
                            </>
                        ) : suggestedFormatObjs.length > 0 ? (
                            <>
                                <span className="text-xs font-semibold text-gray-400">Sugestões:</span>
                                <div className="flex gap-1.5 flex-wrap">
                                    {suggestedFormatObjs.map(f => (
                                        <span key={f.id} className="inline-flex items-center text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                            {f.name}
                                        </span>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>

                    {post.template_link && (
                        <div className="ml-auto">
                            <a
                                href={post.template_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Ver Template
                                {post.template_page && (
                                    <span className="ml-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full px-1.5 py-0.5 text-[10px]">
                                        p.{post.template_page}
                                    </span>
                                )}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
