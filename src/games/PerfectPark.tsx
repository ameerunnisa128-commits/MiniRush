import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';

interface PerfectParkProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
}

export const PerfectParkGame: React.FC<PerfectParkProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [parksCount, setParksCount] = useState(0);
  const [perfectParks, setPerfectParks] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Highway scrolling Y
  const carYRef = useRef(0);
  const carXRef = useRef(75); // highway lane X
  const carAngleRef = useRef(0);
  const speedRef = useRef(3.2);
  const isDriftingRef = useRef(false);

  // Parking spot target Y (where the car should turn right to park)
  const spotYRef = useRef(200);
  const animFrameRef = useRef(0);
  const [, setRerender] = useState({});

  const nextSlot = useCallback((currentScore: number) => {
    // Reposition spot ahead of current car Y
    spotYRef.current = carYRef.current + 320 + Math.random() * 80;
    isDriftingRef.current = false;
    carXRef.current = 75;
    carAngleRef.current = 0;
    speedRef.current = Math.min(6.5, 3.2 + Math.floor(currentScore / 600) * 0.4);
  }, []);

  const updateCar = useCallback(() => {
    // Move car forward
    carYRef.current += speedRef.current;

    if (isDriftingRef.current) {
      // Drifting right into parking slot (from x: 75 to x: 195)
      carXRef.current = Math.min(195, carXRef.current + 4.5);
      carAngleRef.current = Math.min(90, carAngleRef.current + 6);
    }

    // Check if missed the spot completely
    if (carYRef.current > spotYRef.current + 110 && !isDriftingRef.current) {
      // Missed parking spot!
      sound.playCrash();
      setFeedback('MISSED PARKING! 💥');
      cancelAnimationFrame(animFrameRef.current);
      setIsPlaying(false);
      setTimeout(() => {
        onGameOver(score, perfectParks);
      }, 600);
      return;
    }

    setRerender({});
    animFrameRef.current = requestAnimationFrame(updateCar);
  }, [score, perfectParks, onGameOver]);

  const startGame = () => {
    setScore(0);
    setParksCount(0);
    setPerfectParks(0);
    carYRef.current = 0;
    carXRef.current = 75;
    carAngleRef.current = 0;
    speedRef.current = 3.2;
    isDriftingRef.current = false;
    spotYRef.current = 280;
    setIsPlaying(true);
    setFeedback(null);
    sound.playEngine();
    animFrameRef.current = requestAnimationFrame(updateCar);
  };

  const handleParkTap = () => {
    if (!isPlaying) {
      startGame();
      return;
    }

    if (isDriftingRef.current) return;

    isDriftingRef.current = true;
    sound.playEngine();

    // Check timing when tap happened relative to spot center
    const carFrontY = carYRef.current;
    const spotCenterY = spotYRef.current;
    const diff = Math.abs(carFrontY - spotCenterY);

    setTimeout(() => {
      // Evaluation
      if (diff <= 28) {
        // Perfect Park!
        sound.playPerfect();
        setFeedback('PERFECT PARK! 🅿️🔥');
        setPerfectParks(p => p + 1);
        setParksCount(p => p + 1);
        const pts = 350;
        setScore(s => s + pts);
        setTimeout(() => {
          setFeedback(null);
          nextSlot(score + pts);
        }, 500);
      } else if (diff <= 58) {
        // Decent Park
        sound.playThunk();
        setFeedback('GOOD PARK! 🚗');
        setParksCount(p => p + 1);
        const pts = 200;
        setScore(s => s + pts);
        setTimeout(() => {
          setFeedback(null);
          nextSlot(score + pts);
        }, 500);
      } else {
        // Crash into neighboring bumper!
        sound.playCrash();
        setFeedback('BUMPER CRASH! 💥');
        cancelAnimationFrame(animFrameRef.current);
        setIsPlaying(false);
        setTimeout(() => {
          onGameOver(score, perfectParks);
        }, 600);
      }
    }, 280);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const carY = carYRef.current;
  const carX = carXRef.current;
  const carAngle = carAngleRef.current;
  const spotY = spotYRef.current;

  // Viewport offset relative to moving car
  const viewOffsetY = carY - 180;

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game"
      onClick={handleParkTap}
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Score</span>
          <span className="text-2xl font-black font-display text-blue-400">{score.toLocaleString()}</span>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Parked</span>
          <span className="text-xl font-bold text-amber-400">🅿️ {parksCount} Cars</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Speed</span>
          <span className="text-xl font-mono text-emerald-400">{(speedRef.current * 18).toFixed(0)} km/h</span>
        </div>
      </div>

      {/* 3-Second Rule Instructions */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🅿️ <span className="text-blue-300 font-semibold">Tap to drift & park</span> cleanly in the glowing bay!
        </p>
      </div>

      {/* Street Simulation Canvas */}
      <div className="relative w-full h-80 bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Road Surface */}
        <div className="absolute inset-0 bg-slate-900">
          {/* Highway lane divider */}
          <div 
            className="absolute left-36 top-0 bottom-0 w-1 border-r-2 border-dashed border-amber-400/40"
            style={{ transform: `translateY(-${viewOffsetY % 40}px)` }}
          />

          {/* Road Curb */}
          <div className="absolute right-24 top-0 bottom-0 w-2 bg-slate-700 border-l border-slate-600" />
        </div>

        {/* Moving World Container */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(-${viewOffsetY}px)` }}
        >
          {/* Parked Cars Above & Below the Empty Bay */}
          {/* Preceding parked car */}
          <div 
            className="absolute right-5 w-16 h-28 bg-rose-600/90 rounded-lg shadow-lg border border-rose-400 flex flex-col items-center justify-between p-1.5"
            style={{ top: `${spotY - 140}px` }}
          >
            <div className="w-12 h-4 bg-slate-900/80 rounded" />
            <span className="text-xs text-rose-200">PARKED</span>
            <div className="w-12 h-3 bg-red-800 rounded" />
          </div>

          {/* THE EMPTY GLOWING PARKING BAY */}
          <div 
            className="absolute right-5 w-18 h-32 border-2 border-dashed border-emerald-400 bg-emerald-500/15 rounded-xl shadow-lg flex items-center justify-center"
            style={{ top: `${spotY - 60}px` }}
          >
            <span className="text-3xl font-black text-emerald-400 animate-pulse">🅿️</span>
          </div>

          {/* Following parked car */}
          <div 
            className="absolute right-5 w-16 h-28 bg-indigo-600/90 rounded-lg shadow-lg border border-indigo-400 flex flex-col items-center justify-between p-1.5"
            style={{ top: `${spotY + 90}px` }}
          >
            <div className="w-12 h-4 bg-slate-900/80 rounded" />
            <span className="text-xs text-indigo-200">PARKED</span>
            <div className="w-12 h-3 bg-indigo-800 rounded" />
          </div>

          {/* PLAYER SPEEDSTER CAR */}
          <div 
            className="absolute w-12 h-22 rounded-xl shadow-2xl transition-transform flex flex-col items-center justify-between p-1 z-20"
            style={{
              left: `${carX}px`,
              top: `${carY}px`,
              transform: `translate(-50%, -50%) rotate(${carAngle}deg)`,
              backgroundColor: '#3b82f6',
              border: '2px solid #93c5fd',
            }}
          >
            {/* Windshield */}
            <div className="w-8 h-4 bg-slate-900/80 rounded-t" />
            {/* Roof */}
            <div className="text-[10px] font-black text-blue-100">RUSH</div>
            {/* Rear window */}
            <div className="w-8 h-3 bg-slate-900/80 rounded-b" />
          </div>
        </div>

        {/* Feedback popup */}
        {feedback && (
          <div className="absolute top-1/2 -translate-y-10 bg-slate-900/90 text-blue-300 font-black text-sm px-4 py-1.5 rounded-full border border-blue-500/50 shadow-xl animate-bounce z-30">
            {feedback}
          </div>
        )}
      </div>

      {/* Button */}
      <div className="w-full mt-2">
        <button
          id="perfect-park-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleParkTap();
          }}
          className="w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 flex items-center justify-center gap-2"
        >
          {isPlaying ? 'TAP TO DRIFT PARK 🅿️' : 'START PARKING RUSH 🚀'}
        </button>
      </div>
    </div>
  );
};
