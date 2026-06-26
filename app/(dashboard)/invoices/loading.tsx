"use client";

import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSectionCount } from "@/lib/ui/skeleton-count";

// Data-aware loading: render as many skeleton rows as the section actually has
// (1 record → 1 skeleton; 0 → shell only), never a hardcoded bulk preview.
export default function Loading() {
  const count = useSectionCount("invoices");
  return <PageSkeleton variant="table" count={count} />;
}
