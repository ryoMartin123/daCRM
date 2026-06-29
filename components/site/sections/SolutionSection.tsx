import { Section, SectionHeading } from "@/components/site/ui";
import { Workflow, Database, Zap } from "lucide-react";

const POINTS = [
  { icon: Database, title: "One source of truth", body: "Customers, jobs, estimates, payments, and history live in one record — not scattered across tools." },
  { icon: Workflow, title: "Connected workflows", body: "A booked job flows to dispatch, the technician's phone, invoicing, and reporting automatically." },
  { icon: Zap, title: "Operational by default", body: "Strong defaults out of the box, with the depth to customize as the business grows." },
];

export default function SolutionSection() {
  return (
    <Section className="border-b">
      <SectionHeading
        center
        eyebrow="The solution"
        title="One connected platform for the whole operation"
        sub="Routiqa brings every system a service business runs on into a single platform — so the office, the field, and the back office all work from the same data."
      />
      <div className="mt-12 grid md:grid-cols-3 gap-5">
        {POINTS.map(p => (
          <div key={p.title} className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-glow)" }}>
            <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--accent-soft-bg)" }}><p.icon className="w-5 h-5" style={{ color: "var(--accent-text)" }} /></span>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{p.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
