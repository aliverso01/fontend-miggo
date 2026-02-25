import { useState, useRef, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { useAuth } from '../../hooks/authHook';
import Select from '../../components/form/Select';
import {
    useBrandkits,
    createBrandkit,
    deleteBrandkit,
    uploadLogo,
    deleteLogo,
    reanalyzeLogo,
    createColor,
    deleteColor,
    createTypography,
    deleteTypography,
    uploadAsset,
    deleteAsset,
    BrandColor,
} from '../../hooks/useBrandkit';

type Tab = 'logos' | 'colors' | 'typography' | 'assets';

// ── Sub-components ─────────────────────────────────────────────────────────────

function ColorSwatch({ color, onDelete }: { color: BrandColor; onDelete: () => void }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div
                className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0"
                style={{ backgroundColor: color.hex }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{color.name}</p>
                <p className="text-xs text-gray-500 font-mono">{color.hex}</p>
                {color.category && <span className="text-xs text-gray-400">{color.category}</span>}
            </div>
            <button
                onClick={onDelete}
                className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                title="Remover cor"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function BrandkitPage() {
    const { user } = useAuth();
    const isAdmin = !!(user?.is_superuser || user?.is_staff || user?.role === 'admin');

    // Para clientes: resolve o clientId via API (mesmo padrão do ClientBilling)
    const [clientId, setClientId] = useState<number | null>(null);
    const [resolvingClient, setResolvingClient] = useState(!isAdmin);

    useEffect(() => {
        if (isAdmin) { setResolvingClient(false); return; }
        if (!user) return;
        fetch('/api/v1/client/list/', {
            headers: { Authorization: import.meta.env.VITE_MIGGO_API_KEY },
        })
            .then(r => r.ok ? r.json() : [])
            .then((data: any[]) => {
                const mine = data.find(c => c.user === user.id);
                if (mine) setClientId(mine.id);
            })
            .catch(() => { })
            .finally(() => setResolvingClient(false));
    }, [user, isAdmin]);

    const { brandkits, loading, error, refetch } = useBrandkits(clientId, isAdmin);

    // Selected brandkit
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('logos');

    // Create brandkit form
    const [showCreate, setShowCreate] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [createClient, setCreateClient] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Admin: lista de clientes para o select
    const [clients, setClients] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        if (!isAdmin) return;
        fetch('/api/v1/client/list/', {
            headers: { Authorization: import.meta.env.VITE_MIGGO_API_KEY },
        })
            .then(r => r.ok ? r.json() : [])
            .then(data => setClients(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, [isAdmin]);

    // Color form
    const [colorName, setColorName] = useState('');
    const [colorHex, setColorHex] = useState('#000000');
    const [colorCategory, setColorCategory] = useState('');
    const [addingColor, setAddingColor] = useState(false);

    // Typography form
    const [typoRole, setTypoRole] = useState('');
    const [typoFamily, setTypoFamily] = useState('');
    const [typoUrl, setTypoUrl] = useState('');
    const [addingTypo, setAddingTypo] = useState(false);

    // Asset form
    const [assetName, setAssetName] = useState('');
    const [assetType, setAssetType] = useState('image');
    const assetInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const selected = brandkits.find(b => b.id === selectedId) ?? null;

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!createName.trim()) { setCreateError('Nome obrigatório'); return; }
        if (isAdmin && !createClient) { setCreateError('Selecione o cliente'); return; }
        setCreating(true);
        setCreateError('');
        try {
            await createBrandkit({
                name: createName,
                description: createDesc,
                client: isAdmin ? parseInt(createClient) : clientId!,
            });
            setShowCreate(false);
            setCreateName(''); setCreateDesc(''); setCreateClient('');
            refetch();
        } catch (e: any) {
            setCreateError(e.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remover este Brand Kit?')) return;
        await deleteBrandkit(id);
        if (selectedId === id) setSelectedId(null);
        refetch();
    };

    const withLoading = async (fn: () => Promise<void>) => {
        setActionLoading(true);
        setActionError('');
        try { await fn(); refetch(); }
        catch (e: any) { setActionError(e.message); }
        finally { setActionLoading(false); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedId) return;
        withLoading(() => uploadLogo(selectedId, file));
        e.target.value = '';
    };

    const handleAddColor = () => {
        if (!colorName.trim() || !colorHex || !selectedId) return;
        setAddingColor(true);
        withLoading(() => createColor({ brandkit: selectedId, name: colorName, hex: colorHex, category: colorCategory }))
            .finally(() => { setAddingColor(false); setColorName(''); setColorHex('#000000'); setColorCategory(''); });
    };

    const handleAddTypo = () => {
        if (!typoRole.trim() || !typoFamily.trim() || !selectedId) return;
        setAddingTypo(true);
        withLoading(() => createTypography({ brandkit: selectedId, role: typoRole, family: typoFamily, source_url: typoUrl }))
            .finally(() => { setAddingTypo(false); setTypoRole(''); setTypoFamily(''); setTypoUrl(''); });
    };

    const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedId || !assetName.trim()) return;
        withLoading(() => uploadAsset(selectedId, file, assetName, assetType));
        e.target.value = '';
        setAssetName('');
    };

    // ── Tab content ───────────────────────────────────────────────────────────

    const renderTabContent = () => {
        if (!selected) return null;

        switch (activeTab) {
            case 'logos':
                return (
                    <div className="space-y-4">
                        {/* Upload */}
                        <div className="flex items-center gap-3">
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            <button
                                onClick={() => logoInputRef.current?.click()}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload de Logo
                            </button>
                        </div>

                        {selected.logos.length === 0 && (
                            <p className="text-sm text-gray-400 py-4">Nenhuma logo adicionada ainda.</p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selected.logos.map(logo => (
                                <div key={logo.id} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                                    <div className="h-36 flex items-center justify-center bg-[#f8f8f8] dark:bg-gray-800">
                                        <img src={logo.image_url || logo.url} alt={logo.logo_type} className="max-h-28 max-w-full object-contain p-2" />
                                    </div>
                                    <div className="p-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{logo.logo_type || 'Logo'}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${logo.analyzed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                {logo.analyzed ? 'Analisado' : 'Pendente'}
                                            </span>
                                        </div>
                                        {logo.ai_description && (
                                            <p className="text-xs text-gray-500 line-clamp-2">{logo.ai_description}</p>
                                        )}
                                        {logo.primary_color_hex && (
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: logo.primary_color_hex }} />
                                                <span className="text-xs text-gray-400 font-mono">{logo.primary_color_hex}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => withLoading(() => reanalyzeLogo(logo.id))}
                                                className="flex-1 text-xs py-1 rounded-lg border border-brand-200 text-brand-600 dark:border-brand-800 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                            >
                                                Re-analisar
                                            </button>
                                            <button
                                                onClick={() => withLoading(() => deleteLogo(logo.id))}
                                                className="flex-1 text-xs py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'colors':
                return (
                    <div className="space-y-5">
                        {/* Add color form */}
                        <div className="flex flex-wrap gap-3 items-end p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Cor</label>
                                <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
                            </div>
                            <div className="flex-1 min-w-32">
                                <label className="text-xs text-gray-500 mb-1 block">Nome *</label>
                                <input
                                    type="text" value={colorName} onChange={e => setColorName(e.target.value)}
                                    placeholder="ex: Primary Blue"
                                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                                />
                            </div>
                            <div className="min-w-32">
                                <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
                                <select value={colorCategory} onChange={e => setColorCategory(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none">
                                    <option value="">—</option>
                                    <option value="primary">Primária</option>
                                    <option value="secondary">Secundária</option>
                                    <option value="accent">Destaque</option>
                                    <option value="neutral">Neutro</option>
                                </select>
                            </div>
                            <button
                                onClick={handleAddColor}
                                disabled={addingColor || !colorName.trim()}
                                className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                            >
                                {addingColor ? 'Adicionando...' : '+ Adicionar'}
                            </button>
                        </div>

                        {selected.colors.length === 0 && <p className="text-sm text-gray-400">Nenhuma cor cadastrada.</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selected.colors
                                .slice()
                                .sort((a, b) => a.order - b.order)
                                .map(color => (
                                    <ColorSwatch key={color.id} color={color} onDelete={() => withLoading(() => deleteColor(color.id))} />
                                ))}
                        </div>
                    </div>
                );

            case 'typography':
                return (
                    <div className="space-y-5">
                        {/* Add typography form */}
                        <div className="flex flex-wrap gap-3 items-end p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="min-w-28">
                                <label className="text-xs text-gray-500 mb-1 block">Papel *</label>
                                <select value={typoRole} onChange={e => setTypoRole(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none">
                                    <option value="">Selecione</option>
                                    <option value="heading">Título</option>
                                    <option value="body">Corpo</option>
                                    <option value="caption">Legenda</option>
                                    <option value="display">Display</option>
                                </select>
                            </div>
                            <div className="flex-1 min-w-32">
                                <label className="text-xs text-gray-500 mb-1 block">Família *</label>
                                <input type="text" value={typoFamily} onChange={e => setTypoFamily(e.target.value)} placeholder="ex: Inter" className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                            </div>
                            <div className="flex-1 min-w-40">
                                <label className="text-xs text-gray-500 mb-1 block">URL (Google Fonts)</label>
                                <input type="url" value={typoUrl} onChange={e => setTypoUrl(e.target.value)} placeholder="https://fonts.google.com/..." className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                            </div>
                            <button
                                onClick={handleAddTypo}
                                disabled={addingTypo || !typoRole || !typoFamily.trim()}
                                className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                            >
                                {addingTypo ? 'Adicionando...' : '+ Adicionar'}
                            </button>
                        </div>

                        {selected.typography.length === 0 && <p className="text-sm text-gray-400">Nenhuma tipografia cadastrada.</p>}
                        <div className="space-y-3">
                            {selected.typography.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-4">
                                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 capitalize">{t.role}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white" style={{ fontFamily: t.family }}>{t.family}</p>
                                            {t.source_url && (
                                                <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">Ver fonte ↗</a>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => withLoading(() => deleteTypography(t.id))} className="text-red-400 hover:text-red-600 transition-colors p-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'assets':
                return (
                    <div className="space-y-5">
                        {/* Upload asset form */}
                        <div className="flex flex-wrap gap-3 items-end p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="flex-1 min-w-32">
                                <label className="text-xs text-gray-500 mb-1 block">Nome do asset *</label>
                                <input type="text" value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="ex: Ícone principal" className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                            </div>
                            <div className="min-w-28">
                                <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                                <select value={assetType} onChange={e => setAssetType(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none">
                                    <option value="image">Imagem</option>
                                    <option value="icon">Ícone</option>
                                    <option value="pattern">Padrão</option>
                                    <option value="illustration">Ilustração</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>
                            <div>
                                <input ref={assetInputRef} type="file" className="hidden" onChange={handleAssetUpload} />
                                <button
                                    onClick={() => { if (!assetName.trim()) { alert('Informe o nome do asset'); return; } assetInputRef.current?.click(); }}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                                >
                                    Selecionar arquivo
                                </button>
                            </div>
                        </div>

                        {selected.assets.length === 0 && <p className="text-sm text-gray-400">Nenhum asset adicionado.</p>}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {selected.assets.map(asset => (
                                <div key={asset.id} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden group">
                                    <div className="h-28 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                                        {['image', 'icon', 'pattern', 'illustration'].includes(asset.asset_type) ? (
                                            <img src={asset.url || asset.file} alt={asset.name} className="max-h-24 max-w-full object-contain p-2" />
                                        ) : (
                                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="p-2 flex items-center justify-between">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{asset.name}</p>
                                        <button onClick={() => withLoading(() => deleteAsset(asset.id))} className="text-red-400 hover:text-red-600 transition-colors ml-1 flex-shrink-0">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'logos', label: 'Logos', count: selected?.logos.length ?? 0 },
        { key: 'colors', label: 'Cores', count: selected?.colors.length ?? 0 },
        { key: 'typography', label: 'Tipografia', count: selected?.typography.length ?? 0 },
        { key: 'assets', label: 'Assets', count: selected?.assets.length ?? 0 },
    ];

    return (
        <>
            <PageMeta title="Brand Kit | Miggo" description="Gerencie a identidade visual da marca" />
            <PageBreadcrumb pageTitle="Brand Kit" />

            <div className="space-y-6">

                {/* Header row */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isAdmin ? 'Todos os Brand Kits' : 'Identidade visual da sua marca'}
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Novo Brand Kit
                    </button>
                </div>

                {/* Create modal */}
                {showCreate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Criar Brand Kit</h3>
                            <div className="space-y-3">
                                <input
                                    type="text" value={createName} onChange={e => setCreateName(e.target.value)}
                                    placeholder="Nome do Brand Kit *"
                                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                                />
                                <textarea
                                    value={createDesc} onChange={e => setCreateDesc(e.target.value)}
                                    placeholder="Descrição (opcional)"
                                    rows={2}
                                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                                />
                                {isAdmin && (
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Cliente *</label>
                                        <Select
                                            options={clients.map(c => ({ value: String(c.id), label: c.name }))}
                                            placeholder="Buscar cliente..."
                                            onChange={(val) => setCreateClient(val)}
                                            defaultValue={createClient}
                                        />
                                    </div>
                                )}
                                {createError && <p className="text-xs text-red-500">{createError}</p>}
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => { setShowCreate(false); setCreateError(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
                                    {creating ? 'Criando...' : 'Criar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading / Error / Resolving client */}
                {(loading || resolvingClient) && <p className="text-sm text-gray-500">Carregando Brand Kits...</p>}
                {error && <p className="text-sm text-red-500">Erro: {error}</p>}

                {/* Brand Kit list */}
                {!loading && brandkits.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Nenhum Brand Kit encontrado.</p>
                        <p className="text-sm">Crie um para começar.</p>
                    </div>
                )}

                {/* Grid of brandkits (selection) */}
                {brandkits.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {brandkits.map(bk => (
                            <div
                                key={bk.id}
                                onClick={() => { setSelectedId(bk.id); setActiveTab('logos'); }}
                                className={`relative cursor-pointer rounded-2xl border p-5 transition-all ${selectedId === bk.id
                                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 shadow-md'
                                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-300 hover:shadow-sm'
                                    }`}
                            >
                                {/* Color preview */}
                                {bk.colors.length > 0 && (
                                    <div className="flex gap-1 mb-3">
                                        {bk.colors.slice(0, 5).map(c => (
                                            <div key={c.id} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.hex }} title={c.name} />
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-white">{bk.name}</h4>
                                        {bk.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{bk.description}</p>}
                                        <div className="flex gap-2 mt-2 text-xs text-gray-400">
                                            <span>{bk.logos.length} logo{bk.logos.length !== 1 ? 's' : ''}</span>
                                            <span>·</span>
                                            <span>{bk.colors.length} cor{bk.colors.length !== 1 ? 'es' : ''}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${bk.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                                        {bk.status}
                                    </span>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(bk.id); }}
                                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors"
                                    title="Remover"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail panel */}
                {selected && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        {/* Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-800 px-6 flex gap-1 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-1.5 py-3.5 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key
                                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {actionError && (
                                <div className="mb-4 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
                                    {actionError}
                                </div>
                            )}
                            {actionLoading && (
                                <p className="text-sm text-gray-400 mb-4">Processando...</p>
                            )}
                            {renderTabContent()}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
