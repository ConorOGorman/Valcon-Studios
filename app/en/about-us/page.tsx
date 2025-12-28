import { RawHtml } from "../../../components/RawHtml";
import { aboutSections } from "../../../lib/valcon-sections";

export default function AboutUsPage() {
  return (
    <main className="bg-background">
      {aboutSections.map((html, idx) => (
        <RawHtml key={idx} html={html} />
      ))}
    </main>
  );
}

