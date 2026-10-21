const BASE_URL = 'http://127.0.0.1:8000/api/v1';

export interface Game {
  id: string;
  title?: string;
  name?: string;
  genre?: string;
}

// Fetch all games in collection (SCRUM-26 requirement)
export async function fetchGames(): Promise<Game[]> {
  const response = await fetch(`${BASE_URL}/games`);
  if (!response.ok) throw new Error('Failed to fetch games');
  return response.json();
}

// Fetch single game by ID
export async function fetchGameById(id: string): Promise<Game> {
  const response = await fetch(`${BASE_URL}/games/${id}`);
  if (!response.ok) throw new Error('Failed to fetch game details');
  return response.json();
}