"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PaceLogo } from "@/components/PaceLogo";
import { useAutoSync } from "@/hooks/useAutoSync";
import * as grid from "@/styles/dashboardGrid.css";
import * as shell from "@/styles/shell.css";

interface Props {
  user: { name: string; profileImageUrl: string | null };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: Props) {
  const pathname = usePathname();
  const t = useTranslations("shell");
  const { isSyncing } = useAutoSync();

  const tabs = [
    { id: "overview", label: t("tabs.overview"), href: "/dashboard" },
    { id: "activities", label: t("tabs.activities"), href: "/dashboard/activities" },
    { id: "metrics", label: t("tabs.metrics"), href: "/dashboard/metrics" },
    { id: "coach", label: t("tabs.coach"), href: "/dashboard/coach" },
    { id: "plan", label: t("tabs.plan"), href: "/dashboard/plan" },
  ];

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
          <PaceLogo className={shell.logoImg} />
        </div>

        <nav className={grid.headerNav}>
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${shell.tabBtn} ${activeTab === tab.id ? shell.tabBtnActive : ""}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className={shell.headerRight}>
          <div className={`${shell.syncRow} ${grid.headerSync}`}>
            <div className={isSyncing ? shell.syncDotSyncing : shell.syncDot} />
            <span className={isSyncing ? shell.syncLabelSyncing : shell.syncLabel}>
              {isSyncing ? t("syncing") : t("synced")}
            </span>
          </div>
          <Link
            href="/dashboard/settings"
            className={`${shell.settingsLink} ${
              pathname === "/dashboard/settings"
                ? shell.settingsLinkActive
                : shell.settingsLinkInactive
            }`}
            title={t("profileTitle")}
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
              {t("logout")}
            </button>
          </form>
        </div>
      </div>

      <div className={grid.contentWrap}>{children}</div>

      <nav className={`${grid.bottomNav} ${shell.bottomNavBar}`}>
        {tabs.map((tab) => {
          const icons: Record<string, string> = {
            overview: "🏠",
            activities: "📋",
            metrics: "📊",
            coach: "🤖",
            plan: "🎯",
          };
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={shell.bottomNavLink}
              data-active={isActive ? "true" : "false"}
            >
              <span className={shell.bottomNavIcon}>{icons[tab.id]}</span>
              <span className={shell.bottomNavLabel}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
