"use client";

// Renders a "coming soon" panel for a nav-only sub-section, titled from the
// app's nav config so every sidebar link lands somewhere real.

import { useParams } from "next/navigation";
import { ComingSoon } from "@/components/platform/ui";
import { sectionLabel } from "@/lib/platform/nav";
import type { PlatformAppId } from "@/lib/platform/apps";

export default function SectionPlaceholder({ appId }: { appId: PlatformAppId }) {
  const params = useParams();
  const slug = String(params?.section ?? "");
  const label =
    sectionLabel(appId, slug) ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <ComingSoon title={label} />;
}
