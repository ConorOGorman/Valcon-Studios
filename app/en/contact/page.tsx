import { RawHtml } from "../../../components/RawHtml";
import { contactSections } from "../../../lib/valcon-sections";

export default function ContactPage() {
  return (
    <main className="bg-background">
      {contactSections.map((html, idx) => (
        <RawHtml key={idx} html={html} />
      ))}
    </main>
  );
}

