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

        {/* Container centralizado verticamente e horizontalmente */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">

          {/* Bloco logo + form juntos, com largura máxima */}
          <div style={{ width: "100%", maxWidth: "420px" }}>

            {/* Logo grande e centralizado */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <Link to="/" className="inline-block">
                <img
                  className="dark:hidden"
                  src="/images/logo/logo_dark_expanded.svg"
                  alt="Miggo"
                  style={{ width: "280px", maxWidth: "80vw", height: "auto" }}
                />
                <img
                  className="hidden dark:block"
                  src="/images/logo/logo_light_expanded.svg"
                  alt="Miggo"
                  style={{ width: "280px", maxWidth: "80vw", height: "auto" }}
                />
              </Link>
            </div>

            {/* Formulário */}
            {children}
          </div>
        </div>
      </div>

      {/* ── Painel DIREITO: banner cover (só desktop) ── */}
      <div className="hidden lg:block lg:w-1/2 h-screen sticky top-0">
        <img
          src="/images/grid-image/banner.webp"
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
