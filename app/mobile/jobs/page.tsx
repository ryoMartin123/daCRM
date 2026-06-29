"use client";

import { useMemo, useState } from "react";
import { Briefcase } from "lucide-react";
import MobileHeader from "@/components/mobile/MobileHeader";
import { JobCard, EmptyState, ACCENT } from "@/components/mobile/ui";
import { getMyJobsByBucket, type JobBucket } from "@/lib/mobile/data";
import { useDataVersion } from "@/lib/sync/useDataVersion";

const TABS: { key: JobBucket; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "followup", label: "Follow-up" },
];

export default function JobsPage() {
  const [tab, setTab] = useState<JobBucket>("today");
  const rev = useDataVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const counts = useMemo(() => Object.fromEntries(TABS.map(t => [t.key, getMyJobsByBucket(t.key).length])) as Record<JobBucket, number>, [rev]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const jobs = useMemo(() => getMyJobsByBucket(tab), [tab, rev]);

  return (
    <div>
      <MobileHeader title="My Jobs" />
      {/* Filter chips — horizontal scroll, thumb-sized */}
      <div className="sticky top-0 z-20 px-4 pb-2 pt-1" style={{ backgroundColor: "var(--bg-page)" }}>
        <div className="flex gap-2 overflow-x-auto thin-scroll-x">
          {TABS.map(t => {
            const on = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className="shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors"
                style={{ backgroundColor: on ? ACCENT : "var(--bg-surface)", color: on ? "#fff" : "var(--text-secondary)", border: `1px solid ${on ? "transparent" : "var(--border-subtle)"}` }}>
                {t.label}{counts[t.key] > 0 && <span className="ml-1.5 tabular-nums" style={{ opacity: 0.7 }}>{counts[t.key]}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-1">
        {jobs.length === 0
          ? <EmptyState icon={Briefcase} title="Nothing here" hint="No jobs in this list right now." />
          : <div className="space-y-2.5">{jobs.map(j => <JobCard key={j.id} job={j} />)}</div>}
      </div>
    </div>
  );
}
