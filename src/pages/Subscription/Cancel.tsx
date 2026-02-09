import { Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import Button from '../../components/ui/button/Button';

export default function Cancel() {
    return (
        <>
            <PageMeta title="Cancelado | Miggo" description="Assinatura não concluída" />
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Pagamento Cancelado / Não Concluído</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                    O processo de assinatura não foi finalizado. Nenhuma cobrança foi feita no seu cartão.
                </p>
                <div className="flex gap-4">
                    <Link to="/plans">
                        <Button variant="outline" className="px-8">Tentar Novamente</Button>
                    </Link>
                    <Link to="/">
                        <Button className="px-8">Voltar ao Início</Button>
                    </Link>
                </div>
            </div>
        </>
    );
}
