import { Section, SectionHeading } from "@/components/site/ui";
import { Unplug } from "lucide-react";

const DISCONNECTED = [
  "CRM", "Dispatch board", "Maps & routing", "Team chat", "Marketing tool",
  "Payment system", "Accounting", "Documents", "Spreadsheets", "Inventory",
];

export default function ProblemSection() {
  return (
    <Section className="border-b" >
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <SectionHeading
          eyebrow="The problem"
          title="Service businesses are forced to run on disconnected tools"
          sub="A CRM here, a dispatch board there, maps in another tab, chat in another app, plus marketing, payments, documents, and spreadsheets holding it all together. Work falls through the gaps, data never lines up, and no one has the full picture."
        />
        <div className="relative rounded-2xl p-6 site-grid-bg" style={{ border: "1px solid var(--border-subtle)" }}>
          <div className="flex flex-wrap gap-2.5">
            {DISCONNECTED.map((t, i) => (
              <span key={t} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border)", color: "var(--text-secondary)", opacity: 0.6 + (i % 3) * 0.12, transform: `rotate(${(i % 2 ? 1 : -1) * (i % 3)}deg)` }}>
                <Unplug className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                {t}
              </span>
            ))}
          </div>
          <p className="mt-5 text-xs" style={{ color: "var(--text-muted)" }}>Ten tools. None of them talking to each other.</p>
        </div>
      </div>
    </Section>
  );
}
