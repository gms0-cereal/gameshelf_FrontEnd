import GameCard, { type GameSummary } from "./GameCard";

type Props = {
  games: GameSummary[];
  loading?: boolean;
  emptyMessage?: string;
};

const GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4";

const GameGrid = ({ games, loading = false, emptyMessage = "No games to show yet." }: Props) => {
  if (loading) {
    return (
      <div className={GRID} role="status" aria-busy="true" aria-label="Loading games">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-[360px] animate-pulse rounded-xl border border-[#55516c] bg-[#373646]"
          />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <p className="rounded-lg border border-[#55516c] bg-[#373646] px-4 py-8 text-center text-sm text-[#b4aec7]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={GRID}>
      {games.map((game) => (
        <li key={game.id}>
          <GameCard game={game} />
        </li>
      ))}
    </ul>
  );
};

export default GameGrid;