export default function GameCard({ game }: { game: GameSummary }) {
  const descText =
    game.bio ||
    game.description ||
    game.short_description ||
    "Explore live community catalogs and add this title to your shelf.";

  const badgeText = game.price || game.statusLabel;
  const badgeStyle = game.statusClassName || "border border-[#34D399]/30 bg-[#10251F]/95 text-[#34D399]";

  return (
    <Link
      to={`/gamedetails/${game.slug || game.id}`}
      className="group relative flex h-[420px] w-full flex-col overflow-hidden rounded-2xl border border-transparent bg-[#17191E] transition-all hover:border-[#554363] hover:bg-[#20232B] focus:outline-none focus:ring-2 focus:ring-[#B39ACF]"
    >
      {/* Cover Image Container */}
      <div className="relative h-[160px] w-full shrink-0 overflow-hidden rounded-t-2xl bg-[#20232B]">
        <img
          src={game.cover}
          alt={game.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-110"
        />

        {badgeText && (
          <div className="absolute right-3 top-3 z-10">
            <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm ${badgeStyle}`}>
              {badgeText}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wider text-[#A0A0A8]">
          {game.genres?.slice(0, 2).join(" / ") || "Steam Game"}
        </p>
        
        <h3 className="mt-1 line-clamp-1 text-base font-semibold leading-tight text-[#E6E1EA] transition-colors group-hover:text-[#B39ACF]" title={game.title}>
          {game.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#A0A0A8]">
          {descText}
        </p>

        <div className="flex-1" />

        {/* Metadata Footer */}
        <div className="mt-3 flex flex-col gap-1.5 text-[12px] font-medium text-[#A0A0A8]">
          <div className="flex items-center gap-2">
            <Monitor className="size-3.5 text-[#888891]" />
            <span className="line-clamp-1">{game.platforms?.join(" / ") || "PC"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-[#888891]" />
            <span>{game.release_year ? `Released ${game.release_year}` : "Release date unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="size-3.5 text-[#F5C451]" />
            <span className={game.score ? "text-[#E6E1EA]" : ""}>
              {game.score ? `Score ${game.score.toFixed(1)}/10` : "No score yet"}
            </span>
          </div>
        </div>

        {/* Visual Link Button */}
        <div className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#2A2D35] py-2.5 text-[13px] font-semibold text-[#E6E1EA] transition-colors group-hover:bg-[#B39ACF] group-hover:text-[#17191E]">
          View Game
        </div>
      </div>
    </Link>
  );
}