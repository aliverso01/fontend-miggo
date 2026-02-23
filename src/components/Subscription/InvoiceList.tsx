import React, { useState } from 'react';
import { Invoice } from '../../hooks/useInvoices';

interface InvoiceListProps {
    invoices: Invoice[];
    loading: boolean;
    error: string | null;
    showClient?: boolean;
    clientsMap?: Record<number, string>;
    isAdmin?: boolean;
    onStatusUpdated?: () => void;
}

const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

const STATUS_OPTIONS = [
    { value: 'PAID', label: 'Pago' },
    { value: 'UNPAID', label: 'Não pago' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'CANCELLED', label: 'Cancelado' },
];

const statusConfig: Record<string, { color: string; label: string }> = {
    paid: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        label: 'Pago',
    },
    unpaid: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        label: 'Não pago',
    },
    pending: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Pendente',
    },
    cancelled: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        label: 'Cancelado',
    },
};

const getStatusConfig = (status: string) =>
    statusConfig[status.toLowerCase()] ?? {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        label: status,
    };

const InvoiceList: React.FC<InvoiceListProps> = ({
    invoices,
    loading,
    error,
    showClient = false,
    clientsMap = {},
    isAdmin = false,
    onStatusUpdated,
}) => {
    // Track selected status per invoice row
    const [selectedStatus, setSelectedStatus] = useState<Record<number, string>>({});
    const [updating, setUpdating] = useState<Record<number, boolean>>({});
    const [updateError, setUpdateError] = useState<Record<number, string>>({});
    const [updateSuccess, setUpdateSuccess] = useState<Record<number, boolean>>({});

    const handleUpdateStatus = async (invoiceId: number) => {
        const newStatus = selectedStatus[invoiceId];
        if (!newStatus) return;

        setUpdating(prev => ({ ...prev, [invoiceId]: true }));
        setUpdateError(prev => ({ ...prev, [invoiceId]: '' }));
        setUpdateSuccess(prev => ({ ...prev, [invoiceId]: false }));

        try {
            const res = await fetch(`/api/v1/subscription/invoice/update/${invoiceId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.detail || `Erro ${res.status}`);
            }

            setUpdateSuccess(prev => ({ ...prev, [invoiceId]: true }));
            // Clear success after 2s
            setTimeout(() => {
                setUpdateSuccess(prev => ({ ...prev, [invoiceId]: false }));
            }, 2000);

            onStatusUpdated?.();
        } catch (err: any) {
            setUpdateError(prev => ({ ...prev, [invoiceId]: err.message || 'Erro ao atualizar' }));
        } finally {
            setUpdating(prev => ({ ...prev, [invoiceId]: false }));
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Carregando faturas...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Erro ao carregar faturas: {error}</div>;

    if (!invoices || invoices.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <p>Nenhuma fatura encontrada.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            ID
                        </th>
                        {showClient && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Cliente
                            </th>
                        )}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Plano
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Valor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                        </th>
                        {isAdmin && (
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Atualizar status
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                #{invoice.id}
                            </td>
                            {showClient && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {clientsMap?.[invoice.subscription.client] || invoice.subscription.client}
                                </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {invoice.subscription?.plan_price?.interval}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {Number(invoice.amount).toLocaleString('pt-BR', { style: 'currency', currency: invoice.currency })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusConfig(invoice.status ?? '').color}`}>
                                    {getStatusConfig(invoice.status ?? '').label}
                                </span>
                            </td>

                            {/* Admin: coluna de atualização de status */}
                            {isAdmin && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedStatus[invoice.id] ?? invoice.status?.toUpperCase() ?? ''}
                                            onChange={(e) =>
                                                setSelectedStatus(prev => ({ ...prev, [invoice.id]: e.target.value }))
                                            }
                                            disabled={updating[invoice.id]}
                                            className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 disabled:opacity-50"
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            onClick={() => handleUpdateStatus(invoice.id)}
                                            disabled={updating[invoice.id] || !selectedStatus[invoice.id]}
                                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {updating[invoice.id] ? (
                                                <>
                                                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                    </svg>
                                                    Salvando...
                                                </>
                                            ) : updateSuccess[invoice.id] ? (
                                                <>
                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Salvo!
                                                </>
                                            ) : (
                                                'Salvar'
                                            )}
                                        </button>
                                    </div>

                                    {/* Erro inline por linha */}
                                    {updateError[invoice.id] && (
                                        <p className="mt-1 text-xs text-red-500">{updateError[invoice.id]}</p>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InvoiceList;
