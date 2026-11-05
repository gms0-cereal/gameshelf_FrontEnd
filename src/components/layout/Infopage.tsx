import { useEffect, type ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type InfoPageProps = {
  title: string;
  intro?: string;
  wide?: boolean;
  children: ReactNode;
};

/** Shared shell for About, Contact, Help, Privacy Policy, Terms and Settings. */
export default function InfoPage({ title, intro, wide = false, children }: InfoPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [title]);

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col px-5 pb-20 pt-11 md:px-8 xl:px-16">
          <div className={`mx-auto flex w-full flex-col gap-8 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
            <header className="flex flex-col gap-3 border-b border-[#302438] pb-8">
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
                {title}
              </h1>
              {intro && <p className="max-w-2xl text-sm leading-6 text-[#A0A0A8]">{intro}</p>}
            </header>

            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}