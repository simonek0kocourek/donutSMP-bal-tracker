import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isUserId, type StashEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

function validateEntry(raw: unknown): StashEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (
    typeof e.id !== "string" ||
    typeof e.itemId !== "string" ||
    typeof e.itemName !== "string" ||
    typeof e.quantity !== "number" ||
    typeof e.buyPriceTotal !== "number" ||
    typeof e.buyTime !== "string"
  ) return null;
  const entry: StashEntry = {
    id: e.id,
    itemId: e.itemId,
    itemName: e.itemName,
    quantity: e.quantity,
    buyPriceTotal: e.buyPriceTotal,
    buyTime: e.buyTime,
  };
  if (typeof e.sellPriceTotal === "number") entry.sellPriceTotal = e.sellPriceTotal;
  if (typeof e.sellTime === "string") entry.sellTime = e.sellTime;
  if (typeof e.note === "string") entry.note = e.note;
  if (Array.isArray(e.consumedEntryIds)) entry.consumedEntryIds = e.consumedEntryIds as string[];
  if (typeof e.consumedBySellId === "string") entry.consumedBySellId = e.consumedBySellId;
  if (Array.isArray(e.outputItems)) entry.outputItems = e.outputItems as StashEntry["outputItems"];
  return entry;
}

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!isUserId(user)) return bad(400, "Invalid user");
  const store = getStore();
  const stash = await store.getStash(user);
  return NextResponse.json({ stash }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return bad(400, "Invalid JSON"); }
  const { user, entry } = (body ?? {}) as { user?: unknown; entry?: unknown };
  if (!isUserId(user)) return bad(400, "Invalid user");
  const validated = validateEntry(entry);
  if (!validated) return bad(400, "Invalid stash entry");
  const store = getStore();
  const existing = await store.getStash(user);
  const filtered = existing.filter((e) => e.id !== validated.id);
  const next = [...filtered, validated];
  await store.setStash(user, next);
  return NextResponse.json({ stash: next }, { headers: NO_STORE });
}

export async function DELETE(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  const id = req.nextUrl.searchParams.get("id");
  if (!isUserId(user)) return bad(400, "Invalid user");
  if (!id) return bad(400, "Missing id");
  const store = getStore();
  const existing = await store.getStash(user);
  const next = existing.filter((e) => e.id !== id);
  await store.setStash(user, next);
  return NextResponse.json({ stash: next }, { headers: NO_STORE });
}
