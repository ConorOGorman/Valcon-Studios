import Link from "next/link";
import { services } from "../../lib/site-content";
import { Container } from "../primitives/Container";
import { Media } from "../primitives/Media";
import { Section } from "../primitives/Section";

export function ServicesGridSection() {
  return (
    <Section className="bg-white section-padding">
      <Container>
        <div className="flex flex-col gap-[16px] lg:gap-[30px]">
          <div className="flex flex-col lg:flex-row gap-[12px] lg:gap-[30px] lg:items-end lg:justify-between">
            <div className="max-w-[900px]">
              <p className="text-accent font-source-code-pro text-[12px] lg:text-[14px] leading-[1.2] lg:leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
                Capabilities
              </p>
              <h2 className="text-black font-rinter text-[30px] lg:text-[55px] leading-[1.1] tracking-[-1.5px] lg:tracking-[-2.75px]">
                Services that ship
              </h2>
            </div>
            <p className="text-black/70 font-body text-[16px] lg:text-[17px] leading-[1.3] lg:leading-[30px] max-w-[560px]">
              This page is built as a reusable layout. Swap the copy, tags, and media with your own content while
              keeping the structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] lg:gap-[16px]">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/en/service/${service.slug}`}
                className="group bg-container border border-black/5 block overflow-hidden"
              >
                <div className="relative h-[220px] md:h-[240px] lg:h-[260px]">
                  <Media
                    alt={`${service.title} cover`}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,0,0,0.10)] to-[rgba(0,0,0,0.35)]" />
                  <div className="absolute left-4 right-4 bottom-4 lg:left-[30px] lg:right-[30px] lg:bottom-[24px]">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-white font-source-code-pro text-[14px] leading-normal tracking-[-0.42px] uppercase">
                        View service
                      </p>
                      <span className="text-white transition-transform duration-300 group-hover:translate-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <g opacity="1">
                            <circle cx="10.2004" cy="7.1999" r="1.8" fill="currentColor"></circle>
                            <circle cx="10.2004" cy="16.8" r="1.8" fill="currentColor"></circle>
                            <circle cx="14.9992" cy="12.0002" r="1.8" fill="currentColor"></circle>
                          </g>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 lg:p-6">
                  <p className="text-black font-source-code-pro text-[14px] leading-normal tracking-[-0.42px] uppercase">
                    {service.title}
                  </p>
                  <p className="mt-2 text-black/70 font-body text-[16px] lg:text-[17px] leading-[1.3] lg:leading-[30px]">
                    {service.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-[10px]">
                    {service.bullets.slice(0, 3).map((b) => (
                      <span
                        key={b}
                        className="px-[18px] py-[8px] rounded-[99px] border border-black/20 border-solid w-fit text-nowrap"
                      >
                        <span className="text-black font-source-code-pro text-[12px] leading-normal uppercase">
                          {b}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
