import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import InfoPage from "@/components/layout/Infopage";

type Faq = { q: string; a: string };
type Group = { title: string; items: Faq[] };

const GROUPS: Group[] = [
  {
    title: "Playlists",
    items: [
      {
        q: "How do I create a playlist?",
        a: "Open Community Playlists and choose \"Create new playlist\" next to your profile. Give it a title, add games, and pick whether it's public or private.",
      },
      {
        q: "What's the difference between public and private?",
        a: "Public playlists show up on Community Playlists for everyone. Private playlists are only visible to you.",
      },
      {
        q: "Why does the genre filter show fewer playlists than I expected?",
        a: "A playlist appears under a genre when at least one of its games has that genre. Genre data for a game is filled in the first time its playlist is opened, so newly added playlists can take a visit to show up.",
      },
      {
        q: "Can I delete a playlist?",
        a: "Yes. Open the playlist you own and use the delete option. Deleted playlists no longer appear in the community list.",
      },
    ],
  },
  {
    title: "Discovery and recommendations",
    items: [
      {
        q: "How does GameShelf recommend games?",
        a: "It looks at the traits of games you've added and groups similar games together, then suggests titles from the groups closest to your taste.",
      },
      {
        q: "Why are my recommendations off?",
        a: "Suggestions improve as your shelf grows. Adding more games, especially ones you really like, gives the system more to work with.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "How do I change my nickname or avatar?",
        a: "Open your profile settings. Your nickname is shown instead of your username wherever it's set.",
      },
      {
        q: "A game's details or cover look wrong. What can I do?",
        a: "Game information comes from public store listings. If something is clearly incorrect, send us the game's name through the contact page and we'll look into it.",
      },
    ],
  },
];

function FaqItem({ item }: { item: Faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#302438] last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-sm font-medium text-[#E6E1EA] transition-colors hover:text-[#B39ACF]"
      >
        {item.q}
        <ChevronDown
          className={`size-4 shrink-0 text-[#B39ACF] transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <p className="pb-4 pr-8 text-sm leading-7 text-[#A0A0A8]">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Help() {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(term)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <InfoPage title="Help" intro="Answers to common questions about playlists, recommendations and your account.">
      <label className="flex flex-col gap-2 text-[11px] font-semibold">
        Search help
        <span className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
            placeholder="Search questions…"
            className="h-10 w-full rounded-xl border border-[#302438] bg-[#17191E] pl-3 pr-9 text-xs font-normal text-[#E6E1EA] outline-none placeholder:text-[#77717F] transition-colors hover:border-[#554363] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/20"
          />
          <Search
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#B39ACF]"
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </span>
      </label>

      {groups.length === 0 ? (
        <p role="status" className="py-8 text-center text-sm text-[#A0A0A8]">
          No answers match "{query}". Try different words, or{" "}
          <Link to="/contact" className="font-semibold text-[#B39ACF] hover:underline">
            ask us directly
          </Link>
          .
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-2">
            <h2 className="text-[18px] font-semibold leading-6">{g.title}</h2>
            <div className="rounded-2xl border border-[#302438] bg-[#17191E] px-5">
              {g.items.map((item) => (
                <FaqItem key={item.q} item={item} />
              ))}
            </div>
          </section>
        ))
      )}

      <p className="text-xs text-[#A0A0A8]">
        Still stuck?{" "}
        <Link to="/contact" className="font-semibold text-[#B39ACF] hover:underline">
          Contact us
        </Link>
        .
      </p>
    </InfoPage>
  );
}