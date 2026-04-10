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
        paddingBottom: 60,
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
      `}</style>

      {/* HEADER */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 32px",
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

        <nav style={{ display: "flex", gap: 4 }}>
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

      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 0" }}
      >
        {children}
      </div>
    </div>
  );
}
