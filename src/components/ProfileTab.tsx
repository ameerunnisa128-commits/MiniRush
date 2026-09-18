import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, Achievement } from '../types';
import { StorageService } from '../services/storage';
import { sound } from '../services/sound';
import { Award, Trophy, Zap, Share2, Copy, Check, Sparkles, Coins, Flame, UserCheck } from 'lucide-react';

interface ProfileTabProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

const AVATARS = [
  { id: 'rushy', emoji: '⚡', name: 'Rushy' },
  { id: 'fox', emoji: '🦊', name: 'Blaze' },
  { id: 'cyber', emoji: '🦾', name: 'Cyber' },
  { id: 'crown', emoji: '👑', name: 'Royal' },
  { id: 'dino', emoji: '🦖', name: 'Dino' },
  { id: 'ninja', emoji: '🥷', name: 'Ninja' },
];

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile, onProfileUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username);

  const totalScore = Object.values(profile.highScores).reduce((a, b) => a + b, 0);
  const currentAvatar = AVATARS.find(a => a.id === profile.avatarId) || AVATARS[0];

  const handleAvatarSelect = (avatarId: string) => {
    sound.playClick();
    const updated = { ...profile, avatarId };
    StorageService.saveProfile(updated);
    onProfileUpdate(updated);
  };

  const handleSaveName = () => {
    sound.playClick();
    const clean = usernameInput.trim() || 'RushPlayer';
    const updated = { ...profile, username: clean };
    StorageService.saveProfile(updated);
    onProfileUpdate(updated);
    setIsEditingName(false);
  };

  const handleClaimAchievement = (achievementId: string) => {
    sound.playVictory();
    try {
      confetti({ particleCount: 60, spread: 60 });
    } catch {}

    const achList = profile.achievements || [];
    const ach = achList.find(a => a.id === achievementId);
    if (!ach || ach.claimed) return;

    const updated: UserProfile = { ...profile };
    updated.coins += ach.rewardCoins;
    updated.xp += ach.rewardXp || 50;
    updated.achievements = achList.map(a =>
      a.id === achievementId ? { ...a, claimed: true } : a
    );

    StorageService.saveProfile(updated);
    onProfileUpdate(updated);
  };

  const handleCopyReferral = () => {
    sound.playCoin();
    navigator.clipboard.writeText(`Play MiniRush with me and get 500 free coins! Use code: ${profile.referralCode} at ${window.location.origin}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Profile Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/80 via-slate-900 to-purple-950/80 border-2 border-indigo-500/40 shadow-2xl relative">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-indigo-800/80 border-2 border-indigo-400/50 flex items-center justify-center text-4xl shadow-lg">
            {currentAvatar.emoji}
          </div>

          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-36 px-2.5 py-1 bg-slate-950 border border-indigo-500 rounded-lg text-white font-bold text-sm focus:outline-none"
                />
                <button
                  onClick={handleSaveName}
                  className="px-2 py-1 bg-indigo-600 rounded-lg text-xs font-bold text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black font-display text-white">{profile.username}</h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-indigo-300 underline hover:text-white"
                >
                  Edit
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                LEVEL {profile.level}
              </span>
              <span className="text-xs font-bold text-slate-400">
                🔥 {profile.streakDays} Day Streak
              </span>
            </div>

            {/* XP progress */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                <span>XP PROGRESS</span>
                <span>{profile.xp % 500} / 500 XP</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${((profile.xp % 500) / 500) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Avatar selector carousel */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">Choose Avatar</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {AVATARS.map(av => (
              <button
                key={av.id}
                onClick={() => handleAvatarSelect(av.id)}
                className={`p-2 rounded-2xl text-2xl border transition-transform active:scale-95 ${
                  profile.avatarId === av.id
                    ? 'bg-indigo-600/40 border-indigo-400 shadow-md scale-105'
                    : 'bg-slate-800/60 border-slate-700/60 opacity-60'
                }`}
              >
                {av.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div>
        <h4 className="font-display font-black text-base text-white mb-3 px-1">Arcade Career Stats</h4>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Score</span>
            <span className="text-2xl font-black font-display text-amber-400">{totalScore.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Games Played</span>
            <span className="text-2xl font-black font-display text-indigo-400">{profile.totalGamesPlayed}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Perfect Hits</span>
            <span className="text-2xl font-black font-display text-emerald-400">{profile.perfectShots}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Win Streak</span>
            <span className="text-2xl font-black font-display text-pink-400">{profile.streakDays} Days</span>
          </div>
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-500/40 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">👥</span>
          <div>
            <h4 className="font-bold text-sm text-white">Invite Friends & Get +500 Coins</h4>
            <p className="text-[11px] text-slate-300">Share your referral link to earn bonus arcade rewards</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 bg-slate-950/80 px-3 py-2 rounded-xl border border-amber-500/30 font-mono font-black text-amber-300 text-xs">
            {profile.referralCode}
          </div>
          <button
            onClick={handleCopyReferral}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs active:scale-95 flex items-center gap-1.5 shadow"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'COPIED!' : 'SHARE'}
          </button>
        </div>
      </div>

      {/* Achievements List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="font-display font-black text-base text-white">Achievements</h4>
          <span className="text-xs text-slate-500 font-bold font-mono">
            {(profile.achievements || []).filter(a => a.unlocked || a.completed).length} / {(profile.achievements || []).length} UNLOCKED
          </span>
        </div>

        <div className="space-y-2.5">
          {(profile.achievements || []).map(ach => {
            const isUnlocked = ach.unlocked || ach.completed;
            const cur = ach.progress ?? ach.currentCount ?? 0;
            const max = ach.maxProgress ?? ach.targetCount ?? 1;
            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  isUnlocked
                    ? 'bg-slate-900 border-indigo-500/40 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{ach.icon}</span>
                  <div>
                    <h5 className="font-bold text-sm text-white">{ach.name || ach.title}</h5>
                    <p className="text-[11px] text-slate-400">{ach.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-amber-400">
                      <span>+{ach.rewardCoins} Coins</span>
                      <span>•</span>
                      <span>+{ach.rewardXp || 50} XP</span>
                    </div>
                  </div>
                </div>

                <div>
                  {ach.claimed ? (
                    <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                      CLAIMED ✓
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleClaimAchievement(ach.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 animate-bounce"
                    >
                      CLAIM 🎁
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500">
                        {cur} / {max}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
