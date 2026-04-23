"use client";

import type { UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";

type Props = {
  user: UserId;
  onClick: () => void;
};

export default function SignInButton({ user, onClick }: Props) {
  const theme = USER_THEMES[user];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border border-white/10 px-5 py-4 text-left transition-all duration-300 ease-out hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
        boxShadow: `0 6px 24px -8px ${theme.glow}`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at center, ${theme.glow}, transparent 65%)`,
        }}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
            Sign in as
          </div>
          <div className="mt-1 font-display text-2xl text-white">{user}</div>
        </div>
        <svg
          className="h-5 w-5 text-white/70 transition-transform duration-300 group-hover:translate-x-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </div>
    </button>
  );
}
