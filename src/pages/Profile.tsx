import { Link } from "react-router-dom";
import { Gamepad2, Library, Pencil } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";


// import "@fontsource/inter/400.css";
// import "@fontsource/inter/600.css";
// import "@fontsource/inter/700.css";

const STATISTICS = [
  { label: "Playlist", value: "24" },
  { label: "Completed", value: "10" },
  { label: "Reviews", value: "8" },
  { label: "Average rating", value: "8.4" },
];

const FAVORITES = [
  {
    title: "Hollow Knight",
    slug: "hollow-knight",
    image: "/images/games/hollow-knight.png",
  },
  {
    title: "Hades",
    slug: "hades",
    image: "/images/games/hades.png",
  },
  {
    title: "Stardew Valley",
    slug: "stardew-valley",
    image: "/images/games/stardew-valley.png",
  },
];

const PANEL =
  "gap-6 rounded-2xl border-0 bg-[#373646] p-7 " +
  "text-[#e0deeb] shadow-none ring-1 ring-inset ring-[#55516c]";

const OUTLINE_BUTTON =
  "h-11 gap-[9px] rounded-lg border border-[#55516c] " +
  "bg-[#373646] px-[18px] py-[13px] text-sm font-semibold " +
  "leading-[17px] text-[#e0deeb] shadow-none " +
  "hover:bg-[#454256] hover:text-[#e0deeb] " +
  "[&_svg]:size-[18px]";

<Navbar />

function ProfileBanner() {
const { user, loading } = useAuth();
  return (
   <section
  aria-labelledby="player-name"
  className="relative isolate flex min-h-[310px] items-end overflow-hidden rounded-2xl bg-[#29263b] p-6 md:h-[310px] md:p-9"
>
  <img
  src={user?.banner_url || "/images/profile-banner.png"}
  alt=""
  className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
  />

  <div
    aria-hidden="true"
    className="absolute inset-0 -z-10"
    style={{
      background:
        "linear-gradient(180deg, rgba(32,30,47,0.2) 0%, rgba(32,30,47,0.851) 100%)",
    }}
  />

  <div className="flex w-full flex-wrap items-center gap-6 md:flex-nowrap">
<Avatar className="size-24 shrink-0 overflow-hidden border-2 border-[#8870b6] bg-[#4d3e68] after:hidden">
  <AvatarImage
    src={user?.avatar_url || undefined}
    alt={user?.nickname || user?.username || "Player"}
    className="object-cover"
  />
  <AvatarFallback className="bg-[#4d3e68]">
    <Gamepad2 className="size-11 text-[#c2ade7]" strokeWidth={1.7} />
  </AvatarFallback>
</Avatar>
    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
      {/* <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c2ade7]">
        Player Profile
      </p> */}

      <h2
        id="player-name"
        className="break-words text-3xl font-bold tracking-tight text-white md:text-4xl"
      >
        {user?.nickname || user?.username || "Player"}
      </h2>

      <p className="max-w-2xl whitespace-pre-wrap break-words text-sm leading-relaxed text-[#d0ccdc] md:text-base">
        {user?.bio || "No bio yet."}
      </p>
    </div>

    <Button
      asChild
      variant="outline"
      className={`${OUTLINE_BUTTON} w-[137px] shrink-0 border-white/20 bg-black/20 text-white hover:bg-white/10 hover:text-white`}
    >
      <Link to="/profile/edit">
        <Pencil
          className="size-4"
          strokeWidth={1.7}
          aria-hidden="true"
        />
        Edit Profile
      </Link>
    </Button>
  </div>
</section>
  );
}

function PlayerStatistics() {
  return (
    <section aria-label="Player statistics">
      <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {STATISTICS.map((statistic) => (
          <div
            key={statistic.label}
            className="flex h-[135px] flex-col gap-6 rounded-2xl bg-[#373646] p-7 ring-1 ring-inset ring-[#55516c]"
          >
            <dt className="order-2 text-[13px] leading-4 text-[#b4aec7]">
              {statistic.label}
            </dt>

            <dd className="order-1 text-[32px] font-semibold leading-[39px] text-[#c2ade7]">
              {statistic.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FavoriteGames() {
  return (
    <section
      aria-labelledby="favorite-games-title"
      className="flex flex-col gap-8"
    >
      <div className="flex min-h-[29px] flex-wrap items-center justify-between gap-3">
        <h2
          id="favorite-games-title"
          className="text-2xl font-semibold leading-[29px] tracking-[-0.5px]"
        >
          Favorite games
        </h2>

        <p className="text-[13px] leading-4 text-[#b4aec7]">
          Hollow Knight • Hades • Stardew Valley
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {FAVORITES.map((game) => (
          <Link
            key={game.slug}
            to={`/games/${game.slug}`}
            className="group flex min-w-0 flex-col gap-[14px]"
          >
            <img
              src={game.image}
              alt=""
              loading="lazy"
              className="h-[200px] w-full rounded-[10px] object-cover object-center"
            />

            <h3 className="text-[17px] font-semibold leading-[21px] group-hover:text-[#c2ade7]">
              {game.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProfileActivity() {
  return (
    <section
      aria-label="Reviews and game list"
      className="grid items-start gap-7 lg:grid-cols-[minmax(0,870fr)_minmax(0,414fr)]"
    >
      <Card className={PANEL}>
        <div className="flex min-h-[29px] items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold leading-[29px] tracking-[-0.5px]">
            Recent review
          </h2>

          <span className="shrink-0 text-[13px] leading-4 text-[#b4aec7]">
            9 / 10
          </span>
        </div>

        <p className="text-sm leading-[21px]">
          Hollow Knight
        </p>
      </Card>

      <Card className={`${PANEL} items-start`}>
        <p className="text-sm leading-[21px] text-[#b4aec7]">
          List visibility: Public
        </p>

        <Button
          asChild
          variant="outline"
          className={`${OUTLINE_BUTTON} w-[168px]`}
        >
          <Link to="/my-list">
            <Library
              className="text-[#55516c]"
              strokeWidth={1.7}
              aria-hidden="true"
            />
            View Game List
          </Link>
        </Button>
      </Card>
    </section>
  );
}

export default function Profile() {
const { user, loading } = useAuth();
   if (loading) {
    return <div>Loading profile...</div>;
  }
  return (
    
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
       <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">

          <ProfileBanner />
          <PlayerStatistics />
          <FavoriteGames />
          <ProfileActivity />
        </main>

        <Footer />
      </div>
    </div>
  );
}