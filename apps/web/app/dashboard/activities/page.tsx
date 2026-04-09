"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityRow } from "@/components/ActivityRow";
import { SkeletonCard } from "@/components/SkeletonCard";

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
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          Actividades recientes
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          {data?.pagination.total
            ? `${data.pagination.total} sesiones sincronizadas desde Strava`
            : "Cargando actividades..."}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} height={72} />
          ))}
        </div>
      ) : data?.activities.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 40,
            textAlign: "center",
            color: "#475569",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏃</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Sin actividades todavía
          </div>
          <div style={{ fontSize: 13 }}>
            La sincronización desde Strava puede tardar unos minutos.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data?.activities.map((act) => (
              <ActivityRow key={act.id} activity={act} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background:
                    page === 1
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(255,255,255,0.05)",
                  color: page === 1 ? "#334155" : "#94a3b8",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ← Anterior
              </button>
              <span
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  color: "#475569",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) =>
                    Math.min(data.pagination.totalPages, p + 1),
                  )
                }
                disabled={page === data.pagination.totalPages}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background:
                    page === data.pagination.totalPages
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(255,255,255,0.05)",
                  color:
                    page === data.pagination.totalPages
                      ? "#334155"
                      : "#94a3b8",
                  cursor:
                    page === data.pagination.totalPages
                      ? "not-allowed"
                      : "pointer",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
