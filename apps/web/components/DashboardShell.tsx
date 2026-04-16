"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import * as grid from "@/styles/dashboardGrid.css";
import * as shell from "@/styles/shell.css";

interface Props {
  user: { name: string; profileImageUrl: string | null };
  children: React.ReactNode;
}

const tabs = [
  { id: "overview", label: "Overview", href: "/dashboard" },
  { id: "activities", label: "Actividades", href: "/dashboard/activities" },
  { id: "metrics", label: "Métricas", href: "/dashboard/metrics" },
  { id: "coach", label: "Coach IA", href: "/dashboard/coach" },
  { id: "plan", label: "Plan", href: "/dashboard/plan" },
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
    <div className={grid.shellRoot}>
      <div className={`${shell.headerBar} ${grid.headerInner}`}>
        <div className={shell.headerLeft}>
          <div className={shell.logoIcon}>🏃</div>
          <div>
            <div className={shell.brandTitle}>PACE</div>
            <div className={shell.brandSubtitle}>Running Analytics</div>
          </div>
        </div>

        <nav className={grid.headerNav}>
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={`${shell.tabBtn} ${activeTab === t.id ? shell.tabBtnActive : ""}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className={shell.headerRight}>
          <div className={`${shell.syncRow} ${grid.headerSync}`}>
            <div className={shell.syncDot} />
            <span className={shell.syncLabel}>Sincronizado</span>
          </div>
          <Link
            href="/dashboard/settings"
            className={`${shell.settingsLink} ${
              pathname === "/dashboard/settings"
                ? shell.settingsLinkActive
                : shell.settingsLinkInactive
            }`}
            title="Perfil"
          >
            ⚙
          </Link>
          <div
            className={`${shell.avatar} ${!user.profileImageUrl ? shell.avatarPlaceholder : ""}`}
          >
            {user.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImageUrl}
                alt={user.name}
                className={shell.avatarImg}
              />
            ) : (
              initials
            )}
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className={shell.logoutBtn}>
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className={grid.contentWrap}>{children}</div>

      <nav className={`${grid.bottomNav} ${shell.bottomNavBar}`}>
        {tabs.map((t) => {
          const icons: Record<string, string> = {
            overview: "🏠",
            activities: "📋",
            metrics: "📊",
            coach: "🤖",
            plan: "🎯",
          };
          const isActive = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={shell.bottomNavLink}
              data-active={isActive ? "true" : "false"}
            >
              <span className={shell.bottomNavIcon}>{icons[t.id]}</span>
              <span className={shell.bottomNavLabel}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
