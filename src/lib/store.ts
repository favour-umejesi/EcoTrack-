"use client";
import { useSyncExternalStore } from "react";

/** A tiny localStorage-backed store so guest data survives reloads without any backend. */
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
if (typeof window !== "undefined") window.addEventListener("storage", emit);

export function readKey(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writeKey(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
  emit();
}
export function useLocalValue(key: string, fallback: string): string {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => readKey(key) ?? fallback,
    () => fallback,
  );
}

const never = () => () => {};
/** False on the server and during hydration, true once the browser is in charge. Lets pages act on localStorage safely. */
export function useHydrated(): boolean {
  return useSyncExternalStore(never, () => true, () => false);
}
