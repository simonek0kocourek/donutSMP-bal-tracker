"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StashEntry, UserId } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

export function useStash(user: UserId | null) {
  const [stash, setStash] = useState<StashEntry[]>([]);
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
      const res = await fetch(`/api/stash?user=${encodeURIComponent(u)}`, {
        signal: ac.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { stash: StashEntry[] };
      if (userRef.current !== u) return;
      setStash(Array.isArray(data.stash) ? data.stash : []);
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
      setStash([]);
      setReady(false);
      setError(null);
      return;
    }
    setReady(false);
    fetchNow();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchNow();
    }, POLL_INTERVAL_MS);
    const onVis = () => { if (document.visibilityState === "visible") fetchNow(); };
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

  const addEntry = useCallback(async (entry: StashEntry) => {
    const u = userRef.current;
    if (!u) return;
    setStash((prev) => [...prev.filter((e) => e.id !== entry.id), entry]);
    try {
      const res = await fetch("/api/stash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: u, entry }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { stash: StashEntry[] };
      if (userRef.current === u && Array.isArray(data.stash)) setStash(data.stash);
    } catch (e) {
      setError((e as Error).message || "Add failed");
      fetchNow();
    }
  }, [fetchNow]);

  const updateEntry = useCallback(async (entry: StashEntry) => {
    const u = userRef.current;
    if (!u) return;
    setStash((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
    try {
      const res = await fetch("/api/stash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: u, entry }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { stash: StashEntry[] };
      if (userRef.current === u && Array.isArray(data.stash)) setStash(data.stash);
    } catch (e) {
      setError((e as Error).message || "Update failed");
      fetchNow();
    }
  }, [fetchNow]);

  const removeEntry = useCallback(async (id: string) => {
    const u = userRef.current;
    if (!u) return;
    setStash((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(
        `/api/stash?user=${encodeURIComponent(u)}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { stash: StashEntry[] };
      if (userRef.current === u && Array.isArray(data.stash)) setStash(data.stash);
    } catch (e) {
      setError((e as Error).message || "Delete failed");
      fetchNow();
    }
  }, [fetchNow]);

  return { stash, ready, error, addEntry, updateEntry, removeEntry, refetch: fetchNow };
}
