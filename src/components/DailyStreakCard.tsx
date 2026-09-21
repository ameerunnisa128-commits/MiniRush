import React, { useState, useEffect } from 'react';
import { UserProfile, DailyStreakReward } from '../types';
import { StorageService } from '../services/storage';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { Flame, Sparkles, Gift, Check, Clock, ShieldCheck, ChevronDown, ChevronUp, Trophy, Coins, Heart, Zap } from 'lucide-react';

interface DailyStreakCardProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onOpenMysteryBox: () => void;
}

export const DailyStreakCard: React.FC<DailyStreakCardProps> = ({
  profile,
  onProfileUpdate,
  onOpenMysteryBox,
}) => {
  const [streakStatus, setStreakStatus] = useState(() => StorageService.getStreakStatus(profile));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAllPerks, setShowAllPerks] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');

  // Keep streak status fresh with profile changes
  useEffect(() => {
    setStreakStatus(StorageService.getStreakStatus(profile));
  }, [profile]);

  // Live countdown to next day's drop (midnight)
  useEffect(() => {
    const updateCountdown = () => {
      const status = StorageService.getStreakStatus(profile);
      setStreakStatus(status);

      const diffMs = status.msUntilNextDrop;
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setCountdownStr(
        `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  const {
    canClaim,
    currentStreak,
    displayDayInCycle,
    isBroken,
    longestStreak,
    todayReward,
    streakMultiplier,
  } = streakStatus;

  // Handle direct 1-tap claim on home screen
  const handleClaim = () => {
    if (!canClaim || justClaimed) return;

    sound.playVictory();
    sound.playCoinCascade();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#f97316', '#ef4444', '#10b981'],
      });
    } catch {
      // ignore
    }

    const res = StorageService.claimDailyStreak(profile);
    if (res.success) {
      setJustClaimed(true);
      onProfileUpdate(res.profile);
      setStreakStatus(StorageService.getStreakStatus(res.profile));
      setTimeout(() => setJustClaimed(false), 3000);
    }
  };

  const streakRewards = StorageService.DAILY_STREAK_REWARDS;
  const activeDayForUi = displayDayInCycle;
  const inspectedDay = selectedDay !== null ? streakRewards[selectedDay - 1] : todayReward;

  // Visual progression percentage (1-7)
  const completedDaysInTrack = canClaim ? activeDayForUi - 1 : activeDayForUi;
  const progressPercent = Math.min(100, Math.round((completedDaysInTrack / 7) * 100));

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/40 p-4 sm:p-5 shadow-2xl transition-all">
      {/* Radiant ambient glow */}
      <div className="absolute -left-10 -top-10 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3.5">
        {/* Header: Title, Streak Badge, Multiplier, Record */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center text-xl shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/40">
              <Flame className="w-6 h-6 text-slate-950 fill-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-display font-black text-sm text-white tracking-wide">
                  Daily Login Streak
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black border border-amber-500/40 flex items-center gap-0.5 shadow-sm">
                  🔥 {currentStreak} {currentStreak === 1 ? 'DAY' : 'DAYS'}
                </span>
                {streakMultiplier > 1 && (
                  <span className="text-[10px] bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 fill-slate-950" /> {streakMultiplier}x BOOST
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Log in daily to scale your bonus coins!</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-bold font-mono">Best: {longestStreak}d</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setShowAllPerks(!showAllPerks);
            }}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors border border-slate-700/60"
            title="View 7-Day Rewards Breakdown"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold hidden sm:inline">Perks</span>
            {showAllPerks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Broken streak alert notification if user missed yesterday */}
        {isBroken && canClaim && (
          <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-2.5 px-3 flex items-center justify-between text-[11px] text-rose-300">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>Streak paused! Claim now to ignite Day 1 and start fresh.</span>
            </div>
            <span className="font-black text-[10px] bg-rose-500/20 px-2 py-0.5 rounded-full text-rose-300">
              RESTART
            </span>
          </div>
        )}

        {/* 7-Day Visual Progression Stepper (Nodes + Connecting Progress Line) */}
        <div className="relative pt-1 pb-1">
          {/* Background Rail */}
          <div className="absolute top-[26px] left-3 right-3 h-1.5 bg-slate-800 rounded-full z-0" />
          
          {/* Active Progress Fill */}
          <div
            className="absolute top-[26px] left-3 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full z-0 transition-all duration-500 shadow-sm shadow-amber-400/50"
            style={{ width: `calc(${progressPercent}% - 6px)` }}
          />

          {/* 7 Step Nodes */}
          <div className="relative z-10 grid grid-cols-7 gap-1 sm:gap-1.5">
            {streakRewards.map((r) => {
              const dayNum = r.day;
              const isPast = canClaim ? dayNum < activeDayForUi : dayNum <= activeDayForUi;
              const isCurrent = dayNum === activeDayForUi;
              const isSelected = selectedDay === dayNum;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    sound.playTick();
                    setSelectedDay(isSelected ? null : dayNum);
                  }}
                  className={`cursor-pointer group flex flex-col items-center p-1.5 sm:p-2 rounded-2xl border transition-all active:scale-95 ${
                    isCurrent
                      ? canClaim
                        ? 'bg-gradient-to-b from-amber-500/25 to-yellow-500/15 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 animate-pulse'
                        : 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : isPast
                      ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                  } ${isSelected ? 'scale-105 ring-2 ring-white/60' : ''}`}
                >
                  {/* Day Label */}
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider ${
                      isCurrent ? 'text-amber-300' : isPast ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    D{dayNum}
                  </span>

                  {/* Icon Node */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full my-1 flex items-center justify-center text-xs font-black shadow-inner transition-transform ${
                      isPast
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? canClaim
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md scale-110'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : r.isMega
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isCurrent && !canClaim ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : r.isMega ? (
                      <span className="text-sm">👑</span>
                    ) : (
                      <span>{r.badge}</span>
                    )}
                  </div>

                  {/* Coin Amount Pill */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono font-black truncate ${
                      isCurrent ? 'text-amber-300' : isPast ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    +{r.coins}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inspected Day Preview Drawer (if user tapped a specific node) */}
        {selectedDay !== null && (
          <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">{inspectedDay.badge}</span>
              <div>
                <span className="text-xs font-black text-amber-300 block">
                  Day {inspectedDay.day}: {inspectedDay.perkTitle} {inspectedDay.isMega ? '👑 (Mega Vault)' : ''}
                </span>
                <span className="text-[11px] text-slate-400">
                  +{inspectedDay.coins} Coins &bull; +{inspectedDay.lives} Lives
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Milestone Progression Progress Bar Note */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-300">
              Track Progress: {completedDaysInTrack}/7 Days
            </span>
            {completedDaysInTrack < 7 ? (
              <span className="text-amber-400 font-bold">
                &bull; {7 - completedDaysInTrack} days to Mega Crown (+2,000 🪙)
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">&bull; 👑 Mega Streak Completed!</span>
            )}
          </div>
          <span className="font-mono font-bold text-amber-400">{progressPercent}%</span>
        </div>

        {/* Action Row: Ready to Claim vs Claimed Status */}
        <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {canClaim ? (
            <>
              {/* Today's Reward Details */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0">
                  {todayReward.badge}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white uppercase tracking-wide">
                      Day {activeDayForUi} Reward: {todayReward.perkTitle}
                    </span>
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                      READY
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-black text-amber-300 font-mono flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      +{todayReward.coins} Coins
                    </span>
                    <span className="text-xs font-black text-rose-400 font-mono flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      +{todayReward.lives} Lives
                    </span>
                  </div>
                </div>
              </div>

              {/* Claim Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={onOpenMysteryBox}
                  title="Open 3D Mystery Box & Double Reward"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold">Mystery Box</span>
                </button>

                <button
                  onClick={handleClaim}
                  disabled={justClaimed}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs font-display tracking-wide shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {justClaimed ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                      CLAIMED!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      CLAIM DAY {activeDayForUi} BONUS
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Already Claimed Today Status */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl shrink-0 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                      Day {activeDayForUi} Claimed!
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                      STREAK PROTECTED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Come back tomorrow to unlock Day {((activeDayForUi % 7) + 1)} (+{streakRewards[(activeDayForUi % 7)].coins} 🪙)!
                  </p>
                </div>
              </div>

              {/* Countdown & Mystery Chest Access */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Next: {countdownStr}</span>
                </div>

                <button
                  onClick={onOpenMysteryBox}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Expandable 7-Day Perks Table */}
        {showAllPerks && (
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> 7-Day Streak Rewards Calendar
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {streakRewards.map((r) => (
                <div
                  key={r.day}
                  className={`flex items-center justify-between p-2 rounded-xl border ${
                    r.day === activeDayForUi
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{r.badge}</span>
                    <div>
                      <span className="font-bold text-white block text-[11px]">
                        Day {r.day} &bull; {r.perkTitle}
                      </span>
                      <span className="text-[10px] text-slate-400">+{r.lives} Free Lives</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-amber-400">+{r.coins} 🪙</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
