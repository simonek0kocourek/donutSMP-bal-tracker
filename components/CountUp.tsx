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
  const [display, setDisplay] = useState<number>(0);
  const frameRef = useRef<number | null>(null);
  const prevValueRef = useRef<number>(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    const from = mountedRef.current ? prevValueRef.current : 0;
    mountedRef.current = true;
    prevValueRef.current = value;

    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
        frameRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {format(display)}
    </span>
  );
}
