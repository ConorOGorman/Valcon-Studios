export type Service = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

export type CaseStudy = {
  slug: string;
  sector: string;
  title: string;
  summary: string;
  tags: string[];
};

export const services: Service[] = [
  {
    slug: "branding",
    eyebrow: "Service",
    title: "Branding",
    description: "Positioning, identity, and systems designed to stay consistent across every touchpoint.",
    bullets: ["Brand strategy", "Visual identity", "Design systems", "Messaging + tone of voice"],
  },
  {
    slug: "digital-development",
    eyebrow: "Service",
    title: "Digital development",
    description: "Fast, accessible, and maintainable websites and product builds—shipped with real constraints in mind.",
    bullets: ["Web builds", "Performance + SEO", "CMS integration", "Maintenance + iteration"],
  },
  {
    slug: "digital-marketing",
    eyebrow: "Service",
    title: "Digital marketing",
    description: "Campaigns and funnels built to measure what matters—leads, revenue, and retention.",
    bullets: ["Paid media", "Landing pages", "Conversion optimisation", "Analytics + reporting"],
  },
  {
    slug: "photography-and-visual-production",
    eyebrow: "Service",
    title: "Photography & visual production",
    description: "Visual assets with a premium look—ready for web, ads, and social content pipelines.",
    bullets: ["Art direction", "Photo + video production", "Editing + grading", "Asset delivery system"],
  },
];

export const caseStudies: CaseStudy[] = [
  {
    slug: "arslan-group",
    sector: "Construction",
    title: "Arslan Group",
    summary: "A modern digital presence with a premium feel and a clear lead path.",
    tags: ["Digital development", "Branding"],
  },
  {
    slug: "hatamex",
    sector: "Agency",
    title: "Lucid Studio's",
    summary: "A marketing site system designed for clarity, conversion, and speed.",
    tags: ["Branding", "Digital development"],
  },
  {
    slug: "avra-gruppe",
    sector: "Business",
    title: "Avra Gruppe",
    summary: "A structured site experience that communicates trust and capability.",
    tags: ["Digital development"],
  },
  {
    slug: "hogendorp-dental",
    sector: "Healthcare",
    title: "Hogendorp Dental",
    summary: "Lead-gen marketing foundation to quickly attract new patients.",
    tags: ["Digital marketing", "Digital development"],
  },
  {
    slug: "hotel-four-stories",
    sector: "Hospitality / Hotels",
    title: "Hotel Four Stories",
    summary: "A story-led digital experience tailored for bookings and brand perception.",
    tags: ["Branding", "Digital development"],
  },
  {
    slug: "bmr-elektra",
    sector: "Construction",
    title: "BMR Elektra",
    summary: "Service clarity and project credibility translated into a scalable site layout.",
    tags: ["Digital development"],
  },
];
