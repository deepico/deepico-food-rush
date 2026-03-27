import type { GameState } from '../types/game';
import { LEVELS, ENDLESS_LEVEL } from '../game/levels/levels';

interface GameOverScreenProps {
  state: GameState;
  playerName: string;
  highScoreRank: number | null;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({ state, playerName, highScoreRank, onRestart, onMenu }: GameOverScreenProps) {
  const level = state.levelIndex >= LEVELS.length ? ENDLESS_LEVEL : LEVELS[state.levelIndex];
  const accuracy = state.itemsCaught + state.itemsMissed > 0
    ? Math.round((state.itemsCaught / (state.itemsCaught + state.itemsMissed)) * 100)
    : 0;

  const formatNumber = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E293B] border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
        <h2 className="text-4xl font-bold mb-6 text-red-400">GAME OVER</h2>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-lg">
            <span className="text-gray-400">Spieler:</span>
            <span className="font-semibold">{playerName}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-400">Score:</span>
            <span className="font-bold text-[#2D5BFF] text-2xl">{formatNumber(state.score)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Level erreicht:</span>
            <span>{level.displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Bestellungen erfüllt:</span>
            <span>{state.ordersCompleted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Items gefangen:</span>
            <span>{state.itemsCaught}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Genauigkeit:</span>
            <span>{accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Max Combo:</span>
            <span className="text-[#F59E0B]">x{state.maxCombo}</span>
          </div>
        </div>

        {highScoreRank !== null && (
          <div className="py-3 px-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg mb-6">
            <span className="text-[#F59E0B] font-bold text-lg">
              🏆 NEUER HIGH SCORE! Rang #{highScoreRank}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-[#2D5BFF] hover:bg-[#1E4AE6] rounded-lg font-bold transition-colors"
          >
            ▶ Nochmal (R)
          </button>
          <button
            onClick={onMenu}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-semibold transition-colors"
          >
            Menü
          </button>
        </div>
      </div>
    </div>
  );
}
