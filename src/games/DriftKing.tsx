import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';
import { Flame, Trophy, Zap, Sparkles, Gauge } from 'lucide-react';
import { StorageService } from '../services/storage';

interface DriftKingProps {
  onGameOver: (score: number, perfectHits: number) => void;
  onExit: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  decay: number;
}

interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

interface TrackCurve {
  id: number;
  y: number; // distance down the track
  length: number;
  direction: 'left' | 'right';
  intensity: number; // 1 = gentle, 2 = standard, 3 = hairpin
}

export const DriftKingGame: React.FC<DriftKingProps> = ({ onGameOver, onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [currentDriftMeters, setCurrentDriftMeters] = useState(0);
  const [longestDriftThisRun, setLongestDriftThisRun] = useState(0);
  const [isDrifting, setIsDrifting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [comboText, setComboText] = useState<string | null>(null);

  // Profile all-time record
  const profile = StorageService.loadProfile();
  const allTimeLongest = profile.longestDrift || 0;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  // Game physical state
  const carXRef = useRef<number>(200); // Track width is 400
  const carSpeedRef = useRef<number>(7);
  const carAngleRef = useRef<number>(0); // Current steering angle in radians
  const isTouchHeldRef = useRef<boolean>(false);
  const currentDriftRef = useRef<number>(0);
  const longestDriftRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const multRef = useRef<number>(1);
  const roadOffsetRef = useRef<number>(0);
  const trackCurveRef = useRef<number>(0); // Current active turn curvature (-1 to +1)
  const targetCurveRef = useRef<number>(0);
  const nextCurveTimerRef = useRef<number>(60);
  const particlesRef = useRef<Particle[]>([]);
  const skidsRef = useRef<SkidMark[]>([]);
  const lastWheelPosRef = useRef<{ w1x: number; w1y: number; w2x: number; w2y: number } | null>(null);
  const livesRef = useRef<number>(3);
  const [lives, setLives] = useState(3);
  const isGameOverRef = useRef<boolean>(false);

  // Start the game
  const startGame = () => {
    setIsPlaying(true);
    isGameOverRef.current = false;
    setScore(0);
    setMultiplier(1);
    setCurrentDriftMeters(0);
    setLongestDriftThisRun(0);
    setTimeLeft(45);
    setLives(3);
    scoreRef.current = 0;
    multRef.current = 1;
    currentDriftRef.current = 0;
    longestDriftRef.current = 0;
    carXRef.current = 200;
    carAngleRef.current = 0;
    carSpeedRef.current = 7.5;
    trackCurveRef.current = 0;
    targetCurveRef.current = 0;
    livesRef.current = 3;
    particlesRef.current = [];
    skidsRef.current = [];
    isTouchHeldRef.current = false;
    setIsDrifting(false);

    sound.playEngine();
  };

  // Touch down / Drift initiation
  const handlePointerDown = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isPlaying) {
      startGame();
      return;
    }
    if (isGameOverRef.current) return;

    isTouchHeldRef.current = true;
    setIsDrifting(true);
    sound.startContinuousDriftScreech();
  };

  // Touch up / Drift release
  const handlePointerUp = (e?: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    if (!isTouchHeldRef.current) return;

    isTouchHeldRef.current = false;
    setIsDrifting(false);
    sound.stopContinuousDriftScreech();

    // Bank drift points if had substantial drift
    if (currentDriftRef.current > 4) {
      sound.playTurboBlowoff();
      const bankedPoints = Math.floor(currentDriftRef.current * 25 * multRef.current);
      scoreRef.current += bankedPoints;
      setScore(scoreRef.current);

      // Create turbo exhaust flame particles
      for (let i = 0; i < 15; i++) {
        particlesRef.current.push({
          x: carXRef.current + (Math.random() - 0.5) * 16,
          y: 450 + 25,
          vx: (Math.random() - 0.5) * 4,
          vy: 6 + Math.random() * 8,
          size: 6 + Math.random() * 8,
          alpha: 1,
          color: Math.random() > 0.4 ? '#38bdf8' : '#f97316',
          decay: 0.08,
        });
      }

      setFeedback(`DRIFT BANKED! +${currentDriftRef.current.toFixed(1)}m (+${bankedPoints})`);
      setTimeout(() => setFeedback(null), 1200);
    }

    currentDriftRef.current = 0;
    setCurrentDriftMeters(0);
    multRef.current = 1;
    setMultiplier(1);
  };

  // Game timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Finish match and record longest drift
  const handleFinishMatch = useCallback(() => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    setIsPlaying(false);
    setIsDrifting(false);
    sound.stopContinuousDriftScreech();
    sound.playVictory();

    // Check if new all-time longest drift record
    const finalLongest = Math.round(longestDriftRef.current * 10) / 10;
    const existingProfile = StorageService.loadProfile();
    if (finalLongest > (existingProfile.longestDrift || 0)) {
      existingProfile.longestDrift = finalLongest;
      StorageService.saveProfile(existingProfile);
    }

    // Callback with score and perfect hits (drift count)
    onGameOver(scoreRef.current, Math.floor(finalLongest));
  }, [onGameOver]);

  // Keyboard support (Space to drift)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isTouchHeldRef.current) {
          if (!isPlaying) startGame();
          else {
            isTouchHeldRef.current = true;
            setIsDrifting(true);
            sound.startContinuousDriftScreech();
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePointerUp();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isPlaying]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;

      // Update Track Geometry
      roadOffsetRef.current = (roadOffsetRef.current + carSpeedRef.current) % 80;

      if (isPlaying && !isGameOverRef.current) {
        // Curve generation logic
        nextCurveTimerRef.current -= 1;
        if (nextCurveTimerRef.current <= 0) {
          // Switch curve state: left, right, or straight
          const r = Math.random();
          if (r < 0.38) {
            targetCurveRef.current = -1.2; // Left curve
            setComboText('◀ HARD LEFT CURVE! DRIFT!');
          } else if (r < 0.76) {
            targetCurveRef.current = 1.2; // Right curve
            setComboText('HARD RIGHT CURVE! DRIFT! ▶');
          } else {
            targetCurveRef.current = 0; // Straight
            setComboText('STRAIGHTAWAY - BOOST!');
          }
          nextCurveTimerRef.current = 100 + Math.floor(Math.random() * 80);
          setTimeout(() => setComboText(null), 1800);
        }

        // Smooth curve interpolation
        trackCurveRef.current += (targetCurveRef.current - trackCurveRef.current) * 0.04;

        // Steering & Drift Physics
        const turnDir = targetCurveRef.current !== 0 ? Math.sign(targetCurveRef.current) : 1;

        if (isTouchHeldRef.current) {
          // DRIFTING ACTIVE
          // Throw tail out in curve direction
          const targetAngle = turnDir * 0.65; // ~37 degrees
          carAngleRef.current += (targetAngle - carAngleRef.current) * 0.12;

          // Lateral slide
          const slideForce = turnDir * 4.2;
          carXRef.current += slideForce - (trackCurveRef.current * 3.5);

          // Track continuous drift meters
          currentDriftRef.current += 0.28 * (carSpeedRef.current / 7);
          setCurrentDriftMeters(Math.round(currentDriftRef.current * 10) / 10);

          // Update longest drift
          if (currentDriftRef.current > longestDriftRef.current) {
            longestDriftRef.current = currentDriftRef.current;
            setLongestDriftThisRun(Math.round(longestDriftRef.current * 10) / 10);
          }

          // Multiplier climbing
          if (currentDriftRef.current > 40 && multRef.current < 5) {
            multRef.current = 5;
            setMultiplier(5);
            sound.playDriftMilestone(5);
          } else if (currentDriftRef.current > 25 && multRef.current < 4) {
            multRef.current = 4;
            setMultiplier(4);
            sound.playDriftMilestone(4);
          } else if (currentDriftRef.current > 15 && multRef.current < 3) {
            multRef.current = 3;
            setMultiplier(3);
            sound.playDriftMilestone(3);
          } else if (currentDriftRef.current > 6 && multRef.current < 2) {
            multRef.current = 2;
            setMultiplier(2);
            sound.playDriftMilestone(2);
          }

          // Continuous score trickle
          scoreRef.current += Math.floor(multRef.current * 4);
          setScore(scoreRef.current);

          // Audio pitch modulation
          sound.updateDriftPitch(multRef.current);

          // Rear wheel coordinates for tire smoke & skid marks
          const carY = 440;
          const cosA = Math.cos(carAngleRef.current);
          const sinA = Math.sin(carAngleRef.current);

          // Left and right rear wheel offsets
          const rw1x = carXRef.current - 14 * cosA + 20 * sinA;
          const rw1y = carY - 14 * sinA - 20 * cosA + 20;
          const rw2x = carXRef.current + 14 * cosA + 20 * sinA;
          const rw2y = carY + 14 * sinA - 20 * cosA + 20;

          // Record skidmarks
          if (lastWheelPosRef.current) {
            skidsRef.current.push({
              x1: lastWheelPosRef.current.w1x,
              y1: lastWheelPosRef.current.w1y,
              x2: rw1x,
              y2: rw1y,
              alpha: 0.6,
            });
            skidsRef.current.push({
              x1: lastWheelPosRef.current.w2x,
              y1: lastWheelPosRef.current.w2y,
              x2: rw2x,
              y2: rw2y,
              alpha: 0.6,
            });
          }
          lastWheelPosRef.current = { w1x: rw1x, w1y: rw1y, w2x: rw2x, w2y: rw2y };

          // Emit tire smoke particles
          for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
              x: rw1x + (Math.random() - 0.5) * 6,
              y: rw1y,
              vx: (Math.random() - 0.5) * 3 - sinA * 2,
              vy: 3 + Math.random() * 3,
              size: 8 + Math.random() * 12,
              alpha: 0.7,
              color: '#f8fafc',
              decay: 0.04,
            });
            particlesRef.current.push({
              x: rw2x + (Math.random() - 0.5) * 6,
              y: rw2y,
              vx: (Math.random() - 0.5) * 3 - sinA * 2,
              vy: 3 + Math.random() * 3,
              size: 8 + Math.random() * 12,
              alpha: 0.7,
              color: '#e2e8f0',
              decay: 0.04,
            });
          }

          // Sparks if near apex or road edge
          if (carXRef.current < 90 || carXRef.current > width - 90) {
            for (let i = 0; i < 4; i++) {
              particlesRef.current.push({
                x: carXRef.current + (Math.random() - 0.5) * 20,
                y: carY + 15,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6,
                size: 2 + Math.random() * 3,
                alpha: 1,
                color: '#facc15',
                decay: 0.08,
              });
            }
          }
        } else {
          // NOT DRIFTING - Straightening out
          carAngleRef.current += (0 - carAngleRef.current) * 0.18;
          // Road curve pulls car if not steering/drifting
          carXRef.current -= trackCurveRef.current * 4.2;
          lastWheelPosRef.current = null;
        }

        // Road edge collision check
        const roadMinX = 50;
        const roadMaxX = width - 50;
        if (carXRef.current < roadMinX) {
          carXRef.current = roadMinX + 2;
          livesRef.current -= 1;
          setLives(livesRef.current);
          sound.playCrash();
          setFeedback('CRASH! GUARD RAIL HIT! 💥');
          setTimeout(() => setFeedback(null), 1000);
          if (livesRef.current <= 0) {
            handleFinishMatch();
          }
        } else if (carXRef.current > roadMaxX) {
          carXRef.current = roadMaxX - 2;
          livesRef.current -= 1;
          setLives(livesRef.current);
          sound.playCrash();
          setFeedback('CRASH! GUARD RAIL HIT! 💥');
          setTimeout(() => setFeedback(null), 1000);
          if (livesRef.current <= 0) {
            handleFinishMatch();
          }
        }
      }

      // ----------------------------------------------------
      // DRAWING SCENE
      // ----------------------------------------------------

      // 1. Cyber Asphalt Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // 2. Curving Road Rendering
      const roadCenterBase = width / 2;
      const roadWidth = width * 0.76;

      ctx.save();

      // Road track polygon with perspective curvature
      const roadSegments = 20;
      const segH = height / roadSegments;

      for (let i = 0; i < roadSegments; i++) {
        const yTop = i * segH;
        const yBottom = (i + 1) * segH;

        const curveFactorTop = Math.pow((height - yTop) / height, 1.8) * trackCurveRef.current * 55;
        const curveFactorBot = Math.pow((height - yBottom) / height, 1.8) * trackCurveRef.current * 55;

        const cxTop = roadCenterBase + curveFactorTop;
        const cxBot = roadCenterBase + curveFactorBot;

        const wTop = roadWidth * (0.65 + 0.35 * (yTop / height));
        const wBot = roadWidth * (0.65 + 0.35 * (yBottom / height));

        // Road Surface
        ctx.fillStyle = (i % 2 === 0) ? '#111827' : '#0f172a';
        ctx.beginPath();
        ctx.moveTo(cxTop - wTop / 2, yTop);
        ctx.lineTo(cxTop + wTop / 2, yTop);
        ctx.lineTo(cxBot + wBot / 2, yBottom);
        ctx.lineTo(cxBot - wBot / 2, yBottom);
        ctx.closePath();
        ctx.fill();

        // Neon Curb Rumble Strips (Red / White neon or Cyan / Magenta)
        const curbW = 12;
        const isCurbStripe = ((i * 3 + Math.floor(roadOffsetRef.current / 15)) % 2 === 0);

        // Left Curb
        ctx.fillStyle = isCurbStripe ? '#f43f5e' : '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(cxTop - wTop / 2 - curbW, yTop);
        ctx.lineTo(cxTop - wTop / 2, yTop);
        ctx.lineTo(cxBot - wBot / 2, yBottom);
        ctx.lineTo(cxBot - wBot / 2 - curbW, yBottom);
        ctx.fill();

        // Right Curb
        ctx.fillStyle = isCurbStripe ? '#06b6d4' : '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(cxTop + wTop / 2, yTop);
        ctx.lineTo(cxTop + wTop / 2 + curbW, yTop);
        ctx.lineTo(cxBot + wBot / 2 + curbW, yBottom);
        ctx.lineTo(cxBot + wBot / 2, yBottom);
        ctx.fill();
      }

      // Road Center Striping (Dashed neon gold)
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([25, 20]);
      ctx.lineDashOffset = -roadOffsetRef.current;
      ctx.beginPath();
      for (let i = 0; i <= roadSegments; i++) {
        const y = i * segH;
        const curveOffset = Math.pow((height - y) / height, 1.8) * trackCurveRef.current * 55;
        if (i === 0) ctx.moveTo(roadCenterBase + curveOffset, y);
        else ctx.lineTo(roadCenterBase + curveOffset, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Skid Marks on the road
      ctx.lineWidth = 5;
      for (let i = skidsRef.current.length - 1; i >= 0; i--) {
        const s = skidsRef.current[i];
        ctx.strokeStyle = `rgba(15, 23, 42, ${s.alpha})`;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();

        // Move skids down with road motion
        s.y1 += carSpeedRef.current;
        s.y2 += carSpeedRef.current;
        s.alpha -= 0.003;

        if (s.y1 > height + 50 || s.alpha <= 0) {
          skidsRef.current.splice(i, 1);
        }
      }

      // 4. Particles (Tire smoke and sparks)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size *= 1.04;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 5. Draw the Sports Car
      const carY = 440;
      const carX = carXRef.current;
      const angle = carAngleRef.current;

      ctx.save();
      ctx.translate(carX, carY);
      ctx.rotate(angle);

      // Underglow Neon Glow
      const glowColor = isTouchHeldRef.current ? '#06b6d4' : '#6366f1';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18;
      ctx.fillStyle = glowColor;
      ctx.fillRect(-18, -32, 36, 64);
      ctx.shadowBlur = 0;

      // Wheels (4 Black tires with silver rims)
      ctx.fillStyle = '#020617';
      // Front Left
      ctx.fillRect(-22, -26, 6, 14);
      // Front Right
      ctx.fillRect(16, -26, 6, 14);
      // Rear Left
      ctx.fillRect(-22, 12, 6, 14);
      // Rear Right
      ctx.fillRect(16, 12, 6, 14);

      // Car Main Body (Futuristic GT Racer)
      const gradBody = ctx.createLinearGradient(-18, -32, 18, 32);
      gradBody.addColorStop(0, '#f43f5e'); // Neon Crimson
      gradBody.addColorStop(0.5, '#e11d48');
      gradBody.addColorStop(1, '#9f1239');
      ctx.fillStyle = gradBody;
      ctx.beginPath();
      ctx.roundRect(-18, -32, 36, 64, [8, 8, 4, 4]);
      ctx.fill();

      // Racing Stripes (Dual white / cyan central stripes)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-3, -32, 2, 64);
      ctx.fillRect(1, -32, 2, 64);

      // Windshield & Glass Cockpit
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-12, -14, 24, 26, 3);
      ctx.fill();
      // Glass reflection
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(8, -12);
      ctx.lineTo(2, 6);
      ctx.lineTo(-8, 6);
      ctx.fill();

      // Rear Wing / Spoiler
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-20, 26, 40, 5);

      // Headlights (Beaming forward on dark track)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-15, -34, 6, 3);
      ctx.fillRect(9, -34, 6, 3);

      // Taillights
      ctx.fillStyle = isTouchHeldRef.current ? '#ef4444' : '#b91c1c';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = isTouchHeldRef.current ? 12 : 4;
      ctx.fillRect(-15, 30, 8, 3);
      ctx.fillRect(7, 30, 8, 3);
      ctx.shadowBlur = 0;

      ctx.restore();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between select-none touch-none overflow-hidden bg-slate-950"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Dynamic Background Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={650}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Top HUD Bar */}
      <div className="relative z-10 w-full p-3 sm:p-4 flex items-center justify-between pointer-events-none">
        {/* Score & Multiplier */}
        <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-lg flex items-center gap-3">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Score</span>
            <span className="text-xl font-black font-display text-amber-400 leading-none">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <div className="text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Combo</span>
            <span className={`text-base font-black ${multiplier > 1 ? 'text-cyan-400 animate-pulse' : 'text-slate-300'} leading-none`}>
              {multiplier}x 🔥
            </span>
          </div>
        </div>

        {/* Time Remaining & Lives */}
        <div className="flex items-center gap-2">
          {/* Stability Lives */}
          <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-2 rounded-2xl border border-slate-700/80 shadow-lg flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < lives ? 'opacity-100' : 'opacity-25 grayscale'}`}>
                ❤️
              </span>
            ))}
          </div>

          {/* Timer */}
          <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-lg text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Time</span>
            <span className={`text-base font-black font-mono leading-none ${timeLeft <= 8 ? 'text-rose-400 animate-ping' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Mid-Screen Drift Telemetry & Banner */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto pointer-events-none px-4 text-center">
        {/* Turn Warning / Combo text */}
        {comboText && (
          <div className="bg-slate-950/80 backdrop-blur border border-cyan-500/60 px-4 py-1.5 rounded-full text-xs font-black text-cyan-300 animate-bounce shadow-xl mb-3">
            {comboText}
          </div>
        )}

        {/* Active Drift Meter */}
        {isDrifting && (
          <div className="bg-slate-950/90 backdrop-blur-md border-2 border-cyan-400 p-4 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest mb-1">
              <Flame className="w-4 h-4 animate-pulse text-cyan-400" />
              DRIFTING NOW!
            </div>
            <div className="text-4xl font-black font-mono text-white tracking-tight drop-shadow-md">
              {currentDriftMeters.toFixed(1)} <span className="text-lg text-cyan-300">METERS</span>
            </div>
            <div className="text-[11px] font-bold text-amber-300 mt-1">
              {multiplier >= 4 ? '🔥 INSANE DRIFT GOD!' : multiplier >= 2 ? '⚡ SICK DRIFT!' : 'HOLD TO EXTEND!'}
            </div>
          </div>
        )}

        {/* Action feedback toast */}
        {feedback && (
          <div className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-4 py-2 rounded-2xl text-xs shadow-xl animate-in fade-in slide-in-from-bottom-2">
            {feedback}
          </div>
        )}
      </div>

      {/* Bottom Telemetry & Controls */}
      <div className="relative z-10 w-full p-4 flex flex-col items-center gap-2 pointer-events-none">
        {/* Longest Drift Banner (The core user request) */}
        <div className="w-full max-w-xs bg-slate-900/90 backdrop-blur-md border border-amber-500/40 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">Longest Drift</span>
              <span className="text-sm font-black text-white font-mono">
                {longestDriftThisRun.toFixed(1)}m
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Best Ever</span>
            <span className="text-xs font-black text-amber-300 font-mono">
              {Math.max(longestDriftThisRun, allTimeLongest).toFixed(1)}m
            </span>
          </div>
        </div>

        {/* Start / Touch Prompt Banner */}
        {!isPlaying ? (
          <button
            onClick={startGame}
            className="pointer-events-auto w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 text-white font-black text-base shadow-2xl active:scale-95 flex items-center justify-center gap-2 animate-pulse"
          >
            <Zap className="w-5 h-5 fill-current" />
            TOUCH TO START DRIFTING! 🏎️
          </button>
        ) : (
          <div className="text-[11px] font-bold text-slate-400 bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800">
            👆 <span className="text-cyan-300">TOUCH & HOLD ANYWHERE</span> to Drift! Release on straights!
          </div>
        )}
      </div>
    </div>
  );
};
