import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';

interface DontTapRedProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

type TileType = 'empty' | 'green' | 'gold' | 'red';

export const DontTapRedGame: React.FC<DontTapRedProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<TileType[]>(Array(9).fill('empty'));
  const [feedback, setFeedback] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const randomizeGrid = useCallback(() => {
    // Generate new state for 9 tiles
    const newGrid: TileType[] = Array(9).fill('empty');
    // 2-3 green tiles, 1 gold tile (30% chance), 1-2 red tiles
    const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);

    newGrid[indices[0]] = 'green';
    newGrid[indices[1]] = 'green';
    newGrid[indices[2]] = 'red';

    if (Math.random() > 0.4) {
      newGrid[indices[3]] = 'green';
    }
    if (Math.random() > 0.6) {
      newGrid[indices[4]] = 'gold';
    }
    if (Math.random() > 0.5) {
      newGrid[indices[5]] = 'red';
    }

    setGrid(newGrid);
  }, []);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setFeedback(null);
    sound.playClick();
    randomizeGrid();
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying) return;

    const tile = grid[index];

    if (tile === 'red') {
      // Tapped Red! Instant Game Over
      sound.playCrash();
      setFeedback('YOU TAPPED RED! 💀');
      setIsPlaying(false);
      setTimeout(() => {
        onGameOver(score, 0);
      }, 600);
      return;
    }

    if (tile === 'green') {
      sound.playPop();
      const points = 100 + combo * 15;
      setScore(s => s + points);
      setCombo(c => c + 1);

      // Consume this tile
      const updated = [...grid];
      updated[index] = 'empty';
      setGrid(updated);

      // Check if all greens/golds cleared, respawn immediately
      if (!updated.some(t => t === 'green' || t === 'gold')) {
        randomizeGrid();
      }
    } else if (tile === 'gold') {
      sound.playCoin();
      const points = 300 + combo * 30;
      setScore(s => s + points);
      setCombo(c => c + 2);
      setFeedback('GOLD BONUS! ⭐');
      setTimeout(() => setFeedback(null), 400);

      const updated = [...grid];
      updated[index] = 'empty';
      setGrid(updated);

      if (!updated.some(t => t === 'green' || t === 'gold')) {
        randomizeGrid();
      }
    }
  };

  // Periodic grid shuffle so player can't hesitate indefinitely
  useEffect(() => {
    if (!isPlaying) return;
    const shuffleInterval = setInterval(() => {
      randomizeGrid();
    }, 1400);
    return () => clearInterval(shuffleInterval);
  }, [isPlaying, randomizeGrid]);

  // Countdown timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsPlaying(false);
          sound.playVictory();
          onGameOver(score, 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, score, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black font-display text-emerald-400">{score.toLocaleString()}</span>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Timer</span>
          <span className={`text-xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
            {timeLeft}s
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Streak</span>
          <span className="text-xl font-bold text-amber-400">🔥 {combo}x</span>
        </div>
      </div>

      {/* 3-Second Rule */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🚫 <span className="text-rose-400 font-semibold">NEVER TAP RED!</span> Smash green & gold fast!
        </p>
      </div>

      {/* 3x3 Tile Grid */}
      <div className="relative p-3 bg-slate-950 rounded-3xl border-2 border-slate-800 shadow-2xl">
        <div className="grid grid-cols-3 gap-3 w-64 h-64">
          {grid.map((type, idx) => (
            <button
              key={idx}
              disabled={!isPlaying}
              onClick={() => handleTileClick(idx)}
              className={`w-18 h-18 rounded-2xl flex items-center justify-center font-black text-2xl transition-all active:scale-90 shadow-md ${
                type === 'green'
                  ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-emerald-500/40 border border-emerald-300 animate-pulse'
                  : type === 'gold'
                  ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-950 shadow-amber-400/50 border border-yellow-200 animate-bounce'
                  : type === 'red'
                  ? 'bg-gradient-to-br from-rose-600 to-red-800 text-white shadow-rose-600/40 border border-rose-400'
                  : 'bg-slate-800/40 border border-slate-800'
              }`}
            >
              {type === 'green' && '🟢'}
              {type === 'gold' && '⭐'}
              {type === 'red' && '💀'}
            </button>
          ))}
        </div>

        {/* Feedback popup */}
        {feedback && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 text-rose-300 font-black text-sm px-4 py-2 rounded-full border border-rose-500/50 shadow-2xl animate-bounce">
            {feedback}
          </div>
        )}
      </div>

      {/* Button */}
      <div className="w-full mt-2">
        {!isPlaying ? (
          <button
            id="dont-tap-red-btn"
            onClick={startGame}
            className="w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            START RUSH 🚀
          </button>
        ) : (
          <div className="w-full py-3.5 text-center text-xs font-bold text-slate-400 bg-slate-800/60 rounded-2xl border border-slate-700">
            🟢 TAP GREEN • ⭐ TAP GOLD • 💀 AVOID RED
          </div>
        )}
      </div>
    </div>
  );
};
