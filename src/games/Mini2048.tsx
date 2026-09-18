import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface Mini2048Props {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

type Board = number[][];

export const Mini2048Game: React.FC<Mini2048Props> = ({ onGameOver }) => {
  const [board, setBoard] = useState<Board>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [maxTile, setMaxTile] = useState(2);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const addRandomTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val === 0) emptyCells.push({ r, c });
      });
    });

    if (emptyCells.length === 0) return currentBoard;

    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.85 ? 2 : 4;
    return newBoard;
  };

  const startGame = () => {
    let b = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
    setMaxTile(4);
    setTimeLeft(60);
    setIsPlaying(true);
    setFeedback(null);
    sound.playClick();
  };

  // Slide helper for 1D row
  const slideRow = (row: number[]): { newRow: number[]; gainedScore: number; mergedMax: number } => {
    let arr = row.filter(v => v !== 0);
    let gainedScore = 0;
    let mergedMax = 0;

    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        gainedScore += arr[i];
        if (arr[i] > mergedMax) mergedMax = arr[i];
        arr.splice(i + 1, 1);
      }
    }

    while (arr.length < 4) {
      arr.push(0);
    }
    return { newRow: arr, gainedScore, mergedMax };
  };

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isPlaying) return;

    let current = board.map(row => [...row]);
    let moved = false;
    let totalScore = 0;
    let highestMerged = 0;

    if (direction === 'left') {
      for (let r = 0; r < 4; r++) {
        const { newRow, gainedScore, mergedMax } = slideRow(current[r]);
        if (JSON.stringify(newRow) !== JSON.stringify(current[r])) moved = true;
        current[r] = newRow;
        totalScore += gainedScore;
        if (mergedMax > highestMerged) highestMerged = mergedMax;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < 4; r++) {
        const reversed = [...current[r]].reverse();
        const { newRow, gainedScore, mergedMax } = slideRow(reversed);
        const normal = newRow.reverse();
        if (JSON.stringify(normal) !== JSON.stringify(current[r])) moved = true;
        current[r] = normal;
        totalScore += gainedScore;
        if (mergedMax > highestMerged) highestMerged = mergedMax;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < 4; c++) {
        const col = [current[0][c], current[1][c], current[2][c], current[3][c]];
        const { newRow, gainedScore, mergedMax } = slideRow(col);
        for (let r = 0; r < 4; r++) {
          if (current[r][c] !== newRow[r]) moved = true;
          current[r][c] = newRow[r];
        }
        totalScore += gainedScore;
        if (mergedMax > highestMerged) highestMerged = mergedMax;
      }
    } else if (direction === 'down') {
      for (let c = 0; c < 4; c++) {
        const col = [current[3][c], current[2][c], current[1][c], current[0][c]];
        const { newRow, gainedScore, mergedMax } = slideRow(col);
        const normal = newRow.reverse();
        for (let r = 0; r < 4; r++) {
          if (current[r][c] !== normal[r]) moved = true;
          current[r][c] = normal[r];
        }
        totalScore += gainedScore;
        if (mergedMax > highestMerged) highestMerged = mergedMax;
      }
    }

    if (moved) {
      sound.playSwipe();
      if (totalScore > 0) {
        sound.playMerge();
      }
      if (highestMerged >= 64) {
        setFeedback(`${highestMerged} TILE! 🔥`);
        setTimeout(() => setFeedback(null), 600);
      }

      const updated = addRandomTile(current);
      setBoard(updated);
      setScore(s => s + totalScore);
      if (highestMerged > maxTile) setMaxTile(highestMerged);
    }
  }, [board, isPlaying, maxTile]);

  // Touch Swipe Handler
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) move('right');
      else move('left');
    } else {
      if (dy > 0) move('down');
      else move('up');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); move('left'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move('right'); }
      if (e.key === 'ArrowUp') { e.preventDefault(); move('up'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); move('down'); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  // Countdown
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsPlaying(false);
          sound.playGameOver();
          onGameOver(score, maxTile >= 256 ? 1 : 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, score, maxTile, onGameOver]);

  // Tile visual styles
  const getTileStyle = (val: number) => {
    switch (val) {
      case 2: return 'bg-amber-100 text-slate-800';
      case 4: return 'bg-amber-200 text-slate-900';
      case 8: return 'bg-orange-400 text-white font-black';
      case 16: return 'bg-orange-500 text-white font-black';
      case 32: return 'bg-rose-500 text-white font-black';
      case 64: return 'bg-rose-600 text-white font-black shadow-lg shadow-rose-500/30';
      case 128: return 'bg-yellow-400 text-slate-950 font-black shadow-lg shadow-yellow-400/40 text-lg';
      case 256: return 'bg-yellow-500 text-slate-950 font-black shadow-xl shadow-yellow-500/50 text-lg';
      case 512: return 'bg-cyan-400 text-slate-950 font-black shadow-xl text-lg';
      case 1024: return 'bg-emerald-400 text-slate-950 font-black text-base';
      case 2048: return 'bg-fuchsia-500 text-white font-black text-base animate-pulse';
      default: return 'bg-slate-800/60 text-transparent';
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black font-display text-amber-400">{score.toLocaleString()}</span>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Timer</span>
          <span className={`text-xl font-bold font-mono ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
            {timeLeft}s
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Max Tile</span>
          <span className="text-xl font-black text-yellow-400">{maxTile}</span>
        </div>
      </div>

      {/* 3-Second Rule */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🔢 <span className="text-amber-300 font-semibold">Swipe or tap arrows</span> to merge identical tiles!
        </p>
      </div>

      {/* 2048 4x4 Board */}
      <div className="relative p-2.5 bg-slate-950 rounded-3xl border-2 border-slate-800 shadow-2xl">
        <div className="grid grid-cols-4 gap-2 w-64 h-64">
          {board.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-100 ${getTileStyle(val)}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {/* Feedback popup */}
        {feedback && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 text-amber-400 font-black text-sm px-4 py-2 rounded-full border border-amber-500/50 shadow-2xl animate-bounce">
            {feedback}
          </div>
        )}
      </div>

      {/* D-Pad Controls for mobile accessibility */}
      <div className="flex flex-col items-center gap-1 my-1">
        <button 
          onClick={() => move('up')} 
          className="p-3 bg-slate-800 active:bg-slate-700 rounded-xl text-slate-200 border border-slate-700 shadow"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-4">
          <button 
            onClick={() => move('left')} 
            className="p-3 bg-slate-800 active:bg-slate-700 rounded-xl text-slate-200 border border-slate-700 shadow"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => move('down')} 
            className="p-3 bg-slate-800 active:bg-slate-700 rounded-xl text-slate-200 border border-slate-700 shadow"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button 
            onClick={() => move('right')} 
            className="p-3 bg-slate-800 active:bg-slate-700 rounded-xl text-slate-200 border border-slate-700 shadow"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="w-full">
        {!isPlaying ? (
          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            START MINI 2048 🚀
          </button>
        ) : (
          <button
            onClick={startGame}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-800 text-slate-300 border border-slate-700 active:scale-95"
          >
            RESTART BOARD 🔄
          </button>
        )}
      </div>
    </div>
  );
};
