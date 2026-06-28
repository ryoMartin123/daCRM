// ─── Required-photo checklist ─────────────────────────────
// Which photos a job should have, by job type. Built on the existing photo
// categories (Settings → Photo Categories carry a `requiredByDefault` flag +
// `appliesTo`), with a few job-type-specific extras. Drives the field checklist
// so techs know what to capture and managers can verify completeness.

import { getPhotoCategories } from "@/lib/photo-categories/data";
import { getFiles } from "./data";
import type { JobType } from "@/lib/jobs/data";

// Extra required categories beyond the global "required by default" Job set.
const TYPE_EXTRAS: Partial<Record<JobType, string[]>> = {
  installation: ["equipment_plate"],
  replacement:  ["equipment_plate"],
  warranty:     ["equipment_plate", "warranty"],
  maintenance:  ["equipment_plate"],
  inspection:   ["issue_found"],
};

export function requiredCategoriesForJobType(jobType: JobType): string[] {
  const base = getPhotoCategories()
    .filter(c => c.active && c.requiredByDefault && c.appliesTo.includes("Job"))
    .map(c => c.key);
  return Array.from(new Set([...base, ...(TYPE_EXTRAS[jobType] ?? [])]));
}

export interface ChecklistItem { key: string; name: string; color: string; captured: boolean }

export function getJobPhotoChecklist(jobId: string, jobType: JobType): ChecklistItem[] {
  const cats = getPhotoCategories();
  const jobFiles = getFiles({ jobId });
  return requiredCategoriesForJobType(jobType).map(key => {
    const cat = cats.find(c => c.key === key);
    return { key, name: cat?.name ?? key, color: cat?.color ?? "#6b7280", captured: jobFiles.some(f => f.categoryKey === key) };
  });
}

export function checklistProgress(items: ChecklistItem[]): { done: number; total: number } {
  return { done: items.filter(i => i.captured).length, total: items.length };
}
