import { useEffect, useState } from "react";
import { GroupIcon, ListIcon } from "../../icons";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  const [clientCount, setClientCount] = useState<number>(0);
  const [postCount, setPostCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const API_KEY = "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsRes, postsRes] = await Promise.all([
          fetch("/api/v1/client/list/", { headers: { Authorization: API_KEY } }),
          fetch("/api/v1/post/list/", { headers: { Authorization: API_KEY } })
        ]);

        if (clientsRes.ok) {
          const clients = await clientsRes.json();
          setClientCount(clients.length);
        }

        if (postsRes.ok) {
          const posts = await postsRes.json();
          setPostCount(posts.length);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <PageMeta
        title="Dashboard | Miggo"
        description="Visão geral da sua conta Miggo"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">

        {/* Clients Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Clientes Ativos
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {loading ? "..." : clientCount}
              </h4>
            </div>
          </div>
        </div>

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
    </>
  );
}
