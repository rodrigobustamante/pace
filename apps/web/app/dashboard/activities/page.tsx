"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ActivityRow } from "@/components/ActivityRow";
import { SkeletonCard } from "@/components/SkeletonCard";
import * as s from "@/styles/pagesShared.css";

interface Activity {
  id: string;
  name: string;
  type: string;
  date: string;
  distanceM: number;
  durationSec: number;
  paceSeckm: number;
  avgHRbpm: number | null;
  maxHRbpm: number | null;
  cadenceRpm: number | null;
  elevationM: number | null;
  caloriesKcal: number | null;
  feel: number | null;
}

interface ActivitiesResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const t = useTranslations("activities");
  const limit = 20;

  const { data, isLoading } = useQuery<ActivitiesResponse>({
    queryKey: ["activities", { page, limit }],
    queryFn: () =>
      fetch(`/api/activities?page=${page}&limit=${limit}`).then((r) =>
        r.json(),
      ),
  });

  return (
    <div>
      <div className={s.pageHeaderBlock}>
        <div className={s.pageTitle}>{t("title")}</div>
        <div className={s.pageSubtitle}>
          {data?.pagination.total
            ? t("subtitleLoaded", { total: data.pagination.total })
            : t("subtitleLoading")}
        </div>
      </div>

      {isLoading ? (
        <div className={s.flexColGap8}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} height={72} />
          ))}
        </div>
      ) : data?.activities.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyStateEmoji}>🏃</div>
          <div className={s.emptyStateTitle}>{t("empty.title")}</div>
          <div className={s.emptyStateBody}>{t("empty.body")}</div>
        </div>
      ) : (
        <>
          <div className={s.flexColGap8}>
            {data?.activities.map((act) => (
              <ActivityRow key={act.id} activity={act} />
            ))}
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className={s.paginationRow}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`${s.paginationBtn} ${page === 1 ? s.paginationBtnDisabled : s.paginationBtnActive}`}
              >
                {t("prev")}
              </button>
              <span className={s.paginationPage}>
                {page} / {data.pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                }
                disabled={page === data.pagination.totalPages}
                className={`${s.paginationBtn} ${page === data.pagination.totalPages ? s.paginationBtnDisabled : s.paginationBtnActive}`}
              >
                {t("next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
