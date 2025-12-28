import { Container } from "../primitives/Container";
import { Section } from "../primitives/Section";

type ServiceIntroSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ServiceIntroSection({ eyebrow, title, description }: ServiceIntroSectionProps) {
  return (
    <Section
      className="relative w-full bg-white px-[12px] lg:px-16 pt-[120px] lg:pt-[180px] pb-10"
      data-slice-type="services_intro"
      data-slice-variation="default"
    >
      <div className="w-full max-w-[1500px] mx-auto">
        <div className="flex flex-col gap-[12px] lg:gap-[16px] max-w-[980px]">
          <p className="text-accent font-source-code-pro text-[12px] lg:text-[14px] leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
            {eyebrow}
          </p>
          <h1 className="text-black font-rinter font-medium text-[44px] lg:text-[74px] leading-none lg:leading-[.95] tracking-[-2px] lg:tracking-[-3.5px]">
            {title}
          </h1>
          <p className="text-black/70 font-body text-[14px] lg:text-[20px] leading-[1.4] lg:leading-[1.3]">
            {description}
          </p>
        </div>
      </div>
    </Section>
  );
}

