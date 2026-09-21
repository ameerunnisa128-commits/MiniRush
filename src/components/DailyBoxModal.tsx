import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { sound } from '../services/sound';
import { X, Gift, Sparkles, Coins, Heart, CheckCircle2 } from 'lucide-react';

interface DailyBoxModalProps {
  profile: UserProfile;
  onClose: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
  onRequestAdToDouble: (bonusCoins: number) => void;
}

export const DailyBoxModal: React.FC<DailyBoxModalProps> = ({
  profile,
  onClose,
  onProfileUpdate,
  onRequestAdToDouble,
}) => {
  const streakStatus = StorageService.getStreakStatus(profile);
  const canClaim = streakStatus.canClaim;
  const [isOpened, setIsOpened] = useState(!canClaim);
  const [claimedReward, setClaimedReward] = useState<{ coins: number; lives: number } | null>(null);

  const streakRewards = StorageService.DAILY_STREAK_REWARDS;
  const currentStreak = streakStatus.displayDayInCycle;
  const rewardToday = streakStatus.todayReward;

  const handleOpenBox = () => {
    if (!canClaim || isOpened) return;

    sound.playVictory();
    sound.playCoinCascade();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }

    const res = StorageService.claimDailyStreak(profile);
    if (res.success) {
      onProfileUpdate(res.profile);
      setClaimedReward({ coins: res.coinsClaimed, lives: res.livesClaimed });
      setIsOpened(true);
    }
  };

  const alreadyDoubledToday = profile.lastDailyBoxDoubled && 
    new Date(profile.lastDailyBoxDoubled).toDateString() === new Date().toDateString();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-black uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Day {currentStreak} Streak
        </div>
        <h2 className="text-2xl font-black font-display text-white">Daily Mystery Box</h2>
        <p className="text-xs text-slate-400 mt-1">Open daily to boost your rewards streak!</p>

        {/* 7-Day Streak Calendar */}
        <div className="grid grid-cols-7 gap-1.5 my-5">
          {streakRewards.map((r) => {
            const isPast = r.day < currentStreak;
            const isToday = r.day === currentStreak;
            return (
              <div
                key={r.day}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-between border text-[10px] font-bold ${
                  isToday
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                    : isPast
                    ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}
              >
                <span>D{r.day}</span>
                <span className="text-sm my-0.5">{r.isMega ? '👑' : '🎁'}</span>
                <span>+{r.coins}</span>
              </div>
            );
          })}
        </div>

        {/* Mystery Box Presentation */}
        <div className="my-6">
          {!isOpened ? (
            <div 
              onClick={handleOpenBox}
              className="cursor-pointer transform hover:scale-105 active:scale-95 transition-all inline-block"
            >
              <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 border-4 border-amber-300 animate-bounce">
                <span className="text-6xl">🎁</span>
              </div>
              <span className="text-xs font-black text-amber-400 block mt-3 uppercase tracking-wider">
                Tap Box to Unlock! ⚡
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <span className="text-5xl block mb-2">🎉</span>
              <h3 className="text-xl font-black text-amber-400">Claimed Today!</h3>
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-amber-300 font-black text-sm">
                  <Coins className="w-4 h-4 fill-amber-400" />
                  +{rewardToday.coins} Coins
                </div>
                <div className="flex items-center gap-1.5 text-rose-400 font-black text-sm">
                  <Heart className="w-4 h-4 fill-rose-500" />
                  +{rewardToday.lives} Lives
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 mt-4">
          {!isOpened && canClaim ? (
            <button
              onClick={handleOpenBox}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black font-display text-lg shadow-lg shadow-amber-500/30 active:scale-95 flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              CLAIM DAY {currentStreak} BOX 🚀
            </button>
          ) : alreadyDoubledToday ? (
            <div className="w-full py-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-black text-xs text-center">
              DOUBLE REWARD CLAIMED TODAY ✓ (+{rewardToday.coins} 🪙)
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                onRequestAdToDouble(rewardToday.coins);
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30 active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              WATCH AD → DOUBLE REWARD (+{rewardToday.coins} 🪙)
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
