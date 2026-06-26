"use client";

import { PageSkeleton } from "@/components/ui/Skeleton";
import { useSectionCount } from "@/lib/ui/skeleton-count";

// Data-aware loading: the pipeline shows skeleton cards spread to match the real
// lead count (0 → column shells only), never a hardcoded bulk preview.
export default function Loading() {
  const count = useSectionCount("leads");
  return <PageSkeleton variant="board" count={count} />;
}
