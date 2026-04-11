"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface Props {
  user: { name: string; profileImageUrl: string | null };
  children: React.ReactNode;
}

const tabs = [
  { id: "overview", label: "Overview", href: "/dashboard" },
  { id: "activities", label: "Actividades", href: "/dashboard/activities" },
  { id: "metrics", label: "Métricas", href: "/dashboard/metrics" },
  { id: "coach", label: "Coach IA", href: "/dashboard/coach" },
];

export function DashboardShell({ user, children }: Props) {
  const pathname = usePathname();

  const activeTab =
    pathname === "/dashboard"
      ? "overview"
      : tabs.find((t) => pathname.startsWith(t.href) && t.href !== "/dashboard")
          ?.id ?? "overview";

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060d1a",
        color: "#f1f5f9",
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: 0,
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .tab-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .activity-row:hover { background: rgba(255,255,255,0.04) !important; cursor: pointer; }
        .insight-card { transition: transform 0.2s ease; }
        .insight-card:hover { transform: translateY(-2px); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.12s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.19s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.26s; opacity: 0; }
        .fade-up-5 { animation-delay: 0.33s; opacity: 0; }

        /* ── Responsive layout classes ── */
        .rg-4   { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
        .rg-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .rg-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; }
        .rg-3-2 { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; margin-bottom: 20px; }

        /* bottom nav hidden on desktop */
        .bottom-nav { display: none; }

        /* activity row stats */
        .act-stats-mini { display: none; }

        /* header padding as CSS so media query can override */
        .header-inner { padding: 0 32px; }
        .content-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 32px 0; }

        /* hero title */
        .hero-title { font-size: 40px; font-weight: 900; font-family: 'Barlow Condensed', sans-serif; letter-spacing: -0.02em; }

        /* activity expand grid */
        .act-expand-grid { grid-template-columns: repeat(4,1fr); }

        /* insight cards grid (coach page) */
        .rg-insight { gap: 16px; margin-bottom: 0; }

        @media (max-width: 639px) {
          .rg-4   { grid-template-columns: repeat(2,1fr); gap: 12px; margin-bottom: 20px; }
          .rg-2   { grid-template-columns: 1fr; }
          .rg-2-1 { grid-template-columns: 1fr; }
          .rg-3-2 { grid-template-columns: 1fr; }

          .header-nav  { display: none !important; }
          .header-sync { display: none !important; }

          .content-wrap { padding: 20px 16px 88px !important; }
          .header-inner { padding: 0 16px !important; }

          .bottom-nav { display: flex !important; }

          .hero-title  { font-size: 26px !important; letter-spacing: -0.01em !important; }
          .coach-banner-inner { flex-direction: column !important; gap: 12px !important; }
          .coach-banner-btn   { margin-left: 0 !important; }

          /* activity row: hide full stats, show mini */
          .act-stats-full { display: none !important; }
          .act-stats-mini { display: flex !important; gap: 16px; }

          /* activity expanded detail */
          .act-expand-grid { grid-template-columns: repeat(2,1fr) !important; }

          /* insight cards */
          .rg-insight { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(6,13,26,0.92)",
          backdropFilter: "blur(16px)",
        }}
        className="header-inner"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🏃
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              PACE
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Running Analytics
            </div>
          </div>
        </div>

        <nav className="header-nav" style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="tab-btn"
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                background:
                  activeTab === t.id
                    ? "rgba(249,115,22,0.15)"
                    : "transparent",
                color: activeTab === t.id ? "#fb923c" : "#64748b",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
                borderBottom:
                  activeTab === t.id
                    ? "2px solid #fb923c"
                    : "2px solid transparent",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="header-sync" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px #4ade80",
              }}
            />
            <span style={{ fontSize: 12, color: "#475569" }}>Sincronizado</span>
          </div>
          <Link
            href="/dashboard/settings"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              color: pathname === "/dashboard/settings" ? "#fb923c" : "#475569",
              background: pathname === "/dashboard/settings" ? "rgba(249,115,22,0.1)" : "transparent",
              fontSize: 15,
              textDecoration: "none",
            }}
            title="Perfil"
          >
            ⚙
          </Link>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: user.profileImageUrl
                ? "transparent"
                : "linear-gradient(135deg, #1e40af, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              overflow: "hidden",
            }}
          >
            {user.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImageUrl}
                alt={user.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                color: "#475569",
                fontSize: 12,
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Salir
            </button>
          </form>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content-wrap">
        {children}
      </div>

      {/* BOTTOM NAV — mobile only */}
      <nav
        className="bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(6,13,26,0.96)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          justifyContent: "space-around",
          alignItems: "stretch",
          height: 64,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {tabs.map((t) => {
          const icons: Record<string, string> = {
            overview: "🏠",
            activities: "📋",
            metrics: "📊",
            coach: "🤖",
          };
          const isActive = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                flex: 1,
                textDecoration: "none",
                color: isActive ? "#fb923c" : "#475569",
                transition: "color 0.15s",
                borderTop: isActive ? "2px solid #fb923c" : "2px solid transparent",
                paddingTop: 2,
              }}
            >
              <span style={{ fontSize: 20 }}>{icons[t.id]}</span>
              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }}>
                {t.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
