import React, { useState } from 'react';
import { UserProfile, LeaderboardEntry } from '../types';
import { sound } from '../services/sound';
import { Trophy, Medal, Crown, Globe, Users, Flame, Gauge, Zap } from 'lucide-react';

interface LeaderboardTabProps {
  profile: UserProfile;
  onPlayGame?: (gameId: string) => void;
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

const DRIFT_BASE_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'drift_1', username: 'TokyoDrifterX', avatar: '🏎️', score: 18400, longestDrift: 142.8, rank: 1, country: '🇯🇵', badge: '👑 Drift Emperor' },
  { id: 'drift_2', username: 'SlipstreamKen', avatar: '🏁', score: 16200, longestDrift: 128.5, rank: 2, country: '🇺🇸', badge: '🥈 Touge King' },
  { id: 'drift_3', username: 'CyberSlide99', avatar: '⚡', score: 14900, longestDrift: 114.2, rank: 3, country: '🇩🇪', badge: '🥉 Apex Master' },
  { id: 'drift_4', username: 'SmokeShowPro', avatar: '💨', score: 12500, longestDrift: 98.4, rank: 4, country: '🇬🇧' },
  { id: 'drift_5', username: 'RedlineRacer', avatar: '🔥', score: 11200, longestDrift: 86.6, rank: 5, country: '🇫🇷' },
  { id: 'drift_6', username: 'NeonApex', avatar: '🚀', score: 9800, longestDrift: 74.3, rank: 6, country: '🇨🇦' },
  { id: 'drift_7', username: 'TireScreech', avatar: '🚗', score: 8500, longestDrift: 62.0, rank: 7, country: '🇦🇺' },
];

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ profile, onPlayGame }) => {
  const [filter, setFilter] = useState<'global' | 'weekly' | 'drift'>('drift');

  // Compute total user score across all games
  const userTotalScore = Object.values(profile.highScores).reduce((a, b) => a + b, 0);
  const userLongestDrift = profile.longestDrift || 48.5;

  // Build dynamic drift leaderboard including current user
  const driftList: LeaderboardEntry[] = [...DRIFT_BASE_LEADERBOARD];
  // Insert current user
  driftList.push({
    id: 'drift_user',
    username: `${profile.username} (YOU)`,
    avatar: profile.avatarId === 'rushy' ? '⚡' : '🏎️',
    score: (profile.highScores['drift-king'] || 3600),
    longestDrift: userLongestDrift,
    rank: 0,
    isCurrentUser: true,
  });

  // Sort drift list descending by longest drift
  driftList.sort((a, b) => (b.longestDrift || 0) - (a.longestDrift || 0));
  driftList.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  const userDriftRank = driftList.find(e => e.isCurrentUser)?.rank || 5;

  const currentList = filter === 'drift' ? driftList : filter === 'weekly' ? WEEKLY_LEADERBOARD : GLOBAL_LEADERBOARD;
  const userRank = filter === 'drift' ? userDriftRank : userTotalScore > 100000 ? 5 : userTotalScore > 50000 ? 12 : 24;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Tab filter toggles */}
      <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
        <button
          onClick={() => { sound.playTick(); setFilter('drift'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            filter === 'drift' ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          LONGEST DRIFT 🏎️
        </button>
        <button
          onClick={() => { sound.playTick(); setFilter('global'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            filter === 'global' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          GLOBAL ALL-TIME
        </button>
        <button
          onClick={() => { sound.playTick(); setFilter('weekly'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            filter === 'weekly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          WEEKLY CUP
        </button>
      </div>

      {/* If drift filter, show quick launch banner */}
      {filter === 'drift' && onPlayGame && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border border-cyan-500/40 flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              DRIFT KING CONTEST ACTIVE
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Hold the screen to drift. Longest continuous slide climbs the leaderboard!
            </p>
          </div>
          <button
            onClick={() => onPlayGame('drift-king')}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shrink-0 active:scale-95 shadow-md flex items-center gap-1"
          >
            PLAY DRIFT 🏎️
          </button>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-3 gap-2 items-end pt-6 pb-2">
        {/* Rank 2 - Silver */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-md">
          <div className="relative">
            <span className="text-3xl">{currentList[1].avatar}</span>
            <span className="absolute -top-3 -right-1 text-sm">🥈</span>
          </div>
          <span className="font-bold text-xs text-white mt-1 truncate max-w-[80px]">{currentList[1].username}</span>
          <span className="font-mono text-[11px] text-cyan-400 font-black">
            {filter === 'drift' ? `${(currentList[1].longestDrift || 0).toFixed(1)}m` : currentList[1].score.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1">#2 SILVER</span>
        </div>

        {/* Rank 1 - Gold (Elevated) */}
        <div className="flex flex-col items-center p-3.5 rounded-3xl bg-gradient-to-b from-amber-500/20 to-slate-900 border-2 border-amber-400 text-center shadow-xl -translate-y-2">
          <div className="relative">
            <span className="text-4xl">{currentList[0].avatar}</span>
            <Crown className="w-5 h-5 text-amber-400 fill-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
          </div>
          <span className="font-black text-xs text-amber-300 mt-1 truncate max-w-[90px]">{currentList[0].username}</span>
          <span className="font-mono text-xs text-amber-400 font-black">
            {filter === 'drift' ? `${(currentList[0].longestDrift || 0).toFixed(1)}m` : currentList[0].score.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-300 font-black uppercase mt-1">#1 CHAMPION</span>
        </div>

        {/* Rank 3 - Bronze */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-md">
          <div className="relative">
            <span className="text-3xl">{currentList[2].avatar}</span>
            <span className="absolute -top-3 -right-1 text-sm">🥉</span>
          </div>
          <span className="font-bold text-xs text-white mt-1 truncate max-w-[80px]">{currentList[2].username}</span>
          <span className="font-mono text-[11px] text-cyan-400 font-black">
            {filter === 'drift' ? `${(currentList[2].longestDrift || 0).toFixed(1)}m` : currentList[2].score.toLocaleString()}
          </span>
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
            <span className="text-xs text-cyan-300 font-mono font-bold">
              {filter === 'drift' ? `Your Longest Drift: ${userLongestDrift.toFixed(1)} meters` : `Total Points: ${userTotalScore.toLocaleString()}`}
            </span>
          </div>
        </div>

        <span className="text-xs font-black text-amber-400 font-display">
          TOP {Math.max(1, Math.round((userRank / Math.max(1, currentList.length)) * 100))}%
        </span>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider block">
          {filter === 'drift' ? '🏁 Longest Continuous Drift Rankings' : 'Leaderboard Ranks'}
        </span>
        {currentList.slice(3).map(entry => (
          <div
            key={entry.id}
            className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition-all ${
              entry.isCurrentUser
                ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-400/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-500 w-5 text-center">#{entry.rank}</span>
              <span className="text-xl">{entry.avatar}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${entry.isCurrentUser ? 'text-indigo-200' : 'text-white'}`}>
                    {entry.username}
                  </span>
                  {entry.country && <span>{entry.country}</span>}
                  {entry.badge && (
                    <span className="text-[9px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                      {entry.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="font-mono font-bold text-cyan-400 text-sm">
              {filter === 'drift'
                ? `${(entry.longestDrift || 0).toFixed(1)}m`
                : `${entry.score.toLocaleString()} pts`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
