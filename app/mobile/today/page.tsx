"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Navigation, ChevronRight, CheckSquare, Briefcase, Route, Play, AlarmClock } from "lucide-react";
import MobileHeader from "@/components/mobile/MobileHeader";
import { Section, Card, JobCard, StatusChip, EmptyState, ACCENT, prettyType, areaOf } from "@/components/mobile/ui";
import { getCurrentTech, getMyJobsByBucket, getCurrentJob, getMyTasks, getClockState, toggleClock, getMobileExperience, type MobileExperience } from "@/lib/mobile/data";
import MobileNavHome from "@/components/mobile/MobileNavHome";

export default function TodayPage() {
  // Computed on mount; the page remounts on navigation so data stays fresh.
  const me = useMemo(() => getCurrentTech(), []);
  const jobs = useMemo(() => getMyJobsByBucket("today"), []);
  const current = useMemo(() => getCurrentJob(), []);
  const tasks = useMemo(() => getMyTasks().slice(0, 3), []);
  const [clock, setClock] = useState<{ in: boolean; since?: string }>({ in: false });
  const [exp, setExp] = useState<MobileExperience>("field");
  useEffect(() => { setClock(getClockState()); setExp(getMobileExperience()); }, []);

  // Broad-access users: the Overview IS the navigation hub.
  if (exp === "full") return <MobileNavHome />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = me?.fullName?.split(" ")[0] ?? "there";
  const onSiteHrs = Math.round(jobs.reduce((s, j) => s + (j.durationMinutes || 0), 0) / 60 * 10) / 10;

  return (
    <div>
      <MobileHeader title={`${greeting}, ${firstName}`} subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        right={<div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: ACCENT }}>{me?.initials}</div>} />

      <div className="px-4 space-y-5 pt-1">
        {/* Clock + route summary */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setClock(toggleClock())} className="rounded-2xl p-3.5 text-left active:scale-[0.99] transition-transform"
            style={{ border: `1px solid ${clock.in ? "#16a34a55" : "var(--border-subtle)"}`, backgroundColor: clock.in ? "#16a34a14" : "var(--bg-surface)", boxShadow: "var(--shadow-glow)" }}>
            <Clock className="w-5 h-5 mb-2" style={{ color: clock.in ? "#16a34a" : "var(--text-muted)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{clock.in ? "Clocked in" : "Clocked out"}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{clock.in ? "Tap to clock out" : "Tap to clock in"}</p>
          </button>
          <Card className="p-3.5">
            <Route className="w-5 h-5 mb-2" style={{ color: ACCENT }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{jobs.length} stop{jobs.length === 1 ? "" : "s"} today</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>~{onSiteHrs}h on site</p>
          </Card>
        </div>

        {/* Current / next job hero */}
        {current ? (
          <Section title={current.status === "in_progress" || current.status === "en_route" ? "Current job" : "Next job"}>
            <Card className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-secondary)" }}>{current.scheduledTime}</span>
                  <StatusChip status={current.status} size="md" />
                </div>
                <p className="mt-1.5 text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{current.customerName}</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{prettyType(current.type)} · {areaOf(current.propertyAddress) || "No address"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 pt-0">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(current.propertyAddress || "")}`} target="_blank" rel="noreferrer"
                  className="min-h-[48px] rounded-xl flex items-center justify-center gap-2 text-sm font-semibold active:scale-[0.99] transition-transform"
                  style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                  <Navigation className="w-4 h-4" /> Directions
                </a>
                <Link href={`/mobile/jobs/${current.id}`} className="min-h-[48px] rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white active:scale-[0.99] transition-transform" style={{ backgroundColor: ACCENT }}>
                  <Play className="w-4 h-4" /> Open job
                </Link>
              </div>
            </Card>
          </Section>
        ) : (
          <Card><EmptyState icon={Briefcase} title="No jobs scheduled today" hint="Enjoy the quiet — or check upcoming work." /></Card>
        )}

        {/* Today's schedule */}
        {jobs.length > 0 && (
          <Section title="Today's schedule" action={<Link href="/mobile/jobs" className="text-xs font-semibold" style={{ color: ACCENT }}>All jobs</Link>}>
            <div className="space-y-2.5">{jobs.map(j => <JobCard key={j.id} job={j} />)}</div>
          </Section>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <Section title="My tasks" action={<Link href="/mobile/tasks" className="text-xs font-semibold" style={{ color: ACCENT }}>All</Link>}>
            <Card>
              {tasks.map((t, i) => (
                <Link key={t.id} href="/mobile/tasks" className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                  <CheckSquare className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                    {t.dueDate && <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}><AlarmClock className="w-3 h-3" /> Due {t.dueDate}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                </Link>
              ))}
            </Card>
          </Section>
        )}
      </div>
    </div>
  );
}
