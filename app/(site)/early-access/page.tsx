import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/site/ui";
import LeadForm from "@/components/site/LeadForm";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Request Early Access — Routiqa",
  description: "Request early access to Routiqa — the operating system for service businesses.",
};

const POINTS = [
  "Be among the first to run your operation on Routiqa",
  "Onboarding help to set it up around your business",
  "A direct line to our team as you get started",
  "Founding terms for early customers",
];

export default function EarlyAccessPage() {
  return (
    <Section className="site-hero-bg">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div>
          <SectionHeading
            eyebrow="Early Access"
            title="Get early access to Routiqa"
            sub="Tell us a little about your business and we'll be in touch with next steps. No commitment — just a conversation about running your operation on one platform."
          />
          <ul className="mt-8 space-y-3.5">
            {POINTS.map(p => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--accent-text)" }} />
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <LeadForm variant="early-access" />
      </div>
    </Section>
  );
}
