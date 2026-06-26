"use client";

import { Delayed, Skeleton, ProjectCardsSkeleton } from "@/components/ui/Skeleton";
import { useSectionCount } from "@/lib/ui/skeleton-count";

// Projects defaults to the Cards view, so its loading state mirrors the big
// command-center cards (not a table) along with the page header + lens toolbar.
// Data-aware: render as many cards as there are projects (0 → shell only).
export default function Loading() {
  const count = useSectionCount("projects");
  return (
    <Delayed>
      <div className="p-6 flex flex-col h-full min-h-0">
        {/* Header — title · view tabs · New Project */}
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-80 rounded" />
          </div>
          <Skeleton className="h-9 w-72 rounded-lg shrink-0" />
          <div className="flex-1 flex justify-end">
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* Lens + bucket tabs (left) · search + filter (right) */}
        <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)}
            <span className="w-px h-5 mx-1" style={{ backgroundColor: "var(--border)" }} />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-16 rounded-lg" />)}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-52 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        {count > 0 && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ProjectCardsSkeleton count={count} />
          </div>
        )}
      </div>
    </Delayed>
  );
}
