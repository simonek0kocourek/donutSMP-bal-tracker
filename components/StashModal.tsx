"use client";

import { useEffect, useRef, useState } from "react";
import type { StashEntry, UserTheme, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import { formatCurrency, formatSignedCurrency, parseDecimalInput } from "@/lib/utils";
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
  // All currently open stash entries (to pick consumed inputs from)
  openEntries: StashEntry[];
  onClose: () => void;
  // Returns the new sell entry + all consumed entries (marked closed)
  onConfirm: (sellEntry: StashEntry, consumed: StashEntry[]) => void;
};

type Props = AddProps | SellProps;

export default function StashModal(props: Props) {
  const theme = USER_THEMES[props.user];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(props.onClose, 220);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={close}
      style={{
        transition: "opacity 220ms ease",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-t-2xl border border-white/15 sm:rounded-2xl"
        style={{
          background: "rgba(10,10,18,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px -16px ${theme.glow}, 0 8px 32px rgba(0,0,0,0.6)`,
          maxHeight: "92dvh",
          overflowY: "auto",
          transition: "transform 220ms cubic-bezier(0.32,0.72,0,1), opacity 220ms ease",
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          opacity: visible ? 1 : 0,
        }}
      >
        {props.mode === "add" ? (
          <AddForm {...props} onClose={close} theme={theme} />
        ) : (
          <SellForm {...props} onClose={close} theme={theme} />
        )}
      </div>
    </div>
  );
}

// ─── Item search widget ───────────────────────────────────────────────────────

function ItemSearch({
  value,
  onChange,
  placeholder = "Search items…",
}: {
  value: McItem | null;
  onChange: (item: McItem | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<McItem[]>(searchMcItems(""));
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    onChange(item);
    setQuery(item.name);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={searchRef} className="relative">
      <div
        className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 focus-within:border-white/35"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        {value && (
          <img
            src={mcItemIconUrl(value.id)}
            alt={value.name}
            className="h-6 w-6 flex-shrink-0 [image-rendering:pixelated]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(null); }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-white/25"
        />
        {query.length > 0 && (
          <button
            type="button"
            onMouseDown={() => { setQuery(""); onChange(null); setShowDropdown(false); }}
            className="flex-shrink-0 font-mono text-xs text-white/30 hover:text-white/60"
          >
            ✕
          </button>
        )}
      </div>

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

      {showDropdown && results.length > 0 && (
        <div style={{ height: Math.min(results.length * 44, 208) + 8 }} />
      )}
    </div>
  );
}

// ─── Add form ────────────────────────────────────────────────────────────────

function AddForm({
  onClose,
  onConfirm,
  theme,
}: AddProps & { theme: UserTheme }) {
  const [selected, setSelected] = useState<McItem | null>(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => window.clearInterval(id);
  }, []);

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
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Stash</div>
      <h2 className="mt-1 font-display text-2xl text-white">Buy to stash</h2>

      <div className="mt-5">
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Item</label>
        <div className="mt-2">
          <ItemSearch value={selected} onChange={(item) => { setSelected(item); setError(null); }} />
        </div>
      </div>

      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Quantity</span>
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

      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Total buy price</span>
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
  openEntries,
  onClose,
  onConfirm,
  theme,
}: SellProps & { theme: UserTheme }) {
  const [selectedItem, setSelectedItem] = useState<McItem | null>(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [consumedIds, setConsumedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const totalCost = openEntries
    .filter((e) => consumedIds.has(e.id))
    .reduce((sum, e) => sum + e.buyPriceTotal, 0);

  const parsedPrice = parseDecimalInput(price);
  const previewPnl = parsedPrice !== null ? parsedPrice - totalCost : null;

  const toggleConsumed = (id: string) => {
    setConsumedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) { setError("Pick the item you're selling"); return; }
    const parsedQty = parseDecimalInput(qty);
    if (!parsedQty || parsedQty <= 0) { setError("Enter a valid quantity"); return; }
    if (parsedPrice === null || parsedPrice < 0) { setError("Enter a valid sell price"); return; }

    const now = new Date().toISOString();
    const sellId = newId();

    const consumed = openEntries.filter((e) => consumedIds.has(e.id));

    const sellEntry: StashEntry = {
      id: sellId,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity: parsedQty,
      buyPriceTotal: totalCost,
      buyTime: now,
      sellPriceTotal: parsedPrice,
      sellTime: now,
      consumedEntryIds: consumed.map((e) => e.id),
    };

    const closedInputs: StashEntry[] = consumed.map((e) => ({
      ...e,
      sellPriceTotal: 0,
      sellTime: now,
      consumedBySellId: sellId,
    }));

    onConfirm(sellEntry, closedInputs);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Stash</div>
      <h2 className="mt-1 font-display text-2xl text-white">Sell stashed</h2>

      {/* What are you selling */}
      <div className="mt-5">
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Item you&apos;re selling
        </label>
        <div className="mt-2">
          <ItemSearch
            value={selectedItem}
            onChange={(item) => { setSelectedItem(item); setError(null); }}
            placeholder="Search items…"
          />
        </div>
      </div>

      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Quantity</span>
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

      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Total sell price</span>
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

      {/* Stashed inputs list */}
      {openEntries.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Select what was consumed
            <span className="ml-2 text-white/25">(optional)</span>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
            {openEntries.map((entry, i) => {
              const checked = consumedIds.has(entry.id);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => toggleConsumed(entry.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${i !== 0 ? "border-t border-white/5" : ""} ${checked ? "bg-white/5" : "hover:bg-white/4"}`}
                >
                  {/* Checkbox */}
                  <div
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all"
                    style={{
                      borderColor: checked ? theme.line : "rgba(255,255,255,0.2)",
                      background: checked ? theme.gradientFrom : "transparent",
                    }}
                  >
                    {checked && (
                      <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-white">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <img
                    src={mcItemIconUrl(entry.itemId)}
                    alt={entry.itemName}
                    className="h-6 w-6 flex-shrink-0 [image-rendering:pixelated]"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs text-white">{entry.itemName}</div>
                    <div className="font-mono text-[10px] text-white/35">
                      ×{entry.quantity} · {formatCurrency(entry.buyPriceTotal)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {consumedIds.size > 0 && (
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-white/50">
              <span>{consumedIds.size} item{consumedIds.size !== 1 ? "s" : ""} consumed · cost basis</span>
              <span className="tabular-nums">{formatCurrency(totalCost)}</span>
            </div>
          )}
        </div>
      )}

      {/* P&L preview */}
      {previewPnl !== null && (
        <div
          className="mt-3 font-mono text-sm tabular-nums"
          style={{ color: previewPnl >= 0 ? "#4ade80" : "#f87171" }}
        >
          {formatSignedCurrency(previewPnl)} P&amp;L
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
          Confirm sell
        </button>
      </div>
    </form>
  );
}
