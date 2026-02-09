import { useEffect } from 'react';
import { Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import Button from '../../components/ui/button/Button';

export default function Success() {
    useEffect(() => {
        // Optional: Call API to confirm transaction if needed, 
        // though usually Stripe Webhooks handle the backend fulfillment.
    }, []);

    return (
        <>
            <PageMeta title="Sucesso | Miggo" description="Assinatura realizada com sucesso" />
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Assinatura Confirmada!</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                    Obrigado por assinar o Miggo. Seu acesso já foi liberado e você pode começar a usar todos os recursos agora mesmo.
                </p>
                <div className="flex gap-4">
                    <Link to="/">
                        <Button className="px-8">Ir para o Dashboard</Button>
                    </Link>
                </div>
            </div>
        </>
    );
}
