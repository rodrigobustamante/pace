"use client";

import { useEffect, useState } from "react";

interface SyncStatusResponse {
  canSync: boolean;
  remainingSeconds: number;
  lastSyncAt: string | null;
}

interface SyncTriggerResponse {
  ok: boolean;
  lastSyncAt?: string;
}

/**
 * On mount, checks whether a background Strava sync is due (cooldown expired).
 * If so, automatically triggers POST /api/strava/sync (fire-and-forget on the server).
 * Returns { isSyncing, lastSyncAt } for the shell indicator.
 */
export function useAutoSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAndSync() {
      try {
        // 1. Check current sync status
        const statusRes = await fetch("/api/strava/sync");
        if (!statusRes.ok || cancelled) return;

        const status = (await statusRes.json()) as SyncStatusResponse;
        if (cancelled) return;

        setLastSyncAt(status.lastSyncAt);

        // 2. If cooldown is still active, nothing to do
        if (!status.canSync) return;

        // 3. Trigger background sync
        setIsSyncing(true);
        try {
          const syncRes = await fetch("/api/strava/sync", { method: "POST" });
          if (cancelled) return;

          if (syncRes.ok) {
            const data = (await syncRes.json()) as SyncTriggerResponse;
            setLastSyncAt(data.lastSyncAt ?? null);
          }
        } finally {
          if (!cancelled) setIsSyncing(false);
        }
      } catch {
        // Sync is best-effort — silently ignore network errors
        if (!cancelled) setIsSyncing(false);
      }
    }

    checkAndSync();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isSyncing, lastSyncAt };
}
