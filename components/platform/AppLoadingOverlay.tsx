"use client";

// ─── App loading overlay ──────────────────────────────────
// Mounted once inside each app's shell, so it fires when you ENTER an app
// (switching apps remounts the shell) but not on navigation within an app.
// Unlike a Suspense loading.tsx fallback, this is self-controlled: it holds for
// a minimum duration so the transition never flickers, then fades out smoothly
// and unmounts. Pure timers + CSS — matches the CRM's minimal loader style.

import { useEffect, useState } from "react";
import AppLoading from "@/components/platform/AppLoading";
import type { PlatformAppId } from "@/lib/platform/apps";

const MIN_VISIBLE_MS = 900; // guaranteed on-screen time before fading
const FADE_MS = 500; // fade-out duration

export default function AppLoadingOverlay({ appId, label }: { appId?: PlatformAppId; label?: string }) {
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), MIN_VISIBLE_MS);
    const t2 = setTimeout(() => setDone(true), MIN_VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100]"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <AppLoading appId={appId} label={label} />
    </div>
  );
}
