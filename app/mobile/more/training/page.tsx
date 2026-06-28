"use client";

import { GraduationCap, CheckCircle2, PlayCircle, Circle, AlarmClock } from "lucide-react";
import MobileHeader from "@/components/mobile/MobileHeader";
import { Card, Section } from "@/components/mobile/ui";
import { getTraining, type TrainingModule } from "@/lib/mobile/portal";

const STATUS: Record<TrainingModule["status"], { label: string; color: string; icon: React.ElementType }> = {
  complete:    { label: "Complete",    color: "#16a34a", icon: CheckCircle2 },
  in_progress: { label: "In progress", color: "#f59e0b", icon: PlayCircle },
  not_started: { label: "Not started", color: "#6b7280", icon: Circle },
};

export default function TrainingPage() {
  const modules = getTraining();
  const done = modules.filter(m => m.status === "complete").length;

  return (
    <div>
      <MobileHeader title="Training" subtitle={`${done} of ${modules.length} complete`} back />
      <div className="px-4 space-y-5">
        <Section title="Assigned to you">
          <div className="space-y-2.5">
            {modules.map(m => {
              const s = STATUS[m.status]; const Icon = s.icon;
              return (
                <Card key={m.id} className="p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.color + "1a" }}><GraduationCap className="w-4 h-4" style={{ color: s.color }} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.title}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: s.color }}>
                        <Icon className="w-3.5 h-3.5" /> {s.label}
                        {m.due && m.status !== "complete" && <span className="inline-flex items-center gap-1 ml-1" style={{ color: "var(--text-muted)" }}><AlarmClock className="w-3 h-3" /> Due {m.due}</span>}
                      </p>
                    </div>
                  </div>
                  {m.status !== "complete" && (
                    <div className="h-1.5 rounded-full mt-2.5" style={{ backgroundColor: "var(--bg-input)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${m.progress}%`, backgroundColor: s.color }} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}
