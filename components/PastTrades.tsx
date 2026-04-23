"use client";

import { useState } from "react";
import type { StashEntry, StashOutputItem, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import { mcItemIconUrl } from "@/lib/mcItems";

function fmtDayMonth(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

function fmtDayMonthTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  } catch { return iso; }
}

function buildTrades(stash: StashEntry[]) {
  const byId = new Map(stash.map((e) => [e.id, e]));

  return stash
    .filter((e) => e.sellPriceTotal != null && !e.consumedBySellId && (e.sellPriceTotal > 0 || (e.consumedEntryIds?.length ?? 0) > 0))
    .sort((a, b) => {
      const pnlA = a.sellPriceTotal! - a.buyPriceTotal;
      const pnlB = b.sellPriceTotal! - b.buyPriceTotal;
      return pnlB - pnlA;
    })
    .map((sell) => {
      const inputs: StashEntry[] = (sell.consumedEntryIds ?? [])
        .map((id) => byId.get(id))
        .filter(Boolean) as StashEntry[];
      const pnl = sell.sellPriceTotal! - sell.buyPriceTotal;
      const outputs: StashOutputItem[] = sell.outputItems ?? [{
        itemId: sell.itemId,
        itemName: sell.itemName,
        quantity: sell.quantity,
        sellPriceTotal: sell.sellPriceTotal!,
      }];
      return { sell, inputs, outputs, pnl };
    });
}

function SilkArrow({ color }: { color: string }) {
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" fill="none" className="flex-shrink-0" aria-hidden>
      <defs>
        <linearGradient id="sarrow-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0.85} />
        </linearGradient>
      </defs>
      <path d="M2 7 Q10 3 18 7 Q22 9 24 7" stroke="url(#sarrow-grad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M21 4.5 L25 7 L21 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.85} />
    </svg>
  );
}

type Props = {
  user: UserId;
  stash: StashEntry[];
  onDelete: (ids: string[]) => void;
};

export default function PastTrades({ user, stash, onDelete }: Props) {
  const theme = USER_THEMES[user];
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const trades = buildTrades(stash);
  const maxAbsPnl = Math.max(...trades.map((t) => Math.abs(t.pnl)), 1);

  if (trades.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">No past trades</div>
        <div className="mt-1 font-display text-sm text-white/30">Sell a stashed item to see it here.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="rounded-t-2xl border-b px-4 py-2.5" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <span className="w-4" />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">Trade</span>
          <span className="w-20 text-right font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">P&amp;L</span>
        </div>
      </div>

      {trades.map(({ sell, inputs, outputs, pnl }, rank) => {
        const isHovered = hoveredId === sell.id;
        const isProfit = pnl >= 0;
        const barWidth = (Math.abs(pnl) / maxAbsPnl) * 55;

        return (
          <div
            key={sell.id}
            className="relative border-t border-white/5 px-4 py-3"
            onMouseEnter={() => setHoveredId(sell.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* P&L bar */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0"
              style={{
                width: `${barWidth}%`,
                background: isProfit ? "rgba(74,222,128,0.04)" : "rgba(248,113,113,0.04)",
              }}
            />

            {/* Trade row */}
            <div className="relative flex items-center gap-3">

              {/* Rank */}
              <span className="w-4 flex-shrink-0 text-center font-mono text-[10px] text-white/25">{rank + 1}</span>

              {/* Left: inputs stacked — icon + name + qty + buy price */}
              {inputs.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {inputs.map((inp) => (
                    <div key={inp.id} className="flex items-center gap-1.5">
                      <img
                        src={mcItemIconUrl(inp.itemId)}
                        alt={inp.itemName}
                        className="h-6 w-6 flex-shrink-0 [image-rendering:pixelated]"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="font-display text-sm text-white/80">{inp.itemName}</span>
                      <span className="font-mono text-[10px] text-white/35">×{inp.quantity}</span>
                      <span className="font-mono text-[10px] text-white/20">{formatCurrency(inp.buyPriceTotal)}</span>
                      <span
                        className="overflow-hidden whitespace-nowrap font-mono text-[10px] text-white/20 transition-all duration-300 ease-out"
                        style={{ maxWidth: isHovered ? "200px" : "0px", opacity: isHovered ? 1 : 0 }}
                      >&middot; {fmtDayMonthTime(inp.buyTime)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Arrow */}
              {inputs.length > 0 && <SilkArrow color={theme.line} />}

              {/* Right: outputs stacked — icon + name + qty + sell price */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {outputs.map((out, oi) => (
                  <div key={oi} className="flex items-center gap-1.5">
                    <img
                      src={mcItemIconUrl(out.itemId)}
                      alt={out.itemName}
                      className="h-6 w-6 flex-shrink-0 [image-rendering:pixelated]"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="truncate font-display text-sm text-white">{out.itemName}</span>
                    <span className="font-mono text-[10px] text-white/35">×{out.quantity}</span>
                    <span className="font-mono text-[10px] text-white/20">{formatCurrency(out.sellPriceTotal)}</span>
                    {oi === 0 && (
                      <>
                        <span
                          className="overflow-hidden whitespace-nowrap font-mono text-[10px] text-white/20 transition-all duration-300 ease-out"
                          style={{ maxWidth: isHovered ? "0px" : "80px", opacity: isHovered ? 0 : 1 }}
                        >&middot; {fmtDayMonth(sell.sellTime!)}</span>
                        <span
                          className="overflow-hidden whitespace-nowrap font-mono text-[10px] text-white/20 transition-all duration-300 ease-out"
                          style={{ maxWidth: isHovered ? "200px" : "0px", opacity: isHovered ? 1 : 0 }}
                        >&middot; {fmtDayMonthTime(sell.sellTime!)}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* P&L */}
              <div
                className="flex-shrink-0 w-20 text-right font-display text-sm tabular-nums"
                style={{ color: isProfit ? "#4ade80" : "#f87171" }}
              >
                {formatSignedCurrency(pnl)}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => onDelete([sell.id, ...inputs.map((i) => i.id)])}
                className="flex-shrink-0 rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red-400/70 transition-colors hover:bg-red-500/20 hover:text-red-400"
              >
                del
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
