"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import * as mx from "@/styles/metricsExtra.css";

interface PRRecord {
  distance: string;
  distanceKm: number;
  timeSec: number;
  timeFormatted: string;
  pace: string;
  date: string;
  activityName: string;
  activityId: string;
}

interface LongestRun {
  km: number;
  date: string;
  activityName: string;
  activityId: string;
}

interface RecordsResponse {
  records: Array<PRRecord | null>;
  longestRun: LongestRun | null;
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface PRCardProps {
  label: string;
  children: React.ReactNode;
}

function PRCard({ label, children }: PRCardProps) {
  return (
    <div className={mx.prCard}>
      <div className={mx.prDistance}>{label}</div>
      {children}
    </div>
  );
}

export function PRDisplay() {
  const locale = useLocale();
  const t = useTranslations("metrics.prs");
  const { data, isLoading } = useQuery<RecordsResponse>({
    queryKey: ["metrics-records"],
    queryFn: () => fetch("/api/metrics/records").then((r) => r.json()),
  });

  if (isLoading || !data) {
    return (
      <div className={mx.prGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={mx.prCard}
            style={{ opacity: 0.4, minHeight: 100 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={mx.prGrid}>
      {data.records.map((record, i) => {
        if (!record) {
          // We need a label — derive from known distances
          const LABELS = ["5K", "10K", "21K", "42K"];
          const label = LABELS[i] ?? `Dist. ${i + 1}`;
          return (
            <PRCard key={i} label={label}>
              <div className={mx.prEmpty}>—</div>
            </PRCard>
          );
        }

        return (
          <PRCard key={record.distance} label={record.distance}>
            <div className={mx.prTime}>{record.timeFormatted}</div>
            <div className={mx.prPace}>{record.pace} /km</div>
            <div className={mx.prDate}>{formatDate(record.date, locale)}</div>
          </PRCard>
        );
      })}

      {data.longestRun && (
        <PRCard label={t("longestRun")}>
          <div className={mx.prTime}>{data.longestRun.km.toFixed(1)} km</div>
          <div className={mx.prDate}>{formatDate(data.longestRun.date, locale)}</div>
        </PRCard>
      )}
    </div>
  );
}
