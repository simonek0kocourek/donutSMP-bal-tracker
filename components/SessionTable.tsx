"use client";

import { useState } from "react";
import type { Session, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import {
  formatCurrency,
  formatDateShort,
  formatDuration,
  formatSignedCurrency,
  sortSessionsDesc,
} from "@/lib/utils";

type Props = {
  user: UserId;
  sessions: Session[];
  onDelete: (id: string) => void;
};

export default function SessionTable({ user, sessions, onDelete }: Props) {
  const theme = USER_THEMES[user];
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
          No sessions logged yet
        </div>
        <div className="mt-2 font-display text-lg text-white/70">
          Start your first session above.
        </div>
      </div>
    );
  }

  const sorted = sortSessionsDesc(sessions);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3 text-right">Start</th>
              <th className="px-4 py-3 text-right">End</th>
              <th className="px-4 py-3 text-right">Earned</th>
              <th className="px-4 py-3 text-right">$/hr</th>
              <th className="px-4 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const isConfirming = confirmingId === s.id;
              const truePnl = s.earned + (s.stashBought ?? 0);
              const earnedPositive = truePnl >= 0;
              return (
                <tr
                  key={s.id}
                  className={i % 2 === 1 ? "bg-white/[0.02]" : ""}
                >
                  <td className="px-4 py-3 font-mono text-xs text-white/80">
                    {formatDateShort(s.endTime)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/70">
                    {formatDuration(s.durationMinutes)}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-base text-white/80">
                    {formatCurrency(s.startBalance)}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-base text-white/80">
                    {formatCurrency(s.endBalance)}
                  </td>
                  <td
                    className="px-4 py-3 text-right font-display text-base"
                    style={{ color: earnedPositive ? "#4ade80" : "#f87171" }}
                  >
                    {formatSignedCurrency(truePnl)}
                  </td>
                  <td
                    className="px-4 py-3 text-right font-display text-base"
                    style={{ color: theme.line }}
                  >
                    {formatCurrency(s.hourlyRate)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isConfirming ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(s.id);
                            setConfirmingId(null);
                          }}
                          className="rounded-md bg-red-500/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-red-300 transition-colors hover:bg-red-500/30"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="rounded-md bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/70 transition-colors hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label="Delete session"
                        onClick={() => setConfirmingId(s.id)}
                        className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-red-400"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
