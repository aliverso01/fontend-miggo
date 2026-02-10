import { useState, useEffect } from 'react';
import InvoiceList from '../../components/Subscription/InvoiceList';
import { useInvoices } from '../../hooks/useInvoices';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';

interface Client {
    id: number;
    name: string;
}

export default function BillingManagement() {
    const { invoices, loading, error } = useInvoices(null);
    const [clientsMap, setClientsMap] = useState<Record<number, string>>({});
    const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await fetch("/api/v1/client/list/", {
                    headers: { Authorization: API_KEY },
                });
                if (response.ok) {
                    const data: Client[] = await response.json();
                    const map: Record<number, string> = {};
                    data.forEach(c => {
                        map[c.id] = c.name;
                    });
                    setClientsMap(map);
                }
            } catch (e) {
                console.error("Failed to fetch clients", e);
            }
        };
        fetchClients();
    }, []);

    return (
        <>
            <PageMeta title="Gestão de Faturamento | Admin" description="Gerenciar faturas de clientes" />
            <PageBreadcrumb pageTitle="Gestão de Faturamento" />

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Todas as Faturas</h2>
                    <InvoiceList
                        invoices={invoices}
                        loading={loading}
                        error={error}
                        showClient={true}
                        clientsMap={clientsMap}
                    />
                </div>
            </div>
        </>
    );
}
