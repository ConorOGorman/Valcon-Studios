import styles from "./PricingSection.module.css";

type PricingCardProps = {
  name: string;
  descriptor: string;
  price: string;
  meta: string;
  bullets: string[];
  cta: string;
  footnote: string;
  featured?: boolean;
  ctaVariant: "primary" | "secondary";
  ctaHref: string;
};

function DotsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g opacity="1">
        <circle cx="10.2004" cy="7.1999" r="1.8" fill="currentColor" />
        <circle cx="10.2004" cy="16.8" r="1.8" fill="currentColor" />
        <circle cx="14.9992" cy="12.0002" r="1.8" fill="currentColor" />
      </g>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.check}>
      <path
        d="M4 8.5l2.2 2.2L12 4.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PricingCard({
  name,
  descriptor,
  price,
  meta,
  bullets,
  cta,
  footnote,
  featured = false,
  ctaVariant,
  ctaHref,
}: PricingCardProps) {
  const buttonClass =
    ctaVariant === "primary"
      ? `${styles.button} ${styles.btnPrimary}`
      : `${styles.button} ${styles.btnSecondary}`;

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ""}`} aria-label={`${name} plan`}>
      <div className={styles.cardTop}>
        {featured ? <p className={styles.badge}>MOST POPULAR</p> : null}
        <h3 className={styles.planName}>{name}</h3>
        <p className={styles.descriptor}>{descriptor}</p>
        <div className={styles.priceRow}>
          <p className={styles.price}>{price}</p>
          <p className={styles.meta}>{meta}</p>
        </div>
      </div>

      <ul className={styles.bullets}>
        {bullets.map((item) => (
          <li key={item} className={styles.bullet}>
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className={styles.ctaRow}>
        <a className={buttonClass} href={ctaHref}>
          <span>{cta}</span>
          <span className={styles.ctaIcon}>
            <DotsIcon />
          </span>
        </a>
        <p className={styles.footnote}>{footnote}</p>
      </div>
    </article>
  );
}
