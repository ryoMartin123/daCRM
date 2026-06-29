import type { Metadata } from "next";
import { PageHero, Section, SectionHeading, PrimaryCta, GhostCta } from "@/components/site/ui";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Design Partners — Routiqa",
  description: "Join the Routiqa Design Partner Program: early access, direct influence on the roadmap, and founding terms for a small group of service businesses.",
};

const LOOKING_FOR = [
  "An established service business (HVAC, roofing, plumbing, electrical, restoration, property, or B2B service)",
  "A team that runs real daily operations — dispatch, field work, and back office",
  "Willingness to share feedback and shape the product with our team",
  "Interest in moving off disconnected tools onto one platform",
];

const STEPS = [
  { n: "01", t: "Intro call", b: "We learn how your business runs today and where the gaps are." },
  { n: "02", t: "Onboarding", b: "We set Routiqa up around your operation with sensible defaults." },
  { n: "03", t: "Build together", b: "You use Routiqa day-to-day and shape the roadmap with direct input." },
];

export default function DesignPartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Design Partner Program"
        title="Build Routiqa with us"
        sub="We're partnering with a small group of service businesses to shape Routiqa around real operations — with early access, direct roadmap input, and founding terms."
      >
        <div className="flex flex-wrap justify-center gap-3">
          <PrimaryCta href="/early-access">Become a Design Partner</PrimaryCta>
          <GhostCta href="/contact">Talk to us</GhostCta>
        </div>
      </PageHero>

      <Section className="border-b">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <SectionHeading eyebrow="Who it's for" title="What we're looking for" />
            <ul className="mt-6 space-y-4">
              {LOOKING_FOR.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--accent-text)" }} />
                  <span className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="How it works" title="A simple, hands-on process" />
            <div className="mt-6 space-y-4">
              {STEPS.map(s => (
                <div key={s.n} className="flex gap-4 rounded-2xl p-5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                  <span className="text-lg font-bold tabular-nums" style={{ color: "var(--accent-text)" }}>{s.n}</span>
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{s.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
