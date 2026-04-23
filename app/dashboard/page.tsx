"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CountUp from "@/components/CountUp";
import SilkBackground from "@/components/SilkBackground";
import PortfolioChart from "@/components/PortfolioChart";
import SessionModal from "@/components/SessionModal";
import SessionTable from "@/components/SessionTable";
import StatCard from "@/components/StatCard";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useSessions } from "@/hooks/useSessions";
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

  const [modal, setModal] = useState<"start" | "end" | "reset" | null>(null);
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

  const headlineBalance = active.active
    ? active.active.startBalance
    : latest?.endBalance ?? 0;

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
    () => primary.sessions.reduce((sum, s) => sum + s.earned, 0),
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
      {/* Per-user accent glow overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -5%, ${theme.glow}, transparent 60%)`,
        }}
      />

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
            Portfolio balance
          </div>
          <CountUp
            value={headlineBalance}
            format={formatCurrency}
            className="mt-1 block font-display text-5xl sm:text-6xl"
            style={{
              color: "#fff",
              textShadow: `0 0 30px ${theme.glow}, 0 0 60px ${theme.glow}`,
            }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs">
            {annual != null && (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: annual >= 0 ? "#4ade80" : "#f87171" }}
              >
                {annual >= 0 ? "↑" : "↓"} {formatPercent(annual)} p.a.
              </span>
            )}
            {totalSessions > 0 && (
              <span
                style={{
                  color: overallChange >= 0 ? "#4ade80" : "#f87171",
                }}
              >
                <CountUp
                  value={overallChange}
                  format={formatSignedCurrency}
                />
              </span>
            )}
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
            value={formatSignedCurrency(totalEarned)}
            tone={totalEarned >= 0 ? "positive" : "negative"}
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
            label="Best Session"
            value={formatSignedCurrency(bestSession)}
            tone={bestSession >= 0 ? "positive" : "negative"}
            accentColor={theme.accent}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div
            className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-white/10 bg-[#111118]/95 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400/70">
              Destructive action
            </div>
            <h2 className="mt-1 font-display text-2xl text-white">
              Reset today's stats?
            </h2>
            <p className="mt-2 font-mono text-xs leading-relaxed text-white/50">
              This will delete all sessions logged today
              {active.active ? " and clear the open session" : ""}. This cannot
              be undone.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white/70 transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToday}
                className="flex-1 rounded-lg px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #dc2626, #991b1b)",
                  boxShadow: "0 4px 16px -4px rgba(220, 38, 38, 0.5)",
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
