import { RawHtml } from "../components/RawHtml";
import { homeSections } from "../lib/valcon-sections";

export default function HomePage() {
  return (
    <main className="bg-background">
      {homeSections.map((html, idx) => (
        <RawHtml key={idx} html={html} />
      ))}
    </main>
  );
}

