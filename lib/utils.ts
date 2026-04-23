import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Session } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtAmount(abs: number): string {
  if (abs >= 1_000_000) {
    const n = round2(abs / 1_000_000);
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}m`;
  }
  if (abs >= 1_000) {
    const n = round2(abs / 1_000);
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}k`;
  }
  return round2(abs).toFixed(2);
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${fmtAmount(Math.abs(value))}`;
}

export function formatCurrencyCompact(value: number): string {
  return formatCurrency(value);
}

export function formatSignedCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const abs = Math.abs(value);
  if (value > 0) return `+$${fmtAmount(abs)}`;
  if (value < 0) return `-$${fmtAmount(abs)}`;
  return `$${fmtAmount(abs)}`;
}

export function parseDecimalInput(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Shorthand: k/K = thousand, m/M = million, b/B = billion
  const shorthand = trimmed.match(/^([0-9.,]+)\s*([kKmMbB])$/);
  if (shorthand) {
    const numPart = shorthand[1]!;
    const suffix = shorthand[2]!.toLowerCase();
    const base = parseDecimalInput(numPart);
    if (base === null) return null;
    const multiplier = suffix === "k" ? 1_000 : suffix === "b" ? 1_000_000_000 : 1_000_000;
    return base * multiplier;
  }

  const stripped = trimmed.replace(/[^0-9.,-]/g, "");
  if (!stripped) return null;
  const lastComma = stripped.lastIndexOf(",");
  const lastDot = stripped.lastIndexOf(".");
  let normalized: string;
  if (lastComma > lastDot) {
    normalized = stripped.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = stripped.replace(/,/g, "");
  }
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) minutes = 0;
  const totalSeconds = Math.floor(minutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function minutesBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  const ms = Math.max(0, to - from);
  return ms / 60000;
}

export function annualizedReturn(
  startBalance: number,
  endBalance: number,
  startTime: string,
  endTime: string,
): number | null {
  if (startBalance <= 0 || endBalance <= 0) return null;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const years = (end - start) / (365.25 * 24 * 3600 * 1000);
  if (years <= 0) return null;
  const ratio = endBalance / startBalance;
  return Math.pow(ratio, 1 / years) - 1;
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "" : "-";
  return `${sign}${(Math.abs(value) * 100).toFixed(decimals)}%`;
}

export function newSessionId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    try {
      return globalThis.crypto.randomUUID();
    } catch {}
  }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sortSessionsDesc(sessions: Session[]): Session[] {
  return [...sessions].sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
  );
}

export function sortSessionsAsc(sessions: Session[]): Session[] {
  return [...sessions].sort(
    (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
  );
}

export function latestSession(sessions: Session[]): Session | null {
  if (!sessions.length) return null;
  return sortSessionsDesc(sessions)[0] ?? null;
}

export function firstSession(sessions: Session[]): Session | null {
  if (!sessions.length) return null;
  return sortSessionsAsc(sessions)[0] ?? null;
}

export function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
