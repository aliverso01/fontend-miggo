import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { GroupIcon, ListIcon, TimeIcon, ArrowRightIcon, CalenderIcon } from "../../icons";
import PageMeta from "../../components/common/PageMeta";
import { useAuthContext } from "../../context/AuthContext";

const STATUS_LABELS: Record<number, string> = {
  1: "A CRIAR",
  2: "RASCUNHO",
  3: "AGENDADO",
  4: "ENVIADO",
  5: "PENDENTE",
  6: "PAUSADO",
  7: "FINALIZADO",
  8: "APROVADO",
  9: "ENVIANDO",
  10: "PUBLICADO",
  11: "CANCELADO",
  12: "CORREÇÃO"
};

interface HistoryItem {
  id: number;
  action: string;
  model_name: string;
  object_id: string;
  description: string;
  created_at: string;
}

interface EditorialRule {
  id: number;
  client: number;
  week_day: string;
  subject: string;
  time: string;
  active: boolean;
}

interface Client {
  id: number;
  name: string;
  user: number;
}

export default function Home() {
  const { user } = useAuthContext();
  const [clientCount, setClientCount] = useState<number>(0);
  const [inactiveClientCount, setInactiveClientCount] = useState<number>(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [postCount, setPostCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editorialRules, setEditorialRules] = useState<EditorialRule[]>([]);
  const [briefingData, setBriefingData] = useState<Record<string, string>>({});
  const [chartData, setChartData] = useState<{ series: any[], options: ApexOptions }>({
    series: [],
    options: {}
  });

  const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

  // Client Activation State
  const [isClientActive, setIsClientActive] = useState<boolean>(true);
  const [activationCode, setActivationCode] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState("");
  const [currentClientId, setCurrentClientId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Wait for user to be loaded to apply role filters
      if (!user) return;

      setLoading(true);
      try {
        // Build Promise array
        const promises: Promise<Response>[] = [
          fetch("/api/v1/client/list/", { headers: { Authorization: API_KEY } }),
          // Post List replaced by Report? Home still needs basic list? No, purely stats in Home now.
          // BUT - is 'posts' used elsewhere? No, only for stats.
          // fetch("/api/v1/post/list/", { headers: { Authorization: API_KEY } }), 
          // History with user_id based on role
          user.role === 'client'
            ? fetch(`/api/v1/history/list/?user_id=${user.id}`, { headers: { Authorization: API_KEY } })
            : fetch("/api/v1/history/list/", { headers: { Authorization: API_KEY } }),

          fetch("/api/v1/editorial-calendar/list/", { headers: { Authorization: API_KEY } })
        ];

        // Add Reports
        // Client Report (Admin Only)
        // Post Report (All)

        let clientReportPromise: Promise<Response> | null = null;
        let postReportPromise: Promise<Response> | null = null;

        if (user.role !== 'client') { // Admin/Staff
          clientReportPromise = fetch("/api/v1/history/report/clients/", { headers: { Authorization: API_KEY } });
          postReportPromise = fetch("/api/v1/history/report/posts/", { headers: { Authorization: API_KEY } });
        }

        // We handle Client-specific logic after basic fetches because we need client ID first?
        // Actually, for "client" role, we need to know their client ID to fetch their post report.

        // Execute initial batch
        const [clientsRes, historyRes, editorialRes] = await Promise.all(promises);

        let allClients: Client[] = [];
        let myClient: Client | undefined;

        if (clientsRes.ok) {
          allClients = await clientsRes.json();
          // We don't set clientCount from this list anymore if we use the report for admins,
          // but let's keep it sync for now or rely on report.
          setClients(allClients);

          if (user.role === 'client') {
            myClient = allClients.find(c => c.user === user.id);
            if (myClient) {
              setCurrentClientId(myClient.id);
              // Fetch Post Report for this Client
              postReportPromise = fetch(`/api/v1/history/report/posts/?client_id=${myClient.id}`, { headers: { Authorization: API_KEY } });

              // Also check active status logic
              try {
                const clientDetailRes = await fetch(`/api/v1/client/retrieve/${myClient.id}/`, { headers: { Authorization: API_KEY } });
                if (clientDetailRes.ok) {
                  const clientDetail = await clientDetailRes.json();
                  setIsClientActive(clientDetail.active);
                } else if ('active' in myClient) {
                  setIsClientActive((myClient as any).active);
                }
              } catch (e) { console.error(e) }
            }
          }
        }

        // Handle Reports
        if (clientReportPromise) {
          try {
            const res = await clientReportPromise;
            if (res.ok) {
              const data = await res.json();
              // Resp format: [{"total_clients": 3, "details": {"active": 2, "inactive": 1}}]
              if (Array.isArray(data) && data.length > 0) {
                // Use active count? or Total? User said "Clientes Ativos" in UI label
                setClientCount(data[0].details?.active || 0); // or data[0].total_clients? Label says Active.
                setInactiveClientCount(data[0].details?.inactive || 0);
              }
            }
          } catch (e) { console.error("Client report error", e); }
        }

        if (postReportPromise) {
          try {
            const res = await postReportPromise;
            if (res.ok) {
              const data = await res.json();
              // Resp format: { "total_posts": 94, "details": [ {"pending": 80}, ... ] }
              setPostCount(data.total_posts || 0);

              // Chart Data Processing
              const details: Record<string, number>[] = data.details || [];
              // Flatten details to a single object: { pending: 80, draft: 2 ... }
              const statsMap: Record<string, number> = {};
              details.forEach(item => {
                const key = Object.keys(item)[0];
                statsMap[key] = item[key];
              });

              // Map internal keys to our display labels
              // STATUS_LABELS key is ID, value is Name.
              // We need a map from Key -> Label.
              // Assuming keys match standard status names approximately.

              // Map keys to Portuguese labels used in STATUS_LABELS?
              // Or map backend keys to STATUS_LABELS IDs?
              // Backend keys: pending, draft, scheduled, sent, holding, paused, finished, approved, uploading, published, canceled, correction
              // STATUS_LABELS: 
              // 1: A CRIAR (?), 2: RASCUNHO (draft), 3: AGENDADO (scheduled), 4: ENVIADO (sent), 
              // 5: PENDENTE (pending), 6: PAUSADO (paused), 7: FINALIZADO (finished), 8: APROVADO (approved)
              // 9: ENVIANDO (uploading?), 10: PUBLICADO (published), 11: CANCELADO (canceled), 12: CORREÇÃO (correction)

              const keyToLabel: Record<string, string> = {
                'draft': STATUS_LABELS[2],
                'scheduled': STATUS_LABELS[3],
                'sent': STATUS_LABELS[4], // or 'pending'? 
                'pending': STATUS_LABELS[5],
                'holding': 'AGUARDANDO', // No exact match in provided ID list? Maybe ID 1? Or just show as is?
                'paused': STATUS_LABELS[6],
                'finished': STATUS_LABELS[7],
                'approved': STATUS_LABELS[8],
                'uploading': STATUS_LABELS[9],
                'published': STATUS_LABELS[10],
                'canceled': STATUS_LABELS[11],
                'correction': STATUS_LABELS[12]
              };

              const categories: string[] = [];
              const chartDataArray: number[] = [];

              // We can iterate the response keys or fixed list.
              // Let's iterate the map to ensure order if we want, or just the data keys.
              // Let's use the provided keys from backend to show what's actually there.

              Object.keys(statsMap).forEach(key => {
                // Skip if count 0? Or show?
                if (statsMap[key] > 0) {
                  categories.push(keyToLabel[key] || key.toUpperCase());
                  chartDataArray.push(statsMap[key]);
                }
              });

              setChartData({
                series: [{ name: "Posts", data: chartDataArray }],
                options: {
                  chart: { type: 'bar', height: 350, toolbar: { show: false } },
                  plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
                  dataLabels: { enabled: false },
                  stroke: { show: true, width: 2, colors: ['transparent'] },
                  xaxis: { categories: categories, axisBorder: { show: false }, axisTicks: { show: false } },
                  yaxis: { title: { text: 'Quantidade' } },
                  fill: { opacity: 1 },
                  tooltip: { y: { formatter: (val) => val + " posts" } },
                  colors: ['#4F46E5'],
                  grid: { borderColor: '#f1f1f1' }
                }
              });

            }
          } catch (e) { console.error("Post report error", e); }
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          // Take top 5 recent
          setHistory(historyData.slice(0, 5));
        }

        if (editorialRes.ok) {
          const rules = await editorialRes.json();
          setEditorialRules(rules);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchBriefing = async () => {
      if (user?.role === 'client' && clients.length > 0) {
        const myClient = clients.find(c => c.user === user.id);
        if (myClient) {
          try {
            const res = await fetch(`/api/v1/client/client-meta/list/?client_id=${myClient.id}`, {
              headers: { Authorization: API_KEY }
            });
            if (res.ok) {
              const data = await res.json();
              const map: Record<string, string> = {};
              data.forEach((item: any) => map[item.key] = item.value);
              setBriefingData(map);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    fetchBriefing();
  }, [user, clients]);

  const handleActivate = async () => {
    const code = activationCode.trim();
    if (!currentClientId || !code) {
      setActivationError("Activation code is required");
      return;
    }
    setActivationError("");
    setActivationSuccess("");

    try {
      const response = await fetch(`/api/v1/client/activate-account/${currentClientId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY
        },
        // Sending both common keys to potential backend handling to ensure one catch
        // Also ensure it is a string
        body: JSON.stringify({ code: code, activation_code: code })
      });

      if (response.ok) {
        setActivationSuccess("Conta ativada com sucesso!");
        setIsClientActive(true);
        // Refresh page or context? 
        // Since AppLayout also checks active status on mount, user might need to refresh or we update global.
        // For now, local state update hides the banner.
      } else {
        const data = await response.json();
        // Try to read common error fields or use default
        const msg = data.message || data.detail || (data.code ? data.code[0] : "Erro ao ativar conta.");
        setActivationError(msg);
      }
    } catch (e) {
      setActivationError("Erro de conexão.");
    }
  };

  const handleResendCode = async () => {
    if (!currentClientId) return;
    try {
      const response = await fetch(`/api/v1/client/generate-activation-code/${currentClientId}/`, {
        headers: { Authorization: API_KEY }
      });
      if (response.ok) {
        alert("Código reenviado para o WhatsApp!");
      } else {
        alert("Erro ao reenviar código.");
      }
    } catch (e) {
      alert("Erro ao reenviar código.");
    }
  };

  const getDayLabel = (englishDay: string) => {
    const map: Record<string, string> = {
      "Monday": "Segunda-feira",
      "Tuesday": "Terça-feira",
      "Wednesday": "Quarta-feira",
      "Thursday": "Quinta-feira",
      "Friday": "Sexta-feira",
      "Saturday": "Sábado",
      "Sunday": "Domingo",
    };
    return map[englishDay] || englishDay;
  };

  const isAdmin = user?.role === 'admin' || user?.is_superuser;

  return (
    <>
      <PageMeta
        title="Dashboard | Miggo"
        description="Visão geral da sua conta Miggo"
      />

      {!isClientActive && user?.role === 'client' && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Conta não ativada</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">
            Sua conta precisa ser ativada para acessar todas as funcionalidades (como criar posts).
            Por favor, insira o código de 6 dígitos enviado para o seu WhatsApp cadastrado.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="text"
              placeholder="Código (ex: 123456)"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-48"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
            />
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
            >
              Ativar Conta
            </button>
            <button
              onClick={handleResendCode}
              className="px-4 py-2 text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium underline text-sm"
            >
              Reenviar Código via WhatsApp
            </button>
          </div>

          {activationError && (
            <p className="mt-3 text-sm font-medium text-red-600">{activationError}</p>
          )}
          {activationSuccess && (
            <p className="mt-3 text-sm font-medium text-green-600">{activationSuccess}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 mb-6">

        {/* Clients Card OR Briefing Widget */}
        {user?.role === 'client' ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <Link to="/briefing" className="text-sm font-medium text-brand-500 hover:text-brand-600">Ver detalhes</Link>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Minha Marca</span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 line-clamp-1">
                {briefingData['brand_name'] || clients.find(c => c.user === user?.id)?.name || "Marca"}
              </h4>
              {briefingData['brand_tone'] && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  Tom: {briefingData['brand_tone']}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
            </div>

            <div className="flex items-end justify-between mt-5">
              <div className="flex gap-8">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Clientes Ativos
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {loading ? "..." : clientCount}
                  </h4>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Inativos
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {loading ? "..." : inactiveClientCount}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <ListIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total de Posts
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {loading ? "..." : postCount}
              </h4>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Chart Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Posts por Status
          </h3>
          <div className="w-full">
            {loading ? (
              <div className="h-[350px] flex items-center justify-center text-gray-400">Carregando gráfico...</div>
            ) : (
              <div id="chart">
                <ReactApexChart options={chartData.options} series={chartData.series} type="bar" height={350} />
              </div>
            )}
          </div>
        </div>

        {/* History Widget */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Histórico Recente
            </h3>
            <Link to="/history" className="text-sm font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1">
              Ver tudo <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 dark:bg-gray-700"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma atividade recente.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {history.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center dark:bg-blue-500/10 dark:text-blue-400 mt-1">
                      <TimeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase 
                                            ${item.action === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                            item.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                              item.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                                'bg-gray-100 text-gray-700'}`}>
                          {{ 'CREATE': 'CRIADO', 'UPDATE': 'ALTERADO', 'DELETE': 'DELETADO' }[item.action] || item.action}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {new Date(item.created_at).toLocaleDateString()} às {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editorial Calendar Widget */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
          <CalenderIcon className="w-5 h-5" />
          {isAdmin ? "Calendário Editorial dos Clientes" : "Meu Calendário Editorial"}
        </h3>

        {loading ? (
          <div className="h-20 flex items-center justify-center text-gray-400">Carregando calendário...</div>
        ) : (
          <>
            {isAdmin ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map(client => {
                  const activeRules = editorialRules.filter(r => r.client === client.id && r.active).length;
                  return (
                    <div key={client.id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-all flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800 dark:text-white/90">{client.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${activeRules > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {activeRules} regras
                        </span>
                      </div>
                      <Link
                        to={`/editorial-calendar?client_id=${client.id}`}
                        className="text-sm text-brand-500 hover:text-brand-600 font-medium mt-auto self-start"
                      >
                        Ver Calendário &rarr;
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {editorialRules.filter(r => r.active).length === 0 ? (
                  <p className="text-gray-500">Nenhuma regra ativa no calendário.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                      const rules = editorialRules.filter(r => r.week_day === day && r.active);
                      if (rules.length === 0) return null;
                      return (
                        <div key={day} className="py-3 flex gap-4 items-center">
                          <span className="w-24 font-medium text-gray-500 dark:text-gray-400 text-sm">{getDayLabel(day)}</span>
                          <div className="flex gap-2 flex-wrap">
                            {rules.map(rule => (
                              <span key={rule.id} className="px-3 py-1 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg text-sm font-medium border border-brand-100 dark:border-brand-500/20">
                                {rule.subject} ({rule.time})
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
