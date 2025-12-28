import { Container } from "../primitives/Container";
import { Media } from "../primitives/Media";
import { Section } from "../primitives/Section";

type CaseStudiesCarouselSectionProps = {
  title: string;
  items: { title: string; subtitle: string }[];
};

export function CaseStudiesCarouselSection({ title, items }: CaseStudiesCarouselSectionProps) {
  return (
    <Section
      className="relative w-full bg-white md:h-[650px] lg:h-[807px] md:overflow-hidden"
      data-slice-type="case_studies_carousel"
      data-slice-variation="default"
    >
      <Container className="h-full">
        <div className="flex items-end justify-between gap-6 pt-10 md:pt-0 md:h-full">
          <div className="max-w-[600px] pb-8 md:pb-12">
            <p className="text-accent font-source-code-pro text-[12px] lg:text-[14px] leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
              Cases
            </p>
            <h2 className="mt-2 text-black font-rinter text-[30px] lg:text-[55px] leading-[1.1] tracking-[-1.5px] lg:tracking-[-2.75px]">
              {title}
            </h2>
          </div>

          <div className="hidden md:block flex-1 pb-10">
            <div className="flex gap-[12px] lg:gap-[16px] overflow-x-auto">
              {items.map((item) => (
                <div key={item.title} className="relative w-[320px] lg:w-[380px] h-[420px] shrink-0 overflow-hidden">
                  <Media alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute left-5 right-5 bottom-5">
                    <p className="text-white font-source-code-pro text-[14px] leading-normal tracking-[-0.42px] uppercase">
                      {item.subtitle}
                    </p>
                    <p className="mt-2 text-white font-rinter text-[26px] leading-[1.15] tracking-[-1.3px]">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

