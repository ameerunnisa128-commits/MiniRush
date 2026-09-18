import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

export const ArrowLockGame: React.FC<GameProps> = ({ onGameOver, onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [perfectHits, setPerfectHits] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  // Needle angle in degrees (0 - 360)
  const angleRef = useRef<number>(0);
  const speedRef = useRef<number>(2.5);
  const directionRef = useRef<number>(1); // 1 = clockwise, -1 = counter
  const targetStartRef = useRef<number>(90);
  const targetArcRef = useRef<number>(55); // width of target zone in degrees
  const animFrameRef = useRef<number>(0);
  const [, setRerender] = useState({});

  const randomizeTarget = useCallback(() => {
    // Put target away from current needle angle
    const current = angleRef.current;
    let newStart = (current + 90 + Math.random() * 180) % 360;
    // Shrink target slightly as score increases (min 32 deg)
    const newArc = Math.max(30, 55 - Math.floor(score / 500) * 4);
    targetStartRef.current = newStart;
    targetArcRef.current = newArc;
    // Faster needle with speed variance
    speedRef.current = Math.min(6.5, 2.5 + (score / 600) * 0.5);
    // 50% chance to reverse direction on hit
    if (Math.random() > 0.45) {
      directionRef.current *= -1;
    }
  }, [score]);

  // Main game loop
  const updateLoop = useCallback(() => {
    angleRef.current = (angleRef.current + speedRef.current * directionRef.current + 360) % 360;
    setRerender({});
    animFrameRef.current = requestAnimationFrame(updateLoop);
  }, []);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setPerfectHits(0);
    setTimeLeft(30);
    angleRef.current = 0;
    speedRef.current = 2.6;
    directionRef.current = 1;
    targetStartRef.current = 90;
    targetArcRef.current = 55;
    setIsPlaying(true);
    setFeedback(null);
    sound.playClick();
    animFrameRef.current = requestAnimationFrame(updateLoop);
  };

  const handleTap = () => {
    if (!isPlaying) {
      startGame();
      return;
    }

    const needle = angleRef.current;
    const start = targetStartRef.current;
    const arc = targetArcRef.current;
    const end = (start + arc) % 360;

    // Check if needle is inside arc
    let isInside = false;
    let distanceToCenter = 0;
    const center = (start + arc / 2) % 360;

    if (start < end) {
      isInside = needle >= start && needle <= end;
    } else {
      // Arc wraps around 360
      isInside = needle >= start || needle <= end;
    }

    if (isInside) {
      let diff = Math.abs(needle - center);
      if (diff > 180) diff = 360 - diff;

      const isPerfect = diff < arc * 0.22;
      const points = isPerfect ? 300 + combo * 50 : 150 + combo * 25;
      const newScore = score + points;
      const newCombo = combo + 1;

      setScore(newScore);
      setCombo(newCombo);

      if (isPerfect) {
        setPerfectHits(p => p + 1);
        setFeedback('PERFECT! 🔥');
        sound.playPerfect(Math.min(newCombo, 7));
      } else {
        setFeedback('GOOD! 👍');
        sound.playBullseye();
      }

      // Add 1.5 seconds bonus time (max 45s)
      setTimeLeft(t => Math.min(45, t + 1.5));
      randomizeTarget();
    } else {
      // Missed!
      sound.playCrash();
      setFeedback('MISSED! ❌');
      cancelAnimationFrame(animFrameRef.current);
      setIsPlaying(false);
      setTimeout(() => {
        onGameOver(score, perfectHits);
      }, 500);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          cancelAnimationFrame(animFrameRef.current);
          setIsPlaying(false);
          sound.playGameOver();
          onGameOver(score, perfectHits);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, score, perfectHits, onGameOver]);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Keyboard shortcut (Space / Enter)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const needle = angleRef.current;
  const targetStart = targetStartRef.current;
  const targetArc = targetArcRef.current;

  // SVG calculations for arc
  const radius = 105;
  const cx = 130;
  const cy = 130;

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const arcLength = (endAngle - startAngle + 360) % 360;
    const largeArcFlag = arcLength <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const targetPath = describeArc(cx, cy, radius, targetStart, (targetStart + targetArc) % 360);
  const needlePos = polarToCartesian(cx, cy, radius + 12, needle);

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game"
      onClick={handleTap}
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black font-display text-amber-400">{score.toLocaleString()}</span>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Timer</span>
          <span className={`text-xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
            {timeLeft}s
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Streak</span>
          <span className="text-xl font-bold text-orange-400">🔥 {combo}x</span>
        </div>
      </div>

      {/* Quick 3-second instruction banner */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🎯 <span className="text-amber-300 font-semibold">Tap anywhere</span> when needle is in the orange zone!
        </p>
      </div>

      {/* Dial Wheel */}
      <div className="relative flex items-center justify-center my-auto">
        <svg width="260" height="260" className="drop-shadow-2xl">
          {/* Base outer ring */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#334155" strokeWidth="18" />

          {/* Tick marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const p1 = polarToCartesian(cx, cy, radius - 15, i * 30);
            const p2 = polarToCartesian(cx, cy, radius - 23, i * 30);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#475569" strokeWidth="2" />;
          })}

          {/* Target Arc Zone */}
          <path
            d={targetPath}
            fill="none"
            stroke="#f97316"
            strokeWidth="20"
            strokeLinecap="round"
            className="transition-all duration-75"
          />

          {/* Target Center Sweet Spot */}
          {(() => {
            const centerAngle = (targetStart + targetArc / 2) % 360;
            const pt = polarToCartesian(cx, cy, radius, centerAngle);
            return <circle cx={pt.x} cy={pt.y} r="5" fill="#fef08a" />;
          })()}

          {/* Center Hub */}
          <circle cx={cx} cy={cy} r="26" fill="#1e293b" stroke="#f97316" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="8" fill="#f97316" />

          {/* Needle Line */}
          <line
            x1={cx}
            y1={cy}
            x2={needlePos.x}
            y2={needlePos.y}
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Needle tip indicator */}
          <circle cx={needlePos.x} cy={needlePos.y} r="6" fill="#facc15" stroke="#ffffff" strokeWidth="2" />
        </svg>

        {/* Feedback popup text */}
        {feedback && (
          <div className="absolute top-1/2 -translate-y-12 bg-slate-900/90 text-amber-300 font-extrabold text-sm px-3 py-1 rounded-full border border-amber-500/50 animate-bounce pointer-events-none">
            {feedback}
          </div>
        )}
      </div>

      {/* Action Button & Prompt */}
      <div className="w-full mt-2">
        <button
          id="arrow-lock-tap-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleTap();
          }}
          className={`w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isPlaying
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
          }`}
        >
          {isPlaying ? 'TAP TO LOCK ⚡' : 'START GAME 🚀'}
        </button>
      </div>
    </div>
  );
};
