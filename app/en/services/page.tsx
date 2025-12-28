import { RawHtml } from "../../../components/RawHtml";
import { PricingSection } from "../../../components/PricingSection";
import { HeroOrbitSection } from "../../../components/sections/HeroOrbitSection";
import { servicesPageSections } from "../../../lib/valcon-sections";

export default function ServicesPage() {
  return (
    <main className="bg-background">
      <HeroOrbitSection
        eyebrow="What we do"
        title="Services"
        description="Replace this with your own services positioning. This hero is built to match the same layout structure and spacing across breakpoints."
      />
      <PricingSection />
      {servicesPageSections.map((html, idx) => (
        <RawHtml key={idx} html={html} />
      ))}
    </main>
  );
}
