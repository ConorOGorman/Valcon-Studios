import { Container } from "../primitives/Container";
import { Section } from "../primitives/Section";

type ServiceBenefitsSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  benefits: { title: string; body: string }[];
};

export function ServiceBenefitsSection({ eyebrow, title, description, benefits }: ServiceBenefitsSectionProps) {
  return (
    <Section className="bg-white section-padding-top-only" data-slice-type="service_benefits" data-slice-variation="default">
      <Container>
        <div className="flex flex-col gap-[16px] lg:gap-[30px]">
          <div className="flex flex-col lg:flex-row gap-[12px] lg:gap-[30px] lg:items-end lg:justify-between">
            <div className="max-w-[860px]">
              <p className="text-accent font-source-code-pro text-[12px] lg:text-[14px] leading-[1.2] lg:leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
                {eyebrow}
              </p>
              <h2 className="mt-2 text-black font-rinter text-[30px] lg:text-[55px] leading-[1.1] tracking-[-1.5px] lg:tracking-[-2.75px]">
                {title}
              </h2>
            </div>
            <p className="text-black/70 font-body text-[16px] lg:text-[17px] leading-[1.3] lg:leading-[30px] max-w-[560px]">
              {description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] lg:gap-[10px] bg-container p-2">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white p-[30px] flex flex-col gap-[10px]">
                <p className="text-black !font-rinter text-[24px] leading-normal tracking-[-0.72px]">
                  {b.title}
                </p>
                <p className="text-[#1e1e20] font-body text-[17px] leading-[30px] overflow-hidden">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

