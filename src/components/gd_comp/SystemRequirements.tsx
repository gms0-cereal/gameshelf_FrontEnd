
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import type { SteamGameDetail } from "@/services/Gameservice";

type RequirementRow = {
  label: string;
  value: string;
};

function parseRequirements(
  html: string | undefined
): RequirementRow[] {
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");

  return Array.from(doc.querySelectorAll("li"))
    .map((li) => {
      const clone = li.cloneNode(true) as HTMLElement;
      const strong = clone.querySelector("strong");

      const label = (strong?.textContent ?? "")
        .replace(/:\s*$/, "")
        .trim();

      strong?.remove();

      const value = (clone.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim();

      return { label, value };
    })
    .filter((row) => row.value);
}

function SectionHeading({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
        {title}
      </h2>

      {note && (
        <p className="text-[13px] leading-4 text-[#A0A0A8]">
          {note}
        </p>
      )}
    </div>
  );
}

function RequirementColumn({
  title,
  rows,
}: {
  title: string;
  rows: RequirementRow[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[#B39ACF]">
        {title}
      </h3>

      {rows.length === 0 ? (
        <p className="text-xs text-[#A0A0A8]">
          Not specified.
        </p>
      ) : (
        <dl className="flex flex-col gap-3 text-xs">
          {rows.map((row, index) =>
            row.label ? (
              <div key={`${row.label}-${index}`}>
                <dt className="mb-0.5 uppercase tracking-wide text-[#77717F]">
                  {row.label}
                </dt>

                <dd className="leading-5 text-[#E6E1EA]">
                  {row.value}
                </dd>
              </div>
            ) : (
              <p
                key={index}
                className="leading-5 text-[#A0A0A8]"
              >
                {row.value}
              </p>
            )
          )}
        </dl>
      )}
    </div>
  );
}

interface SystemRequirementsProps {
  game: SteamGameDetail;
}

export default function SystemRequirements({
  game,
}: SystemRequirementsProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const sources = [
    {
      key: "pc",
      label: "PC",
      supported: game.platforms?.windows,
      data: game.pc_requirements,
    },
    {
      key: "mac",
      label: "Mac",
      supported: game.platforms?.mac,
      data: game.mac_requirements,
    },
    {
      key: "linux",
      label: "Linux",
      supported: game.platforms?.linux,
      data: game.linux_requirements,
    },
  ].map(({ key, label, supported, data }) => {
    const reqs =
      data && !Array.isArray(data) ? data : undefined;

    const minimum = parseRequirements(reqs?.minimum);
    const recommended = parseRequirements(reqs?.recommended);

    return {
      key,
      label,
      supported: Boolean(supported),
      minimum,
      recommended,
      hasData:
        minimum.length > 0 || recommended.length > 0,
    };
  });

  if (!sources.some((s) => s.hasData || s.supported)) {
    return null;
  }

  const active =
    sources.find((s) => s.key === activeKey) ??
    sources.find((s) => s.hasData) ??
    sources[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      <SectionHeading
        title="System requirements"
        note="From the Steam store page"
      />

      <Card className="gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none">
        <CardContent className="flex flex-col gap-5 p-6">
          <div
            role="tablist"
            aria-label="Platform"
            className="flex w-fit gap-1 rounded-xl border border-[#302438] bg-[#000000] p-1"
          >
            {sources.map((s) => {
              const isSelected = active.key === s.key;

              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveKey(s.key)}
                  className={`relative h-8 cursor-pointer rounded-lg px-4 text-xs font-medium transition-colors ${
                    isSelected
                      ? "font-semibold text-[#17191E]"
                      : s.hasData || s.supported
                        ? "text-[#A0A0A8] hover:text-[#E6E1EA]"
                        : "text-[#554363] hover:text-[#A0A0A8]"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="sys-req-active-tab"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-lg bg-[#B39ACF]"
                    />
                  )}

                  <span className="relative z-10">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {active.hasData ? (
                <div className="grid gap-8 md:grid-cols-2">
                  <RequirementColumn
                    title="Minimum"
                    rows={active.minimum}
                  />

                  <RequirementColumn
                    title="Recommended"
                    rows={active.recommended}
                  />
                </div>
              ) : (
                <p className="text-sm text-[#A0A0A8]">
                  {active.supported
                    ? `The publisher hasn’t listed ${active.label} requirements for this game.`
                    : `This game isn’t available on ${active.label}.`}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.section>
  );
}
