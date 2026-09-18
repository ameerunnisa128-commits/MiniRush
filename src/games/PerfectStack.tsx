import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';

interface PerfectStackProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

interface StackLayer {
  y: number;
  x: number;
  width: number;
  color: string;
}

const COLORS = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7',
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
  '#06b6d4', '#14b8a6', '#10b981', '#84cc16',
  '#eab308', '#f97316'
];

export const PerfectStackGame: React.FC<PerfectStackProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Stack of placed blocks
  const [stack, setStack] = useState<StackLayer[]>([
    { y: 0, x: 50, width: 140, color: COLORS[0] }
  ]);

  // Current moving block
  const movingXRef = useRef<number>(10);
  const movingDirRef = useRef<number>(1);
  const movingSpeedRef = useRef<number>(3.0);
  const movingWidthRef = useRef<number>(140);
  const animFrameRef = useRef<number>(0);
  const [, setRerender] = useState({});

  const updateMoving = useCallback(() => {
    let x = movingXRef.current + movingSpeedRef.current * movingDirRef.current;
    if (x + movingWidthRef.current > 240) {
      x = 240 - movingWidthRef.current;
      movingDirRef.current = -1;
    } else if (x < 0) {
      x = 0;
      movingDirRef.current = 1;
    }
    movingXRef.current = x;
    setRerender({});
    animFrameRef.current = requestAnimationFrame(updateMoving);
  }, []);

  const startGame = () => {
    setScore(0);
    setPerfects(0);
    setCombo(0);
    movingWidthRef.current = 140;
    movingXRef.current = 50;
    movingSpeedRef.current = 3.0;
    movingDirRef.current = 1;
    setStack([
      { y: 0, x: 50, width: 140, color: COLORS[0] }
    ]);
    setIsPlaying(true);
    setFeedback(null);
    sound.playClick();
    animFrameRef.current = requestAnimationFrame(updateMoving);
  };

  const handleDrop = () => {
    if (!isPlaying) {
      startGame();
      return;
    }

    const currentX = movingXRef.current;
    const currentWidth = movingWidthRef.current;
    const topBlock = stack[stack.length - 1];

    // Calculate overlap
    const leftEdge = Math.max(currentX, topBlock.x);
    const rightEdge = Math.min(currentX + currentWidth, topBlock.x + topBlock.width);
    const overlap = rightEdge - leftEdge;

    if (overlap <= 0) {
      // Completely missed!
      sound.playCrash();
      setFeedback('MISSED TOWER! 💥');
      cancelAnimationFrame(animFrameRef.current);
      setIsPlaying(false);
      setTimeout(() => {
        onGameOver(score, perfects);
      }, 600);
      return;
    }

    const diff = Math.abs(currentX - topBlock.x);
    const isPerfect = diff <= 4;

    let newWidth = overlap;
    let newX = leftEdge;

    if (isPerfect) {
      newWidth = topBlock.width; // Keep exact width
      newX = topBlock.x;
      const newCombo = combo + 1;
      setCombo(newCombo);
      setPerfects(p => p + 1);
      sound.playPerfect(Math.min(newCombo, 7));
      setFeedback('PERFECT! 🎵');

      // Bonus widening after 3 perfects
      if (newCombo % 3 === 0) {
        newWidth = Math.min(150, newWidth + 10);
        newX = Math.max(0, newX - 5);
      }
    } else {
      setCombo(0);
      sound.playThunk();
      setFeedback(null);
    }

    const nextScore = score + (isPerfect ? 250 : 100);
    setScore(nextScore);

    const newColor = COLORS[(stack.length) % COLORS.length];
    const newStack = [
      ...stack,
      { y: stack.length * 20, x: newX, width: newWidth, color: newColor }
    ];

    setStack(newStack);
    movingWidthRef.current = newWidth;
    movingSpeedRef.current = Math.min(6.0, 3.0 + stack.length * 0.15);
    movingXRef.current = movingDirRef.current === 1 ? 0 : (240 - newWidth);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const movingX = movingXRef.current;
  const movingWidth = movingWidthRef.current;
  const currentHeight = stack.length;
  // Auto scroll down as tower grows
  const viewOffsetY = Math.max(0, (stack.length - 6) * 20);

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game"
      onClick={handleDrop}
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black font-display text-fuchsia-400">{score.toLocaleString()}</span>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Floors</span>
          <span className="text-xl font-black text-amber-400">🏢 {currentHeight}</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Streak</span>
          <span className="text-xl font-bold text-pink-400">🔥 {combo}x</span>
        </div>
      </div>

      {/* 3-Second Rule */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🏢 <span className="text-fuchsia-300 font-semibold">Tap to drop block!</span> Align cleanly to prevent shrinking!
        </p>
      </div>

      {/* Tower Building Canvas Area */}
      <div className="relative w-full h-80 bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-inner flex flex-col items-center justify-end p-4">
        {/* Sky background stars */}
        <div className="absolute inset-0 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

        {/* Tower Stack Container */}
        <div 
          className="relative w-60 h-full transition-transform duration-150"
          style={{ transform: `translateY(${viewOffsetY}px)` }}
        >
          {/* Active Moving Block */}
          {isPlaying && (
            <div
              className="absolute h-5 rounded shadow-lg shadow-white/20 transition-all border border-white/50"
              style={{
                bottom: `${(stack.length) * 20}px`,
                left: `${movingX}px`,
                width: `${movingWidth}px`,
                backgroundColor: COLORS[(stack.length) % COLORS.length],
              }}
            />
          )}

          {/* Placed Blocks */}
          {stack.map((layer, idx) => (
            <div
              key={idx}
              className="absolute h-5 rounded shadow-md border-t border-white/20"
              style={{
                bottom: `${idx * 20}px`,
                left: `${layer.x}px`,
                width: `${layer.width}px`,
                backgroundColor: layer.color,
              }}
            />
          ))}
        </div>

        {/* Feedback popup */}
        {feedback && (
          <div className="absolute top-1/3 bg-slate-900/90 text-fuchsia-300 font-black text-sm px-4 py-1.5 rounded-full border border-fuchsia-500/50 shadow-xl animate-bounce z-20">
            {feedback}
          </div>
        )}
      </div>

      {/* Drop Button */}
      <div className="w-full mt-2">
        <button
          id="perfect-stack-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleDrop();
          }}
          className="w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-fuchsia-500/30 flex items-center justify-center gap-2"
        >
          {isPlaying ? 'DROP BLOCK! 🏢' : 'START STACKING 🚀'}
        </button>
      </div>
    </div>
  );
};
