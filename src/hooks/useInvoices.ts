import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';

export interface Invoice {
    id: number;
    subscription: {
        id: number;
        plan_price: {
            id: number;
            price: string;
            currency: string;
            interval: string;
            plan: number;
        };
        plan_meta: {
            id: number;
            key: string;
            value: string;
            plan: number;
        }[];
        start_date: string;
        end_date: string;
        expires_at: string;
        trial: boolean;
        status: string;
        client: number;
    };
    amount: string;
    currency: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export const useInvoices = (clientId: number | null | undefined) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthContext();

    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let url = '/api/v1/subscription/invoice/list/';
            if (clientId) {
                url += `?client_id=${clientId}`;
            }

            const response = await fetch(url, {
                credentials: 'include',
                headers: {
                    'Authorization': API_KEY
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch invoices');
            }

            const data = await response.json();
            setInvoices(data);
        } catch (err: any) {
            console.error("Error fetching invoices:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        // If user is client, we need clientId. If admin, maybe we fetch all?
        // For now, if clientId is provided or if we are admin (and clientId is null means fetch all?)
        // The logic depends on how the caller uses it.
        if (clientId !== undefined) {
            fetchInvoices();
        }
    }, [fetchInvoices, clientId]);

    return {
        invoices,
        loading,
        error,
        refetch: fetchInvoices
    };
};
