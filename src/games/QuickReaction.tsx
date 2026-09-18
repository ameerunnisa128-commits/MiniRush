import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../services/sound';

interface QuickReactionProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

type Stage = 'idle' | 'waiting' | 'ready' | 'result' | 'early';

export const QuickReactionGame: React.FC<QuickReactionProps> = ({ onGameOver }) => {
  const [stage, setStage] = useState<Stage>('idle');
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [currentMs, setCurrentMs] = useState<number | null>(null);

  const startTimestampRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    setStage('waiting');
    setCurrentMs(null);
    sound.playTick();

    const delay = 1500 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      setStage('ready');
      startTimestampRef.current = performance.now();
      sound.playBullseye();
    }, delay);
  };

  const handleTap = () => {
    if (stage === 'idle') {
      setResults([]);
      setRound(1);
      startRound();
      return;
    }

    if (stage === 'waiting') {
      // Tapped too early
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStage('early');
      sound.playCrash();
      return;
    }

    if (stage === 'ready') {
      const elapsed = Math.round(performance.now() - startTimestampRef.current);
      setCurrentMs(elapsed);
      const newResults = [...results, elapsed];
      setResults(newResults);
      setStage('result');

      if (elapsed < 200) {
        sound.playPerfect(6);
      } else {
        sound.playThunk();
      }

      // Check rounds (3 rounds total)
      if (newResults.length >= 3) {
        const avg = Math.round(newResults.reduce((a, b) => a + b, 0) / newResults.length);
        const score = Math.max(100, Math.round(10000 - avg * 15));
        setTimeout(() => {
          sound.playVictory();
          onGameOver(score, avg < 220 ? 1 : 0);
        }, 1500);
      }
    }
  };

  const nextTrial = () => {
    setRound(r => r + 1);
    startRound();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getRating = (ms: number) => {
    if (ms < 180) return { title: 'GODLIKE REFLEX! ⚡', color: 'text-amber-300' };
    if (ms < 230) return { title: 'LIGHTNING FAST! 🔥', color: 'text-emerald-300' };
    if (ms < 290) return { title: 'SHARP REFLEX! 🎯', color: 'text-cyan-300' };
    if (ms < 380) return { title: 'SOLID SPEED! 👍', color: 'text-blue-300' };
    return { title: 'SLOW TURTLE 🐢', color: 'text-slate-400' };
  };

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game"
      onClick={handleTap}
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Attempt</span>
          <span className="text-xl font-black text-cyan-400">ROUND {round} / 3</span>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Avg Speed</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {results.length > 0
              ? `${Math.round(results.reduce((a, b) => a + b, 0) / results.length)} ms`
              : '-- ms'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Rating</span>
          <span className="text-sm font-bold text-amber-400">
            {currentMs ? getRating(currentMs).title.split(' ')[0] : 'READY'}
          </span>
        </div>
      </div>

      {/* 3-Second Rule */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          ⚡ <span className="text-cyan-300 font-semibold">Screen turns green:</span> TAP INSTANTLY!
        </p>
      </div>

      {/* Main Reaction Zone */}
      <div className={`relative w-full h-80 rounded-3xl border-2 flex flex-col items-center justify-center p-6 transition-all duration-100 ${
        stage === 'ready'
          ? 'bg-emerald-500 border-emerald-300 shadow-2xl shadow-emerald-500/60'
          : stage === 'waiting'
          ? 'bg-rose-950 border-rose-600'
          : stage === 'early'
          ? 'bg-amber-950 border-amber-600'
          : 'bg-slate-950 border-slate-800'
      }`}>
        {stage === 'idle' && (
          <div className="text-center">
            <span className="text-6xl block mb-3 animate-pulse">⚡</span>
            <h3 className="text-2xl font-black text-cyan-400">Quick Reaction</h3>
            <p className="text-xs text-slate-400 mt-2">Test your human reflex time down to the millisecond!</p>
          </div>
        )}

        {stage === 'waiting' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-rose-600 border-4 border-rose-400 mx-auto mb-3 shadow-lg shadow-rose-500/50 animate-pulse" />
            <h3 className="text-3xl font-black text-rose-300">WAIT FOR GREEN...</h3>
            <p className="text-xs text-rose-400/80 mt-1">Don't tap yet!</p>
          </div>
        )}

        {stage === 'ready' && (
          <div className="text-center">
            <h2 className="text-6xl font-black text-slate-950 tracking-wider animate-bounce">
              TAP NOW!
            </h2>
          </div>
        )}

        {stage === 'early' && (
          <div className="text-center">
            <span className="text-5xl block mb-2">⚠️</span>
            <h3 className="text-2xl font-black text-amber-400">TOO EARLY!</h3>
            <p className="text-xs text-slate-300 mt-1">You tapped while it was still red.</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startRound();
              }}
              className="mt-4 px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl active:scale-95"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {stage === 'result' && currentMs && (
          <div className="text-center">
            <span className="text-6xl font-black font-mono text-white block mb-1">
              {currentMs} <span className="text-2xl text-slate-400">ms</span>
            </span>
            <span className={`text-xl font-black ${getRating(currentMs).color}`}>
              {getRating(currentMs).title}
            </span>

            {results.length < 3 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextTrial();
                }}
                className="mt-5 px-6 py-2.5 bg-cyan-500 text-slate-950 font-black rounded-xl active:scale-95 shadow-lg shadow-cyan-500/30"
              >
                NEXT ROUND ({round + 1}/3) 🚀
              </button>
            )}
          </div>
        )}
      </div>

      {/* Button */}
      <div className="w-full mt-2">
        <button
          id="quick-reaction-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleTap();
          }}
          className={`w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            stage === 'ready'
              ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/50 text-2xl font-black'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-cyan-500/30'
          }`}
        >
          {stage === 'idle' ? 'START REFLEX TEST ⚡' : stage === 'ready' ? 'TAP! TAP! TAP!' : 'READY TO TAP'}
        </button>
      </div>
    </div>
  );
};
