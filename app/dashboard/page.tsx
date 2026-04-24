"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CountUp from "@/components/CountUp";
import SilkBackground from "@/components/SilkBackground";
import PortfolioChart from "@/components/PortfolioChart";
import LiveStash from "@/components/LiveStash";
import PastTrades from "@/components/PastTrades";
import SessionModal from "@/components/SessionModal";
import SessionTable from "@/components/SessionTable";
import StashModal from "@/components/StashModal";
import StatCard from "@/components/StatCard";
import ConfirmModal from "@/components/ConfirmModal";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useSessions } from "@/hooks/useSessions";
import { useStash } from "@/hooks/useStash";
import { useUser } from "@/hooks/useUser";
import type { Session } from "@/lib/types";
import { USER_THEMES, otherUser } from "@/lib/types";
import {
  annualizedReturn,
  firstSession,
  formatCurrency,
  formatDuration,
  formatPercent,
  formatSignedCurrency,
  formatTime,
  latestSession,
  minutesBetween,
  newSessionId,
} from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready: userReady } = useUser();

  useEffect(() => {
    if (userReady && !user) router.replace("/");
  }, [userReady, user, router]);

  if (!userReady || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-navy">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          Loading…
        </div>
      </main>
    );
  }

  return <DashboardInner user={user} />;
}

function DashboardInner({ user }: { user: import("@/lib/types").UserId }) {
  const router = useRouter();
  const { signOut } = useUser();
  const activeUser = user;
  const compareUser = otherUser(activeUser);
  const theme = USER_THEMES[activeUser];

  const primary = useSessions(activeUser);
  const secondary = useSessions(compareUser);
  const active = useActiveSession(activeUser);
  const compareActive = useActiveSession(compareUser);

  const stashHook = useStash(activeUser);
  const compareStash = useStash(compareUser);

  const [modal, setModal] = useState<"start" | "end" | "reset" | null>(null);
  const [stashModal, setStashModal] = useState<"add" | "sell" | null>(null);
  const [summary, setSummary] = useState<{
    durationMinutes: number;
    earned: number;
    hourlyRate: number;
    shownAt: number;
  } | null>(null);

  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const startTimeRef = useRef<string | null>(null);
  startTimeRef.current = active.active?.startTime ?? null;

  useEffect(() => {
    if (!active.active) {
      setElapsedMinutes(0);
      return;
    }
    const compute = () => {
      const st = startTimeRef.current;
      if (!st) return;
      setElapsedMinutes(minutesBetween(st, new Date().toISOString()));
    };
    compute();
    const id = window.setInterval(compute, 30000);
    return () => window.clearInterval(id);
  }, [active.active]);

  useEffect(() => {
    if (!summary) return;
    const t = window.setTimeout(() => setSummary(null), 6000);
    return () => window.clearTimeout(t);
  }, [summary]);

  const latest = useMemo(
    () => latestSession(primary.sessions),
    [primary.sessions],
  );
  const first = useMemo(
    () => firstSession(primary.sessions),
    [primary.sessions],
  );

  const totalOpenStash = useMemo(
    () =>
      stashHook.stash
        .filter((e) => e.sellPriceTotal == null)
        .reduce((sum, e) => sum + e.buyPriceTotal, 0),
    [stashHook.stash],
  );

  const stashPnl = useMemo(
    () =>
      stashHook.stash
        .filter((e) => e.sellPriceTotal != null && e.sellPriceTotal > 0 && !e.consumedBySellId)
        .reduce((sum, e) => sum + (e.sellPriceTotal! - e.buyPriceTotal), 0),
    [stashHook.stash],
  );

  // During an active session, derive live cash from startBalance ± stash activity
  const liquidBalance = useMemo(() => {
    if (!active.active) return latest?.endBalance ?? 0;
    const startMs = new Date(active.active.startTime).getTime();
    const boughtThisSession = stashHook.stash
      .filter((e) => new Date(e.buyTime).getTime() >= startMs)
      .reduce((sum, e) => sum + e.buyPriceTotal, 0);
    const soldRevenueThisSession = stashHook.stash
      .filter((e) => e.sellTime != null && new Date(e.sellTime).getTime() >= startMs && !e.consumedBySellId)
      .reduce((sum, e) => sum + (e.sellPriceTotal ?? 0), 0);
    return active.active.startBalance - boughtThisSession + soldRevenueThisSession;
  }, [active.active, stashHook.stash, latest]);

  const headlineBalance = liquidBalance + totalOpenStash;

  const annual = useMemo(() => {
    if (!first) return null;
    const endBalance = latest?.endBalance ?? first.endBalance;
    const endTime = latest?.endTime ?? first.endTime;
    return annualizedReturn(
      first.startBalance,
      endBalance,
      first.startTime,
      endTime,
    );
  }, [first, latest]);

  const totalEarned = useMemo(
    () => primary.sessions.reduce((sum, s) => sum + s.earned + (s.stashBought ?? 0), 0),
    [primary.sessions],
  );
  const totalSessions = primary.sessions.length;
  const avgHourly = useMemo(() => {
    const totalHours = primary.sessions.reduce(
      (sum, s) => sum + s.durationMinutes / 60,
      0,
    );
    if (totalHours <= 0) return 0;
    return totalEarned / totalHours;
  }, [primary.sessions, totalEarned]);
  const bestSession = useMemo(() => {
    if (primary.sessions.length === 0) return 0;
    return Math.max(...primary.sessions.map((s) => s.earned));
  }, [primary.sessions]);

  const overallStartBalance = first?.startBalance ?? 0;
  const overallChange = headlineBalance - overallStartBalance;

  const handleStart = async (startBalance: number) => {
    setModal(null);
    await active.start({
      startBalance,
      startTime: new Date().toISOString(),
    });
  };

  const handleEnd = async (endBalance: number) => {
    setModal(null);
    const open = active.active;
    if (!open) return;
    const endTime = new Date().toISOString();
    const durationMinutes = minutesBetween(open.startTime, endTime);
    const earned = endBalance - open.startBalance;
    const hourlyRate =
      durationMinutes > 0 ? earned / (durationMinutes / 60) : 0;
    const startMs = new Date(open.startTime).getTime();
    const endMs = new Date(endTime).getTime();
    const stashBought = stashHook.stash
      .filter((e) => {
        const t = new Date(e.buyTime).getTime();
        return t >= startMs && t <= endMs;
      })
      .reduce((sum, e) => sum + e.buyPriceTotal, 0);
    const session: Session = {
      id: newSessionId(),
      date: open.startTime.slice(0, 10),
      startBalance: open.startBalance,
      endBalance,
      startTime: open.startTime,
      endTime,
      durationMinutes,
      earned,
      hourlyRate,
      stashBought,
    };
    await primary.addSession(session);
    await active.clear();
    setSummary({
      durationMinutes,
      earned,
      hourlyRate,
      shownAt: Date.now(),
    });
  };

  const handleResetToday = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayIds = primary.sessions
      .filter((s) => s.date === today)
      .map((s) => s.id);
    for (const id of todayIds) {
      await primary.removeSession(id);
    }
    if (active.active) await active.clear();
    setModal(null);
  };

  const handleSignOut = () => {
    signOut();
    router.replace("/");
  };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-[#0a0a0f]"
    >
      {/* Silk full-screen fixed background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <SilkBackground
          speed={5}
          scale={1}
          color={theme.accent}
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <header
          className="fade-up flex items-center justify-between"
          style={{ animationDelay: "0ms" }}
        >
          <div className="flex items-center gap-3">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                User
              </div>
              <div
                className="font-display text-xl sm:text-2xl"
                style={{
                  color: "#fff",
                  textShadow: `0 0 24px ${theme.glow}`,
                }}
              >
                {activeUser}
              </div>
            </div>
            {active.active && (
              <div className="pulse-open ml-2 flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-300">
                  Open session
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 transition-colors hover:bg-white/10"
          >
            Sign out
          </button>
        </header>

        <section
          className="fade-up mt-8"
          style={{ animationDelay: "60ms" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
            Net Worth
          </div>
          <div className="mt-1 flex items-baseline gap-4">
            <CountUp
              value={headlineBalance}
              format={formatCurrency}
              className="block font-display text-5xl sm:text-6xl"
              style={{
                color: "#fff",
                textShadow: `0 0 30px ${theme.glow}, 0 0 60px ${theme.glow}`,
              }}
            />
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Balance</span>
              <CountUp
                value={liquidBalance}
                format={formatCurrency}
                className="font-display text-xl text-white/40"
              />
            </div>
          </div>
        </section>

        <section
          className="fade-up mt-6"
          style={{ animationDelay: "120ms" }}
        >
          {!active.active ? (
            <button
              type="button"
              onClick={() => setModal("start")}
              className="group w-full overflow-hidden rounded-xl border border-white/10 px-5 py-4 text-left transition-all duration-300 ease-out hover:-translate-y-0.5 sm:w-auto"
              style={{
                background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                boxShadow: `0 6px 24px -8px ${theme.glow}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M5 4v16l14-8z" />
                  </svg>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70">
                    Ready to grind
                  </div>
                  <div className="font-display text-xl text-white">
                    Start session
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="grid grid-cols-3 gap-6 font-mono text-xs">
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                      Started
                    </div>
                    <div className="mt-1 font-display text-base text-white">
                      {formatTime(active.active.startTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                      Start balance
                    </div>
                    <div className="mt-1 font-display text-base text-white">
                      {formatCurrency(active.active.startBalance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                      Elapsed
                    </div>
                    <div className="mt-1 font-display text-base text-white">
                      {formatDuration(elapsedMinutes)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModal("end")}
                  className="rounded-lg px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white transition-all hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #dc2626, #991b1b)",
                    boxShadow: "0 4px 16px -4px rgba(220, 38, 38, 0.4)",
                  }}
                >
                  End session
                </button>
              </div>
            </div>
          )}

          {summary && (
            <div
              className="mt-3 animate-scale-in rounded-xl border border-white/10 bg-white/[0.03] p-4"
              key={summary.shownAt}
            >
              <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                    Duration
                  </div>
                  <div className="mt-1 font-display text-base text-white">
                    {formatDuration(summary.durationMinutes)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                    Earned
                  </div>
                  <div
                    className="mt-1 font-display text-base"
                    style={{
                      color: summary.earned >= 0 ? "#4ade80" : "#f87171",
                    }}
                  >
                    {formatSignedCurrency(summary.earned)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                    $/hr
                  </div>
                  <div
                    className="mt-1 font-display text-base"
                    style={{ color: theme.line }}
                  >
                    {formatCurrency(summary.hourlyRate)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section
          className="fade-up mt-8"
          style={{ animationDelay: "180ms" }}
        >
          <PortfolioChart
            primaryUser={activeUser}
            secondaryUser={compareUser}
            primarySessions={primary.sessions}
            secondarySessions={secondary.sessions}
            primaryActive={active.active}
            primaryLiveBalance={
              active.active ? active.active.startBalance : null
            }
            secondaryActive={compareActive.active}
            secondaryLiveBalance={
              compareActive.active ? compareActive.active.startBalance : null
            }
          />
        </section>

        <section
          className="fade-up mt-6 grid grid-cols-2 gap-3 md:grid-cols-4"
          style={{ animationDelay: "220ms" }}
        >
          <StatCard
            label="Total Earned"
            value={formatSignedCurrency(totalEarned + stashPnl)}
            tone={(totalEarned + stashPnl) >= 0 ? "positive" : "negative"}
            accentColor={theme.accent}
          />
          <StatCard
            label="Total Sessions"
            value={String(totalSessions)}
            accentColor={theme.accent}
          />
          <StatCard
            label="Avg $/hr"
            value={formatCurrency(avgHourly)}
            tone="accent"
            accentColor={theme.accent}
          />
          <StatCard
            label="Stashed"
            value={formatCurrency(totalOpenStash)}
            tone={totalOpenStash > 0 ? "accent" : undefined}
            accentColor="#fbbf24"
          />
        </section>

        <section
          className="fade-up mt-8"
          style={{ animationDelay: "380ms" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-white">History</h2>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
              {primary.sessions.length} session
              {primary.sessions.length === 1 ? "" : "s"}
            </div>
          </div>
          <SessionTable
            user={activeUser}
            sessions={primary.sessions}
            onDelete={primary.removeSession}
          />
        </section>

        {/* Stash section */}
        <section
          className="fade-up mt-10"
          style={{ animationDelay: "440ms" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-white">Investments</h2>
            <button
              type="button"
              onClick={() => setStashModal("add")}
              className="rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                boxShadow: `0 4px 14px -4px ${theme.glow}`,
              }}
            >
              + Buy to stash
            </button>
          </div>

          <LiveStash
            user={activeUser}
            stash={stashHook.stash}
            onSell={() => setStashModal("sell")}
            onDelete={stashHook.removeEntry}
          />

          {/* Past trades — shown once there's at least one closed trade */}
          {stashHook.stash.some((e) => e.sellPriceTotal != null && !e.consumedBySellId) && (
            <div className="mt-6">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                Past Trades
              </div>
              <PastTrades
                user={activeUser}
                stash={stashHook.stash}
                onDelete={async (ids) => {
                  for (const id of ids) await stashHook.removeEntry(id);
                }}
              />
            </div>
          )}
        </section>

        <footer className="mt-10 pb-4 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          Synced every 5 seconds
        </footer>
      </div>

      {modal === "start" && (
        <SessionModal
          mode="start"
          user={activeUser}
          onClose={() => setModal(null)}
          onConfirm={handleStart}
        />
      )}
      {modal === "end" && active.active && (
        <SessionModal
          mode="end"
          user={activeUser}
          startBalance={active.active.startBalance}
          onClose={() => setModal(null)}
          onConfirm={handleEnd}
        />
      )}

      {/* Stash modals */}
      {stashModal === "add" && (
        <StashModal
          mode="add"
          user={activeUser}
          onClose={() => setStashModal(null)}
          onConfirm={async (entry) => {
            setStashModal(null);
            await stashHook.addEntry(entry);
          }}
        />
      )}
      {stashModal === "sell" && (
        <StashModal
          mode="sell"
          user={activeUser}
          openEntries={stashHook.stash.filter(
            (e) => e.sellPriceTotal == null && e.consumedBySellId == null,
          )}
          onClose={() => setStashModal(null)}
          onConfirm={async (sellEntry, consumed) => {
            setStashModal(null);
            await stashHook.updateEntries([sellEntry, ...consumed]);
          }}
        />
      )}

      {/* Reset today floating button */}
      <button
        type="button"
        onClick={() => setModal("reset")}
        className="fixed bottom-5 right-5 z-40 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
      >
        Reset today
      </button>

      {/* Reset confirmation modal */}
      {modal === "reset" && (
        <ConfirmModal
          title="Reset today's stats?"
          message={`This will delete all sessions logged today${active.active ? " and clear the open session" : ""}. This cannot be undone.`}
          confirmLabel="Reset"
          onConfirm={handleResetToday}
          onCancel={() => setModal(null)}
        />
      )}
    </main>
  );
}
