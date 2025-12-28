import { notFound } from "next/navigation";
import { BookingCTASection } from "../../../../components/sections/BookingCTASection";
import { CaseStudiesCarouselSection } from "../../../../components/sections/CaseStudiesCarouselSection";
import { FeaturedCasesSection } from "../../../../components/sections/FeaturedCasesSection";
import { LogoMarqueeSection } from "../../../../components/sections/LogoMarqueeSection";
import { ProcessStepsSection } from "../../../../components/sections/ProcessStepsSection";
import { ServiceBenefitsSection } from "../../../../components/sections/ServiceBenefitsSection";
import { ServiceIntroSection } from "../../../../components/sections/ServiceIntroSection";
import { services } from "../../../../lib/site-content";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  return (
    <main className="bg-background">
      <ServiceIntroSection eyebrow={service.eyebrow} title={service.title} description={service.description} />

      <LogoMarqueeSection
        title="Trusted by innovators worldwide"
        logos={[
          { name: "Logo 1" },
          { name: "Logo 2" },
          { name: "Logo 3" },
          { name: "Logo 4" },
          { name: "Logo 5" },
          { name: "Logo 6" },
        ]}
      />

      <CaseStudiesCarouselSection
        title="Selected work"
        items={[
          { title: "Case study one", subtitle: "Branding" },
          { title: "Case study two", subtitle: "Development" },
          { title: "Case study three", subtitle: "Marketing" },
        ]}
      />

      <ServiceBenefitsSection
        eyebrow="Benefits"
        title="What this service unlocks"
        description="Replace these benefit statements with outcomes that matter to your audience."
        benefits={[
          { title: "Clarity", body: "Clear positioning and messaging that stays consistent across channels." },
          { title: "Consistency", body: "A system that keeps your brand cohesive as you scale." },
          { title: "Speed", body: "Assets and patterns that reduce time-to-launch for new initiatives." },
          { title: "Conversion", body: "Better structure and storytelling that supports action." },
        ]}
      />

      <FeaturedCasesSection
        eyebrow="Cases"
        title="Featured cases"
        description="Swap these featured cases for your own portfolio items."
      />

      <ProcessStepsSection
        theme="light"
        eyebrow="Our process"
        title="A framework that drives excellence"
        description="A clear, repeatable process that keeps projects moving while preserving quality."
        steps={[
          { title: "Insight", body: "Understand goals, constraints, and what success looks like." },
          { title: "Strategy", body: "Define the plan, scope, and the path to execution." },
          { title: "Build", body: "Design and build with performance and accessibility in mind." },
          { title: "Launch", body: "QA, ship, and monitor for stability and outcomes." },
          { title: "Support", body: "Iterate with data, improvements, and ongoing optimisation." },
        ]}
      />

      <BookingCTASection
        eyebrow="Next step"
        title="Ready to get started?"
        description="Use this block as your primary conversion moment on service pages."
        primaryCtaLabel="Book a call"
        primaryCtaHref="/en/contact"
      />
    </main>
  );
}
