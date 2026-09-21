import React from 'react';
import { sound } from '../services/sound';
import { Coins, X, Sparkles } from 'lucide-react';

interface CoinReminderBannerProps {
  onClaim: () => void;
  onDismiss: () => void;
}

export const CoinReminderBanner: React.FC<CoinReminderBannerProps> = ({ onClaim, onDismiss }) => {
  return (
    <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-0.5 rounded-3xl shadow-2xl">
        <div className="bg-slate-950/95 backdrop-blur-md rounded-[22px] p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0 animate-bounce">
              🪙
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-300 tracking-wide uppercase">
                  Coin Reminder
                </span>
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                  +100 FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-1">
                Your vault is full! Collect coins to keep gaming.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                onClaim();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs active:scale-95 shadow-md flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 fill-slate-950" />
              CLAIM
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onDismiss();
              }}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
