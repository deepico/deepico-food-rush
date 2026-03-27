import { useState, useCallback, useRef, useEffect } from 'react';
import GameCanvas from './game/Canvas';
import { GameEngine } from './game/GameEngine';
import { LEVELS, ENDLESS_LEVEL } from './game/levels/levels';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import LevelTransition from './components/LevelTransition';
import HighScoreTable from './components/HighScoreTable';
import { saveHighScore } from './lib/supabase';
import type { GameState } from './types/game';

type Screen = 'menu' | 'playing' | 'gameOver' | 'highScores' | 'levelComplete';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [highScoreRank, setHighScoreRank] = useState<number | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const gameOverHandled = useRef(false);

  const onCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    if (engineRef.current) {
      engineRef.current.destroy();
    }
    // No event callbacks – we use polling only
    const engine = new GameEngine(canvas, () => {});
    engineRef.current = engine;
    engine.renderMenu();
  }, []);

  // Poll game state – runs always, checks engine status
  useEffect(() => {
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;

      const st = engine.state;

      // Only react to engine status changes when we're in 'playing' screen
      if (screen !== 'playing') return;

      if (st.gameStatus === 'gameOver' && !gameOverHandled.current) {
        gameOverHandled.current = true;
        const snapshot = { ...st };
        setGameState(snapshot);
        setScreen('gameOver');

        // Save score async
        const level = st.levelIndex >= LEVELS.length ? ENDLESS_LEVEL : LEVELS[st.levelIndex];
        const accuracy = st.itemsCaught + st.itemsMissed > 0
          ? Math.round((st.itemsCaught / (st.itemsCaught + st.itemsMissed)) * 100)
          : 0;
        saveHighScore({
          player_name: playerName || 'Spieler',
          score: snapshot.score,
          level_reached: level.name,
          orders_completed: snapshot.ordersCompleted,
          accuracy,
          items_caught: snapshot.itemsCaught,
        }).then((result) => {
          setHighScoreRank(result.rank);
        });
      } else if (st.gameStatus === 'levelComplete') {
        setGameState({ ...st });
        setScreen('levelComplete');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [screen, playerName]);

  const startGame = (name: string) => {
    setPlayerName(name);
    setScreen('playing');
    setHighScoreRank(null);
    gameOverHandled.current = false;
    engineRef.current?.startGame();
  };

  const restartGame = () => {
    setScreen('playing');
    setHighScoreRank(null);
    gameOverHandled.current = false;
    engineRef.current?.startGame();
  };

  const goToMenu = () => {
    setScreen('menu');
    gameOverHandled.current = false;
    engineRef.current?.stop();
    engineRef.current?.renderMenu();
  };

  const continueToNextLevel = () => {
    // IMPORTANT: set engine state BEFORE changing screen
    // so the poll doesn't re-detect 'levelComplete'
    engineRef.current?.continueToNextLevel();
    setScreen('playing');
  };

  return (
    <div className="h-screen flex flex-col bg-[#0F172A] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏭</span>
          <span className="font-bold text-lg">
            <span className="text-[#2D5BFF]">Deepico</span>{' '}
            <span className="text-[#F59E0B]">Food Rush</span>
          </span>
        </div>
        {screen === 'playing' && (
          <div className="text-sm text-gray-400">
            P = Pause | Leertaste = Boost
          </div>
        )}
      </header>

      {/* Game Area */}
      <main className="flex-1 flex items-center justify-center relative">
        <GameCanvas onCanvasReady={onCanvasReady} />

        {screen === 'menu' && (
          <StartScreen
            onStart={startGame}
            onShowHighScores={() => setScreen('highScores')}
          />
        )}

        {screen === 'gameOver' && gameState && (
          <GameOverScreen
            state={gameState}
            playerName={playerName}
            highScoreRank={highScoreRank}
            onRestart={restartGame}
            onMenu={goToMenu}
          />
        )}

        {screen === 'levelComplete' && gameState && engineRef.current && (
          <LevelTransition
            completedLevelIndex={gameState.levelIndex - 1}
            nextLevel={engineRef.current.getCurrentLevel()}
            score={gameState.score}
            ordersCompleted={gameState.ordersCompleted}
            itemsCaught={gameState.itemsCaught}
            itemsMissed={gameState.itemsMissed}
            onContinue={continueToNextLevel}
          />
        )}

        {screen === 'highScores' && (
          <HighScoreTable onBack={goToMenu} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-2 text-xs text-gray-500 border-t border-white/5">
        Powered by Deepico &middot; ← → Bewegen &middot; Leertaste Boost &middot; P Pause
      </footer>
    </div>
  );
}
