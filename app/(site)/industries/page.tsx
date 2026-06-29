import type { Metadata } from "next";
import { PageHero, Section, CtaGroup } from "@/components/site/ui";
import FinalCta from "@/components/site/sections/FinalCta";
import { INDUSTRIES } from "@/components/site/nav";
import { Wind, Home, Droplets, Zap, ShieldAlert, Building2, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Industries — Routiqa",
  description: "Routiqa is built for service businesses: HVAC, roofing, plumbing, electrical, restoration, property maintenance, and B2B service operations.",
};

const ICONS = [Wind, Home, Droplets, Zap, ShieldAlert, Building2, Briefcase];

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Built for the way service businesses work"
        sub="Routiqa adapts to your trade with strong defaults for pipelines, job stages, agreements, and workflows — then customizes as you grow."
      >
        <CtaGroup />
      </PageHero>
      <Section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRIES.map((ind, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={ind.name} className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
                <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--accent-soft-bg)" }}><Icon className="w-5 h-5" style={{ color: "var(--accent-text)" }} /></span>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{ind.name}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ind.blurb}</p>
              </div>
            );
          })}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
