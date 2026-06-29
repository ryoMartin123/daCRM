import Hero from "@/components/site/sections/Hero";
import ProblemSection from "@/components/site/sections/ProblemSection";
import SolutionSection from "@/components/site/sections/SolutionSection";
import PlatformGrid from "@/components/site/sections/PlatformGrid";
import ProductShowcase from "@/components/site/sections/ProductShowcase";
import WhyRoutiqa from "@/components/site/sections/WhyRoutiqa";
import DesignPartnerSection from "@/components/site/sections/DesignPartnerSection";
import FinalCta from "@/components/site/sections/FinalCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <PlatformGrid />
      <ProductShowcase withIds />
      <WhyRoutiqa />
      <DesignPartnerSection />
      <FinalCta />
    </>
  );
}
