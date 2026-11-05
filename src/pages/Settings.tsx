import { useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import InfoPage from "@/components/layout/Infopage";
import {
  PAGE_SIZES,
  SORT_OPTIONS,
  TEXT_SIZES,
  useSettings,
  type MotionPref,
  type SortKey,
  type Visibility,
} from "@/context/Settingscontext";

type Choice<T> = { value: T; label: string; hint?: string };

const VISIBILITY: Choice<Visibility>[] = [
  { value: "public", label: "Public", hint: "Shown on Community Playlists" },
  { value: "private", label: "Private", hint: "Only you can see it" },
];

const MOTION: Choice<MotionPref>[] = [
  { value: "system", label: "Match my device", hint: "Follows your system setting" },
  { value: "reduce", label: "Reduce", hint: "Fewer fades and slides" },
  { value: "full", label: "Full", hint: "Always animate" },
];

const COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-[#302438] bg-[#17191E] p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-semibold leading-6">{title}</h2>
        <p className="text-xs leading-5 text-[#A0A0A8]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function OptionGroup<T extends string | number>({
  legend,
  name,
  value,
  options,
  onChange,
  columns,
}: {
  legend: string;
  name: string;
  value: T;
  options: Choice<T>[];
  onChange: (value: T) => void;
  columns: 2 | 3 | 4;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-[11px] font-semibold">{legend}</legend>
      <div className={`grid grid-cols-1 gap-3 ${COLUMNS[columns]}`}>
        {options.map((o) => (
          <label
            key={String(o.value)}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors focus-within:ring-1 focus-within:ring-[#B39ACF]/40 ${
              value === o.value
                ? "border-[#B39ACF] bg-[#B39ACF]/10"
                : "border-[#302438] bg-[#000000] hover:border-[#554363]"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="mt-0.5 accent-[#B39ACF]"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold">{o.label}</span>
              {o.hint && <span className="text-[11px] text-[#A0A0A8]">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Switch for hiding 18+ games. Turning the filter off asks for an age confirmation first. */
function MatureFilter() {
  const { settings, update } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const hiding = settings.hideMature;

  function toggle() {
    if (hiding) setConfirming(true);
    else update({ hideMature: true });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p id="mature-label" className="text-xs font-semibold">
            Hide 18+ games
          </p>
          <p className="max-w-md text-[11px] leading-4 text-[#A0A0A8]">
            Removes games rated 18+ from playlists and recommendations. Ratings come from the game's store listing,
            so a few games may be missing one.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={hiding}
          aria-labelledby="mature-label"
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]/50 ${
            hiding ? "border-[#B39ACF] bg-[#B39ACF]" : "border-[#554363] bg-[#000000]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`inline-block size-4 rounded-full transition-transform ${
              hiding ? "translate-x-6 bg-[#17101F]" : "translate-x-1 bg-[#A0A0A8]"
            }`}
          />
        </button>
      </div>

      <p role="status" className="text-[11px] text-[#77717F]">
        {hiding ? "18+ games are hidden." : "18+ games are shown."}
      </p>

      {confirming && (
        <div role="group" aria-label="Confirm your age" className="flex flex-col gap-3 rounded-xl border border-[#554363] bg-[#000000] p-4">
          <p className="text-xs leading-5 text-[#C9C4CF]">
            Showing 18+ games is only for adults. Are you 18 or older?
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                update({ hideMature: false });
                setConfirming(false);
              }}
              className="inline-flex h-9 cursor-pointer items-center rounded-xl bg-[#B39ACF] px-4 text-xs font-bold text-[#17101F] transition-colors hover:bg-[#C2ADE0]"
            >
              Yes, I'm 18 or older
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-[#302438] bg-[#17191E] px-4 text-xs font-semibold transition-colors hover:border-[#554363] hover:bg-[#20232B]"
            >
              Keep hiding them
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { settings, update, reset } = useSettings();

  return (
    <InfoPage title="Settings" intro="Adjust how GameShelf looks and what it shows you on this device.">
      <Card title="Appearance" description="Changes apply across the whole site as soon as you pick them.">
        <OptionGroup
          legend="Text size"
          name="text-size"
          columns={4}
          value={settings.textSize}
          onChange={(v) => update({ textSize: v })}
          options={TEXT_SIZES.map((t) => ({
            value: t.value,
            label: t.label,
            hint: `${Math.round(t.scale * 100)}%`,
          }))}
        />

        <OptionGroup
          legend="Animations"
          name="motion"
          columns={3}
          value={settings.motion}
          onChange={(v) => update({ motion: v })}
          options={MOTION}
        />
      </Card>

      <Card title="Content" description="Control which games appear for you.">
        <MatureFilter />
      </Card>

      <Card title="Playlists" description="How Community Playlists loads and how new playlists start out.">
        <OptionGroup
          legend="Playlists per page"
          name="page-size"
          columns={3}
          value={settings.playlistsPerPage}
          onChange={(v) => update({ playlistsPerPage: v })}
          options={PAGE_SIZES.map((n) => ({ value: n, label: `${n} playlists` }))}
        />

        <label className="flex flex-col gap-2 text-[11px] font-semibold">
          Default sort order
          <select
            value={settings.defaultSort}
            onChange={(e) => update({ defaultSort: e.target.value as SortKey })}
            className="h-10 w-full cursor-pointer rounded-xl border border-[#302438] bg-[#000000] px-3 text-xs font-normal text-[#E6E1EA] outline-none transition-colors hover:border-[#554363] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/20 sm:max-w-xs"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#17191E]">
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <OptionGroup
          legend="Default visibility for new playlists"
          name="default-visibility"
          columns={2}
          value={settings.defaultVisibility}
          onChange={(v) => update({ defaultVisibility: v })}
          options={VISIBILITY}
        />
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[11px] text-[#77717F]">Changes save automatically and apply to this browser only.</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#302438] bg-[#000000] px-4 text-xs font-semibold text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B]"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" /> Reset to defaults
        </button>
      </div>
    </InfoPage>
  );
}