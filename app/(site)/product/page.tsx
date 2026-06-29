import type { Metadata } from "next";
import { PageHero } from "@/components/site/ui";
import ProductShowcase from "@/components/site/sections/ProductShowcase";
import PlatformGrid from "@/components/site/sections/PlatformGrid";
import WhyRoutiqa from "@/components/site/sections/WhyRoutiqa";
import FinalCta from "@/components/site/sections/FinalCta";
import { CtaGroup } from "@/components/site/ui";
import { OPERATIONS_AREAS } from "@/components/site/nav";

export const metadata: Metadata = {
  title: "Platform — Routiqa",
  description: "The Routiqa platform: CRM, dispatch & routing, technician mobile, marketing automation, analytics, payments, documents, inventory, HR, and field visibility — connected.",
};

export default function ProductPage() {
  return (
    <>
      <PageHero
        eyebrow="The platform"
        title="One platform for the entire service operation"
        sub="Routiqa connects the customer-facing surfaces and the back office into a single system — from the first lead to the final invoice, and everything in the field in between."
      >
        <CtaGroup />
      </PageHero>

      <ProductShowcase withIds />

      <PlatformGrid
        areas={OPERATIONS_AREAS}
        anchors
        id="operations"
        eyebrow="Operations"
        title="The back office, connected too"
        sub="Payments, documents, inventory, people, and fleet visibility — the systems that keep the operation running, in the same platform."
      />

      <WhyRoutiqa />
      <FinalCta />
    </>
  );
}
