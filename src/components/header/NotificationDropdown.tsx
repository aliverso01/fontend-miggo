import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link } from "react-router";
import { useAuthContext } from "../../context/AuthContext";

interface Notification {
  id: number;
  notification_type: string;
  notification_type_display: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
  created_at_relative: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthContext();
  const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/v1/notification/list/?user_id=${user.id}`, {
        headers: { Authorization: API_KEY },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Polling a cada minuto para atualizar notificações (ajuste conforme necessário)
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Quando abre o dropdown, dá refresh
      fetchNotifications();
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/v1/notification/${id}/read/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      const response = await fetch(`/api/v1/notification/mark-all-read/?user_id=${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: API_KEY,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'new_client': return '👥';
      case 'new_post':
      case 'post_scheduled': return '📝';
      case 'post_published':
      case 'content_published': return '✅';
      case 'post_canceled': return '❌';
      case 'social_connected': return '🔗';
      case 'social_disconnected': return '🔌';
      case 'subscription_started': return '💎';
      case 'subscription_canceled': return '⚠️';
      case 'brandkit_uploaded': return '🎨';
      case 'post_ready_review': return '👀';
      case 'post_approved': return '👍';
      case 'billing_alert': return '💳';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Botão do Navbar */}
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0.5 z-10 flex h-2.5 w-2.5">
            <span className="absolute inline-flex w-full h-full bg-brand-500 rounded-full opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 border border-white dark:border-gray-900"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Caixa do Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-20 mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0 z-50 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notificações
            </h5>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center px-2 py-0.5 text-xs font-medium text-white rounded-full bg-brand-500">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Marcar todas lidas
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <ul className="flex flex-col flex-1 pb-2 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm font-medium">Nenhuma notificação</p>
              <p className="text-xs text-center mt-1">Quando você receber atualizações, elas aparecerão aqui.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <li key={notification.id}>
                {notification.link ? (
                  <Link
                    to={notification.link}
                    onClick={() => {
                      if (!notification.is_read) handleMarkAsRead(notification.id, { preventDefault: () => { }, stopPropagation: () => { } } as any);
                      closeDropdown();
                    }}
                    className={`flex items-start gap-3 rounded-lg p-3 my-0.5 transition-colors ${notification.is_read
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'bg-brand-50/50 hover:bg-brand-50 dark:bg-brand-900/10 dark:hover:bg-brand-900/20'
                      }`}
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-1 text-base rounded-full bg-gray-100 dark:bg-gray-800">
                      {getIconForType(notification.notification_type)}
                    </div>

                    <div className="flex-[1_1_0%] overflow-hidden">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className={`text-sm block font-semibold truncate pr-2 ${notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-gray-500 flex-shrink-0 dark:text-gray-400 mt-0.5">
                          {notification.created_at_relative}
                        </span>
                      </div>

                      <p className={`text-xs line-clamp-2 ${notification.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
                        {notification.message}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div
                    className={`flex items-start gap-4 rounded-lg p-3 my-0.5 select-none transition-colors ${notification.is_read
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'bg-brand-50/50 hover:bg-brand-50 dark:bg-brand-900/10 dark:hover:bg-brand-900/20 cursor-pointer'
                      }`}
                    onClick={(e) => {
                      if (!notification.is_read) handleMarkAsRead(notification.id, e);
                    }}
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-1 text-base rounded-full bg-gray-100 dark:bg-gray-800">
                      {getIconForType(notification.notification_type)}
                    </div>

                    <div className="flex-[1_1_0%] overflow-hidden">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className={`text-sm block font-semibold truncate pr-2 ${notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-gray-500 flex-shrink-0 dark:text-gray-400 mt-0.5">
                          {notification.created_at_relative}
                        </span>
                      </div>

                      <p className={`text-xs line-clamp-2 ${notification.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
