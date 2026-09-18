import React, { useState, useEffect } from 'react';
import { adService, RewardedAdReason } from '../services/adService';
import { sound } from '../services/sound';
import { X, CheckCircle2, Play, Sparkles } from 'lucide-react';

interface AdModalProps {
  reason: RewardedAdReason;
  onClose: () => void;
}

export const AdModal: React.FC<AdModalProps> = ({ reason, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaim(true);
          sound.playCoin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClaim = () => {
    sound.playVictory();
    adService.completeCurrentAd(true);
    onClose();
  };

  const handleCancel = () => {
    adService.completeCurrentAd(false);
    onClose();
  };

  const getTitle = () => {
    switch (reason) {
      case 'extra_lives': return 'Watch to Refill 5 Lives ❤️';
      case 'double_daily_box': return 'Watch to Double Daily Coins 🪙';
      case 'bonus_coins': return 'Watch to Claim 250 Free Coins 🪙';
      default: return 'MiniRush Arcade Sponsor';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
        {/* Skip/Close after completion or cancel */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-xs font-bold text-slate-500 hover:text-slate-300 py-1 px-2.5 rounded-lg bg-slate-800"
        >
          {canClaim ? 'Skip' : `Skip in ${secondsLeft}s`}
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Rewarded Arcade Sponsor
        </div>

        <h3 className="text-xl font-black font-display text-white mb-2">{getTitle()}</h3>
        <p className="text-xs text-slate-400">
          MiniRush sponsored partner message. Supporting free gaming for everyone!
        </p>

        {/* Sponsor Banner Demo Frame */}
        <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 mx-auto flex items-center justify-center text-3xl font-black text-slate-950 shadow-xl mb-3 animate-pulse">
            ⚡
          </div>
          <h4 className="font-display font-black text-white text-base">MiniRush Pro Tour 2026</h4>
          <span className="text-[11px] text-indigo-300 mt-1 block">Play fast. Win rewards. Tiny games, infinite rush.</span>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full mt-5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-1000"
              style={{ width: `${((4 - secondsLeft) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        {canClaim ? (
          <button
            onClick={handleClaim}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black font-display text-base shadow-lg shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            CLAIM YOUR REWARD! 🎁
          </button>
        ) : (
          <div className="py-3 text-xs font-bold text-slate-400 font-mono">
            Reward unlocks in {secondsLeft} seconds...
          </div>
        )}
      </div>
    </div>
  );
};
