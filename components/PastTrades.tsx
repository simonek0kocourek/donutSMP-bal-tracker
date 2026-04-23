"use client";

import { useState } from "react";
import type { StashEntry, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import { mcItemIconUrl } from "@/lib/mcItems";

function fmtDayMonth(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

function fmtTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  } catch { return ""; }
}

function fmtDayMonthTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  } catch { return iso; }
}

// Build a flat list of closed sell trades sorted by profit desc.
// A "sell" entry is one with sellPriceTotal set and no consumedBySellId (i.e. it's the output, not a consumed input).
function buildTrades(stash: StashEntry[]) {
  const byId = new Map(stash.map((e) => [e.id, e]));

  const sellEntries = stash
    .filter((e) => e.sellPriceTotal != null && !e.consumedBySellId)
    .sort((a, b) => {
      const pnlA = a.sellPriceTotal! - a.buyPriceTotal;
      const pnlB = b.sellPriceTotal! - b.buyPriceTotal;
      return pnlB - pnlA;
    });

  return sellEntries.map((sell) => {
    const inputs: StashEntry[] = (sell.consumedEntryIds ?? [])
      .map((id) => byId.get(id))
      .filter(Boolean) as StashEntry[];
    const pnl = sell.sellPriceTotal! - sell.buyPriceTotal;
    return { sell, inputs, pnl };
  });
}

// Silk-style SVG arrow
function SilkArrow({ color }: { color: string }) {
  return (
    <svg
      width="32"
      height="16"
      viewBox="0 0 32 16"
      fill="none"
      className="flex-shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id="arrow-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <path
        d="M2 8 Q10 4 20 8 Q26 10 28 8"
        stroke={`url(#arrow-grad)`}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M25 5 L29 8 L25 11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.9}
      />
    </svg>
  );
}

type Props = {
  user: UserId;
  stash: StashEntry[];
};

export default function PastTrades({ user, stash }: Props) {
  const theme = USER_THEMES[user];
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredInputId, setHoveredInputId] = useState<string | null>(null);

  const trades = buildTrades(stash);

  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">No past trades</div>
        <div className="mt-1 font-display text-sm text-white/30">Sell a stashed item to see it here.</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {/* Column header */}
      <div
        className="border-b px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">Trade</span>
          <span className="w-20 text-right font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">Sold for</span>
          <span className="w-20 text-right font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">P&amp;L</span>
        </div>
      </div>

      {trades.map(({ sell, inputs, pnl }, rank) => {
        const isHovered = hoveredId === sell.id;
        const isProfit = pnl >= 0;

        return (
          <div
            key={sell.id}
            className={`relative border-t border-white/5 px-4 py-3 transition-colors ${isHovered ? "bg-white/[0.03]" : ""}`}
            onMouseEnter={() => setHoveredId(sell.id)}
            onMouseLeave={() => { setHoveredId(null); setHoveredInputId(null); }}
          >
            {/* Subtle P&L bar */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0"
              style={{
                width: `${Math.min(Math.abs(pnl) / Math.max(...trades.map((t) => Math.abs(t.pnl)), 1) * 60, 60)}%`,
                background: isProfit ? "rgba(74,222,128,0.04)" : "rgba(248,113,113,0.04)",
              }}
            />

            <div className="relative grid grid-cols-[1fr_auto_auto] items-center gap-4">
              {/* Left: rank + input icons → arrow → output icon */}
              <div className="flex min-w-0 items-center gap-2">
                {/* Rank number */}
                <span className="w-4 flex-shrink-0 text-center font-mono text-[10px] text-white/25">
                  {rank + 1}
                </span>

                {/* Input icons (if any) */}
                {inputs.length > 0 && (
                  <div className="flex items-center">
                    {inputs.map((inp) => (
                      <div
                        key={inp.id}
                        className="relative -mr-1 flex-shrink-0"
                        onMouseEnter={() => setHoveredInputId(inp.id)}
                        onMouseLeave={() => setHoveredInputId(null)}
                      >
                        <img
                          src={mcItemIconUrl(inp.itemId)}
                          alt={inp.itemName}
                          className="h-7 w-7 rounded [image-rendering:pixelated]"
                          style={{ outline: "1px solid rgba(255,255,255,0.08)" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                        {/* Per-input hover tooltip */}
                        {hoveredInputId === inp.id && (
                          <div
                            className="absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[10px] shadow-xl"
                            style={{ background: "rgba(8,8,16,0.97)", backdropFilter: "blur(12px)" }}
                          >
                            <div className="text-white/80">{inp.itemName} ×{inp.quantity}</div>
                            <div className="mt-0.5 text-white/45">{fmtDayMonthTime(inp.buyTime)}</div>
                            <div className="mt-0.5 text-white/45">{formatCurrency(inp.buyPriceTotal)}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Silk arrow — only when there are inputs */}
                {inputs.length > 0 && (
                  <div className="ml-1 flex-shrink-0">
                    <SilkArrow color={theme.line} />
                  </div>
                )}

                {/* Output icon + name + date */}
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={mcItemIconUrl(sell.itemId)}
                    alt={sell.itemName}
                    className="h-7 w-7 flex-shrink-0 [image-rendering:pixelated]"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm text-white">{sell.itemName}</div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/35">
                      <span>{fmtDayMonth(sell.sellTime!)}</span>
                      {/* Time fades in on row hover */}
                      <span
                        className="transition-all duration-300"
                        style={{ opacity: isHovered ? 0.7 : 0 }}
                      >
                        {fmtTime(sell.sellTime!)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sold for */}
              <div className="w-20 text-right font-mono text-[10px] tabular-nums text-white/40">
                {formatCurrency(sell.sellPriceTotal!)}
              </div>

              {/* P&L */}
              <div
                className="w-20 text-right font-display text-sm tabular-nums"
                style={{ color: isProfit ? "#4ade80" : "#f87171" }}
              >
                {formatSignedCurrency(pnl)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer totals */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            Total · {trades.length} trade{trades.length !== 1 ? "s" : ""}
          </div>
          <div className="w-20 text-right font-mono text-[10px] tabular-nums text-white/35">
            {formatCurrency(trades.reduce((s, t) => s + t.sell.sellPriceTotal!, 0))}
          </div>
          <div
            className="w-20 text-right font-display text-sm tabular-nums"
            style={{
              color: trades.reduce((s, t) => s + t.pnl, 0) >= 0 ? "#4ade80" : "#f87171",
            }}
          >
            {formatSignedCurrency(trades.reduce((s, t) => s + t.pnl, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
