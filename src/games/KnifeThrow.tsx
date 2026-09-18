import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';

interface KnifeThrowProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

interface EmbeddedKnife {
  angle: number; // in degrees on the wheel
}

interface TargetApple {
  angle: number;
  sliced: boolean;
}

export const KnifeThrowGame: React.FC<KnifeThrowProps> = ({ onGameOver }) => {
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [knivesRemaining, setKnivesRemaining] = useState(6);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flyingKnifeY, setFlyingKnifeY] = useState<number | null>(null); // null = ready at bottom
  const [feedback, setFeedback] = useState<string | null>(null);

  // Wheel state
  const wheelAngleRef = useRef<number>(0);
  const wheelSpeedRef = useRef<number>(1.8);
  const wheelDirRef = useRef<number>(1);
  const stuckKnivesRef = useRef<EmbeddedKnife[]>([]);
  const applesRef = useRef<TargetApple[]>([]);
  const animFrameRef = useRef<number>(0);
  const isShootingRef = useRef<boolean>(false);
  const [, setRerender] = useState({});

  const setupStage = useCallback((lvl: number) => {
    // Reset stuck knives with 1-2 initial obstacles
    const initialKnives: EmbeddedKnife[] = [];
    if (lvl > 1) {
      initialKnives.push({ angle: 45 });
    }
    if (lvl > 3) {
      initialKnives.push({ angle: 180 });
    }
    stuckKnivesRef.current = initialKnives;

    // Place an apple on the wheel
    applesRef.current = [
      { angle: (Math.random() * 260 + 50) % 360, sliced: false }
    ];

    setKnivesRemaining(5 + Math.min(lvl, 4));
    wheelSpeedRef.current = 1.6 + lvl * 0.35;
    wheelDirRef.current = Math.random() > 0.5 ? 1 : -1;
    setFlyingKnifeY(null);
    isShootingRef.current = false;
  }, []);

  const updateWheel = useCallback(() => {
    wheelAngleRef.current = (wheelAngleRef.current + wheelSpeedRef.current * wheelDirRef.current + 360) % 360;
    setRerender({});
    animFrameRef.current = requestAnimationFrame(updateWheel);
  }, []);

  const startGame = () => {
    setScore(0);
    setStage(1);
    setIsPlaying(true);
    setupStage(1);
    sound.playClick();
    animFrameRef.current = requestAnimationFrame(updateWheel);
  };

  const handleThrow = () => {
    if (!isPlaying) {
      startGame();
      return;
    }
    if (isShootingRef.current || knivesRemaining <= 0) return;

    isShootingRef.current = true;
    sound.playWhoosh();

    // Animate knife flying up from bottom (y: 220) to log (y: 65)
    let curY = 220;
    const flyInterval = setInterval(() => {
      curY -= 35;
      if (curY <= 65) {
        clearInterval(flyInterval);
        curY = 65;
        // Check collision on the wheel
        // The knife strikes at bottom of wheel (angle 180 or relative to wheel orientation)
        // Hit angle relative to current wheel rotation:
        const currentWheel = wheelAngleRef.current;
        // Knife enters at bottom of wheel (90 degrees relative to top center)
        const hitAngle = (90 - currentWheel + 360) % 360;

        // Check if collision with any stuck knife (within 14 degrees)
        let collision = false;
        for (const k of stuckKnivesRef.current) {
          let diff = Math.abs(k.angle - hitAngle);
          if (diff > 180) diff = 360 - diff;
          if (diff < 16) {
            collision = true;
            break;
          }
        }

        if (collision) {
          // Clink crash! Game Over
          sound.playCrash();
          setFeedback('KNIFE CLASH! 💥');
          cancelAnimationFrame(animFrameRef.current);
          setIsPlaying(false);
          setTimeout(() => {
            onGameOver(score, stage);
          }, 600);
          return;
        }

        // Clean hit!
        sound.playThunk();
        stuckKnivesRef.current.push({ angle: hitAngle });

        // Check apple hit
        for (const apple of applesRef.current) {
          if (!apple.sliced) {
            let diff = Math.abs(apple.angle - hitAngle);
            if (diff > 180) diff = 360 - diff;
            if (diff < 20) {
              apple.sliced = true;
              sound.playCoin();
              setScore(s => s + 250);
              setFeedback('APPLE SLICE! +250 🍎');
            }
          }
        }

        const newRemaining = knivesRemaining - 1;
        setKnivesRemaining(newRemaining);
        setScore(s => s + 100);

        if (newRemaining <= 0) {
          // Stage cleared!
          sound.playVictory();
          setFeedback('STAGE CLEARED! 🌟');
          setTimeout(() => {
            const nextStage = stage + 1;
            setStage(nextStage);
            setFeedback(null);
            setupStage(nextStage);
          }, 800);
        } else {
          setFlyingKnifeY(null);
          isShootingRef.current = false;
        }
      } else {
        setFlyingKnifeY(curY);
      }
    }, 16);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const wheelAngle = wheelAngleRef.current;

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game"
      onClick={handleThrow}
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black font-display text-emerald-400">{score.toLocaleString()}</span>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Stage</span>
          <span className="text-xl font-black text-amber-400">STAGE {stage}</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Knives Left</span>
          <div className="flex gap-1 justify-end mt-0.5">
            {Array.from({ length: Math.min(knivesRemaining, 8) }).map((_, i) => (
              <span key={i} className="text-sm">🔪</span>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Second Rule Instructions */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🔪 <span className="text-emerald-300 font-semibold">Tap to throw!</span> Don't hit other knives!
        </p>
      </div>

      {/* Target Arena */}
      <div className="relative w-full h-72 flex flex-col items-center justify-start overflow-hidden">
        {/* Rotating Wooden Log Disk */}
        <div 
          className="relative w-36 h-36 mt-2 rounded-full border-4 border-amber-800 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 shadow-2xl flex items-center justify-center transition-transform"
          style={{ transform: `rotate(${wheelAngle}deg)` }}
        >
          {/* Wood rings detail */}
          <div className="w-28 h-28 rounded-full border-2 border-amber-900/60 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-amber-900/40 flex items-center justify-center">
              <span className="text-lg">🪵</span>
            </div>
          </div>

          {/* Embedded Knives sticking out of the wheel */}
          {stuckKnivesRef.current.map((k, i) => {
            const rad = ((k.angle - 90) * Math.PI) / 180;
            const r = 72; // outer edge
            const x = 72 + r * Math.cos(rad);
            const y = 72 + r * Math.sin(rad);
            return (
              <div
                key={i}
                className="absolute w-2 h-10 bg-gradient-to-t from-slate-200 to-slate-400 rounded origin-top shadow"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: `translate(-50%, 0) rotate(${k.angle + 90}deg)`,
                }}
              >
                <div className="w-4 h-3 bg-amber-600 rounded-b -mt-3 -ml-1 border border-amber-700" />
              </div>
            );
          })}

          {/* Target Apples */}
          {applesRef.current.map((apple, i) => {
            if (apple.sliced) return null;
            const rad = ((apple.angle - 90) * Math.PI) / 180;
            const r = 62;
            const x = 72 + r * Math.cos(rad);
            const y = 72 + r * Math.sin(rad);
            return (
              <div
                key={i}
                className="absolute text-xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                🍎
              </div>
            );
          })}
        </div>

        {/* Flying Knife or Ready Knife */}
        <div 
          className="absolute w-4 h-16 flex flex-col items-center pointer-events-none transition-all duration-75"
          style={{
            bottom: flyingKnifeY !== null ? `${250 - flyingKnifeY}px` : '20px',
          }}
        >
          {/* Blade */}
          <div className="w-2.5 h-10 bg-gradient-to-t from-slate-100 to-slate-300 rounded-t shadow-md border-t border-slate-50" />
          {/* Guard */}
          <div className="w-6 h-1.5 bg-slate-400 rounded-full" />
          {/* Handle */}
          <div className="w-2.5 h-6 bg-amber-700 rounded-b shadow" />
        </div>

        {/* Feedback text */}
        {feedback && (
          <div className="absolute top-1/2 -translate-y-6 bg-slate-900/90 text-emerald-300 font-black text-sm px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-xl animate-bounce">
            {feedback}
          </div>
        )}
      </div>

      {/* Throw Button */}
      <div className="w-full mt-2">
        <button
          id="knife-throw-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleThrow();
          }}
          className="w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 flex items-center justify-center gap-2"
        >
          {isPlaying ? 'THROW KNIFE 🔪' : 'START KNIFE RUSH 🚀'}
        </button>
      </div>
    </div>
  );
};
