import React, { useState } from 'react';
import { GameDefinition, UserProfile, BotOpponent, FriendChallenge } from '../types';
import { BOT_OPPONENTS, getDailyChallengeGame, getWeeklyTournamentGame } from '../data/games';
import { StorageService } from '../services/storage';
import { sound } from '../services/sound';
import { Swords, Bot, Trophy, Users, Clock, Sparkles, Shield, ArrowRight, Play } from 'lucide-react';

interface ArenaTabProps {
  games: GameDefinition[];
  profile: UserProfile;
  onLaunchGame: (game: GameDefinition, bot?: BotOpponent, scoreToBeat?: number) => void;
  onOpenFriendChallengeModal: (game?: GameDefinition) => void;
}

export const ArenaTab: React.FC<ArenaTabProps> = ({
  games,
  profile,
  onLaunchGame,
  onOpenFriendChallengeModal,
}) => {
  const [selectedBot, setSelectedBot] = useState<BotOpponent>(BOT_OPPONENTS[1]);
  const dailyGame = getDailyChallengeGame(games);
  const weeklyGame = getWeeklyTournamentGame(games);
  const challenges = StorageService.loadChallenges();

  const handleBotDuel = (bot: BotOpponent) => {
    sound.playClick();
    setSelectedBot(bot);
    const duelGame = games.find(g => g.id === 'dual-shoot') || games[0];
    onLaunchGame(duelGame, bot);
  };

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600/20 via-orange-600/20 to-amber-600/20 border border-orange-500/30 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-orange-400 uppercase tracking-wider mb-1">
            <Swords className="w-3.5 h-3.5" />
            BATTLE ARENA
          </div>
          <h2 className="text-xl font-black font-display text-white">Compete & Conquer</h2>
          <p className="text-xs text-slate-400">Duel arcade bots, join tournaments, or battle friends</p>
        </div>
        <span className="text-4xl">⚔️</span>
      </div>

      {/* Tournaments Grid */}
      <div className="space-y-3">
        <h3 className="font-display font-black text-base text-white px-1">Tournaments & Events</h3>

        {/* Daily Challenge Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border-2 border-slate-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
              {dailyGame.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">DAILY RUSH CUP</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  Ends in 8h
                </span>
              </div>
              <h4 className="font-bold text-sm text-white">{dailyGame.name}</h4>
              <span className="text-[11px] text-slate-400">Prize: 1,000 Coins + Golden Badge</span>
            </div>
          </div>

          <button
            onClick={() => onLaunchGame(dailyGame)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            ENTER
          </button>
        </div>

        {/* Weekly Grand Tournament Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border-2 border-indigo-500/40 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
              {weeklyGame.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">WEEKLY GRAND PRIX</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  3 Days Left
                </span>
              </div>
              <h4 className="font-bold text-sm text-white">{weeklyGame.name}</h4>
              <span className="text-[11px] text-slate-400">Grand Prize: 5,000 Coins + Crown 👑</span>
            </div>
          </div>

          <button
            onClick={() => onLaunchGame(weeklyGame)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            ENTER
          </button>
        </div>
      </div>

      {/* Arcade Bot Opponents Arena */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-display font-black text-base text-white">Bot Duel Arena</h3>
            <span className="text-xs text-slate-400">Challenge simulated AI rivals to quick draws</span>
          </div>
          <Bot className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {BOT_OPPONENTS.map(bot => (
            <div
              key={bot.id}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{bot.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{bot.name}</h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-amber-400 uppercase">
                      {bot.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>⚡ ~{bot.reactionTimeMs}ms reflex</span>
                    <span>•</span>
                    <span>🏆 {bot.winRate}% win rate</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleBotDuel(bot)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 active:scale-95 text-indigo-300 hover:text-white font-black text-xs border border-slate-700 transition-all"
              >
                DUEL ⚔️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Friend Challenge Hub */}
      <div className="p-5 rounded-3xl bg-slate-900 border-2 border-slate-800 text-center space-y-3">
        <Users className="w-8 h-8 text-indigo-400 mx-auto" />
        <h3 className="font-display font-black text-lg text-white">Friend Challenge Hub</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Create custom challenge codes or join a friend's challenge to beat their high score!
        </p>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onOpenFriendChallengeModal(games[0])}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs shadow-md shadow-indigo-600/30"
          >
            CREATE CODE ⚡
          </button>
          <button
            onClick={() => onOpenFriendChallengeModal()}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 text-slate-200 font-bold text-xs"
          >
            ENTER CODE 🔑
          </button>
        </div>

        {/* Pending challenges list */}
        {challenges.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-left">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">ACTIVE CHALLENGES ({challenges.length})</span>
            <div className="space-y-1.5">
              {challenges.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span>{c.gameIcon}</span>
                    <span className="font-bold text-white">{c.challengerName}</span>
                    <span className="font-mono text-amber-400 font-bold">{c.challengerScore} pts</span>
                  </div>
                  <button
                    onClick={() => {
                      const targetGame = games.find(g => g.id === c.gameId) || games[0];
                      onLaunchGame(targetGame, undefined, c.challengerScore);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black"
                  >
                    ACCEPT ⚔️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
