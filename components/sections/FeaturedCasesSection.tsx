import Link from "next/link";
import { caseStudies } from "../../lib/site-content";
import { Container } from "../primitives/Container";
import { Media } from "../primitives/Media";
import { Section } from "../primitives/Section";

type FeaturedCasesSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function FeaturedCasesSection({ eyebrow, title, description }: FeaturedCasesSectionProps) {
  const featured = caseStudies.slice(0, 4);

  return (
    <Section
      className="relative flex flex-col gap-[30px] lg:gap-[70px] w-full max-w-[1500px] mx-auto overflow-hidden section-padding-x-only bg-white"
      data-slice-type="case_studies_showcase"
      data-slice-variation="default"
    >
      <div className="flex flex-col lg:flex-row gap-[16px] lg:items-start lg:justify-between w-full">
        <div className="flex flex-col gap-[8px] lg:gap-[16px] w-full">
          <p className="text-accent font-source-code-pro text-[12px] lg:text-[14px] leading-[1.2] lg:leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
            {eyebrow}
          </p>
          <h2 className="text-black font-rinter text-[30px] lg:text-[55px] leading-[1.1] tracking-[-1.5px] lg:tracking-[-2.75px]">
            {title}
          </h2>
          <p className="text-black/70 font-body text-[16px] lg:text-[17px] leading-[1.3] lg:leading-[30px] max-w-[888px]">
            {description}
          </p>
        </div>

        <div className="w-full lg:w-fit shrink-0">
          <Link
            className="group max-lg:px-4 max-lg:py-2 lg:py-[15px] flex items-center justify-between h-[40px] lg:h-[54px] gap-[8px] lg:gap-[16px] font-source-code-pro text-[12px] lg:text-[14px] tracking-[-0.36px] lg:tracking-[-0.42px] transition-all duration-300 text-center cursor-pointer bg-accent text-white hover:bg-accent/80 lg:px-[28px] w-fit lg:w-full"
            href="/en/cases"
          >
            <span className="text-center uppercase text-white" style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              View more cases
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
      </div>

      <div className="keen-slider">
        {featured.map((cs) => (
          <div key={cs.slug} className="keen-slider__slide !min-w-[350px] !max-w-[350px] lg:!min-w-[568px] lg:!max-w-[568px] select-none">
            <Link className="group block" draggable={false} href={`/en/case-studies/${cs.slug}`}>
              <div className="relative h-[475px] md:h-[638px] md:overflow-hidden w-full">
                <Media alt={cs.title} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                <div className="absolute left-[30px] top-[37px] flex items-center gap-[8px]">
                  <div className="w-[10px] h-[10px] bg-white rounded-full" />
                  <p className="font-source-code-pro text-[16px] leading-normal tracking-[-0.48px] text-white uppercase">
                    {cs.sector}
                  </p>
                </div>

                <div className="absolute left-[30px] top-2/3 -translate-y-1/2 w-[362px] lg:w-[500px] flex flex-col gap-6 z-10">
                  <div className="flex flex-col gap-[16px]">
                    <h3 className="!font-rinter text-[35px] leading-[50px] tracking-[-1.75px] text-white">
                      {cs.title}
                    </h3>
                    <p className="font-body text-[20px] leading-[30px] text-white line-clamp-2">
                      {cs.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-[16px]">
                    {cs.tags.slice(0, 3).map((tag) => (
                      <div
                        key={tag}
                        className="px-[18px] py-[8px] rounded-[99px] border border-white border-solid w-fit text-nowrap"
                      >
                        <span className="text-white font-source-code-pro text-[12px] leading-normal uppercase">
                          {tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute left-0 bottom-0 w-full h-[54px] flex items-center justify-between px-[30px] py-[15px] bg-accent z-10">
                  <p className="font-source-code-pro text-[14px] leading-normal tracking-[-0.42px] text-white">
                    See work
                  </p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                    <g opacity="1">
                      <circle cx="10.2004" cy="7.1999" r="1.8" fill="currentColor"></circle>
                      <circle cx="10.2004" cy="16.8" r="1.8" fill="currentColor"></circle>
                      <circle cx="14.9992" cy="12.0002" r="1.8" fill="currentColor"></circle>
                    </g>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}

