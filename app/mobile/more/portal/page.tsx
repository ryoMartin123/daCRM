"use client";

import { useMemo } from "react";
import MobileHeader from "@/components/mobile/MobileHeader";
import MyPortalContent from "@/components/mobile/MyPortalContent";
import { getCurrentTech } from "@/lib/mobile/data";

export default function MyPortalPage() {
  const me = useMemo(() => getCurrentTech(), []);
  const firstName = me?.fullName?.split(" ")[0] ?? "there";

  return (
    <div>
      <MobileHeader title="My Portal" subtitle={`Hi ${firstName} — your self-service hub`} back />
      <MyPortalContent />
    </div>
  );
}
