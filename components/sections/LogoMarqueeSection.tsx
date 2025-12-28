import { Container } from "../primitives/Container";
import { Media } from "../primitives/Media";
import { Section } from "../primitives/Section";

type LogoMarqueeSectionProps = {
  title: string;
  logos: { name: string }[];
};

export function LogoMarqueeSection({ title, logos }: LogoMarqueeSectionProps) {
  return (
    <Section
      className="flex flex-col gap-[70px] items-center justify-center bg-white section-padding-y-half"
      data-slice-type="brands_marquee"
      data-slice-variation="default"
    >
      <Container>
        <div className="flex flex-col lg:flex-row items-start lg:justify-start items-center gap-6 lg:gap-[89px]">
          <p className="text-black font-rinter text-[20px] leading-normal tracking-[-0.42px] w-full max-w-[221px] overflow-hidden text-left">
            {title}
          </p>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-[100px] bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-[100px] bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

            <div className="flex overflow-hidden select-none will-change-transform">
              <div className="flex animate-marquee flex-shrink-0 gap-[30px] pr-[30px]">
                {logos.map((logo) => (
                  <div
                    key={logo.name}
                    className="flex items-center justify-center lg:pl-[47px] lg:pr-[48px] pl-[18px] pr-[17px] lg:w-[227px] lg:h-[101px] w-[150px] h-[60px] flex-shrink-0 border-[0.5px] border-container"
                  >
                    <Media alt={logo.name} className="lg:w-[132px] lg:h-[24px] w-[85px] h-[38px] object-contain" />
                  </div>
                ))}
              </div>

              <div className="flex animate-marquee flex-shrink-0 gap-[30px] pr-[30px]" aria-hidden="true">
                {logos.map((logo) => (
                  <div
                    key={`${logo.name}-dup`}
                    className="flex items-center justify-center lg:pl-[47px] lg:pr-[48px] pl-[18px] pr-[17px] lg:w-[227px] lg:h-[101px] w-[150px] h-[60px] flex-shrink-0 border-[0.5px] border-container"
                  >
                    <Media alt={logo.name} className="lg:w-[132px] lg:h-[24px] w-[85px] h-[38px] object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

