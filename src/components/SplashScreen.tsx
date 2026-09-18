import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1.2s display time, then 300ms smooth fadeout
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const exitTimer = setTimeout(() => {
        onComplete();
      }, 350);
      return () => clearTimeout(exitTimer);
    }, 1100);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 select-none transition-opacity duration-350 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Radial Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      {/* Brand Emblem Container */}
      <div className="relative flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="relative w-28 h-28 mb-5">
          {/* Animated Glow Halo */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-lg animate-pulse" />
          
          {/* Icon Box */}
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-0.5 shadow-2xl flex items-center justify-center border border-white/20">
            <svg
              viewBox="0 0 100 100"
              className="w-16 h-16 drop-shadow-md"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Golden Glow Lightning */}
              <polygon
                points="56,12 28,52 50,52 42,88 76,44 54,44"
                fill="url(#splashBoltGrad)"
              />
              {/* Crisp White Inner Bolt */}
              <polygon
                points="55,16 34,50 50,50 44,82 70,46 52,46"
                fill="#FFFFFF"
              />
              <defs>
                <linearGradient id="splashBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display font-black text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
          MINIRUSH
        </h1>

        {/* Official Tagline */}
        <p className="text-xs font-bold text-amber-400/90 tracking-widest uppercase mt-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Tiny Games. Endless Challenges.
        </p>

        {/* Subtle mini progress pip */}
        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden mt-6">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
