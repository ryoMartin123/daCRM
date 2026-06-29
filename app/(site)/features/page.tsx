import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero, Section, CtaGroup } from "@/components/site/ui";
import FinalCta from "@/components/site/sections/FinalCta";
import { PRODUCT_AREAS, OPERATIONS_AREAS } from "@/components/site/nav";

export const metadata: Metadata = {
  title: "Features — Routiqa",
  description: "Explore the major areas of Routiqa: CRM & jobs, dispatch & routing, technician mobile, marketing automation, analytics, payments, documents, inventory, HR, and field visibility.",
};

const areaHref = (id: string) => (id === "overview" ? "/product" : `/product#${id}`);

function Group({ label, areas }: { label: string; areas: typeof PRODUCT_AREAS }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{label}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {areas.filter(a => a.id !== "overview").map(a => (
          <Link key={a.id} href={areaHref(a.id)} className="group rounded-2xl p-5 flex items-start gap-4 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-soft-bg)" }}><a.icon className="w-5 h-5" style={{ color: "var(--accent-text)" }} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {a.title} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-text)" }} />
              </span>
              <span className="block mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a.blurb}.</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything Routiqa does, in one place"
        sub="The major areas of the platform — explore any one to see how it connects to the rest."
      >
        <CtaGroup />
      </PageHero>
      <Section>
        <div className="space-y-12">
          <Group label="Product" areas={PRODUCT_AREAS} />
          <Group label="Operations" areas={OPERATIONS_AREAS} />
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
