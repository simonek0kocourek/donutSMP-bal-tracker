import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { USER_IDS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const store = getStore();

  for (const user of USER_IDS) {
    await store.setSessions(user, []);
    await store.setStash(user, []);
    await store.setActive(user, null);
  }

  return NextResponse.json({ ok: true, message: "All data wiped for all users" });
}
