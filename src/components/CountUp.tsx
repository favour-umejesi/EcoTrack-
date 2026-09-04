"use client";
import { useEffect, useRef, useState } from "react";

/** Tweens from the previously shown value to the new one, so totals count up on load and glide when inputs change. */
export default function CountUp({ value, format = (v) => String(Math.round(v)), duration = 900 }: { value: number; format?: (v: number) => string; duration?: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) { setShown(value); from.current = value; return; }
    const start = performance.now(), a = from.current, b = value;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration), e = 1 - Math.pow(1 - p, 3);
      const v = a + (b - a) * e;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = a + (b - a) * 0.999; };
  }, [value, duration]);
  return <>{format(Math.round(shown))}</>;
}
