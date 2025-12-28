import { Container } from "../primitives/Container";
import { Section } from "../primitives/Section";

type HeroOrbitSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function HeroOrbitSection({ eyebrow, title, description }: HeroOrbitSectionProps) {
  return (
    <Section
      className="relative w-full min-h-[85vh] flex items-end justify-center overflow-hidden section-padding bg-black"
      data-slice-type="hero_orbit"
      data-slice-variation="default"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] md:w-[1100px] md:h-[1100px] opacity-40">
          <svg viewBox="0 0 1000 1000" className="w-full h-full">
            <defs>
              <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="55%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
              </radialGradient>
              <linearGradient id="orbLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
              </linearGradient>
            </defs>
            <circle cx="500" cy="500" r="460" fill="url(#orbGlow)" />
            <circle cx="500" cy="500" r="420" fill="none" stroke="url(#orbLine)" strokeWidth="1" />
            <circle cx="500" cy="500" r="300" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <circle cx="500" cy="500" r="190" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          </svg>
        </div>
      </div>

      <Container className="relative">
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
