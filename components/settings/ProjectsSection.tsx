"use client";

// ─── Settings · Projects ──────────────────────────────────
// Project Maps are the single configurable surface here — they're strong enough
// to drive each project's workflow on their own. Stages, types, and defaults are
// fixed CRM defaults (lib/projects/settings) and are not editable.

import ProjectMapsEditor from "@/components/settings/ProjectMapsEditor";

export default function ProjectsSection() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Project Maps</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Build the connected workflow each project runs on. Stages, types, and defaults ship as built-in CRM defaults — Maps are where you customize.
        </p>
      </div>
      <ProjectMapsEditor />
    </div>
  );
}
