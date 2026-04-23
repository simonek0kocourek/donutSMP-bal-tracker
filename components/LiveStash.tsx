"use client";

import { useState } from "react";
import type { StashEntry, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { mcItemIconUrl } from "@/lib/mcItems";
import ConfirmModal from "@/components/ConfirmModal";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  user: UserId;
  stash: StashEntry[];
  onSell: () => void;
  onDelete: (id: string) => void;
};

export default function LiveStash({ user, stash, onSell, onDelete }: Props) {
  const theme = USER_THEMES[user];
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const open = stash
    .filter((e) => e.sellPriceTotal == null && e.consumedBySellId == null)
    .sort((a, b) => new Date(b.buyTime).getTime() - new Date(a.buyTime).getTime());

  const totalStashed = open.reduce((s, e) => s + e.buyPriceTotal, 0);
  const pendingEntry = open.find((e) => e.id === pendingDelete);

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        border: "1px solid transparent",
        backgroundClip: "padding-box",
        position: "relative",
      }}
    >
      {/* Pulsing animated border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          padding: "1px",
          background: `linear-gradient(135deg, ${theme.line}55, ${theme.line}11, ${theme.line}55)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: "pulse-border 2.4s ease-in-out infinite",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: theme.line,
              boxShadow: `0 0 8px ${theme.line}`,
              animation: "pulse-dot 2.4s ease-in-out infinite",
            }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
            Live Stash
          </span>
        </div>
        {open.length > 0 && (
          <span className="font-mono text-[10px] tabular-nums text-white/40">
            {formatCurrency(totalStashed)} invested
          </span>
        )}
      </div>

      {open.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">Nothing stashed</div>
          <div className="mt-1 font-display text-sm text-white/30">Buy items to watch them here.</div>
        </div>
      ) : (
        <>
          {open.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? "border-t border-white/5" : ""}`}
              style={{ background: "rgba(255,255,255,0.01)" }}
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
                <div className="font-mono text-[10px] text-white/35">
                  {formatDate(entry.buyTime)} · {formatCurrency(entry.buyPriceTotal)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDelete(entry.id)}
                  className="rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 transition-colors hover:border-red-500/30 hover:text-red-400"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Sell stashed button */}
          <div className="border-t border-white/5 px-4 py-3">
            <button
              type="button"
              onClick={onSell}
              className="w-full rounded-xl px-4 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                boxShadow: `0 4px 16px -6px ${theme.glow}`,
              }}
            >
              Sell stashed
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse-border {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>

      {pendingDelete && (
        <ConfirmModal
          title="Remove stashed item?"
          message={pendingEntry ? `Remove ${pendingEntry.itemName} ×${pendingEntry.quantity} from your stash? This cannot be undone.` : "This cannot be undone."}
          confirmLabel="Remove"
          onConfirm={() => { onDelete(pendingDelete); setPendingDelete(null); }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
