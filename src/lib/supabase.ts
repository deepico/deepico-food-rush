import type { HighScore } from '../types/game';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const headers: Record<string, string> = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

function isConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function getHighScores(limit = 50, period?: 'today' | 'week' | 'all'): Promise<HighScore[]> {
  if (!isConfigured()) {
    return getLocalHighScores();
  }

  try {
    let url = `${SUPABASE_URL}/rest/v1/highscores?select=*&order=score.desc&limit=${limit}`;

    if (period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      url += `&created_at=gte.${today}`;
    } else if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      url += `&created_at=gte.${weekAgo}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return getLocalHighScores();
  }
}

export async function saveHighScore(data: {
  player_name: string;
  score: number;
  level_reached: string;
  orders_completed: number;
  accuracy: number;
  items_caught: number;
}): Promise<{ rank: number | null }> {
  // Always save locally
  saveLocalHighScore(data);

  if (!isConfigured()) {
    const locals = getLocalHighScores();
    const rank = locals.findIndex((s) => s.score === data.score && s.player_name === data.player_name);
    return { rank: rank >= 0 ? rank + 1 : null };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/highscores`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to save');

    // Get rank
    const allScores = await getHighScores(100, 'all');
    const rank = allScores.findIndex((s) => s.score === data.score && s.player_name === data.player_name);
    return { rank: rank >= 0 ? rank + 1 : null };
  } catch {
    const locals = getLocalHighScores();
    const rank = locals.findIndex((s) => s.score === data.score && s.player_name === data.player_name);
    return { rank: rank >= 0 ? rank + 1 : null };
  }
}

// Local fallback storage
function getLocalHighScores(): HighScore[] {
  try {
    const raw = localStorage.getItem('foodrush_highscores');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHighScore(data: {
  player_name: string;
  score: number;
  level_reached: string;
  orders_completed: number;
  accuracy: number;
  items_caught: number;
}) {
  const scores = getLocalHighScores();
  scores.push({
    id: crypto.randomUUID(),
    ...data,
    created_at: new Date().toISOString(),
  });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem('foodrush_highscores', JSON.stringify(scores.slice(0, 100)));
}
