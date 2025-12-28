import { PricingCard } from "./PricingCard";
import styles from "./PricingSection.module.css";

type Plan = {
  name: string;
  descriptor: string;
  price: string;
  meta: string;
  bullets: string[];
  cta: string;
  footnote: string;
  featured?: boolean;
  ctaVariant: "primary" | "secondary";
};

const PLANS: Plan[] = [
  {
    name: "Launch",
    descriptor: "For early-stage businesses",
    price: "€1,950",
    meta: "one-off · 2–3 weeks",
    bullets: [
      "Up to 5 pages",
      "Pixel-clean UI",
      "Basic SEO setup",
      "Analytics + events",
      "Contact form",
      "Launch checklist",
    ],
    cta: "Start with Launch",
    footnote: "Best if you need a credible site fast.",
    ctaVariant: "secondary",
  },
  {
    name: "Growth",
    descriptor: "For teams ready to convert",
    price: "€3,950",
    meta: "one-off · 3–5 weeks",
    bullets: [
      "Up to 10 pages",
      "CMS for content",
      "On-page SEO",
      "Performance pass",
      "Conversion sections",
      "Tracking dashboard",
    ],
    cta: "Choose Growth",
    footnote: "Most popular for service businesses.",
    featured: true,
    ctaVariant: "primary",
  },
  {
    name: "Studio",
    descriptor: "For premium brands & scale",
    price: "€7,950",
    meta: "one-off · 6–8 weeks",
    bullets: [
      "Up to 20 pages",
      "Custom components",
      "Advanced SEO",
      "Animations + motion",
      "Integrations",
      "QA + hardening",
    ],
    cta: "Talk about Studio",
    footnote: "Best for ambitious, high-touch builds.",
    ctaVariant: "secondary",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className={styles.section} aria-labelledby="pricing-title">
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.eyebrow}>PRICING</p>
            <h2 id="pricing-title" className={styles.title}>
              Plans that ship fast and scale cleanly
            </h2>
          </div>
          <p className={`${styles.lead} ${styles.headerRight}`}>
            Choose a fixed scope package, then optionally add a monthly care plan after launch.
          </p>
        </header>

        <div className={styles.grid}>
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              descriptor={plan.descriptor}
              price={plan.price}
              meta={plan.meta}
              bullets={plan.bullets}
              cta={plan.cta}
              footnote={plan.footnote}
              featured={plan.featured}
              ctaVariant={plan.ctaVariant}
              ctaHref="/en/contact"
            />
          ))}
        </div>

        <div className={styles.ongoing}>
          <div className={styles.ongoingRow}>
            <p className={styles.ongoingLabel}>ONGOING</p>
            <p className={styles.ongoingCopy}>
              Care Plan from €250/month: updates, monitoring, small edits, and priority support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
