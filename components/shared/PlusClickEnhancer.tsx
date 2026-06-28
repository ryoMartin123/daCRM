"use client";

// ─── Plus-button click spin ───────────────────────────────
// Every "+" button gets a 45° spin when clicked. If the click opens a popup
// (modal/dialog/overlay), the "+" HOLDS at 45° — like an open "×" — until that
// popup is removed from the DOM, then rotates back. If no popup opens, it plays a
// quick one-shot spin. Toggle buttons (aria-expanded) manage their own rotation
// via CSS and are skipped.

import { useEffect } from "react";

const PLUS = ".lucide-plus, .lucide-plus-circle, .lucide-circle-plus";
const MODAL = '[role="dialog"], [aria-modal="true"], .fixed.inset-0';

export default function PlusClickEnhancer() {
  useEffect(() => {
    const modals = () => Array.from(document.querySelectorAll(MODAL));

    const onDown = (e: PointerEvent) => {
      const ctrl = (e.target as HTMLElement | null)?.closest?.("button, a") as HTMLElement | null;
      if (!ctrl || ctrl.hasAttribute("aria-expanded")) return;
      const icon = ctrl.querySelector(PLUS) as HTMLElement | null;
      if (!icon) return;
      const before = new Set(modals());
      // After the click handler runs and React renders any popup, decide.
      window.setTimeout(() => {
        const appeared = modals().find(m => !before.has(m) && m.getClientRects().length > 0);
        if (appeared) {
          icon.classList.remove("plus-clicked");
          icon.classList.add("plus-held");          // hold at 45° while the popup is open
          const release = () => { icon.classList.remove("plus-held"); obs.disconnect(); window.clearTimeout(safety); };
          const obs = new MutationObserver(() => { if (!document.body.contains(appeared)) release(); });
          obs.observe(document.body, { childList: true, subtree: true });
          const safety = window.setTimeout(release, 120000); // never get stuck
        } else {
          icon.classList.remove("plus-clicked");
          void icon.offsetWidth;                     // restart the one-shot animation
          icon.classList.add("plus-clicked");
        }
      }, 80);
    };
    const onEnd = (e: AnimationEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.classList?.contains("plus-clicked")) t.classList.remove("plus-clicked");
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("animationend", onEnd, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("animationend", onEnd, true);
    };
  }, []);
  return null;
}
