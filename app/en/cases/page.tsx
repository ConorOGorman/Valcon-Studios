import { RawHtml } from "../../../components/RawHtml";
import { casesPageSections } from "../../../lib/valcon-sections";

export default function CasesPage() {
  return (
    <main className="bg-background">
      {casesPageSections.map((html, idx) => (
        <RawHtml key={idx} html={html} />
      ))}
    </main>
  );
}
