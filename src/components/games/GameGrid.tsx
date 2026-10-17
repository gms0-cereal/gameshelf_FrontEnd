import GameCard, { type GameSummary } from "./GameCard";

type Props = {
  games: GameSummary[];
  loading?: boolean;
  emptyMessage?: string;
};

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

const GameGrid = ({ games, loading = false, emptyMessage = "No games to show yet." }: Props) => {
  if (loading) {
    return (
      <div className={GRID} role="status" aria-busy="true" aria-label="Loading games">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-[320px] animate-pulse rounded-xl border border-[#46415c] bg-[#393549]"
          />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <p className="rounded-lg border border-[#46415c] bg-[#393549] px-4 py-8 text-center text-sm text-[#a9a6c2]">
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