import { Redis } from "@upstash/redis";
import type { ActiveSession, Session, StashEntry, UserId } from "./types";

export interface Store {
  getSessions(user: UserId): Promise<Session[]>;
  setSessions(user: UserId, sessions: Session[]): Promise<void>;
  getActive(user: UserId): Promise<ActiveSession | null>;
  setActive(user: UserId, active: ActiveSession | null): Promise<void>;
  getStash(user: UserId): Promise<StashEntry[]>;
  setStash(user: UserId, stash: StashEntry[]): Promise<void>;
}

const sessionsKey = (user: UserId) => `donut:sessions:${user}`;
const activeKey = (user: UserId) => `donut:active:${user}`;
const stashKey = (user: UserId) => `donut:stash:${user}`;

function parseMaybe<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return raw as T;
}

function createRedisStore(redis: Redis): Store {
  return {
    async getSessions(user) {
      const raw = await redis.get(sessionsKey(user));
      const parsed = parseMaybe<Session[]>(raw);
      return Array.isArray(parsed) ? parsed : [];
    },
    async setSessions(user, sessions) {
      await redis.set(sessionsKey(user), JSON.stringify(sessions));
    },
    async getActive(user) {
      const raw = await redis.get(activeKey(user));
      const parsed = parseMaybe<ActiveSession>(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.startBalance === "number" &&
        typeof parsed.startTime === "string"
      ) {
        return parsed;
      }
      return null;
    },
    async setActive(user, active) {
      if (active === null) {
        await redis.del(activeKey(user));
      } else {
        await redis.set(activeKey(user), JSON.stringify(active));
      }
    },
    async getStash(user) {
      const raw = await redis.get(stashKey(user));
      const parsed = parseMaybe<StashEntry[]>(raw);
      return Array.isArray(parsed) ? parsed : [];
    },
    async setStash(user, stash) {
      await redis.set(stashKey(user), JSON.stringify(stash));
    },
  };
}

type MemoryDB = {
  sessions: Map<UserId, Session[]>;
  active: Map<UserId, ActiveSession | null>;
  stash: Map<UserId, StashEntry[]>;
};

const MEMORY_KEY = "__donut_memory_db__";

function getMemoryDB(): MemoryDB {
  const g = globalThis as unknown as Record<string, MemoryDB | undefined>;
  if (!g[MEMORY_KEY]) {
    g[MEMORY_KEY] = {
      sessions: new Map(),
      active: new Map(),
      stash: new Map(),
    };
  }
  return g[MEMORY_KEY]!;
}

function createMemoryStore(): Store {
  return {
    async getSessions(user) {
      const db = getMemoryDB();
      return db.sessions.get(user) ?? [];
    },
    async setSessions(user, sessions) {
      const db = getMemoryDB();
      db.sessions.set(user, sessions);
    },
    async getActive(user) {
      const db = getMemoryDB();
      return db.active.get(user) ?? null;
    },
    async setActive(user, active) {
      const db = getMemoryDB();
      if (active === null) db.active.delete(user);
      else db.active.set(user, active);
    },
    async getStash(user) {
      const db = getMemoryDB();
      return db.stash.get(user) ?? [];
    },
    async setStash(user, stash) {
      const db = getMemoryDB();
      db.stash.set(user, stash);
    },
  };
}

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.KV_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    const redis = new Redis({ url, token });
    cached = createRedisStore(redis);
  } else {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[donut] No Upstash env vars found — using in-memory store (dev mode).",
      );
    }
    cached = createMemoryStore();
  }
  return cached;
}
