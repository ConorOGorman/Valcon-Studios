"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { caseStudies } from "../../lib/site-content";
import { Media } from "../primitives/Media";
import { Section } from "../primitives/Section";

type Filter = { key: string; label: string };

function titleToKey(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CasesIndexSection() {
  const filters: Filter[] = useMemo(() => {
    const tagSet = new Set<string>();
    for (const cs of caseStudies) for (const t of cs.tags) tagSet.add(t);

    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    return [{ key: "all", label: "All" }, ...tags.map((t) => ({ key: titleToKey(t), label: t }))];
  }, []);

  const [active, setActive] = useState<Filter>(filters[0]!);

  const items = useMemo(() => {
    if (active.key === "all") return caseStudies;
    return caseStudies.filter((cs) => cs.tags.some((t) => titleToKey(t) === active.key));
  }, [active.key]);

  return (
    <Section
      className="w-full bg-white pt-[120px] px-[12px] md:px-[24px] lg:px-[64px]"
      data-slice-type="case_studies_index"
      data-slice-variation="default"
    >
      <div className="w-full max-w-[1500px] mx-auto">
        <div className="max-w-[980px]">
          <p className="text-accent font-source-code-pro text-[12px] lg:text-[14px] leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] uppercase">
            Cases
          </p>
          <h1 className="mt-3 text-black font-rinter font-medium text-[44px] lg:text-[74px] leading-none lg:leading-[.95] tracking-[-2px] lg:tracking-[-3.5px]">
            Results that speak louder than promises
          </h1>
        </div>

        <div className="mt-10 lg:mt-14 grid grid-cols-1 md:grid-cols-2 gap-[12px] lg:gap-[16px] pb-[140px]">
          {items.map((cs) => (
            <Link
              key={cs.slug}
              href={`/en/case-studies/${cs.slug}`}
              className="group relative overflow-hidden h-[260px] md:h-[320px] lg:h-[330px] block"
            >
              <Media alt={cs.title} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/45 pointer-events-none" />

              <div className="absolute left-4 top-4 lg:left-6 lg:top-6 flex items-center gap-[8px]">
                <div className="w-[10px] h-[10px] bg-white rounded-full" />
                <p className="font-source-code-pro text-[14px] leading-normal tracking-[-0.42px] text-white uppercase">
                  {cs.sector}
                </p>
              </div>

              <div className="absolute left-4 right-4 bottom-4 lg:left-6 lg:right-6 lg:bottom-6">
                <h2 className="text-white font-rinter text-[26px] lg:text-[34px] leading-[1.1] tracking-[-1.3px] lg:tracking-[-1.7px]">
                  {cs.title}
                </h2>
                <p className="mt-2 text-white/85 font-body text-[14px] lg:text-[16px] leading-[1.35] line-clamp-2">
                  {cs.summary}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-[10px]">
                  {cs.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-[18px] py-[8px] rounded-[99px] border border-white/60 border-solid">
                      <span className="text-white font-source-code-pro text-[12px] leading-normal uppercase">
                        {tag}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="absolute left-0 bottom-0 w-full h-[54px] flex items-center justify-between px-[18px] lg:px-[30px] py-[15px] bg-accent translate-y-[54px] transition-transform duration-300 group-hover:translate-y-0">
                <p className="font-source-code-pro text-[14px] leading-normal tracking-[-0.42px] text-white uppercase">
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
            </Link>
          ))}
        </div>
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-50 bg-white">
        <div className="w-full max-w-[1500px] mx-auto px-[12px] md:px-[24px] lg:px-[64px] pb-4">
          <div className="border border-black/10 bg-white backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="w-[6px] h-[6px] rounded-full bg-accent" />
                <p className="font-source-code-pro text-[12px] lg:text-[14px] leading-normal tracking-[-0.36px] lg:tracking-[-0.42px] text-black uppercase">
                  Filter
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {filters.map((f) => {
                  const selected = f.key === active.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setActive(f)}
                      className={`shrink-0 px-[14px] py-[8px] rounded-[99px] border transition-colors duration-150 font-source-code-pro text-[12px] uppercase tracking-[-0.36px] ${
                        selected
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-black/15 hover:border-black/35"
                      }`}
                      aria-pressed={selected}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

