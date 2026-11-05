import { Link } from "react-router-dom";
import { Compass, Library, ListMusic } from "lucide-react";
import InfoPage from "@/components/layout/Infopage";

const FEATURES = [
  {
    icon: Library,
    title: "Track your library",
    body: "Keep every game you own, are playing, or want to play on one shelf, so your backlog stops living in five different launchers.",
  },
  {
    icon: Compass,
    title: "Discover by taste",
    body: "GameShelf groups games with similar traits and suggests titles close to what you already enjoy, instead of only showing what's popular.",
  },
  {
    icon: ListMusic,
    title: "Share playlists",
    body: "Build themed playlists, publish them to the community, and browse collections other players have put together.",
  },
];

export default function About() {
  return (
    <InfoPage
      title="About GameShelf"
      intro="GameShelf is a place to keep track of the games you play and find the next one you'll actually like."
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold leading-6">Why we built it</h2>
        <p className="max-w-2xl text-sm leading-7 text-[#C9C4CF]">
          Finding a good game usually means scrolling store pages and guessing. Tracking what you've already played
          means spreadsheets or memory. GameShelf puts both in one place: a personal shelf for your games, and a
          discovery system that learns from what's on it.
        </p>
        <p className="max-w-2xl text-sm leading-7 text-[#C9C4CF]">
          It started as a university capstone project and is built and maintained by students. Game data comes from
          public store listings, and playlists are created by the community.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] font-semibold leading-6">What you can do</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-3 rounded-2xl border border-[#302438] bg-[#17191E] p-5">
              <Icon className="size-5 text-[#B39ACF]" strokeWidth={1.7} aria-hidden="true" />
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-xs leading-5 text-[#A0A0A8]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-[#302438] bg-[#17191E] p-6">
        <h2 className="text-[16px] font-semibold">Get started</h2>
        <p className="text-xs leading-5 text-[#A0A0A8]">
          Browse games, reviews, and playlists that other players have curated.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            to="/Home"
            className="inline-flex h-10 items-center rounded-xl bg-[#B39ACF] px-4 text-xs font-bold text-[#17101F] transition-colors hover:bg-[#C2ADE0]"
          >
            Browse now
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-10 items-center rounded-xl border border-[#302438] bg-[#000000] px-4 text-xs font-semibold text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B]"
          >
            Contact the team
          </Link>
        </div>
      </section>
    </InfoPage>
  );
}