import fs from "node:fs";
import path from "node:path";

const SECTIONS_DIR = path.join(process.cwd(), "src", "sections");

function read(name: string) {
  return fs.readFileSync(path.join(SECTIONS_DIR, name), "utf8");
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

