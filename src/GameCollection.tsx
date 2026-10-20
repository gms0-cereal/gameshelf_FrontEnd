import { useEffect, useState } from 'react';
import { fetchGames, fetchGameById, type Game } from './api';

export default function GameCollection(): import("react").JSX.Element {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    fetchGames()
      .then((data) => setGames(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSelectGame = async (id: string) => {
    try {
      const details = await fetchGameById(id);
      setSelectedGame(details);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Games Collection</h2>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {games.map((game) => (
          <div key={game.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>{game.title || game.name}</h3>
            <p>ID: {game.id}</p>
            <button onClick={() => handleSelectGame(game.id)}>View Details</button>
          </div>
        ))}
      </div>

      {selectedGame && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Selected Game Details</h3>
          <p><strong>ID:</strong> {selectedGame.id}</p>
          <p><strong>Title:</strong> {selectedGame.title || selectedGame.name}</p>
        </div>
      )}
    </div>
  );
}