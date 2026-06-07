// Project phases — the milestones that drive the vertical progress viewer.
// Persisted per project in localStorage (pre-Supabase), mirroring the other
// runtime stores. A project's progress = completed phases / total phases.

export type PhaseStatus = "upcoming" | "in_progress" | "done";

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  status: PhaseStatus;
  order: number;
  targetDate?: string;
  note?: string;
}

const PHASES_KEY = "crm-project-phases";
let _phases: Record<string, ProjectPhase[]> | null = null;

function store(): Record<string, ProjectPhase[]> {
  if (_phases) return _phases;
  if (typeof window === "undefined") return {};
  try { const raw = localStorage.getItem(PHASES_KEY); _phases = raw ? JSON.parse(raw) : {}; }
  catch { _phases = {}; }
  return _phases!;
}
function persist(): void {
  if (typeof window === "undefined" || !_phases) return;
  try { localStorage.setItem(PHASES_KEY, JSON.stringify(_phases)); } catch { /* ignore */ }
}

export function getPhases(projectId: string): ProjectPhase[] {
  return (store()[projectId] ?? []).slice().sort((a, b) => a.order - b.order);
}

export function savePhases(projectId: string, phases: ProjectPhase[]): void {
  const s = store();
  s[projectId] = phases.map((p, i) => ({ ...p, projectId, order: i + 1 }));
  persist();
}

// Seed a project's phases from a template's ordered phase names (first = in
// progress, rest upcoming). Used by the project wizard when a template is picked.
export function applyTemplatePhases(projectId: string, names: string[]): void {
  const phases: ProjectPhase[] = names.map((name, i) => ({
    id: `ph-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
    projectId, name, order: i + 1,
    status: i === 0 ? "in_progress" : "upcoming",
  }));
  savePhases(projectId, phases);
}

export function phaseProgress(projectId: string): { total: number; done: number; pct: number } {
  const phases = getPhases(projectId);
  const done = phases.filter(p => p.status === "done").length;
  const pct = phases.length ? Math.round((done / phases.length) * 100) : 0;
  return { total: phases.length, done, pct };
}

export function newPhaseId(): string { return `ph-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }
