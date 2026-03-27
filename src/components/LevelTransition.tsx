import type { LevelConfig } from '../types/game';

interface LevelTransitionProps {
  completedLevelIndex: number;
  nextLevel: LevelConfig;
  score: number;
  ordersCompleted: number;
  itemsCaught: number;
  itemsMissed: number;
  onContinue: () => void;
}

export default function LevelTransition({
  completedLevelIndex,
  nextLevel,
  score,
  ordersCompleted,
  itemsCaught,
  itemsMissed,
  onContinue,
}: LevelTransitionProps) {
  const accuracy = itemsCaught + itemsMissed > 0
    ? Math.round((itemsCaught / (itemsCaught + itemsMissed)) * 100)
    : 0;

  const formatNumber = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1E293B] border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-2 text-[#22C55E]">Level geschafft!</h2>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Score bisher:</span>
            <span className="font-bold text-[#2D5BFF]">{formatNumber(score)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Bestellungen:</span>
            <span>{ordersCompleted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Genauigkeit:</span>
            <span>{accuracy}%</span>
          </div>
        </div>

        <div className="py-4 px-4 bg-white/5 rounded-lg mb-6">
          <p className="text-gray-400 text-sm mb-1">Nächstes Level</p>
          <p className="text-2xl font-bold" style={{ color: nextLevel.colors.primary }}>
            {nextLevel.displayName}
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3 bg-[#2D5BFF] hover:bg-[#1E4AE6] rounded-lg font-bold text-lg transition-colors"
        >
          ▶ Weiter
        </button>
      </div>
    </div>
  );
}
