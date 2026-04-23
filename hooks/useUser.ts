"use client";

import { useCallback, useEffect, useState } from "react";
import { isUserId, type UserId } from "@/lib/types";

const STORAGE_KEY = "donut_active_user";

export function useUser() {
  const [user, setUser] = useState<UserId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (isUserId(raw)) setUser(raw);
    } catch {}
    setReady(true);
  }, []);

  const signIn = useCallback((id: UserId) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    setUser(id);
  }, []);

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setUser(null);
  }, []);

  return { user, ready, signIn, signOut };
}
