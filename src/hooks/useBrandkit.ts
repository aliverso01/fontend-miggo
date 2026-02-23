import { useState, useEffect, useCallback } from 'react';

const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

export interface BrandLogo {
    id: number;
    brandkit: number;
    file: string;
    url: string;
    format: string;
    logo_type: string;
    background_context: string;
    primary_color_hex: string;
    secondary_color_hex: string;
    ai_description: string;
    analyzed: boolean;
    image_url: string;
    created_at: string;
}

export interface BrandColor {
    id: number;
    brandkit: number;
    name: string;
    hex: string;
    category: string;
    order: number;
    created_at: string;
}

export interface BrandTypography {
    id: number;
    brandkit: number;
    role: string;
    family: string;
    weights: string[];
    source_url: string;
    created_at: string;
}

export interface BrandAsset {
    id: number;
    brandkit: number;
    asset_type: string;
    name: string;
    file: string;
    url: string;
    created_at: string;
}

export interface Brandkit {
    id: number;
    client: number;
    brand_id: string;
    name: string;
    description: string;
    status: string;
    version: string;
    logos: BrandLogo[];
    colors: BrandColor[];
    typography: BrandTypography[];
    assets: BrandAsset[];
    created_at: string;
    updated_at: string;
}

const headers = () => ({
    Authorization: API_KEY,
    'Content-Type': 'application/json',
});

// isAdmin=true  → GET /api/v1/brandkit/list/
// isAdmin=false → GET /api/v1/brandkit/client/<clientId>/
export const useBrandkits = (clientId?: number | null, isAdmin?: boolean) => {
    const [brandkits, setBrandkits] = useState<Brandkit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBrandkits = useCallback(async () => {
        // Se for cliente, aguarda o clientId resolver antes de buscar
        if (!isAdmin && !clientId) return;

        setLoading(true);
        setError(null);
        try {
            const url = isAdmin
                ? '/api/v1/brandkit/list/'
                : `/api/v1/brandkit/client/${clientId}/`;
            const res = await fetch(url, { headers: headers() });
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const data = await res.json();
            setBrandkits(Array.isArray(data) ? data : [data]);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [clientId, isAdmin]);

    useEffect(() => { fetchBrandkits(); }, [fetchBrandkits]);

    return { brandkits, loading, error, refetch: fetchBrandkits };
};

// ── CRUD Brandkit ─────────────────────────────────────────────────────────────

export const createBrandkit = async (data: { client: number; name: string; description?: string }) => {
    const res = await fetch('/api/v1/brandkit/create/', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
};

export const updateBrandkit = async (id: number, data: Partial<Brandkit>) => {
    const res = await fetch(`/api/v1/brandkit/update/${id}/`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
};

export const deleteBrandkit = async (id: number) => {
    const res = await fetch(`/api/v1/brandkit/delete/${id}/`, {
        method: 'DELETE',
        headers: headers(),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
};

// ── Logo ──────────────────────────────────────────────────────────────────────

export const uploadLogo = async (brandkitId: number, file: File) => {
    const form = new FormData();
    form.append('brandkit', String(brandkitId));
    form.append('file', file);
    const res = await fetch('/api/v1/brandkit/logo/upload/', {
        method: 'POST',
        headers: { Authorization: API_KEY },
        body: form,
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
};

export const deleteLogo = async (id: number) => {
    const res = await fetch(`/api/v1/brandkit/logo/delete/${id}/`, {
        method: 'DELETE',
        headers: headers(),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
};

export const reanalyzeLogo = async (id: number) => {
    const res = await fetch(`/api/v1/brandkit/logo/reanalyze/${id}/`, {
        method: 'POST',
        headers: headers(),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
};

// ── Color ─────────────────────────────────────────────────────────────────────

export const createColor = async (data: { brandkit: number; name: string; hex: string; category?: string; order?: number }) => {
    const res = await fetch('/api/v1/brandkit/color/create/', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
};

export const updateColor = async (id: number, data: Partial<BrandColor>) => {
    const res = await fetch(`/api/v1/brandkit/color/update/${id}/`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
};

export const deleteColor = async (id: number) => {
    const res = await fetch(`/api/v1/brandkit/color/delete/${id}/`, {
        method: 'DELETE',
        headers: headers(),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
};

// ── Typography ────────────────────────────────────────────────────────────────

export const createTypography = async (data: { brandkit: number; role: string; family: string; weights?: string[]; source_url?: string }) => {
    const res = await fetch('/api/v1/brandkit/typography/create/', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
};

export const deleteTypography = async (id: number) => {
    const res = await fetch(`/api/v1/brandkit/typography/delete/${id}/`, {
        method: 'DELETE',
        headers: headers(),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
};

// ── Asset ─────────────────────────────────────────────────────────────────────

export const uploadAsset = async (brandkitId: number, file: File, name: string, asset_type: string) => {
    const form = new FormData();
    form.append('brandkit', String(brandkitId));
    form.append('file', file);
    form.append('name', name);
    form.append('asset_type', asset_type);
    const res = await fetch('/api/v1/brandkit/asset/create/', {
        method: 'POST',
        headers: { Authorization: API_KEY },
        body: form,
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
};

export const deleteAsset = async (id: number) => {
    const res = await fetch(`/api/v1/brandkit/asset/delete/${id}/`, {
        method: 'DELETE',
        headers: headers(),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
};
