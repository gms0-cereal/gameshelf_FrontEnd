import { useState } from "react";
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

function Cover({ src, className }: { src: string | null; className: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center bg-gradient-to-br from-[#3b3560] to-[#1d2b33] ${className}`} aria-hidden="true">
      <ListMusic className="size-5 text-[#8b86a3]" />
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
      to={`/playlists/${playlist.id}`}
      className="group block w-[300px] shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6] sm:w-[360px] rounded-xl"
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#2a2838]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-y-0"
            style={{ left: `${i * 30}%`, width: "40%", clipPath: clips[i], zIndex: i }}
          >
            <Cover src={coverFor(playlist.games[i])} className="h-full w-full" />
          </div>
        ))}
        <span className="absolute left-3 top-3 z-10 rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-[#e0deeb] backdrop-blur">
          {ownerOf(playlist)}
        </span>
      </div>
      <h3 className="mt-3 truncate text-[15px] font-semibold group-hover:text-[#c2ade7]">{playlist.title}</h3>
      <p className="mt-1 font-mono text-[11px] text-[#8b86a3]">
        {titlesLabel(playlist.game_count)} {timeAgo(playlist.updated_at)}
      </p>
    </Link>
  );
}

/** Browse page card: owner row, meta line, 4 covers, "View all". */
export function PlaylistListCard({ playlist }: { playlist: Playlist }) {
  const name = ownerOf(playlist);

  return (
    <Link
      to={`/playlists/${playlist.id}`}
      className="block rounded-xl border border-[#2f2d40] bg-[#262436] p-5 transition-colors hover:border-[#8b6fd6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6]"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#8b6fd6]/40 text-xs font-semibold">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{name}</p>
          <p className="truncate font-mono text-[11px] text-[#8b86a3]">
            <span className="capitalize">{playlist.visibility}</span> · {titlesLabel(playlist.game_count)} ·{" "}
            <Heart className="inline size-3 -translate-y-px" aria-hidden="true" /> {playlist.like_count} · Created{" "}
            {timeAgo(playlist.created_at)} · Updated {timeAgo(playlist.updated_at)}
          </p>
        </div>
      </div>

      <h3 className="mt-4 truncate text-[17px] font-semibold">{playlist.title}</h3>
      {playlist.description && (
        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[#b4aec7]">{playlist.description}</p>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Cover key={i} src={coverFor(playlist.games[i])} className="aspect-[2/3] w-full rounded-md" />
        ))}
      </div>

      <p className="mt-4 text-[13px] font-medium text-[#c2ade7]">
        View all {titlesLabel(playlist.game_count)} →
      </p>
    </Link>
  );
}