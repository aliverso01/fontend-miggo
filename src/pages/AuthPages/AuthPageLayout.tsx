import React from "react";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-900">

      {/* ── Painel ESQUERDO: logo + formulário ── */}
      <div className="flex flex-col w-full lg:w-1/2 min-h-screen lg:h-screen lg:overflow-y-auto">

        {/* Mobile: logo + form agrupados e centralizados juntos */}
        {/* Desktop: logo topo, form centrado verticalmente */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:py-0">

          {/* Logo — centralizado com o form no mobile, topo no desktop */}
          <div className="w-full max-w-md mb-8">
            <Link to="/">
              <img
                className="dark:hidden"
                src="/images/logo/logo_dark_expanded.svg"
                alt="Miggo"
                width={150}
                height={62}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo_light_expanded.svg"
                alt="Miggo"
                width={150}
                height={62}
              />
            </Link>
          </div>

          {/* Formulário */}
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>

      {/* ── Painel DIREITO: banner.png cover (só desktop) ── */}
      <div className="hidden lg:block lg:w-1/2 h-screen sticky top-0">
        <img
          src="/images/grid-image/banner.png"
          alt="Miggo Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Theme toggler */}
      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}
