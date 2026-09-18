import React, { useState } from 'react';
import { GameDefinition, UserProfile, GameCategory } from '../types';
import { getDailyChallengeGame } from '../data/games';
import { sound } from '../services/sound';
import { Sparkles, Play, Trophy, Flame, Zap, Compass, Filter } from 'lucide-react';

interface HomeTabProps {
  games: GameDefinition[];
  profile: UserProfile;
  onSelectGame: (game: GameDefinition) => void;
  onOpenDailyBox: () => void;
  canClaimDailyBox: boolean;
}

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All Games', icon: '🎮' },
  { id: 'reflex', label: 'Reflex', icon: '⚡' },
  { id: 'timing', label: 'Timing', icon: '⏱️' },
  { id: 'aim', label: 'Aim', icon: '🎯' },
  { id: 'puzzle', label: 'Puzzle', icon: '🧩' },
  { id: 'duel', label: 'Duel', icon: '⚔️' },
];

export const HomeTab: React.FC<HomeTabProps> = ({
  games,
  profile,
  onSelectGame,
  onOpenDailyBox,
  canClaimDailyBox,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dailyGame = getDailyChallengeGame(games);

  const filteredGames = selectedCategory === 'all'
    ? games
    : games.filter(g => g.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleQuickPlay = () => {
    sound.playClick();
    // Pick a random game from top 10
    const top10 = games.slice(0, 10);
    const randomGame = top10[Math.floor(Math.random() * top10.length)];
    onSelectGame(randomGame);
  };

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Daily Mystery Box Notification Banner */}
      {canClaimDailyBox && (
        <div 
          onClick={onOpenDailyBox}
          className="cursor-pointer mx-1 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform animate-pulse"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎁</span>
            <div>
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">Daily Box Ready!</h4>
              <p className="text-[11px] text-slate-300">Tap to claim free coins & lives for today</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-xl border border-amber-500/30">
            CLAIM
          </span>
        </div>
      )}

      {/* Featured Game of the Day Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 border-2 border-indigo-500/40 p-5 shadow-2xl">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              GAME OF THE DAY
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              2x COINS REWARD
            </div>
          </div>

          <div className="flex items-center gap-4 my-1">
            <div className="w-16 h-16 rounded-2xl bg-indigo-800/80 border border-indigo-400/40 flex items-center justify-center text-4xl shadow-lg">
              {dailyGame.icon}
            </div>
            <div>
              <h3 className="text-2xl font-black font-display text-white tracking-wide">{dailyGame.name}</h3>
              <p className="text-xs text-indigo-200/80 line-clamp-1">{dailyGame.description}</p>
              <span className="text-[10px] font-bold text-amber-400 block mt-1">
                Your Record: {(profile.highScores[dailyGame.id] || 0).toLocaleString()} pts
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                sound.playClick();
                onSelectGame(dailyGame);
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black font-display text-sm tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              PLAY NOW ⚡
            </button>

            <button
              onClick={handleQuickPlay}
              className="px-4 py-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-slate-200 font-bold text-xs active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              RANDOM
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                sound.playTick();
                setSelectedCategory(cat.id);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/80'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mini-Games Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-black text-base text-white tracking-wide">
            {selectedCategory === 'all' ? 'Top Mini-Games' : `${selectedCategory.toUpperCase()} Games`}
          </h3>
          <span className="text-xs text-slate-500 font-semibold font-mono">
            {filteredGames.length} GAMES
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredGames.map((game, idx) => {
            const best = profile.highScores[game.id] || 0;
            const isPriority10 = idx < 10;

            return (
              <div
                key={game.id}
                onClick={() => {
                  sound.playClick();
                  onSelectGame(game);
                }}
                className="group relative flex flex-col justify-between p-3.5 rounded-3xl bg-slate-900 border-2 border-slate-800 hover:border-indigo-500/60 active:scale-95 transition-all shadow-md cursor-pointer overflow-hidden"
              >
                {/* Tag */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{game.icon}</span>
                  {game.tag && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      game.tag === 'POPULAR'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : game.tag === 'NEW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {game.tag}
                    </span>
                  )}
                </div>

                {/* Name & Desc */}
                <div>
                  <h4 className="font-display font-black text-sm text-white group-hover:text-indigo-300 transition-colors">
                    {game.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{game.description}</p>
                </div>

                {/* Score footer */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>{best > 0 ? best.toLocaleString() : '--'}</span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center text-white transition-colors">
                    <Play className="w-2.5 h-2.5 fill-current" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
