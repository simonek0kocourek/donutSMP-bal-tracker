"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, UserId } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

export function useSessions(user: UserId | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
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
        `/api/sessions?user=${encodeURIComponent(u)}`,
        { signal: ac.signal, cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { sessions: Session[] };
      if (userRef.current !== u) return;
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
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
      setSessions([]);
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

  const addSession = useCallback(
    async (session: Session) => {
      const u = userRef.current;
      if (!u) return;
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== session.id);
        return [...filtered, session];
      });
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: u, session }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { sessions: Session[] };
        if (userRef.current === u && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      } catch (e) {
        setError((e as Error).message || "Add failed");
        fetchNow();
      }
    },
    [fetchNow],
  );

  const removeSession = useCallback(
    async (id: string) => {
      const u = userRef.current;
      if (!u) return;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      try {
        const res = await fetch(
          `/api/sessions?user=${encodeURIComponent(u)}&id=${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { sessions: Session[] };
        if (userRef.current === u && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      } catch (e) {
        setError((e as Error).message || "Delete failed");
        fetchNow();
      }
    },
    [fetchNow],
  );

  return {
    sessions,
    ready,
    error,
    addSession,
    removeSession,
    refetch: fetchNow,
  };
}
