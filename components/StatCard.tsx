"use client";

type Props = {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "accent";
  accentColor?: string;
};

export default function StatCard({
  label,
  value,
  tone = "default",
  accentColor,
}: Props) {
  let color = "#ffffff";
  if (tone === "positive") color = "#4ade80";
  else if (tone === "negative") color = "#f87171";
  else if (tone === "accent" && accentColor) color = accentColor;

  return (
    <div
      className="group relative rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 ease-out hover:-translate-y-0.5"
      style={{
        boxShadow: accentColor
          ? `inset 0 0 0 1px transparent`
          : undefined,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: accentColor
            ? `inset 0 0 40px -10px ${accentColor}`
            : undefined,
        }}
      />
      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
          {label}
        </div>
        <div
          className="mt-2 font-display text-2xl md:text-3xl"
          style={{ color }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
