import React, { useState, useEffect } from 'react';
import { GameDefinition, UserProfile, AppSettings, BotOpponent, FriendChallenge } from './types';
import { GAME_CATALOG, getNextGame } from './data/games';
import { StorageService } from './services/storage';
import { sound } from './services/sound';
import { adService, RewardedAdReason } from './services/adService';

// Tabs
import { HomeTab } from './components/HomeTab';
import { ArenaTab } from './components/ArenaTab';
import { LeaderboardTab } from './components/LeaderboardTab';
import { ProfileTab } from './components/ProfileTab';

// Modals
import { ActiveGameModal } from './components/ActiveGameModal';
import { DailyBoxModal } from './components/DailyBoxModal';
import { FriendChallengeModal } from './components/FriendChallengeModal';
import { ShareModal } from './components/ShareModal';
import { AdModal } from './components/AdModal';
import { SettingsModal } from './components/SettingsModal';

import { Heart, Coins, Settings, Gamepad2, Swords, Trophy, User, Plus } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'arena' | 'leaderboard' | 'profile'>('home');
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.loadProfile());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.loadSettings());

  // Modal states
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null);
  const [selectedBot, setSelectedBot] = useState<BotOpponent | undefined>(undefined);
  const [challengeScoreToBeat, setChallengeScoreToBeat] = useState<number | undefined>(undefined);

  const [isDailyBoxOpen, setIsDailyBoxOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [friendChallengeGame, setFriendChallengeGame] = useState<{ game?: GameDefinition; score?: number } | null>(null);
  const [shareData, setShareData] = useState<{ game: GameDefinition; score: number } | null>(null);
  const [adReason, setAdReason] = useState<RewardedAdReason | null>(null);

  // Sync sound settings
  useEffect(() => {
    sound.soundEnabled = settings.soundEnabled;
    sound.hapticsEnabled = settings.hapticsEnabled;
  }, [settings]);

  // Periodic life regeneration check
  useEffect(() => {
    const timer = setInterval(() => {
      setProfile(StorageService.loadProfile());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Hash URL listener for instant challenge matches
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const params = new URLSearchParams(hash);
        const gameId = params.get('game');
        const score = params.get('score');
        if (gameId) {
          const matched = GAME_CATALOG.find((g: GameDefinition) => g.id === gameId);
          if (matched) {
            setActiveGame(matched);
            if (score) setChallengeScoreToBeat(Number(score));
          }
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Launch a game
  const handleLaunchGame = (game: GameDefinition, bot?: BotOpponent, scoreToBeat?: number) => {
    sound.playClick();
    setSelectedBot(bot);
    setChallengeScoreToBeat(scoreToBeat);
    setActiveGame(game);
  };

  // Launch next game in sequence
  const handleNextGame = () => {
    if (!activeGame) return;
    const next = getNextGame(GAME_CATALOG, activeGame.id);
    setSelectedBot(undefined);
    setChallengeScoreToBeat(undefined);
    setActiveGame(next);
  };

  // Open Rewarded Ad Flow
  const handleRequestAd = (reason: RewardedAdReason, onRewardSuccess: () => void) => {
    adService.showRewardedAd({
      reason,
      onReward: () => {
        onRewardSuccess();
      },
    });
    setAdReason(reason);
  };

  // Watch ad for lives
  const handleWatchAdForLives = () => {
    handleRequestAd('extra_lives', () => {
      const updated = StorageService.refillLives(5);
      setProfile(updated);
    });
  };

  // Watch ad for double daily box coins
  const handleWatchAdToDoubleDaily = (bonusCoins: number) => {
    handleRequestAd('double_daily_box', () => {
      const updated = { ...profile, coins: profile.coins + bonusCoins };
      StorageService.saveProfile(updated);
      setProfile(updated);
    });
  };

  const canClaimDaily = StorageService.canClaimDailyBox(profile);

  return (
    <div className="flex justify-center min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Mobile-constrained centered shell */}
      <div className="relative w-full max-w-md min-h-screen flex flex-col bg-slate-950 border-x border-slate-800/80 shadow-2xl">
        
        {/* Sticky Top Arcade Header Bar */}
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/30">
              <span className="font-black text-lg">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-display font-black text-lg tracking-tight text-white">MINIRUSH</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block -mt-1">
                Tiny Games. Endless Challenges.
              </span>
            </div>
          </div>

          {/* Right Controls: Lives, Coins, Settings */}
          <div className="flex items-center gap-2">
            {/* Lives Pill */}
            <button
              onClick={handleWatchAdForLives}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 hover:border-rose-500/50 px-2.5 py-1.5 rounded-full active:scale-95 transition-all"
              title="Refill Lives"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span className="text-xs font-bold font-mono text-slate-200">{profile.lives}</span>
              <Plus className="w-3 h-3 text-rose-400" />
            </button>

            {/* Coins Balance */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 rounded-full">
              <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-black font-mono text-amber-300">
                {profile.coins.toLocaleString()}
              </span>
            </div>

            {/* Settings Gear */}
            <button
              onClick={() => {
                sound.playClick();
                setIsSettingsOpen(true);
              }}
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main View Body */}
        <main className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeTab
              games={GAME_CATALOG}
              profile={profile}
              onSelectGame={(g) => handleLaunchGame(g)}
              onOpenDailyBox={() => {
                sound.playClick();
                setIsDailyBoxOpen(true);
              }}
              canClaimDailyBox={canClaimDaily}
            />
          )}

          {activeTab === 'arena' && (
            <ArenaTab
              games={GAME_CATALOG}
              profile={profile}
              onLaunchGame={handleLaunchGame}
              onOpenFriendChallengeModal={(g) => setFriendChallengeGame({ game: g })}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardTab profile={profile} />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              profile={profile}
              onProfileUpdate={setProfile}
            />
          )}
        </main>

        {/* Bottom Fixed Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2 flex items-center justify-around z-40">
          <button
            onClick={() => {
              sound.playTick();
              setActiveTab('home');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'home' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px]">Games</span>
          </button>

          <button
            onClick={() => {
              sound.playTick();
              setActiveTab('arena');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'arena' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Swords className="w-5 h-5" />
            <span className="text-[10px]">Arena</span>
          </button>

          <button
            onClick={() => {
              sound.playTick();
              setActiveTab('leaderboard');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'leaderboard' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px]">Rankings</span>
          </button>

          <button
            onClick={() => {
              sound.playTick();
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all relative ${
              activeTab === 'profile' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
            {/* Notification pip if uncollected achievements */}
            {profile.achievements?.some((a) => a.unlocked && !a.claimed) && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </nav>

        {/* MODALS */}
        {/* Active Game Modal Runner */}
        {activeGame && (
          <ActiveGameModal
            game={activeGame}
            profile={profile}
            selectedBot={selectedBot}
            challengeScoreToBeat={challengeScoreToBeat}
            onClose={() => {
              setActiveGame(null);
              setSelectedBot(undefined);
              setChallengeScoreToBeat(undefined);
            }}
            onNextGame={handleNextGame}
            onChallengeFriend={(g, s) => setFriendChallengeGame({ game: g, score: s })}
            onShareScore={(g, s) => setShareData({ game: g, score: s })}
            onProfileUpdate={setProfile}
            onRequestAdForLives={handleWatchAdForLives}
          />
        )}

        {/* Daily Mystery Box Modal */}
        {isDailyBoxOpen && (
          <DailyBoxModal
            profile={profile}
            onClose={() => setIsDailyBoxOpen(false)}
            onProfileUpdate={setProfile}
            onRequestAdToDouble={handleWatchAdToDoubleDaily}
          />
        )}

        {/* Friend Challenge Modal */}
        {friendChallengeGame && (
          <FriendChallengeModal
            game={friendChallengeGame.game}
            initialScore={friendChallengeGame.score}
            profile={profile}
            onClose={() => setFriendChallengeGame(null)}
            onLaunchChallengeGame={(c) => {
              const matched = GAME_CATALOG.find((g: GameDefinition) => g.id === c.gameId) || GAME_CATALOG[0];
              handleLaunchGame(matched, undefined, c.challengerScore);
            }}
          />
        )}

        {/* Share Score Modal */}
        {shareData && (
          <ShareModal
            game={shareData.game}
            score={shareData.score}
            onClose={() => setShareData(null)}
          />
        )}

        {/* Rewarded Ad Modal Simulator */}
        {adReason && (
          <AdModal
            reason={adReason}
            onClose={() => setAdReason(null)}
          />
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            profile={profile}
            onClose={() => setIsSettingsOpen(false)}
            onSettingsUpdate={setSettings}
            onProfileUpdate={setProfile}
          />
        )}
      </div>
    </div>
  );
}
