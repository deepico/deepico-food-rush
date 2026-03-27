import { useState, useEffect } from 'react';
import type { HighScore } from '../types/game';
import { getHighScores } from '../lib/supabase';

interface HighScoreTableProps {
  onBack: () => void;
  highlightScore?: number;
}

type Period = 'today' | 'week' | 'all';

export default function HighScoreTable({ onBack, highlightScore }: HighScoreTableProps) {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [period, setPeriod] = useState<Period>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScores();
  }, [period]);

  const loadScores = async () => {
    setLoading(true);
    const data = await getHighScores(50, period);
    setScores(data);
    setLoading(false);
  };

  const formatNumber = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-CH');

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🏆 High Scores</h2>
          <button
            onClick={onBack}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            ← Zurück
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['today', 'week', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'bg-[#2D5BFF] text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'
              }`}
            >
              {p === 'today' ? 'Heute' : p === 'week' ? 'Woche' : 'Alle Zeit'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Laden...</div>
          ) : scores.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Noch keine Scores. Sei der Erste! 🎮
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="py-2 text-left w-10">#</th>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-right">Score</th>
                  <th className="py-2 text-right">Level</th>
                  <th className="py-2 text-right hidden sm:table-cell">Datum</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => {
                  const isHighlight = highlightScore !== undefined && s.score === highlightScore;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-white/5 ${isHighlight ? 'bg-[#F59E0B]/10' : ''}`}
                    >
                      <td className="py-2 text-gray-400">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="py-2 font-medium">{s.player_name}</td>
                      <td className="py-2 text-right font-bold text-[#2D5BFF]">
                        {formatNumber(s.score)}
                      </td>
                      <td className="py-2 text-right text-xs">{s.level_reached}</td>
                      <td className="py-2 text-right text-gray-400 text-xs hidden sm:table-cell">
                        {formatDate(s.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
