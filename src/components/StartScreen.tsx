import { useState, useEffect } from 'react';

interface StartScreenProps {
  onStart: (name: string) => void;
  onShowHighScores: () => void;
}

export default function StartScreen({ onStart, onShowHighScores }: StartScreenProps) {
  const [name, setName] = useState(() => localStorage.getItem('playerName') || '');
  const [showInstructions, setShowInstructions] = useState(false);

  const handleStart = () => {
    const trimmed = name.trim() || 'Spieler';
    localStorage.setItem('playerName', trimmed);
    onStart(trimmed);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && name.trim()) {
        handleStart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [name]);

  if (showInstructions) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">📖 Anleitung</h2>
          <div className="space-y-3 text-left text-sm text-gray-300">
            <p>🎯 <strong>Ziel:</strong> Fange die richtigen Lebensmittel, um Bestellungen zu erfüllen!</p>
            <p>⬅️➡️ <strong>Pfeiltasten:</strong> Korb bewegen</p>
            <p>⎵ <strong>Leertaste:</strong> Magnet-Boost (1x pro Level)</p>
            <p>🅿️ <strong>P:</strong> Pause</p>
            <hr className="border-white/10" />
            <p>✅ Richtiges Item (in Bestellung): <span className="text-green-400">+10 Punkte</span></p>
            <p>📦 Falsches Item: <span className="text-blue-400">+2 Punkte</span></p>
            <p>💀 Verdorbenes Item: <span className="text-red-400">-15 Punkte</span></p>
            <p>⭐ Goldenes Item: <span className="text-yellow-400">+25 Punkte</span></p>
            <p>🏆 Bestellung komplett: <span className="text-green-400">+50 Bonus</span></p>
            <p>🔥 Combo (3+): <span className="text-yellow-400">x2 Multiplikator</span></p>
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            className="mt-6 w-full py-3 bg-[#2D5BFF] hover:bg-[#1E4AE6] rounded-lg font-semibold transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4 animate-bounce">🏭</div>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-[#2D5BFF] to-[#22C55E] bg-clip-text text-transparent">
            DEEPICO
          </h1>
          <h2 className="text-4xl font-bold text-[#F59E0B]">FOOD RUSH</h2>
        </div>

        <div className="mb-6 flex justify-center gap-2 text-3xl">
          {['🍎', '🥩', '🧀', '🥤', '🥐'].map((e, i) => (
            <span
              key={i}
              className="inline-block animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {e}
            </span>
          ))}
        </div>

        <div className="bg-[#1E293B] border border-white/10 rounded-xl p-6 max-w-sm mx-auto shadow-2xl">
          <label className="block text-sm text-gray-400 mb-2 text-left">Spielername</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="Dein Name..."
            className="w-full px-4 py-3 bg-[#0F172A] border border-white/10 rounded-lg text-white text-center text-lg focus:outline-none focus:border-[#2D5BFF] transition-colors"
            autoFocus
            maxLength={20}
          />

          <button
            onClick={handleStart}
            className="mt-4 w-full py-3 bg-[#2D5BFF] hover:bg-[#1E4AE6] rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            ▶ SPIEL STARTEN
          </button>

          <div className="mt-3 flex gap-2">
            <button
              onClick={onShowHighScores}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
            >
              🏆 High Scores
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
            >
              📖 Anleitung
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-500">Powered by Deepico</p>
      </div>
    </div>
  );
}
