import { Container } from "../primitives/Container";
import { Section } from "../primitives/Section";

type ServicesIndexHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ServicesIndexHero({ eyebrow, title, description }: ServicesIndexHeroProps) {
  return (
    <Section className="relative max-lg:pt-[110px] max-lg:pb-[44px] lg:pt-[160px] lg:pb-[90px] overflow-hidden bg-black">
      <Container>
        <div className="flex flex-col gap-[12px] lg:gap-[16px] max-w-[980px]">
          <p className="text-[#a8a29d] font-source-code-pro text-[12px] lg:text-[14px] leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
            {eyebrow}
          </p>
          <h1 className="text-white font-rinter font-medium text-[44px] lg:text-[74px] leading-none lg:leading-[.95] tracking-[-2px] lg:tracking-[-3.5px]">
            {title}
          </h1>
          <p className="text-[#a8a29d] font-body text-[14px] lg:text-[20px] leading-[1.4] lg:leading-[1.3]">
            {description}
          </p>
        </div>
      </Container>
    </Section>
  );
}

