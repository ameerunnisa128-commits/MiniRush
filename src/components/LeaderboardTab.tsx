import React, { useState } from 'react';
import { UserProfile, LeaderboardEntry } from '../types';
import { sound } from '../services/sound';
import { Trophy, Medal, Crown, Globe, Users, Flame } from 'lucide-react';

interface LeaderboardTabProps {
  profile: UserProfile;
}

const GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'lb_1', username: 'CyberViper', avatar: '⚡', score: 148200, rank: 1, country: '🇺🇸', badge: 'Apex Champion' },
  { id: 'lb_2', username: 'NeonNinja', avatar: '🥷', score: 139500, rank: 2, country: '🇯🇵', badge: 'Speed Legend' },
  { id: 'lb_3', username: 'PixelMaster', avatar: '👑', score: 128400, rank: 3, country: '🇩🇪', badge: 'Grandmaster' },
  { id: 'lb_4', username: 'GhostRider', avatar: '🏎️', score: 115200, rank: 4, country: '🇨🇦' },
  { id: 'lb_5', username: 'AeroStrike', avatar: '🎯', score: 104800, rank: 5, country: '🇬🇧' },
  { id: 'lb_6', username: 'TurboFox', avatar: '🦊', score: 98600, rank: 6, country: '🇫🇷' },
  { id: 'lb_7', username: 'Vortex99', avatar: '🌀', score: 87300, rank: 7, country: '🇦🇺' },
  { id: 'lb_8', username: 'BlazePulse', avatar: '🔥', score: 79400, rank: 8, country: '🇧🇷' },
  { id: 'lb_9', username: 'ShadowAim', avatar: '🏹', score: 71200, rank: 9, country: '🇰🇷' },
  { id: 'lb_10', username: 'QuickClutch', avatar: '🤖', score: 65100, rank: 10, country: '🇪🇸' },
];

const WEEKLY_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'w_1', username: 'AeroStrike', avatar: '🎯', score: 48500, rank: 1, country: '🇬🇧', badge: 'Weekly Leader' },
  { id: 'w_2', username: 'CyberViper', avatar: '⚡', score: 45200, rank: 2, country: '🇺🇸' },
  { id: 'w_3', username: 'BlazePulse', avatar: '🔥', score: 39800, rank: 3, country: '🇧🇷' },
  { id: 'w_4', username: 'NeonNinja', avatar: '🥷', score: 36400, rank: 4, country: '🇯🇵' },
  { id: 'w_5', username: 'TurboFox', avatar: '🦊', score: 31200, rank: 5, country: '🇫🇷' },
];

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ profile }) => {
  const [filter, setFilter] = useState<'global' | 'weekly' | 'friends'>('global');

  // Compute total user score across all games
  const userTotalScore = Object.values(profile.highScores).reduce((a, b) => a + b, 0);
  const userRank = userTotalScore > 100000 ? 5 : userTotalScore > 50000 ? 12 : 24;

  const currentList = filter === 'weekly' ? WEEKLY_LEADERBOARD : GLOBAL_LEADERBOARD;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Tab filter toggles */}
      <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
        <button
          onClick={() => { sound.playTick(); setFilter('global'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            filter === 'global' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          GLOBAL ALL-TIME
        </button>
        <button
          onClick={() => { sound.playTick(); setFilter('weekly'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            filter === 'weekly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          WEEKLY CUP
        </button>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-3 gap-2 items-end pt-6 pb-2">
        {/* Rank 2 - Silver */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-md">
          <div className="relative">
            <span className="text-3xl">{currentList[1].avatar}</span>
            <span className="absolute -top-3 -right-1 text-sm">🥈</span>
          </div>
          <span className="font-bold text-xs text-white mt-1 truncate max-w-[80px]">{currentList[1].username}</span>
          <span className="font-mono text-[11px] text-slate-300 font-bold">{currentList[1].score.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1">#2 SILVER</span>
        </div>

        {/* Rank 1 - Gold (Elevated) */}
        <div className="flex flex-col items-center p-3.5 rounded-3xl bg-gradient-to-b from-amber-500/20 to-slate-900 border-2 border-amber-400 text-center shadow-xl -translate-y-2">
          <div className="relative">
            <span className="text-4xl">{currentList[0].avatar}</span>
            <Crown className="w-5 h-5 text-amber-400 fill-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
          </div>
          <span className="font-black text-xs text-amber-300 mt-1 truncate max-w-[90px]">{currentList[0].username}</span>
          <span className="font-mono text-xs text-amber-400 font-black">{currentList[0].score.toLocaleString()}</span>
          <span className="text-[10px] text-amber-300 font-black uppercase mt-1">#1 CHAMPION</span>
        </div>

        {/* Rank 3 - Bronze */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-md">
          <div className="relative">
            <span className="text-3xl">{currentList[2].avatar}</span>
            <span className="absolute -top-3 -right-1 text-sm">🥉</span>
          </div>
          <span className="font-bold text-xs text-white mt-1 truncate max-w-[80px]">{currentList[2].username}</span>
          <span className="font-mono text-[11px] text-slate-300 font-bold">{currentList[2].score.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1">#3 BRONZE</span>
        </div>
      </div>

      {/* User's Pinned Standing Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-2 border-indigo-500/50 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="font-mono font-black text-sm text-indigo-300">#{userRank}</span>
          <span className="text-2xl">{profile.avatarId === 'rushy' ? '⚡' : '🦊'}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white">{profile.username} (YOU)</span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-black">
                LVL {profile.level}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total Points: {userTotalScore.toLocaleString()}</span>
          </div>
        </div>

        <span className="text-xs font-black text-amber-400 font-display">
          TOP {Math.max(1, Math.round((userRank / 50) * 100))}%
        </span>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider block">Leaderboard Ranks</span>
        {currentList.slice(3).map(entry => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-500 w-5 text-center">#{entry.rank}</span>
              <span className="text-xl">{entry.avatar}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">{entry.username}</span>
                  <span>{entry.country}</span>
                  {entry.badge && (
                    <span className="text-[9px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                      {entry.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="font-mono font-bold text-slate-300">{entry.score.toLocaleString()} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};
