"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActiveSession, Session, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDateShort,
  formatSignedCurrency,
  sortSessionsAsc,
} from "@/lib/utils";
import { useMemo } from "react";

type ChartPoint = {
  time: number;
  primary?: number;
  secondary?: number;
  primaryEarned?: number;
  primaryHourlyRate?: number;
};

type Props = {
  primaryUser: UserId;
  secondaryUser: UserId;
  primarySessions: Session[];
  secondarySessions: Session[];
  primaryActive: ActiveSession | null;
  primaryLiveBalance: number | null;
  secondaryActive: ActiveSession | null;
  secondaryLiveBalance: number | null;
};

function buildSeries(
  sessions: Session[],
): { time: number; value: number; earned?: number; hourly?: number }[] {
  const sorted = sortSessionsAsc(sessions);
  const points: { time: number; value: number; earned?: number; hourly?: number }[] = [];
  if (sorted.length === 0) return points;
  const first = sorted[0]!;
  points.push({ time: new Date(first.startTime).getTime(), value: first.startBalance });
  for (const s of sorted) {
    points.push({
      time: new Date(s.endTime).getTime(),
      value: s.endBalance,
      earned: s.earned,
      hourly: s.hourlyRate,
    });
  }
  return points;
}


export default function PortfolioChart({
  primaryUser,
  secondaryUser,
  primarySessions,
  secondarySessions,
  primaryActive,
  primaryLiveBalance,
  secondaryActive,
  secondaryLiveBalance,
}: Props) {
  const primaryTheme = USER_THEMES[primaryUser];
  const secondaryTheme = USER_THEMES[secondaryUser];

  const data = useMemo<ChartPoint[]>(() => {
    const primarySeries = buildSeries(primarySessions);
    const secondarySeries = buildSeries(secondarySessions);

    if (primaryActive && primaryLiveBalance != null) {
      const liveTime = Math.max(Date.now(), new Date(primaryActive.startTime).getTime());
      primarySeries.push({ time: liveTime, value: primaryLiveBalance });
    }
    if (secondaryActive && secondaryLiveBalance != null) {
      const liveTime = Math.max(Date.now(), new Date(secondaryActive.startTime).getTime());
      secondarySeries.push({ time: liveTime, value: secondaryLiveBalance });
    }

    const times = new Set<number>();
    primarySeries.forEach((p) => times.add(p.time));
    secondarySeries.forEach((p) => times.add(p.time));

    const sortedTimes = [...times].sort((a, b) => a - b);

    const primaryMap = new Map<number, (typeof primarySeries)[number]>();
    primarySeries.forEach((p) => primaryMap.set(p.time, p));
    const secondaryMap = new Map<number, (typeof secondarySeries)[number]>();
    secondarySeries.forEach((p) => secondaryMap.set(p.time, p));

    let lastPrimary: number | undefined;
    let lastSecondary: number | undefined;
    const points: ChartPoint[] = [];

    for (const t of sortedTimes) {
      const pIn = primaryMap.get(t);
      const sIn = secondaryMap.get(t);
      if (pIn) lastPrimary = pIn.value;
      if (sIn) lastSecondary = sIn.value;

      points.push({
        time: t,
        primary: lastPrimary,
        secondary: lastSecondary,
        primaryEarned: pIn?.earned,
        primaryHourlyRate: pIn?.hourly,
      });
    }
    return points;
  }, [primarySessions, secondarySessions, primaryActive, primaryLiveBalance, secondaryActive, secondaryLiveBalance]);

  const { yDomain, yTicks } = useMemo<{ yDomain: [number, number]; yTicks: number[] }>(() => {
    const allValues: number[] = [];
    for (const p of data) {
      if (p.primary != null) allValues.push(p.primary);
      if (p.secondary != null) allValues.push(p.secondary);
    }
    if (allValues.length === 0) return { yDomain: [0, 1], yTicks: [0, 0.25, 0.5, 0.75, 1] };

    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const rawRange = rawMax - rawMin || rawMax * 0.1 || 1;

    // Pick a step that gives exactly 4 intervals (5 ticks) and is a "round" number
    const roughStep = rawRange / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const niceStep = Math.ceil(roughStep / magnitude) * magnitude;

    // Snap bottom down and top up to multiples of niceStep
    const bottom = Math.floor(rawMin / niceStep) * niceStep;
    const top = bottom + niceStep * 4;

    const ticks = [0, 1, 2, 3, 4].map((i) => bottom + i * niceStep);
    return { yDomain: [bottom, top] as [number, number], yTicks: ticks };
  }, [data]);

  const monthTicks = useMemo<number[]>(() => {
    if (data.length === 0) return [];
    const seen = new Set<string>();
    const ticks: number[] = [];
    for (const p of data) {
      const d = new Date(p.time);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!seen.has(key)) {
        seen.add(key);
        ticks.push(new Date(d.getFullYear(), d.getMonth(), 1).getTime());
      }
    }
    if (ticks.length > 10) {
      const step = Math.ceil(ticks.length / 10);
      return ticks.filter((_, i) => i % step === 0);
    }
    return ticks;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
          No sessions yet
        </div>
        <div className="mt-2 font-display text-xl text-white/70">
          Start your first one to draw the line.
        </div>
      </div>
    );
  }

  const gradientId = `grad-${primaryUser}`;
  const glowId = `glow-${primaryUser}`;

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
      <div className="pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
          Net Worth
        </div>
      </div>
      <div className="pointer-events-none absolute right-6 top-6 z-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: primaryTheme.line, boxShadow: `0 0 8px ${primaryTheme.line}` }}
          />
          {primaryUser}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: secondaryTheme.line }} />
          {secondaryUser}
        </div>
      </div>
      <div className="h-[320px] w-full pt-6 sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 36, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryTheme.line} stopOpacity={0.28} />
                <stop offset="100%" stopColor={primaryTheme.line} stopOpacity={0} />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={monthTicks.length ? monthTicks : undefined}
              tickFormatter={(t) =>
                new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(t as number))
              }
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              orientation="right"
              tickFormatter={(v) => formatCurrencyCompact(v as number)}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={72}
              domain={yDomain}
              ticks={yTicks}
              tickCount={5}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "3 3" }}
              content={(p: unknown) => {
                const props = p as { active?: boolean; payload?: { payload: ChartPoint }[] };
                if (!props.active || !props.payload?.length) return null;
                const point = props.payload[0]!.payload;
                return (
                  <div className="rounded-xl border border-white/10 bg-[#0b0b12]/95 px-3 py-2 font-mono text-xs backdrop-blur-md">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                      {formatDateShort(new Date(point.time).toISOString())}
                    </div>
                    {point.primary != null && (
                      <div className="mt-1.5 flex items-center justify-between gap-4" style={{ color: primaryTheme.line }}>
                        <span className="uppercase tracking-wide">{primaryUser}</span>
                        <span className="font-display text-sm">{formatCurrency(point.primary)}</span>
                      </div>
                    )}
{point.secondary != null && (
                      <div className="flex items-center justify-between gap-4" style={{ color: secondaryTheme.line }}>
                        <span className="uppercase tracking-wide">{secondaryUser}</span>
                        <span className="font-display text-sm">{formatCurrency(point.secondary)}</span>
                      </div>
                    )}
                    {point.primaryEarned != null && (
                      <div className="mt-2 border-t border-white/10 pt-1.5 text-[10px] text-white/60">
                        <div className="flex justify-between gap-4">
                          <span>Earned</span>
                          <span style={{ color: point.primaryEarned >= 0 ? "#4ade80" : "#f87171" }}>
                            {formatSignedCurrency(point.primaryEarned)}
                          </span>
                        </div>
                        {point.primaryHourlyRate != null && (
                          <div className="flex justify-between gap-4">
                            <span>$/hr</span>
                            <span style={{ color: primaryTheme.line }}>{formatCurrency(point.primaryHourlyRate)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="primary"
              stroke="none"
              fill={`url(#${gradientId})`}
              isAnimationActive
              animationDuration={900}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="secondary"
              stroke={secondaryTheme.line}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, fill: secondaryTheme.line }}
              isAnimationActive
              animationDuration={900}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="primary"
              stroke={primaryTheme.line}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: primaryTheme.line, stroke: "#fff", strokeWidth: 1 }}
              filter={`url(#${glowId})`}
              isAnimationActive
              animationDuration={900}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
