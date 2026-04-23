"use client";

import type { StashEntry, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import { mcItemIconUrl } from "@/lib/mcItems";

function formatExactTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  user: UserId;
  stash: StashEntry[];
  onSell: (entry: StashEntry) => void;
  onDelete: (id: string) => void;
};

export default function StashTable({ user, stash, onSell, onDelete }: Props) {
  const theme = USER_THEMES[user];

  const open = stash
    .filter((e) => e.sellPriceTotal == null)
    .sort((a, b) => new Date(b.buyTime).getTime() - new Date(a.buyTime).getTime());

  const closed = stash
    .filter((e) => e.sellPriceTotal != null)
    .sort((a, b) => new Date(b.sellTime!).getTime() - new Date(a.sellTime!).getTime());

  if (stash.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          No investments yet
        </div>
        <div className="mt-1 font-display text-lg text-white/50">
          Click "Add investment" to stash an item.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Open positions */}
      {open.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" style={{ boxShadow: "0 0 6px #fbbf24" }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
              Open positions ({open.length})
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            {open.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? "border-t border-white/5" : ""}`}
              >
                <img
                  src={mcItemIconUrl(entry.itemId)}
                  alt={entry.itemName}
                  className="h-7 w-7 flex-shrink-0 [image-rendering:pixelated]"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-sm text-white">{entry.itemName}</span>
                    <span className="font-mono text-[10px] text-white/40">×{entry.quantity}</span>
                  </div>
                  <div className="font-mono text-[10px] text-white/40">
                    {formatExactTime(entry.buyTime)} · Invested {formatCurrency(entry.buyPriceTotal)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSell(entry)}
                    className="rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white transition-all hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                      boxShadow: `0 2px 10px -3px ${theme.glow}`,
                    }}
                  >
                    Sell
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 transition-colors hover:border-red-500/30 hover:text-red-400"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closed positions */}
      {closed.length > 0 && (
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
            Closed positions ({closed.length})
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            {closed.map((entry, i) => {
              const pnl = entry.sellPriceTotal! - entry.buyPriceTotal;
              const isProfit = pnl >= 0;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? "border-t border-white/5" : ""}`}
                >
                  <img
                    src={mcItemIconUrl(entry.itemId)}
                    alt={entry.itemName}
                    className="h-7 w-7 flex-shrink-0 opacity-60 [image-rendering:pixelated]"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-sm text-white/70">{entry.itemName}</span>
                      <span className="font-mono text-[10px] text-white/30">×{entry.quantity}</span>
                    </div>
                    <div className="font-mono text-[10px] text-white/30">
                      Bought {formatCurrency(entry.buyPriceTotal)} · Sold {formatCurrency(entry.sellPriceTotal!)} · {formatExactTime(entry.sellTime!)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-display text-sm tabular-nums"
                      style={{ color: isProfit ? "#4ade80" : "#f87171" }}
                    >
                      {formatSignedCurrency(pnl)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      className="rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 transition-colors hover:border-red-500/30 hover:text-red-400"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
