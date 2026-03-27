import { useRef, useEffect, useState } from 'react';

interface CanvasProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ASPECT = GAME_WIDTH / GAME_HEIGHT;

export default function GameCanvas({ onCanvasReady }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const scaleX = cw / GAME_WIDTH;
      const scaleY = ch / GAME_HEIGHT;
      setScale(Math.min(scaleX, scaleY, 1));
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div ref={containerRef} className="flex items-center justify-center w-full h-full p-4">
      <canvas
        ref={canvasRef}
        className="block rounded-lg shadow-2xl border border-white/10"
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        style={{
          width: `${GAME_WIDTH * scale}px`,
          height: `${GAME_HEIGHT * scale}px`,
        }}
      />
    </div>
  );
}
