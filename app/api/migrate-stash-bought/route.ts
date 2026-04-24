import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { USER_IDS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const store = getStore();
  const report: Record<string, unknown> = {};

  for (const user of USER_IDS) {
    const [sessions, stash] = await Promise.all([
      store.getSessions(user),
      store.getStash(user),
    ]);

    const patched = sessions.map((s) => {
      const startMs = new Date(s.startTime).getTime();
      const endMs = new Date(s.endTime).getTime();
      const stashBought = stash
        .filter((e) => {
          const t = new Date(e.buyTime).getTime();
          return t >= startMs && t <= endMs;
        })
        .reduce((sum, e) => sum + e.buyPriceTotal, 0);
      return { ...s, stashBought };
    });

    await store.setSessions(user, patched);
    report[user] = patched.map((s) => ({
      date: s.date,
      earned: s.earned,
      stashBought: s.stashBought,
      truePnl: s.earned + (s.stashBought ?? 0),
    }));
  }

  return NextResponse.json({ ok: true, report });
}
