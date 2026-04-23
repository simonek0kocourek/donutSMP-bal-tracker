"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveSession, UserId } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

export function useActiveSession(user: UserId | null) {
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userRef = useRef<UserId | null>(user);
  userRef.current = user;

  const fetchNow = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch(
        `/api/active?user=${encodeURIComponent(u)}`,
        { signal: ac.signal, cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { active: ActiveSession | null };
      if (userRef.current !== u) return;
      setActive(data.active ?? null);
      setError(null);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || "Fetch failed");
    } finally {
      if (userRef.current === u) setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setActive(null);
      setReady(false);
      setError(null);
      return;
    }
    setReady(false);
    fetchNow();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchNow();
    }, POLL_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") fetchNow();
    };
    const onFocus = () => fetchNow();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      abortRef.current?.abort();
    };
  }, [user, fetchNow]);

  const start = useCallback(
    async (next: ActiveSession) => {
      const u = userRef.current;
      if (!u) return;
      setActive(next);
      try {
        const res = await fetch("/api/active", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: u, active: next }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { active: ActiveSession | null };
        if (userRef.current === u) setActive(data.active ?? null);
      } catch (e) {
        setError((e as Error).message || "Start failed");
        fetchNow();
      }
    },
    [fetchNow],
  );

  const clear = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    setActive(null);
    try {
      const res = await fetch(
        `/api/active?user=${encodeURIComponent(u)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setError((e as Error).message || "Clear failed");
      fetchNow();
    }
  }, [fetchNow]);

  return { active, ready, error, start, clear, refetch: fetchNow };
}
