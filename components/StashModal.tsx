"use client";

import { useEffect, useRef, useState } from "react";
import type { StashEntry, UserTheme, UserId } from "@/lib/types";
import { USER_THEMES } from "@/lib/types";
import { formatCurrency, formatSignedCurrency, parseDecimalInput } from "@/lib/utils";
import { mcItemIconUrl, searchMcItems, type McItem } from "@/lib/mcItems";

function parseStackInput(raw: string, max: number): number | null {
  const s = raw.trim().toLowerCase();
  const stackMatch = s.match(/^(\d+(?:\.\d+)?)s$/);
  if (stackMatch) {
    const n = Math.round(parseFloat(stackMatch[1]) * 64);
    return Math.min(Math.max(1, n), max);
  }
  const n = parseInt(s, 10);
  if (!isNaN(n)) return Math.min(Math.max(1, n), max);
  return null;
}

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

  const parsedQty = parseDecimalInput(qty) ?? 0;
  const parsedPriceEach = parseDecimalInput(price);
  const totalBuy = parsedPriceEach !== null && parsedQty > 0 ? parsedPriceEach * parsedQty : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { setError("Pick an item first"); return; }
    if (!parsedQty || parsedQty <= 0) { setError("Enter a valid quantity"); return; }
    if (parsedPriceEach === null || parsedPriceEach < 0) { setError("Enter a valid price"); return; }
    const entry: StashEntry = {
      id: newId(),
      itemId: selected.id,
      itemName: selected.name,
      quantity: parsedQty,
      buyPriceTotal: parsedPriceEach * parsedQty,
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
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Price per item</span>
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

      {totalBuy !== null && parsedQty > 1 && (
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-white/45">
          <span>{formatCurrency(parsedPriceEach!)} × {parsedQty} =</span>
          <span className="tabular-nums text-white/70">{formatCurrency(totalBuy)}</span>
        </div>
      )}

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

type OutputRow = { id: string; item: McItem | null; qty: string; price: string };

function newOutputRow(): OutputRow {
  return { id: Math.random().toString(36).slice(2), item: null, qty: "1", price: "" };
}

function SellForm({
  openEntries,
  onClose,
  onConfirm,
  theme,
}: SellProps & { theme: UserTheme }) {
  const [outputs, setOutputs] = useState<OutputRow[]>([newOutputRow()]);
  // Map of entry id → selected quantity to consume (0 = not selected)
  const [consumedQtys, setConsumedQtys] = useState<Map<string, number>>(new Map());
  // Raw text inputs for the qty boxes (so user can type freely without snapping)
  const [qtyInputs, setQtyInputs] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const totalCost = openEntries
    .filter((e) => (consumedQtys.get(e.id) ?? 0) > 0)
    .reduce((sum, e) => {
      const qty = consumedQtys.get(e.id)!;
      const pricePerItem = e.buyPriceTotal / e.quantity;
      return sum + qty * pricePerItem;
    }, 0);

  const totalRevenue = outputs.reduce((sum, o) => {
    const p = parseDecimalInput(o.price);
    const q = parseDecimalInput(o.qty) ?? 1;
    return sum + (p !== null ? p * q : 0);
  }, 0);

  const allPricesFilled = outputs.every((o) => parseDecimalInput(o.price) !== null && o.price.trim() !== "");
  const previewPnl = allPricesFilled ? totalRevenue - totalCost : null;

  const toggleConsumed = (entry: StashEntry) => {
    setConsumedQtys((prev) => {
      const next = new Map(prev);
      if ((next.get(entry.id) ?? 0) > 0) {
        next.delete(entry.id);
      } else {
        next.set(entry.id, entry.quantity);
      }
      return next;
    });
    setQtyInputs((prev) => {
      const next = new Map(prev);
      if ((consumedQtys.get(entry.id) ?? 0) > 0) {
        next.delete(entry.id);
      } else {
        next.set(entry.id, String(entry.quantity));
      }
      return next;
    });
  };

  const setConsumedQty = (id: string, qty: number) => {
    setConsumedQtys((prev) => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(id); else next.set(id, qty);
      return next;
    });
  };

  const updateOutput = (id: string, patch: Partial<OutputRow>) => {
    setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    setError(null);
  };

  const addOutput = () => setOutputs((prev) => [...prev, newOutputRow()]);
  const removeOutput = (id: string) => setOutputs((prev) => prev.filter((o) => o.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    for (const o of outputs) {
      if (!o.item) { setError("Pick an item for each output row"); return; }
      const q = parseDecimalInput(o.qty);
      if (!q || q <= 0) { setError("Enter a valid quantity for each output"); return; }
      const p = parseDecimalInput(o.price);
      if (p === null || p < 0) { setError("Enter a valid sell price for each output"); return; }
    }

    const ts = new Date().toISOString();
    const sellId = newId();

    const outputItems = outputs.map((o) => {
      const q = parseDecimalInput(o.qty)!;
      const priceEach = parseDecimalInput(o.price)!;
      return {
        itemId: o.item!.id,
        itemName: o.item!.name,
        quantity: q,
        sellPriceTotal: priceEach * q,
      };
    });

    const totalSell = outputItems.reduce((s, o) => s + o.sellPriceTotal, 0);

    // Build consumed entries — split if partial qty selected
    const allUpdated: StashEntry[] = [];
    const consumedIds: string[] = [];

    for (const entry of openEntries) {
      const selectedQty = consumedQtys.get(entry.id) ?? 0;
      if (selectedQty <= 0) continue;
      const pricePerItem = entry.buyPriceTotal / entry.quantity;
      const isPartial = selectedQty < entry.quantity;

      if (isPartial) {
        // Consumed fragment
        const consumedId = newId();
        consumedIds.push(consumedId);
        allUpdated.push({
          ...entry,
          id: consumedId,
          quantity: selectedQty,
          buyPriceTotal: selectedQty * pricePerItem,
          sellPriceTotal: 0,
          sellTime: ts,
          consumedBySellId: sellId,
        });
        // Remaining fragment — updates original entry in place
        allUpdated.push({
          ...entry,
          quantity: entry.quantity - selectedQty,
          buyPriceTotal: (entry.quantity - selectedQty) * pricePerItem,
        });
      } else {
        // Full consume — mark original
        consumedIds.push(entry.id);
        allUpdated.push({
          ...entry,
          sellPriceTotal: 0,
          sellTime: ts,
          consumedBySellId: sellId,
        });
      }
    }

    // Primary display item = first output
    const primary = outputs[0]!;
    const sellEntry: StashEntry = {
      id: sellId,
      itemId: primary.item!.id,
      itemName: primary.item!.name,
      quantity: parseDecimalInput(primary.qty)!,
      buyPriceTotal: totalCost,
      buyTime: ts,
      sellPriceTotal: totalSell,
      sellTime: ts,
      outputItems,
      consumedEntryIds: consumedIds,
    };

    onConfirm(sellEntry, allUpdated);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Stash</div>
      <h2 className="mt-1 font-display text-2xl text-white">Sell stashed</h2>

      {/* Output rows */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            What you&apos;re selling
          </span>
          <button
            type="button"
            onClick={addOutput}
            className="font-mono text-[10px] uppercase tracking-[0.15em] transition-colors"
            style={{ color: theme.line }}
          >
            + Add output
          </button>
        </div>

        <div className="space-y-2">
          {outputs.map((row, i) => (
            <div key={row.id} className="rounded-xl border border-white/10 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">Output {i + 1}</span>
                {outputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOutput(row.id)}
                    className="font-mono text-[10px] text-white/30 hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="mt-2">
                <ItemSearch
                  value={row.item}
                  onChange={(item) => updateOutput(row.id, { item })}
                  placeholder="Search items…"
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div
                  className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 focus-within:border-white/35"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={row.qty}
                    onChange={(e) => updateOutput(row.id, { qty: e.target.value })}
                    placeholder="Qty"
                    className="w-full bg-transparent font-display text-base text-white outline-none placeholder:text-white/20"
                  />
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 focus-within:border-white/35"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <span className="font-display text-base text-white/40">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Per item"
                    value={row.price}
                    onChange={(e) => updateOutput(row.id, { price: e.target.value })}
                    className="w-full bg-transparent font-display text-base text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </div>
              {(() => {
                const q = parseDecimalInput(row.qty) ?? 0;
                const p = parseDecimalInput(row.price);
                if (p !== null && q > 1) {
                  return (
                    <div className="mt-1.5 flex justify-between font-mono text-[10px] text-white/40">
                      <span>{formatCurrency(p)} × {q}</span>
                      <span className="tabular-nums text-white/60">{formatCurrency(p * q)}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ))}
        </div>

        {outputs.length > 1 && allPricesFilled && (
          <div className="mt-2 flex justify-between font-mono text-[10px] text-white/40">
            <span>Total revenue</span>
            <span className="tabular-nums">{formatCurrency(totalRevenue)}</span>
          </div>
        )}
      </div>

      {/* Stashed inputs list */}
      {openEntries.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Select what was consumed
            <span className="ml-2 text-white/25">(optional)</span>
          </div>
          <div className="rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
            {openEntries.map((entry, i) => {
              const selectedQty = consumedQtys.get(entry.id) ?? 0;
              const checked = selectedQty > 0;
              const pricePerItem = entry.buyPriceTotal / entry.quantity;

              return (
                <div
                  key={entry.id}
                  className={`${i !== 0 ? "border-t border-white/5" : ""}`}
                >
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => toggleConsumed(entry)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${checked ? "bg-white/5" : "hover:bg-white/[0.04]"}`}
                  >
                    <div
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all"
                      style={{
                        borderColor: checked ? theme.line : "rgba(255,255,255,0.2)",
                        background: checked ? theme.gradientFrom : "transparent",
                      }}
                    >
                      {checked && (
                        <svg viewBox="0 0 10 8" className="h-2.5 w-2.5">
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

                  {/* Slider — expands when checked */}
                  {(() => {
                    const rawInput = qtyInputs.get(entry.id) ?? String(entry.quantity);
                    const stackMatch = rawInput.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)s$/);
                    const stackPreviewQty = stackMatch ? Math.round(parseFloat(stackMatch[1]) * 64) : null;
                    const clampedPreview = stackPreviewQty !== null ? Math.min(stackPreviewQty, entry.quantity) : null;
                    return (
                      <div
                        className="overflow-hidden transition-all duration-300 ease-out"
                        style={{ maxHeight: checked ? "110px" : "0px" }}
                      >
                        <div className="px-4 pb-3 pt-1">
                          <input
                            type="range"
                            min={1}
                            max={entry.quantity}
                            step={1}
                            value={selectedQty || entry.quantity}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setConsumedQty(entry.id, n);
                              setQtyInputs((prev) => new Map(prev).set(entry.id, String(n)));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full accent-current"
                            style={{ accentColor: theme.line }}
                          />
                          <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-white/40">
                            <span className="tabular-nums">×1</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={rawInput}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setQtyInputs((prev) => new Map(prev).set(entry.id, raw));
                                // Only commit if it's a plain number (not mid-typing "s")
                                const parsed = parseStackInput(raw, entry.quantity);
                                if (parsed !== null && !raw.trim().toLowerCase().endsWith("s")) {
                                  setConsumedQty(entry.id, parsed);
                                }
                              }}
                              onBlur={(e) => {
                                const parsed = parseStackInput(e.target.value, entry.quantity);
                                if (parsed !== null) {
                                  setConsumedQty(entry.id, parsed);
                                  setQtyInputs((prev) => new Map(prev).set(entry.id, String(parsed)));
                                } else {
                                  // Reset to current valid qty
                                  setQtyInputs((prev) => new Map(prev).set(entry.id, String(selectedQty || entry.quantity)));
                                }
                              }}
                              className="w-16 rounded border border-white/15 bg-white/5 px-2 py-0.5 text-center text-white/80 outline-none focus:border-white/30"
                            />
                            <span className="tabular-nums">×{entry.quantity}</span>
                          </div>
                          {/* Stack preview or cost */}
                          <div className="mt-1 text-center font-mono text-[10px] tabular-nums text-white/30">
                            {clampedPreview !== null
                              ? <>{stackMatch![1]}s = ×{clampedPreview} · {formatCurrency(clampedPreview * pricePerItem)}</>
                              : formatCurrency((selectedQty || entry.quantity) * pricePerItem)
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {consumedQtys.size > 0 && (
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-white/50">
              <span>{consumedQtys.size} consumed · cost basis</span>
              <span className="tabular-nums">{formatCurrency(totalCost)}</span>
            </div>
          )}
        </div>
      )}

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
