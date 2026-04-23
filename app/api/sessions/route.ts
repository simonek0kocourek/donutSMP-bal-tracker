import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isUserId, type Session } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

function validateSession(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (
    typeof s.id !== "string" ||
    typeof s.date !== "string" ||
    typeof s.startBalance !== "number" ||
    typeof s.endBalance !== "number" ||
    typeof s.startTime !== "string" ||
    typeof s.endTime !== "string" ||
    typeof s.durationMinutes !== "number" ||
    typeof s.earned !== "number" ||
    typeof s.hourlyRate !== "number"
  ) {
    return null;
  }
  return {
    id: s.id,
    date: s.date,
    startBalance: s.startBalance,
    endBalance: s.endBalance,
    startTime: s.startTime,
    endTime: s.endTime,
    durationMinutes: s.durationMinutes,
    earned: s.earned,
    hourlyRate: s.hourlyRate,
  };
}

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!isUserId(user)) return bad(400, "Invalid user");
  const store = getStore();
  const sessions = await store.getSessions(user);
  return NextResponse.json({ sessions }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad(400, "Invalid JSON");
  }
  const { user, session } = (body ?? {}) as {
    user?: unknown;
    session?: unknown;
  };
  if (!isUserId(user)) return bad(400, "Invalid user");
  const validated = validateSession(session);
  if (!validated) return bad(400, "Invalid session payload");
  const store = getStore();
  const existing = await store.getSessions(user);
  const filtered = existing.filter((s) => s.id !== validated.id);
  const next = [...filtered, validated];
  await store.setSessions(user, next);
  return NextResponse.json({ sessions: next }, { headers: NO_STORE });
}

export async function DELETE(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  const id = req.nextUrl.searchParams.get("id");
  if (!isUserId(user)) return bad(400, "Invalid user");
  if (!id) return bad(400, "Missing session id");
  const store = getStore();
  const existing = await store.getSessions(user);
  const next = existing.filter((s) => s.id !== id);
  await store.setSessions(user, next);
  return NextResponse.json({ sessions: next }, { headers: NO_STORE });
}
