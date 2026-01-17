import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { SearchProvider } from "../context/SearchContext";
import { Outlet, useLocation, useNavigate } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { useAuth } from "../hooks/authHook";
import { useState, useEffect } from "react";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user } = useAuth(); // We need to export useAuth to use it here or import useAuthContext
  const location = useLocation();
  const navigate = useNavigate();
  const [isClientActive, setIsClientActive] = useState<boolean>(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check client status globally
  useEffect(() => {
    const checkStatus = async () => {
      if (user?.role === 'client') {
        setCheckingStatus(true);
        try {
          // First get list to find ID
          const listRes = await fetch("/api/v1/client/list/", {
            headers: { Authorization: "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS" }
          });
          if (listRes.ok) {
            const clients = await listRes.json();
            const myClient = clients.find((c: any) => c.user === user.id);
            if (myClient) {
              // Then get retrieve for accurate active status
              const detailRes = await fetch(`/api/v1/client/retrieve/${myClient.id}/`, {
                headers: { Authorization: "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS" }
              });
              if (detailRes.ok) {
                const detail = await detailRes.json();
                setIsClientActive(detail.active);
              }
            }
          }
        } catch (e) {
          console.error("Failed to check client status", e);
        } finally {
          setCheckingStatus(false);
        }
      }
    };

    if (user) checkStatus();
  }, [user]);

  // Redirect if inactive and not on home
  useEffect(() => {
    if (user?.role === 'client' && !isClientActive && !checkingStatus) {
      if (location.pathname !== '/') {
        navigate('/');
      }
    }
  }, [isClientActive, location.pathname, user, checkingStatus, navigate]);

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <SearchProvider>
        <LayoutContent />
      </SearchProvider>
    </SidebarProvider>
  );
};

export default AppLayout;
