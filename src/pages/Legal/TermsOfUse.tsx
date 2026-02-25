import PageMeta from "../../components/common/PageMeta";

export default function TermsOfUse() {
    return (
        <>
            <PageMeta
                title="Termos de Uso | Miggo"
                description="Termos de uso da plataforma Miggo Marketing"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12">
                    <div className="mb-8">
                        <img
                            src="/images/logo/logo_dark_expanded.svg"
                            alt="Miggo"
                            className="h-10 dark:hidden"
                        />
                        <img
                            src="/images/logo/logo_light_expanded.svg"
                            alt="Miggo"
                            className="h-10 hidden dark:block"
                        />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Termos de Uso</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Última atualização: 01 de fevereiro de 2024</p>

                    <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Sobre o Serviço</h2>
                            <p>Informamos que o serviço, o site e todo o seu conteúdo são de propriedade exclusiva da <strong>51.742.621 SONIA REGINA DUTRA CAMPOS</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 51.742.621/0001-81, com sede na RUA PROFESSOR PEDRO VIRIATO PARIGOT DE SOUZA, 5285, CURITIBA, PARANÁ.</p>
                            <p className="mt-3">Neste início, estamos disponibilizando a compra de pacote com acesso restrito de pessoas para utilização do serviço. Esses usuários serão os "BETA TESTERS". Ressaltamos que neste período, a MIGGO MARKETING está em fase beta e sua utilização poderá haver bugs e falhas.</p>
                            <p className="mt-3">Ressaltamos que, através de seu whatsapp, a MIGGO MARKETING, irá disponibilizar aos seus usuários, autorização não exclusiva, intransferível e revogável do uso de conteúdos criados pela MIGGO MARKETING, o qual tem como objetivo oferecer um serviço que disponibiliza imagens, textos e vídeos personalizados e, terá acesso às suas informações de redes sociais para postar e acompanhar as informações do seu desempenho.</p>
                            <p className="mt-3">Os serviços MIGGO MARKETING poderão ser contratados por qualquer parte do mundo, porém ressaltamos que ao adquiri-los, você estará concordando com esses termos e sujeito à Legislação Brasileira, além de atendimento e conteúdos em português do Brasil. Portanto, leia-o com atenção.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Sobre o Termo de Uso</h2>
                            <p>O presente Termo aplica-se à utilização dos serviços da MIGGO MARKETING e tem como objetivo definir as regras a serem seguidas pelos usuários do serviço. Desse modo, caso haja alguma discordância por parte do usuário, solicitamos que não contrate o serviço.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Condições Gerais</h2>
                            <p>É de responsabilidade da MIGGO MARKETING proteger e conservar todos os dados pessoais dos usuários, de modo que as informações fornecidas estarão sujeitas a medidas de segurança para impedir o acesso, o uso e a divulgação não autorizada. Porém, o usuário se responsabiliza civil e criminalmente, inclusive perante terceiros, pela veracidade dos dados informados.</p>
                            <p className="mt-3">A MIGGO MARKETING tem o direito de suspender ou cancelar o acesso de qualquer usuário ao serviço nos casos de fraude comprovada, participação através da obtenção de benefício ou vantagem de forma ilícita ou pelo não cumprimento de quaisquer das condições destes Termos de Uso.</p>
                            <p className="mt-3">Ressaltamos que a MIGGO MARKETING está em fase de BETA TESTE, sendo assim, reforçamos a possibilidade de haver bugs e falhas no sistema. Ao realizar a assinatura, entendemos que você está ciente destas condições.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Dos 7 Dias Grátis</h2>
                            <p>A MIGGO MARKETING oferece aos seus usuários um benefício de 7 dias corridos em que há gratuidade do seu serviço. Esse benefício é promocional e pode ser suspendido a qualquer momento.</p>
                            <p className="mt-3">Caso o cliente não retorne ou aprove os conteúdos sugeridos, os dias de serviço não são acumulativos. Após o término do período gratuito, é preciso escolher a assinatura que deseja adotar para obter continuidade da solução.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Das Assinaturas Trimestrais e Semestrais</h2>
                            <p>O pagamento da assinatura trimestral é mensal e recorrente durante 3 meses, sendo cobrado via a plataforma STRIPE — uma gateway de pagamentos que não faz parte do grupo MIGGO MARKETING (<a href="https://stripe.com/en-br/ssa" className="text-brand-500 hover:text-brand-600" target="_blank" rel="noopener noreferrer">stripe.com/en-br/ssa</a>).</p>
                            <p className="mt-3">As assinaturas trimestrais têm a duração de 3 meses e seu pagamento é realizado no cartão de crédito em 3x sem juros. Se houver a necessidade do cliente cancelar a assinatura antes do término do período vigente, o serviço será cancelado, porém as parcelas <strong>não serão canceladas</strong> até o término do período contratado. A renovação do plano trimestral é automática.</p>
                            <p className="mt-3">O pagamento da assinatura semestral é mensal e recorrente durante 6 meses. As assinaturas semestrais têm a duração de 6 meses e seu pagamento é realizado no cartão de crédito em 6x sem juros. A renovação do plano semestral é automática.</p>
                            <p className="mt-3">Próximo à conclusão do período, os usuários podem cancelar e não serão cobrados das mensalidades subsequentes, desde que cancelem com ao menos <strong>3 dias úteis de antecedência</strong> à data de cobrança fixa do cartão.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Suspensão de Serviços por Inadimplência</h2>
                            <p>A Miggo é uma plataforma de assinatura com fidelidade mínima de 6 (seis) meses. O cliente assume o compromisso de pagamento mensal durante esse período, independentemente da utilização dos serviços.</p>
                            <p className="mt-3">Em caso de inadimplência, o fornecimento dos conteúdos será suspenso automaticamente até que os valores em aberto sejam quitados. O período em que os conteúdos não forem entregues por inadimplência não será compensado com envios retroativos.</p>
                            <p className="mt-3">Em caso de inadimplência superior a 30 dias, a Miggo reserva-se o direito de registrar a dívida em órgãos de proteção ao crédito, conforme previsto em lei.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Dos Conteúdos Personalizados</h2>
                            <p>Atualmente, a MIGGO MARKETING conta com apenas o Plano Base, em que 100% do conteúdo gerado é personalizado à marca do usuário. Esse plano inclui sugestão de post todo dia útil. Em semanas sem feriado, os posts são compostos de: 2 posts nos stories e 3 posts no feed.</p>
                            <p className="mt-3">Os posts no feed são compostos de apenas uma imagem quadrada estática com legenda. Até 2 vezes por mês criamos vídeos para Reels e até 2 vezes por mês criamos posts do tipo "Carrossel" (até 6 imagens quadradas com legenda).</p>
                            <p className="mt-3">Após a aprovação do conteúdo, a postagem é feita no mesmo dia da aprovação, desde que esta seja feita até 16h. As alterações são limitadas a até 3 revisões, que podem demorar de 2 a 24 horas úteis.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Dos Conteúdos Antigos</h2>
                            <p>A Miggo armazena os conteúdos gerados pela plataforma pelo período máximo de 30 (trinta) dias corridos, a contar da data de envio ao cliente. Após esse prazo, os arquivos são automaticamente excluídos do sistema.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Ramos de Atividade Não Atendidos</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Atividades Ilegais</strong></li>
                                <li><strong>Marketing Político</strong></li>
                                <li><strong>Indústria de Armas</strong></li>
                                <li><strong>Conteúdo Adulto</strong></li>
                                <li><strong>Jogos de Azar</strong></li>
                                <li><strong>Propagandas Enganosas ou Golpes</strong></li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Responsabilidade pelo Uso dos Conteúdos</h2>
                            <p>A MIGGO MARKETING entrega conteúdos com base nas informações fornecidas pelos clientes. No entanto, a responsabilidade legal pelo uso, publicação e repercussão dos conteúdos gerados é exclusivamente do cliente contratante.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Isenção de Responsabilidade</h2>
                            <p>Em termos jurídicos, até onde permitido por lei, o serviço da MIGGO MARKETING não é responsável por danos e prejuízos financeiros, materiais e morais, diretos ou indiretos, inclusive lucros cessantes, bem como danos físicos eventualmente sofridos pelos USUÁRIOS.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Foro</h2>
                            <p>Para operações realizadas a partir das ferramentas disponibilizadas pela MIGGO MARKETING fica eleito o foro da <strong>Comarca de Curitiba/PR</strong> como o único competente para dirimir eventuais controvérsias.</p>
                        </section>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
                        <a href="/privacy" className="text-brand-500 hover:text-brand-600 text-sm font-medium">
                            Ver Política de Privacidade →
                        </a>
                        <a href="/signup" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm">
                            Voltar ao Cadastro
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
