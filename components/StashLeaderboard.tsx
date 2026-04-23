"use client";

import { useMemo } from "react";
import type { StashEntry, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import { mcItemIconUrl } from "@/lib/mcItems";

type ItemStat = {
  itemId: string;
  itemName: string;
  totalPnl: number;
  totalInvested: number;
  totalRevenue: number;
  trades: number;
};

function buildLeaderboard(stash: StashEntry[]): ItemStat[] {
  const closed = stash.filter((e) => e.sellPriceTotal != null);
  if (closed.length === 0) return [];

  const map = new Map<string, ItemStat>();
  for (const e of closed) {
    const pnl = e.sellPriceTotal! - e.buyPriceTotal;
    const existing = map.get(e.itemId);
    if (existing) {
      existing.totalPnl += pnl;
      existing.totalInvested += e.buyPriceTotal;
      existing.totalRevenue += e.sellPriceTotal!;
      existing.trades += 1;
    } else {
      map.set(e.itemId, {
        itemId: e.itemId,
        itemName: e.itemName,
        totalPnl: pnl,
        totalInvested: e.buyPriceTotal,
        totalRevenue: e.sellPriceTotal!,
        trades: 1,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.totalPnl - a.totalPnl);
}

type Props = {
  user: UserId;
  stash: StashEntry[];
};

export default function StashLeaderboard({ user, stash }: Props) {
  const theme = USER_THEMES[user];
  const board = useMemo(() => buildLeaderboard(stash), [stash]);

  if (board.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          No closed trades yet
        </div>
        <div className="mt-1 font-display text-base text-white/40">
          Sell an investment to see your item rankings.
        </div>
      </div>
    );
  }

  const best = board[0]!;
  const worst = board[board.length - 1]!;
  const maxAbsPnl = Math.max(...board.map((s) => Math.abs(s.totalPnl)), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-3">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          <span className="w-5 text-center">#</span>
          <span>Item</span>
          <span className="w-16 text-right">Invested</span>
          <span className="w-16 text-right">Trades</span>
          <span className="w-20 text-right">P&L</span>
        </div>
      </div>

      {/* Rows */}
      {board.map((stat, i) => {
        const isProfit = stat.totalPnl >= 0;
        const barWidth = (Math.abs(stat.totalPnl) / maxAbsPnl) * 100;
        const isBest = stat.itemId === best.itemId;
        const isWorst = board.length > 1 && stat.itemId === worst.itemId && worst.totalPnl < 0;

        return (
          <div
            key={stat.itemId}
            className="relative grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 border-t border-white/5 px-4 py-3"
          >
            {/* P&L progress bar behind the row */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0"
              style={{
                width: `${barWidth}%`,
                background: isProfit
                  ? "rgba(74,222,128,0.05)"
                  : "rgba(248,113,113,0.05)",
              }}
            />

            {/* Rank */}
            <div className="relative w-5 text-center">
              {i === 0 ? (
                <span className="font-display text-base" style={{ color: "#fbbf24" }}>1</span>
              ) : i === 1 ? (
                <span className="font-display text-base text-white/60">2</span>
              ) : i === 2 ? (
                <span className="font-display text-base" style={{ color: "#cd7f32" }}>3</span>
              ) : (
                <span className="font-mono text-xs text-white/30">{i + 1}</span>
              )}
            </div>

            {/* Item */}
            <div className="relative flex min-w-0 items-center gap-2">
              <img
                src={mcItemIconUrl(stat.itemId)}
                alt={stat.itemName}
                className="h-6 w-6 flex-shrink-0 [image-rendering:pixelated]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="min-w-0">
                <div className="truncate font-display text-sm text-white">
                  {stat.itemName}
                </div>
                {(isBest || isWorst) && (
                  <div
                    className="font-mono text-[9px] uppercase tracking-[0.15em]"
                    style={{ color: isBest ? "#4ade80" : "#f87171" }}
                  >
                    {isBest ? "Best performer" : "Worst performer"}
                  </div>
                )}
              </div>
            </div>

            {/* Invested */}
            <div className="relative w-16 text-right font-mono text-[10px] text-white/40">
              {formatCurrency(stat.totalInvested)}
            </div>

            {/* Trades */}
            <div className="relative w-16 text-right font-mono text-[10px] text-white/40">
              {stat.trades}×
            </div>

            {/* P&L */}
            <div
              className="relative w-20 text-right font-display text-sm tabular-nums"
              style={{ color: isProfit ? "#4ade80" : "#f87171" }}
            >
              {formatSignedCurrency(stat.totalPnl)}
            </div>
          </div>
        );
      })}

      {/* Footer totals */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3">
          <div className="w-5" />
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Total ({board.reduce((s, x) => s + x.trades, 0)} trades)
          </div>
          <div className="w-16 text-right font-mono text-[10px] text-white/40">
            {formatCurrency(board.reduce((s, x) => s + x.totalInvested, 0))}
          </div>
          <div className="w-16" />
          <div
            className="w-20 text-right font-display text-sm tabular-nums"
            style={{
              color:
                board.reduce((s, x) => s + x.totalPnl, 0) >= 0
                  ? "#4ade80"
                  : "#f87171",
            }}
          >
            {formatSignedCurrency(board.reduce((s, x) => s + x.totalPnl, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
