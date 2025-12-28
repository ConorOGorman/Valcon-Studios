import Link from "next/link";
import { Container } from "../primitives/Container";
import { Section } from "../primitives/Section";

type BookingCTASectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
};

export function BookingCTASection({
  eyebrow,
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
}: BookingCTASectionProps) {
  return (
    <Section className="bg-black section-padding">
      <Container>
        <div className="flex flex-col lg:flex-row gap-[24px] lg:gap-[40px] items-start lg:items-end justify-between">
          <div className="max-w-[820px]">
            <p className="text-[#a8a29d] font-source-code-pro text-[12px] lg:text-[14px] leading-[1.2] lg:leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-white font-rinter text-[30px] lg:text-[55px] leading-[1.1] tracking-[-1.5px] lg:tracking-[-2.75px]">
              {title}
            </h2>
            <p className="mt-3 text-white/80 font-body text-[16px] lg:text-[17px] leading-[1.3] lg:leading-[30px]">
              {description}
            </p>
          </div>

          <Link
            href={primaryCtaHref}
            className="group max-lg:px-4 max-lg:py-2 lg:py-[15px] flex items-center justify-between h-[40px] lg:h-[54px] gap-[8px] lg:gap-[16px] font-source-code-pro text-[12px] lg:text-[14px] tracking-[-0.36px] lg:tracking-[-0.42px] transition-all duration-300 text-center cursor-pointer bg-accent text-white hover:bg-accent/80 lg:px-[28px] w-full lg:w-fit"
          >
            <span className="text-center uppercase text-white" style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {primaryCtaLabel}
            </span>
            <div className="flex items-center justify-center">
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <g opacity="1">
                    <circle cx="10.2004" cy="7.1999" r="1.8" fill="currentColor"></circle>
                    <circle cx="10.2004" cy="16.8" r="1.8" fill="currentColor"></circle>
                    <circle cx="14.9992" cy="12.0002" r="1.8" fill="currentColor"></circle>
                  </g>
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
