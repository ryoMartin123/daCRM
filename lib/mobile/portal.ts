// ─── Mobile self-service (My Portal) data ─────────────────
// The content behind the More → Portal / Time Card / Training / Documents
// screens. Mock for now (the desktop portal is the same), but shaped so it can
// read real HR / timesheet / LMS data later. Deterministic so it's stable.

export interface Shift { id: string; date: string; label: string; in: string; out: string; hours: number }
export interface TrainingModule { id: string; title: string; status: "complete" | "in_progress" | "not_started"; progress: number; due?: string }
export interface PortalDoc { id: string; title: string; category: string; updated: string }

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export function getTimecard(): { weekHours: number; daysWorked: number; entries: Shift[] } {
  const now = new Date();
  const entries: Shift[] = days.map((d, i) => {
    const dt = new Date(now); dt.setDate(now.getDate() - (now.getDay() - 1) + i);
    const hours = 7.5 + (i % 3) * 0.5;
    return { id: `sh-${i}`, date: `${dt.getMonth() + 1}/${dt.getDate()}`, label: d, in: "7:30 AM", out: i === 4 ? "3:30 PM" : "4:00 PM", hours };
  });
  const past = entries.filter((_, i) => i <= now.getDay() - 1);
  return { weekHours: past.reduce((s, e) => s + e.hours, 0), daysWorked: Math.max(0, past.length), entries };
}

export function getTraining(): TrainingModule[] {
  return [
    { id: "t1", title: "Ladder & fall safety", status: "complete", progress: 100 },
    { id: "t2", title: "EPA 608 refresher", status: "in_progress", progress: 60, due: "Jun 30" },
    { id: "t3", title: "Customer communication", status: "in_progress", progress: 25, due: "Jul 12" },
    { id: "t4", title: "New thermostat install", status: "not_started", progress: 0, due: "Jul 20" },
    { id: "t5", title: "Defensive driving", status: "not_started", progress: 0 },
  ];
}

export function getDocuments(): PortalDoc[] {
  return [
    { id: "d1", title: "Employee handbook", category: "HR", updated: "May 2026" },
    { id: "d2", title: "HVAC install SOP", category: "SOPs", updated: "Apr 2026" },
    { id: "d3", title: "Refrigerant handling policy", category: "Safety", updated: "Mar 2026" },
    { id: "d4", title: "Truck inventory checklist", category: "Field", updated: "Jun 2026" },
    { id: "d5", title: "Warranty & callback policy", category: "SOPs", updated: "Feb 2026" },
    { id: "d6", title: "Uniform & conduct policy", category: "HR", updated: "Jan 2026" },
  ];
}
