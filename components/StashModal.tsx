"use client";

import { useEffect, useRef, useState } from "react";
import type { StashEntry, UserTheme, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import { mcItemIconUrl, searchMcItems, type McItem } from "@/lib/mcItems";

function newId(): string {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    try { return globalThis.crypto.randomUUID(); } catch {}
  }
  return `stash_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatExactTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type AddProps = {
  mode: "add";
  user: UserId;
  onClose: () => void;
  onConfirm: (entry: StashEntry) => void;
};

type SellProps = {
  mode: "sell";
  user: UserId;
  entry: StashEntry;
  onClose: () => void;
  onConfirm: (entry: StashEntry) => void;
};

type Props = AddProps | SellProps;

export default function StashModal(props: Props) {
  const theme = USER_THEMES[props.user];

  // Lock page scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") props.onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={props.onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Sheet — fixed height with internal scroll, never grows the page */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm animate-scale-in rounded-t-2xl border border-white/15 sm:rounded-2xl"
        style={{
          background: "rgba(10,10,18,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px -16px ${theme.glow}, 0 8px 32px rgba(0,0,0,0.6)`,
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
      >
        {props.mode === "add" ? (
          <AddForm {...props} theme={theme} />
        ) : (
          <SellForm {...props} theme={theme} />
        )}
      </div>
    </div>
  );
}

// ─── Add form ────────────────────────────────────────────────────────────────

function AddForm({
  onClose,
  onConfirm,
  theme,
}: AddProps & { theme: UserTheme }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<McItem[]>(searchMcItems(""));
  const [selected, setSelected] = useState<McItem | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date().toISOString());

  // Dropdown positioning — rendered inline with overflow visible on the wrapper
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setResults(searchMcItems(query));
    if (query) setShowDropdown(true);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item: McItem) => {
    setSelected(item);
    setQuery(item.name);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { setError("Pick an item first"); return; }
    const parsedQty = parseDecimalInput(qty);
    if (!parsedQty || parsedQty <= 0) { setError("Enter a valid quantity"); return; }
    const parsedPrice = parseDecimalInput(price);
    if (parsedPrice === null || parsedPrice < 0) { setError("Enter a valid price"); return; }
    const entry: StashEntry = {
      id: newId(),
      itemId: selected.id,
      itemName: selected.name,
      quantity: parsedQty,
      buyPriceTotal: parsedPrice,
      buyTime: new Date().toISOString(),
    };
    onConfirm(entry);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        Stash
      </div>
      <h2 className="mt-1 font-display text-2xl text-white">Log investment</h2>

      {/* Item search — dropdown is inline, stacks below and pushes content down intentionally inside the scrollable sheet */}
      <div className="mt-5" ref={searchRef}>
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Item
        </label>
        <div className="relative mt-2">
          {/* Input row */}
          <div
            className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 focus-within:border-white/35"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {selected && (
              <img
                src={mcItemIconUrl(selected.id)}
                alt={selected.name}
                className="h-6 w-6 flex-shrink-0 [image-rendering:pixelated]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); setError(null); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search items…"
              autoComplete="off"
              className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-white/25"
            />
            {query.length > 0 && (
              <button
                type="button"
                onMouseDown={() => { setQuery(""); setSelected(null); setShowDropdown(false); }}
                className="flex-shrink-0 font-mono text-xs text-white/30 hover:text-white/60"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown — absolutely positioned, overlaps content below */}
          {showDropdown && results.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-white/15 shadow-2xl"
              style={{
                background: "rgba(8,8,16,0.97)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={() => handleSelect(item)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/8"
                >
                  <img
                    src={mcItemIconUrl(item.id)}
                    alt={item.name}
                    className="h-6 w-6 flex-shrink-0 [image-rendering:pixelated]"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div>
                    <div className="font-mono text-xs text-white">{item.name}</div>
                    <div className="font-mono text-[10px] text-white/35">{item.category}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spacer that expands when dropdown is open so fields below stay visible */}
      {showDropdown && results.length > 0 && (
        <div style={{ height: Math.min(results.length * 44, 208) + 8 }} />
      )}

      {/* Quantity */}
      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Quantity
        </span>
        <div
          className="mt-2 flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 focus-within:border-white/35"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <input
            type="text"
            inputMode="decimal"
            value={qty}
            onChange={(e) => { setQty(e.target.value); setError(null); }}
            placeholder="1"
            className="w-full bg-transparent font-display text-lg text-white outline-none placeholder:text-white/20"
          />
        </div>
      </label>

      {/* Price */}
      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Total buy price
        </span>
        <div
          className="mt-2 flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 focus-within:border-white/35"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <span className="font-display text-lg text-white/50">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setError(null); }}
            placeholder="0.00"
            className="w-full bg-transparent font-display text-lg text-white outline-none placeholder:text-white/20"
          />
        </div>
      </label>

      {/* Live timestamp */}
      <div className="mt-3 font-mono text-[10px] text-white/35">
        <span className="uppercase tracking-[0.15em]">Timestamp </span>
        <span className="tabular-nums">{formatExactTime(now)}</span>
      </div>

      {error && <div className="mt-2 font-mono text-xs text-red-400">{error}</div>}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white/60 transition-colors hover:bg-white/8"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white transition-all hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            boxShadow: `0 4px 16px -4px ${theme.glow}`,
          }}
        >
          Stash it
        </button>
      </div>
    </form>
  );
}

// ─── Sell form ────────────────────────────────────────────────────────────────

function SellForm({
  entry,
  onClose,
  onConfirm,
  theme,
}: SellProps & { theme: UserTheme }) {
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseDecimalInput(price);
    if (parsedPrice === null || parsedPrice < 0) { setError("Enter a valid sell price"); return; }
    onConfirm({ ...entry, sellPriceTotal: parsedPrice, sellTime: new Date().toISOString() });
  };

  const previewPnl =
    price !== "" ? (parseDecimalInput(price) ?? 0) - entry.buyPriceTotal : null;

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        Stash — Sell
      </div>
      <h2 className="mt-1 font-display text-2xl text-white">Close position</h2>

      {/* Item preview */}
      <div
        className="mt-4 flex items-center gap-3 rounded-xl border border-white/15 px-4 py-3"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <img
          src={mcItemIconUrl(entry.itemId)}
          alt={entry.itemName}
          className="h-8 w-8 [image-rendering:pixelated]"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <div>
          <div className="font-display text-base text-white">{entry.itemName}</div>
          <div className="font-mono text-[10px] text-white/40">
            Qty {entry.quantity} · Bought for {formatCurrency(entry.buyPriceTotal)}
          </div>
        </div>
      </div>

      {/* Sell price */}
      <label className="mt-5 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Total sell price
        </span>
        <div
          className="mt-2 flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 focus-within:border-white/35"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <span className="font-display text-lg text-white/50">$</span>
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={price}
            onChange={(e) => { setPrice(e.target.value); setError(null); }}
            placeholder="0.00"
            className="w-full bg-transparent font-display text-lg text-white outline-none placeholder:text-white/20"
          />
        </div>
      </label>

      {previewPnl !== null && (
        <div
          className="mt-3 font-mono text-sm tabular-nums"
          style={{ color: previewPnl >= 0 ? "#4ade80" : "#f87171" }}
        >
          {previewPnl >= 0 ? "+" : ""}
          {formatCurrency(previewPnl)} P&amp;L
        </div>
      )}

      <div className="mt-2 font-mono text-[10px] text-white/35">
        <span className="uppercase tracking-[0.15em]">Sell time </span>
        <span className="tabular-nums">{formatExactTime(now)}</span>
      </div>

      {error && <div className="mt-2 font-mono text-xs text-red-400">{error}</div>}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white/60 transition-colors hover:bg-white/8"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white transition-all hover:-translate-y-0.5"
          style={{
            background:
              previewPnl !== null && previewPnl < 0
                ? "linear-gradient(135deg, #dc2626, #991b1b)"
                : `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            boxShadow:
              previewPnl !== null && previewPnl < 0
                ? "0 4px 16px -4px rgba(220,38,38,0.5)"
                : `0 4px 16px -4px ${theme.glow}`,
          }}
        >
          Sell
        </button>
      </div>
    </form>
  );
}
