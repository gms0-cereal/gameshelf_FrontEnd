
import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { Heart, ListMusic } from "lucide-react";
import type { Playlist, PlaylistGame } from "@/services/playlistService";

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, "y"],
    [60 * 60 * 24 * 30, "mo"],
    [60 * 60 * 24 * 7, "w"],
    [60 * 60 * 24, "d"],
    [60 * 60, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return "just now";
}

const steamCover = (appid: number) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

function coverFor(game?: PlaylistGame): string | null {
  if (!game) return null;
  return game.cover_url ?? (game.steam_appid ? steamCover(game.steam_appid) : null);
}

const getFullUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `http://127.0.0.1:8000${url.startsWith("/") ? "" : "/"}${url}`;
};

/** Owner Avatar component matching the GameShelf design system */
const OwnerAvatar = memo(({ src, name }: { src?: string | null; name: string }) => {
  const [failed, setFailed] = useState(false);
  const initials = name ? name.slice(0, 2).toUpperCase() : "U";

  return src && !failed ? (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  ) : (
    <div
      className="flex h-full w-full items-center justify-center bg-[#20232B] text-[11px] font-semibold text-[#B39ACF]"
      aria-hidden="true"
    >
      {initials}
    </div>
  );
});
OwnerAvatar.displayName = "OwnerAvatar";

function Cover({ src, className }: { src: string | null; className: string }) {
  const [failed, setFailed] = useState(false);

  return src && !failed ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center bg-[#20232B] ${className}`}
      aria-hidden="true"
    >
      <ListMusic className="size-5 text-[#B39ACF]" />
    </div>
  );
}

const ownerOf = (p: Playlist) => p.owner.nickname || p.owner.username;
const titlesLabel = (n: number) => `${n} ${n === 1 ? "title" : "titles"}`;

/** Home carousel card: slanted cover strip, owner badge on top. */
export function PlaylistCarouselCard({ playlist }: { playlist: Playlist }) {
  const clips = [
    "polygon(0 0, 100% 0, 88% 100%, 0 100%)",
    "polygon(12% 0, 100% 0, 88% 100%, 0 100%)",
    "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
  ];

  return (
    <Link
      to={`/playlists/${playlist.owner.username}/${playlist.id}`}
      className="group block w-[300px] shrink-0 snap-start rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF] sm:w-[360px]"
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] transition-colors group-hover:border-[#B39ACF]/60">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-y-0"
            style={{ left: `${i * 30}%`, width: "40%", clipPath: clips[i], zIndex: i }}
          >
            <Cover src={coverFor(playlist.games[i])} className="h-full w-full" />
          </div>
        ))}

        <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-[#302438] bg-black/70 px-2.5 py-1 font-mono text-[11px] text-[#B39ACF] backdrop-blur">
          {ownerOf(playlist)}
        </span>
      </div>

      <h3 className="mt-3 truncate text-[15px] font-semibold text-[#E6E1EA] transition-colors group-hover:text-[#B39ACF]">
        {playlist.title}
      </h3>

      <p className="mt-1 font-mono text-[11px] text-[#A0A0A8]">
        {titlesLabel(playlist.game_count)} ·{" "}
        <span className="text-[#34D399]">{timeAgo(playlist.updated_at)}</span>
      </p>
    </Link>
  );
}

/** Browse page card: owner row, meta line, 4 covers, "View all". */
export function PlaylistListCard({ playlist }: { playlist: Playlist }) {
  const name = ownerOf(playlist);
  const avatarUrl = getFullUrl(playlist.owner.avatar_url);

  return (
    <Link
      to={`/playlists/${playlist.owner.username}/${playlist.id}`}
      className="group block rounded-2xl border border-[#302438] bg-[#17191E] p-5 transition-all hover:border-[#554363] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]"
    >
      <div className="flex items-center gap-3">
        <div className="size-9 shrink-0 overflow-hidden rounded-full border border-[#554363] bg-[#20232B]">
          <OwnerAvatar src={avatarUrl} name={name} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[#E6E1EA] transition-colors group-hover:text-[#B39ACF]">
            {name}
          </p>

          <p className="truncate font-mono text-[11px] text-[#A0A0A8]">
            <span className="capitalize text-[#B39ACF]">{playlist.visibility}</span>
            {" · "}
            <span className="text-[#38BDF8]">{titlesLabel(playlist.game_count)}</span>
            {" · "}
            <Heart
              className="inline size-3 -translate-y-px fill-[#E58B91] text-[#E58B91]"
              aria-hidden="true"
            />{" "}
            {playlist.like_count}
            {" · Created "}
            <span className="text-[#FBBF24]">{timeAgo(playlist.created_at)}</span>
            {" · Updated "}
            <span className="text-[#34D399]">{timeAgo(playlist.updated_at)}</span>
          </p>
        </div>
      </div>

      <h3 className="mt-4 truncate text-[17px] font-semibold text-[#E6E1EA] transition-colors group-hover:text-[#B39ACF]">
        {playlist.title}
      </h3>

      {playlist.description && (
        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[#A0A0A8]">
          {playlist.description}
        </p>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Cover
            key={i}
            src={coverFor(playlist.games[i])}
            className="aspect-[2/3] w-full rounded-xl border border-[#302438]"
          />
        ))}
      </div>

      <p className="mt-4 inline-block text-[13px] font-medium text-[#B39ACF] transition-transform group-hover:translate-x-1">
        View all {titlesLabel(playlist.game_count)} →
      </p>
    </Link>
  );
}
