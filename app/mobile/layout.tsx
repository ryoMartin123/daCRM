// ─── Mobile shell ─────────────────────────────────────────
// The field PWA layout: NO desktop sidebar/topbar. MobileShell picks the nav
// experience by role (technician bottom nav vs full-permissions app drawer),
// inside the root layout (theme, fonts) so it's the same Routiqa.

import MobileShell from "@/components/mobile/MobileShell";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
