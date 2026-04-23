import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isUserId, type ActiveSession } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

function validateActive(raw: unknown): ActiveSession | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  if (typeof a.startBalance !== "number" || typeof a.startTime !== "string") {
    return null;
  }
  return {
    startBalance: a.startBalance,
    startTime: a.startTime,
  };
}

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!isUserId(user)) return bad(400, "Invalid user");
  const store = getStore();
  const active = await store.getActive(user);
  return NextResponse.json({ active }, { headers: NO_STORE });
}

export async function PUT(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad(400, "Invalid JSON");
  }
  const { user, active } = (body ?? {}) as {
    user?: unknown;
    active?: unknown;
  };
  if (!isUserId(user)) return bad(400, "Invalid user");
  const validated = validateActive(active);
  if (!validated) return bad(400, "Invalid active payload");
  const store = getStore();
  await store.setActive(user, validated);
  return NextResponse.json({ active: validated }, { headers: NO_STORE });
}

export async function DELETE(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!isUserId(user)) return bad(400, "Invalid user");
  const store = getStore();
  await store.setActive(user, null);
  return NextResponse.json({ active: null }, { headers: NO_STORE });
}
