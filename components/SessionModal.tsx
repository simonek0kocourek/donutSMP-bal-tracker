"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import type { UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";

type StartProps = {
  mode: "start";
  user: UserId;
  onClose: () => void;
  onConfirm: (startBalance: number) => void;
};

type EndProps = {
  mode: "end";
  user: UserId;
  startBalance: number;
  onClose: () => void;
  onConfirm: (endBalance: number) => void;
};

type Props = StartProps | EndProps;

export default function SessionModal(props: Props) {
  const theme = USER_THEMES[props.user];
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseDecimalInput(raw);
    if (parsed === null || parsed < 0) {
      setError("Enter a valid amount");
      return;
    }
    if (props.mode === "start") props.onConfirm(parsed);
    else props.onConfirm(parsed);
  };

  const isEnd = props.mode === "end";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={props.onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-white/10 bg-[#111118]/95 p-6 shadow-2xl"
        style={{ boxShadow: `0 20px 60px -20px ${theme.glow}` }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
          {isEnd ? "End session" : "Start session"}
        </div>
        <h2 className="mt-1 font-display text-2xl text-white">
          {isEnd ? "Log ending balance" : "Log starting balance"}
        </h2>
        {isEnd && (
          <div className="mt-2 font-mono text-xs text-white/50">
            Started at {formatCurrency(props.startBalance)}
          </div>
        )}

        <label className="mt-5 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
            {isEnd ? "Your ending balance" : "Your current balance"}
          </span>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-3 focus-within:border-white/30">
            <span className="font-display text-lg text-white/60">€</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setError(null);
              }}
              placeholder="0,00"
              className="w-full bg-transparent font-display text-xl text-white outline-none placeholder:text-white/20"
            />
          </div>
          {error && (
            <div className="mt-2 font-mono text-xs text-red-400">{error}</div>
          )}
        </label>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white/70 transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white transition-all"
            style={{
              background: isEnd
                ? "linear-gradient(135deg, #dc2626, #991b1b)"
                : `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
              boxShadow: isEnd
                ? "0 4px 16px -4px rgba(220, 38, 38, 0.5)"
                : `0 4px 16px -4px ${theme.glow}`,
            }}
          >
            {isEnd ? "End session" : "Start session"}
          </button>
        </div>
      </form>
    </div>
  );
}
