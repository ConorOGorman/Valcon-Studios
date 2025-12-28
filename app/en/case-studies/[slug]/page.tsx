import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "../../../../components/primitives/Container";
import { Section } from "../../../../components/primitives/Section";
import { Media } from "../../../../components/primitives/Media";
import { RawHtml } from "../../../../components/RawHtml";
import { caseStudies } from "../../../../lib/site-content";
import { casesSections, contactSections } from "../../../../lib/valcon-sections";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cs = caseStudies.find((c) => c.slug === slug);
  if (!cs) notFound();

  return (
    <main className="bg-background">
      <Section className="relative max-lg:pt-[110px] max-lg:pb-[44px] lg:pt-[160px] lg:pb-[90px] overflow-hidden bg-black">
        <div className="absolute inset-0">
          <Media alt={`${cs.title} cover`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <Container className="relative">
          <div className="flex flex-col gap-[12px] lg:gap-[16px] max-w-[980px]">
            <p className="text-[#a8a29d] font-source-code-pro text-[12px] lg:text-[14px] leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
              Case study · {cs.sector}
            </p>
            <h1 className="text-white font-rinter font-medium text-[44px] lg:text-[74px] leading-none lg:leading-[.95] tracking-[-2px] lg:tracking-[-3.5px]">
              {cs.title}
            </h1>
            <p className="text-white/80 font-body text-[14px] lg:text-[20px] leading-[1.4] lg:leading-[1.3]">
              {cs.summary}
            </p>
            <div className="flex flex-wrap items-center gap-[10px] pt-2">
              {cs.tags.map((t) => (
                <span
                  key={t}
                  className="px-[18px] py-[8px] rounded-[99px] border border-white/35 border-solid w-fit text-nowrap"
                >
                  <span className="text-white font-source-code-pro text-[12px] leading-normal uppercase">{t}</span>
                </span>
              ))}
            </div>
            <div className="pt-4">
              <Link
                href="/en/cases"
                className="inline-flex items-center gap-[10px] font-source-code-pro uppercase text-[14px] tracking-[-0.42px] text-white hover:text-white/80 transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                Back to cases
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-white section-padding">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px] lg:gap-[30px]">
            <div className="lg:col-span-1">
              <p className="text-accent font-source-code-pro text-[12px] lg:text-[14px] leading-[1.2] lg:leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
                Summary
              </p>
              <h2 className="text-black font-rinter text-[30px] lg:text-[55px] leading-[1.1] tracking-[-1.5px] lg:tracking-[-2.75px]">
                What changed
              </h2>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-[18px]">
              <p className="font-body text-[16px] lg:text-[17px] leading-[1.3] lg:leading-[30px] text-black/70">
                Replace this narrative with your project story: the goal, constraints, and the decisions that shaped the
                end result.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] lg:gap-[16px]">
                {["Challenge", "Approach", "Outcome", "Next"].map((label) => (
                  <div key={label} className="bg-container p-5 lg:p-6">
                    <p className="font-source-code-pro text-[14px] leading-normal tracking-[-0.42px] text-black uppercase">
                      {label}
                    </p>
                    <p className="mt-2 font-body text-[16px] lg:text-[17px] leading-[1.3] lg:leading-[30px] text-black/70">
                      Add your own case study content here.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-black section-padding">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[12px] lg:gap-[16px]">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="relative w-full h-[220px] md:h-[260px] lg:h-[240px] overflow-hidden">
                <Media alt={`${cs.title} gallery ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {casesSections.map((html, idx) => (
        <RawHtml key={`cases-${idx}`} html={html} />
      ))}
      {contactSections.map((html, idx) => (
        <RawHtml key={`contact-${idx}`} html={html} />
      ))}
    </main>
  );
}
