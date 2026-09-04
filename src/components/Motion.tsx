"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = ".paper, .stamp, .sketch, .hand, .tag, .ink-bar, .draw, .rv";

/**
 * Scroll-in motion for the whole site. Elements matching SELECTOR start hidden (see globals.css, under `html.js`)
 * and receive `is-in` when they enter the viewport, staggered by their position on screen.
 * New elements (route changes, answers, photos) are picked up by a MutationObserver.
 */
export default function Motion() {
  const path = usePathname();
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      vis.forEach((e, k) => {
        const el = e.target as HTMLElement;
        el.style.setProperty("--d", `${Math.min(k * 70, 560)}ms`);
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    const watch = (root: ParentNode) => {
      root.querySelectorAll(SELECTOR).forEach((el) => { if (!seen.has(el)) { seen.add(el); io.observe(el); } });
    };
    watch(document);
    // Safety net: if the observer is slow or unsupported, reveal anything already on screen.
    const reveal = (el: Element) => { (el as HTMLElement).classList.add("is-in"); io.unobserve(el); };
    const fallback = window.setTimeout(() => {
      document.querySelectorAll(SELECTOR).forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom > 0 && r.top < window.innerHeight) reveal(el); });
    }, 1400);
    const mo = new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => { if (n instanceof Element) { if (n.matches(SELECTOR) && !seen.has(n)) { seen.add(n); io.observe(n); } watch(n); } })));
    mo.observe(document.body, { childList: true, subtree: true });

    // Gentle parallax on the margin sketches.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        document.querySelectorAll<HTMLElement>(".sketch").forEach((el, k) => el.style.setProperty("--py", `${(y * (0.04 + (k % 3) * 0.03)).toFixed(1)}px`));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.clearTimeout(fallback); io.disconnect(); mo.disconnect(); window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [path]);
  return null;
}
