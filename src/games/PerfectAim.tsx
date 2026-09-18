import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';

interface PerfectAimProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

interface Target {
  id: number;
  x: number; // 10% to 90%
  y: number; // 10% to 85%
  size: number; // current diameter
  maxSize: number;
  life: number; // remaining ms
  isBonus?: boolean;
}

export const PerfectAimGame: React.FC<PerfectAimProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bullseyes, setBullseyes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; x: number; y: number } | null>(null);

  const nextTargetIdRef = useRef(1);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const spawnTarget = useCallback(() => {
    if (!isPlayingRef.current) return;
    const isBonus = Math.random() < 0.2;
    const newTarget: Target = {
      id: nextTargetIdRef.current++,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 65,
      size: isBonus ? 50 : 65,
      maxSize: isBonus ? 50 : 65,
      life: isBonus ? 1600 : 2200,
      isBonus,
    };
    setTargets(prev => [...prev.slice(-3), newTarget]);
  }, []);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setBullseyes(0);
    setTimeLeft(30);
    setTargets([]);
    setIsPlaying(true);
    sound.playClick();
  };

  // Main spawner interval
  useEffect(() => {
    if (!isPlaying) return;
    spawnTarget();
    const interval = setInterval(() => {
      spawnTarget();
    }, 750);
    return () => clearInterval(interval);
  }, [isPlaying, spawnTarget]);

  // Game timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsPlaying(false);
          sound.playGameOver();
          onGameOver(score, bullseyes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, score, bullseyes, onGameOver]);

  const handleTargetHit = (target: Target, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isPlaying) return;

    // Calculate distance from center of target
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - centerX, clientY - centerY);

    const isBullseye = dist < rect.width * 0.28;
    const hitPoints = isBullseye ? (target.isBonus ? 500 : 300) : (target.isBonus ? 250 : 150);
    const comboBonus = combo * 35;
    const totalPoints = hitPoints + comboBonus;

    setScore(s => s + totalPoints);
    setCombo(c => c + 1);

    if (isBullseye) {
      setBullseyes(b => b + 1);
      sound.playBullseye();
      setFeedback({ text: 'BULLSEYE! 🎯', x: target.x, y: target.y });
    } else {
      sound.playThunk();
      setFeedback({ text: `+${totalPoints}`, x: target.x, y: target.y });
    }

    // Remove target immediately
    setTargets(prev => prev.filter(t => t.id !== target.id));
    setTimeout(() => setFeedback(null), 500);
  };

  const handleBackgroundMiss = () => {
    if (!isPlaying) return;
    // Streak reset on miss
    if (combo > 2) {
      sound.playCrash();
    } else {
      sound.playTick();
    }
    setCombo(0);
  };

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game"
      onClick={handleBackgroundMiss}
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black font-display text-rose-400">{score.toLocaleString()}</span>
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

      {/* 3-Second Rule Instructions */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🎯 <span className="text-rose-400 font-semibold">Tap targets instantly!</span> Hit center for Bullseye bonus!
        </p>
      </div>

      {/* Shooting Gallery Range */}
      <div className="relative w-full h-80 bg-slate-950/60 rounded-3xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Crosshair grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {!isPlaying && (
          <div className="text-center p-6 z-10">
            <span className="text-5xl block mb-2 animate-bounce">🎯</span>
            <h3 className="text-xl font-black text-white">Perfect Aim</h3>
            <p className="text-xs text-slate-400 mt-1">Tap bullseyes fast before they vanish!</p>
          </div>
        )}

        {/* Floating Targets */}
        {isPlaying && targets.map(t => (
          <div
            key={t.id}
            onMouseDown={(e) => handleTargetHit(t, e)}
            onTouchStart={(e) => handleTargetHit(t, e)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-90"
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: `${t.size}px`,
              height: `${t.size}px`,
            }}
          >
            {/* Bullseye target rings */}
            <div className={`w-full h-full rounded-full border-2 flex items-center justify-center shadow-lg animate-pulse ${
              t.isBonus 
                ? 'border-amber-400 bg-amber-500/20' 
                : 'border-rose-500 bg-rose-500/20'
            }`}>
              {/* Middle ring */}
              <div className={`w-2/3 h-2/3 rounded-full border-2 flex items-center justify-center ${
                t.isBonus ? 'border-amber-300 bg-amber-400/40' : 'border-rose-300 bg-rose-400/40'
              }`}>
                {/* Center Bullseye Nucleus */}
                <div className={`w-1/3 h-1/3 rounded-full ${
                  t.isBonus ? 'bg-amber-300 shadow-amber-300' : 'bg-white shadow-rose-400'
                } shadow-md`} />
              </div>
            </div>
          </div>
        ))}

        {/* Floating hit feedback */}
        {feedback && (
          <div
            className="absolute text-sm font-black text-rose-300 pointer-events-none animate-ping"
            style={{ left: `${feedback.x}%`, top: `${feedback.y}%` }}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* Button */}
      <div className="w-full mt-2">
        <button
          id="perfect-aim-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (!isPlaying) startGame();
          }}
          className="w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/30 flex items-center justify-center gap-2"
        >
          {isPlaying ? 'TAP TARGETS ABOVE! 🎯' : 'START SHOOTING 🚀'}
        </button>
      </div>
    </div>
  );
};
