"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function CountUp({
  value,
  format,
  duration = 900,
  className,
  style,
}: Props) {
  const [display, setDisplay] = useState<number>(value);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(value);
  const toRef = useRef<number>(value);

  useEffect(() => {
    if (display === value) return;
    fromRef.current = display;
    toRef.current = value;
    startRef.current = performance.now();
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current =
        fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplay(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(toRef.current);
        frameRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration, display]);

  return (
    <span className={className} style={style}>
      {format(display)}
    </span>
  );
}
