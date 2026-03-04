import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  GridIcon,
  HorizontaLDots,
  ListIcon,
  GroupIcon,
  ChevronDownIcon,
  DollarLineIcon,
  CalenderIcon
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../hooks/authHook";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  adminOnly?: boolean;
  clientOnly?: boolean;
};

type NavGroup = {
  label: string;
  adminOnly?: boolean;
  clientOnly?: boolean;
  items: NavItem[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
    group: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const isAdmin = user?.is_superuser || user?.is_staff || user?.role === "admin";

  // ─── Navigation Groups ────────────────────────────────────────────────────
  const allGroups: NavGroup[] = [
    // ── SHARED ──
    {
      label: "Dashboard",
      items: [
        { icon: <GridIcon />, name: "Dashboard", path: "/" },
      ],
    },

    // ── ADMIN GROUPS ──
    {
      label: "Gestão",
      adminOnly: true,
      items: [
        { icon: <GroupIcon />, name: "Clientes", path: "/clients", adminOnly: true },
        { icon: <ListIcon />, name: "Conteúdos", path: "/content", adminOnly: true },
        { icon: <CalenderIcon />, name: "Biblioteca de Mídias", path: "/media-library", adminOnly: true },
      ],
    },
    {
      label: "Administrativo",
      adminOnly: true,
      items: [
        { icon: <DollarLineIcon />, name: "Faturamento", path: "/admin/billing", adminOnly: true },
        { icon: <ListIcon />, name: "Logs", path: "/admin/logs", adminOnly: true },
      ],
    },

    // ── CLIENT GROUPS ──
    {
      label: "Conteúdo",
      clientOnly: true,
      items: [
        { icon: <ListIcon />, name: "Conteúdos", path: "/content", clientOnly: true },
        { icon: <CalenderIcon />, name: "Calendário Editorial", path: "/editorial-calendar", clientOnly: true },
        { icon: <ListIcon />, name: "Sugestão de Pauta", path: "/agenda/sugestao", clientOnly: true },
        { icon: <GridIcon />, name: "Biblioteca de Mídias", path: "/media-library", clientOnly: true },
      ],
    },
    {
      label: "Social",
      clientOnly: true,
      items: [
        { icon: <GroupIcon />, name: "Redes Sociais", path: "/social-networks", clientOnly: true },
      ],
    },
    {
      label: "Conta",
      clientOnly: true,
      items: [
        { icon: <DollarLineIcon />, name: "Assinatura", path: "/billing", clientOnly: true },
      ],
    },
  ];

  // Filter groups and items based on role
  const visibleGroups = allGroups
    .filter((g) => {
      if (g.adminOnly && !isAdmin) return false;
      if (g.clientOnly && isAdmin) return false;
      return true;
    })
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.clientOnly && isAdmin) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  useEffect(() => {
    let submenuMatched = false;
    visibleGroups.forEach((group, gIndex) => {
      group.items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: "main", index, group: gIndex });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.group}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (groupIndex: number, itemIndex: number) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.group === groupIndex && prev.index === itemIndex) return null;
      return { type: "main", index: itemIndex, group: groupIndex };
    });
  };

  const renderMenuItems = (items: NavItem[], groupIndex: number) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(groupIndex, index)}
              className={`menu-item group ${openSubmenu?.group === groupIndex && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size ${openSubmenu?.group === groupIndex && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.group === groupIndex && openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${groupIndex}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.group === groupIndex && openSubmenu?.index === index
                    ? `${subMenuHeight[`${groupIndex}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="py-6 flex justify-center">
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo_dark_expanded.svg"
                alt="Miggo"
                width={300}
                height={66}
                style={{ marginTop: "-30px" }}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo_light_expanded.svg"
                alt="Miggo"
                width={300}
                height={66}
                style={{ marginTop: "-30px" }}
              />
            </>
          ) : (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo_dark.svg"
                alt="Miggo"
                width={44}
                height={44}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo_light.svg"
                alt="Miggo"
                width={44}
                height={44}
              />
            </>
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {visibleGroups.map((group, gIndex) => (
              <div key={group.label}>
                <h2
                  className={`mb-3 text-xs font-semibold uppercase tracking-wider leading-[20px] text-gray-400 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    group.label
                  ) : (
                    <HorizontaLDots className="size-5" />
                  )}
                </h2>
                {renderMenuItems(group.items, gIndex)}
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
