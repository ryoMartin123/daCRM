"use client";

// ─── Mobile shell ─────────────────────────────────────────
// Picks the navigation experience by role. Field staff get the floating bottom
// tab bar. Broad-access users get NO hamburger/drawer — their Overview screen is
// the navigation, with a floating search + quick-actions command bar at the
// bottom. Both share the Routiqa design system.

import { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import MobileCommandBar from "./MobileCommandBar";
import { getMobileExperience, type MobileExperience } from "@/lib/mobile/data";

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const [exp, setExp] = useState<MobileExperience>("field");
  useEffect(() => { setExp(getMobileExperience()); }, []);

  if (exp === "full") {
    return (
      <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>
        <main className="flex-1" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)" }}>{children}</main>
        <MobileCommandBar />
      </div>
    );
  }

  // Technician field experience — floating bottom nav.
  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>
      <main className="flex-1" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 92px)" }}>{children}</main>
      <BottomNav />
    </div>
  );
}
