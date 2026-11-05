import { Link } from "react-router-dom";
import InfoPage from "@/components/layout/Infopage";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageProps = {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

/** Renders a titled legal document with a section index on large screens. */
export default function LegalPage({ title, intro, updated, sections }: LegalPageProps) {
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <InfoPage title={title} intro={intro} wide>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-2 text-xs">
            {sections.map((s) => (
              <li key={s.heading}>
                <a
                  href={`#${slug(s.heading)}`}
                  className="text-[#A0A0A8] transition-colors hover:text-[#B39ACF]"
                >
                  {s.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="flex max-w-2xl flex-col gap-9">
          <p className="text-[11px] text-[#77717F]">Last updated {updated}</p>

          {sections.map((s) => (
            <section key={s.heading} id={slug(s.heading)} className="scroll-mt-24 flex flex-col gap-3">
              <h2 className="text-[18px] font-semibold leading-6 text-[#E6E1EA]">{s.heading}</h2>

              {s.paragraphs?.map((p) => (
                <p key={p} className="text-sm leading-7 text-[#C9C4CF]">
                  {p}
                </p>
              ))}

              {s.items && (
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-7 text-[#C9C4CF] marker:text-[#554363]">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <p className="border-t border-[#302438] pt-6 text-xs text-[#A0A0A8]">
            Questions about this page? Reach us through the{" "}
            <Link to="/contact" className="font-semibold text-[#B39ACF] hover:underline">
              contact page
            </Link>
            .
          </p>
        </article>
      </div>
    </InfoPage>
  );
}