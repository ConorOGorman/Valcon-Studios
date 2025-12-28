import fs from "node:fs";
import path from "node:path";
import { replaceBrandInHtml } from "./brand";

function resolveProjectRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "src", "sections"))) return cwd;

  // When executing from bundled Next output, `process.cwd()` may be `.next/...`.
  // In that case, walk back up to the project root.
  return path.resolve(__dirname, "../../../../");
}

const SECTIONS_DIR = path.join(resolveProjectRoot(), "src", "sections");

function read(name: string) {
  return replaceBrandInHtml(fs.readFileSync(path.join(SECTIONS_DIR, name), "utf8"));
}

export const homeSections = [
  read("hero.html"),
  read("brands_marquee.html"),
  read("video_hero.html"),
  read("achievements.html"),
  read("services_overview.html"),
  read("services_accordion.html"),
  read("case_studies_showcase.html"),
  read("why_us.html"),
  read("process_steps.html"),
  read("contact_scheduler.html"),
];

export const casesSections = [
  read("page_header_cases.html"),
  read("case_studies_showcase.html"),
  read("contact_scheduler.html"),
];

export const casesPageSections = [
  read("case_studies_index.html"),
  read("brands_marquee_cases.html"),
  read("services_accordion.html"),
  read("contact_scheduler.html"),
];

export const servicesSections = [
  read("page_header_services.html"),
  read("services_overview.html"),
  read("services_accordion.html"),
  read("contact_scheduler.html"),
];

export const servicesPageSections = [
  read("services_accordion.html"),
  read("process_steps.html"),
  read("contact_scheduler.html"),
];

export const aboutSections = [
  read("page_header_about.html"),
  read("why_us.html"),
  read("achievements.html"),
  read("process_steps.html"),
  read("contact_scheduler.html"),
];

export const contactSections = [
  read("page_header_contact.html"),
  read("contact_scheduler.html"),
];
