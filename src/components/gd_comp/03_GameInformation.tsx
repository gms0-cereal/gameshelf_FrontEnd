
import type { SteamGameDetail } from "@/services/Gameservice";

interface GameInformationProps {
  game: SteamGameDetail;
}

function formatNames(value?: string[]): string {
  if (!value?.length) return "Not available";
  return value.join(", ");
}

function formatReleaseDate(value: unknown): string {
  if (!value) return "Not available";

  let date: string;

  if (typeof value === "string") {
    date = value;
  } else if (
    typeof value === "object" &&
    "date" in value &&
    typeof value.date === "string"
  ) {
    date = value.date;
  } else {
    return "Not available";
  }

  return date.trim() || "Not available";
}

function Jellyfish({
  className = "",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      aria-hidden="true"
      className={`overflow-visible ${className}`}
      style={{
        animation: `archive-jelly-float 5s ease-in-out ${delay}s infinite`,
      }}
    >
      <defs>
        <linearGradient id="archive-jelly-body" x1="20" y1="15" x2="80" y2="90">
          <stop stopColor="#D8C4F0" stopOpacity=".65" />
          <stop offset="1" stopColor="#8D72B6" stopOpacity=".18" />
        </linearGradient>
      </defs>

      <path
        d="M16 57C16 31 30 15 50 15C70 15 84 31 84 57C84 69 69 76 50 76C31 76 16 69 16 57Z"
        fill="url(#archive-jelly-body)"
        stroke="#B39ACF"
        strokeOpacity=".65"
        strokeWidth="1.5"
      />

      <path
        d="M28 74C27 89 35 91 31 106M43 76C43 91 49 94 45 113M58 76C57 91 66 96 61 108M72 73C75 87 69 93 76 103"
        stroke="#B39ACF"
        strokeOpacity=".55"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M34 45C38 35 45 31 55 32"
        stroke="white"
        strokeOpacity=".35"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <circle cx="39" cy="57" r="2" fill="#E6E1EA" fillOpacity=".65" />
      <circle cx="61" cy="57" r="2" fill="#E6E1EA" fillOpacity=".65" />
    </svg>
  );
}

export default function GameInformation({ game }: GameInformationProps) {
  const information = [
    {
      label: "Developer",
      value: formatNames(game.developers),
    },
    {
      label: "Publisher",
      value: formatNames(game.publishers),
    },
    {
      label: "Release Date",
      value: formatReleaseDate(game.release_date),
    },
  ];

  return (
    <section className="relative flex h-full min-h-[390px] flex-col overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] p-6 sm:p-7">
    <div className="relative z-10 space-y-5">
  {information.map((item) => {
    const valueColor =
      item.label === "Developer"
        ? "text-[#38BDF8]"
        : item.label === "Publisher"
          ? "text-[#B39ACF]"
          : item.label === "Release Date"
            ? "text-[#34D399]"
            : "text-[#E6E1EA]";

    return (
      <div key={item.label}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777780]">
          {item.label}
        </p>

        <p className={`text-sm leading-6 ${valueColor}`}>
          {item.value}
        </p>
      </div>
    );
  })}
</div>

      {/* Decorative jellyfish */}
      <div className="pointer-events-none relative mt-auto flex min-h-[125px] items-end justify-around overflow-hidden pt-5">
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#24202D]/40 to-transparent" />

        <Jellyfish
          className="relative z-10 w-12 opacity-40"
          delay={0.2}
        />

        <Jellyfish
          className="relative z-10 w-[4.5rem] opacity-70"
          delay={1.3}
        />

        <Jellyfish
          className="relative z-10 w-10 opacity-30"
          delay={0.8}
        />

        <Jellyfish
          className="relative z-10 w-14 opacity-50"
          delay={2}
        />
      </div>

      <style>{`
        @keyframes archive-jelly-float {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
      `}</style>
    </section>
  );
}
