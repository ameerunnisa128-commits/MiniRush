import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';

interface OneShotProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

interface Crystal {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  hit: boolean;
}

export const OneShotGame: React.FC<OneShotProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [crystalsLeft, setCrystalsLeft] = useState(4);
  const [bouncesLeft, setBouncesLeft] = useState(6);
  const [aimAngle, setAimAngle] = useState(45); // degrees (-60 to +60 from vertical)
  const [isFired, setIsFired] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const crystalsRef = useRef<Crystal[]>([]);
  const ballPosRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const animFrameRef = useRef<number>(0);
  const bouncesRef = useRef<number>(6);
  const [, setRerender] = useState({});

  const setupLevel = useCallback((lvl: number) => {
    // Generate crystals in upper half of room (w: 260, h: 280)
    const count = 3 + Math.min(lvl, 4);
    const list: Crystal[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        x: 40 + Math.random() * 180,
        y: 40 + Math.random() * 140,
        r: 14,
        color: ['#f43f5e', '#a855f7', '#06b6d4', '#eab308'][i % 4],
        hit: false,
      });
    }
    crystalsRef.current = list;
    setCrystalsLeft(count);
    setBouncesLeft(6);
    bouncesRef.current = 6;
    ballPosRef.current = null;
    setIsFired(false);
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setIsPlaying(true);
    setFeedback(null);
    setupLevel(1);
    sound.playClick();
  };

  const fire = () => {
    if (!isPlaying || isFired) return;
    setIsFired(true);
    sound.playLaser();

    // Cannon starts at bottom center (x: 130, y: 270)
    const rad = ((aimAngle - 90) * Math.PI) / 180;
    const speed = 7.5;
    ballPosRef.current = {
      x: 130,
      y: 260,
      vx: speed * Math.cos(rad),
      vy: speed * Math.sin(rad),
    };

    const updatePhysics = () => {
      const ball = ballPosRef.current;
      if (!ball) return;

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall collisions (w: 260, h: 280)
      let bounced = false;
      if (ball.x <= 8) {
        ball.x = 8;
        ball.vx *= -1;
        bounced = true;
      } else if (ball.x >= 252) {
        ball.x = 252;
        ball.vx *= -1;
        bounced = true;
      }

      if (ball.y <= 8) {
        ball.y = 8;
        ball.vy *= -1;
        bounced = true;
      } else if (ball.y >= 272) {
        ball.y = 272;
        ball.vy *= -1;
        bounced = true;
      }

      if (bounced) {
        sound.playTick();
        bouncesRef.current -= 1;
        setBouncesLeft(bouncesRef.current);
      }

      // Check crystal collisions
      crystalsRef.current.forEach(c => {
        if (!c.hit) {
          const dist = Math.hypot(ball.x - c.x, ball.y - c.y);
          if (dist <= c.r + 6) {
            c.hit = true;
            sound.playPop();
            setScore(s => s + 350);
          }
        }
      });

      const remaining = crystalsRef.current.filter(c => !c.hit).length;
      setCrystalsLeft(remaining);

      // Check win
      if (remaining === 0) {
        // Level cleared!
        sound.playVictory();
        setFeedback('ALL CRYSTALS SHATTERED! 🌟');
        setScore(s => s + 1000);
        setTimeout(() => {
          setFeedback(null);
          const nextLvl = level + 1;
          setLevel(nextLvl);
          setupLevel(nextLvl);
        }, 1000);
        return;
      }

      // Check out of bounces
      if (bouncesRef.current <= 0) {
        // Failed
        sound.playCrash();
        setFeedback('OUT OF BOUNCES! 💥');
        setTimeout(() => {
          onGameOver(score, level > 1 ? 1 : 0);
        }, 800);
        return;
      }

      setRerender({});
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const ball = ballPosRef.current;
  const cannonAngleRad = ((aimAngle - 90) * Math.PI) / 180;
  const aimLaserX = 130 + 120 * Math.cos(cannonAngleRad);
  const aimLaserY = 260 + 120 * Math.sin(cannonAngleRad);

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black font-display text-indigo-400">{score.toLocaleString()}</span>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Crystals</span>
          <span className="text-xl font-black text-amber-400">🔮 {crystalsLeft} Left</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Bounces</span>
          <span className="text-xl font-bold font-mono text-cyan-400">{bouncesLeft} / 6</span>
        </div>
      </div>

      {/* 3-Second Rule */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🔮 <span className="text-indigo-300 font-semibold">Aim angle & fire!</span> Shatter all crystals in 1 bouncing shot!
        </p>
      </div>

      {/* Arena Stage */}
      <div className="relative w-68 h-72 bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
        <svg width="260" height="280" className="absolute inset-0">
          {/* Aim laser line */}
          {!isFired && isPlaying && (
            <line
              x1="130"
              y1="260"
              x2={aimLaserX}
              y2={aimLaserY}
              stroke="#818cf8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Target Crystals */}
          {crystalsRef.current.map(c => !c.hit && (
            <g key={c.id} transform={`translate(${c.x}, ${c.y})`}>
              <polygon
                points="0,-12 10,0 0,12 -10,0"
                fill={c.color}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="animate-pulse"
              />
              <circle cx="0" cy="0" r="3" fill="#ffffff" />
            </g>
          ))}

          {/* Cannon Base */}
          <circle cx="130" cy="275" r="18" fill="#312e81" stroke="#6366f1" strokeWidth="2" />
          <line
            x1="130"
            y1="275"
            x2={130 + 24 * Math.cos(cannonAngleRad)}
            y2={275 + 24 * Math.sin(cannonAngleRad)}
            stroke="#a5b4fc"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Projectile Ball */}
          {ball && (
            <circle
              cx={ball.x}
              cy={ball.y}
              r="7"
              fill="#ffffff"
              stroke="#818cf8"
              strokeWidth="2"
              className="drop-shadow"
            />
          )}
        </svg>

        {/* Feedback popup */}
        {feedback && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 text-indigo-300 font-black text-sm px-4 py-2 rounded-full border border-indigo-500/50 shadow-2xl animate-bounce">
            {feedback}
          </div>
        )}
      </div>

      {/* Angle Slider Control */}
      {isPlaying && !isFired && (
        <div className="w-full px-4 my-1">
          <div className="flex justify-between text-xs text-slate-400 font-bold mb-1">
            <span>◀ ANGLE</span>
            <span className="font-mono text-indigo-300">{aimAngle}°</span>
            <span>ANGLE ▶</span>
          </div>
          <input
            type="range"
            min="30"
            max="150"
            value={aimAngle}
            onChange={(e) => setAimAngle(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      )}

      {/* Fire Button */}
      <div className="w-full mt-1">
        {!isPlaying ? (
          <button
            id="one-shot-start-btn"
            onClick={startGame}
            className="w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30 flex items-center justify-center gap-2"
          >
            START ONE SHOT 🚀
          </button>
        ) : (
          <button
            id="one-shot-fire-btn"
            disabled={isFired}
            onClick={fire}
            className={`w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isFired
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30 active:scale-95'
            }`}
          >
            {isFired ? 'BALL IN FLIGHT... ⚡' : 'FIRE ONE SHOT! 🔮'}
          </button>
        )}
      </div>
    </div>
  );
};
