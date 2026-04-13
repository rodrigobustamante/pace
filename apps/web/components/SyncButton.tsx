"use client";

import { useState, useEffect, useCallback } from "react";
import * as y from "@/styles/syncButton.css";

interface SyncStatus {
  canSync: boolean;
  remainingSeconds: number;
  lastSyncAt: string | null;
}

function formatRemaining(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatLastSync(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

export function SyncButton() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/strava/sync");
      const data = (await res.json()) as SyncStatus;
      setStatus(data);
      setRemaining(data.remainingSeconds);
    } catch {
      // silent — button stays disabled
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          setStatus((s) =>
            s ? { ...s, canSync: true, remainingSeconds: 0 } : s,
          );
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  async function handleSync() {
    if (isSyncing || !status?.canSync) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        remainingSeconds?: number;
        lastSyncAt?: string;
      };

      if (res.status === 429 && data.remainingSeconds) {
        setStatus((s) =>
          s
            ? {
                ...s,
                canSync: false,
                remainingSeconds: data.remainingSeconds!,
              }
            : s,
        );
        setRemaining(data.remainingSeconds);
        return;
      }

      if (data.ok) {
        setStatus({
          canSync: false,
          remainingSeconds: 3600,
          lastSyncAt: data.lastSyncAt ?? null,
        });
        setRemaining(3600);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      }
    } catch {
      // silent
    } finally {
      setIsSyncing(false);
    }
  }

  const canSync = status?.canSync ?? false;
  const loading = status === null;

  return (
    <div>
      <div className={y.sectionLabel}>Sincronización con Strava</div>

      <div className={y.row}>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={!canSync || isSyncing || loading}
          className={`${y.syncBtn} ${canSync && !isSyncing ? y.syncBtnReady : y.syncBtnIdle}`}
        >
          {isSyncing ? (
            <>
              <span className={y.syncSpinner} />
              Sincronizando...
            </>
          ) : justSynced ? (
            <>
              <span className={y.checkGreen}>✓</span>
              Sync iniciado
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              Sincronizar ahora
            </>
          )}
        </button>

        <div className={y.meta}>
          {loading && "Verificando..."}
          {!loading && remaining > 0 && (
            <span>
              Disponible en{" "}
              <span className={y.metaHighlight}>{formatRemaining(remaining)}</span>
            </span>
          )}
          {!loading && remaining <= 0 && status?.lastSyncAt && (
            <span>
              Último sync:{" "}
              <span className={y.metaHighlight}>
                {formatLastSync(status.lastSyncAt)}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className={y.footnote}>
        Máximo 1 sync por hora · las actividades nuevas llegan automáticamente
        vía webhook
      </div>
    </div>
  );
}
