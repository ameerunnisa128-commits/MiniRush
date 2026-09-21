import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameDefinition, UserProfile, BotOpponent } from '../types';
import { StorageService } from '../services/storage';
import { sound } from '../services/sound';
import { ArrowLockGame } from '../games/ArrowLock';
import { KnifeThrowGame } from '../games/KnifeThrow';
import { PerfectAimGame } from '../games/PerfectAim';
import { DriftKingGame } from '../games/DriftKing';
import { Mini2048Game } from '../games/Mini2048';
import { DualShootGame } from '../games/DualShoot';
import { QuickReactionGame } from '../games/QuickReaction';
import { PerfectStackGame } from '../games/PerfectStack';
import { DontTapRedGame } from '../games/DontTapRed';
import { OneShotGame } from '../games/OneShot';
import { X, RotateCcw, Play, Share2, Users, Home, Award, Heart, Coins, Maximize2, Minimize2 } from 'lucide-react';

interface ActiveGameModalProps {
  game: GameDefinition;
  profile: UserProfile;
  selectedBot?: BotOpponent;
  challengeScoreToBeat?: number;
  onClose: () => void;
  onNextGame: () => void;
  onChallengeFriend: (game: GameDefinition, score: number) => void;
  onShareScore: (game: GameDefinition, score: number) => void;
  onProfileUpdate: (profile: UserProfile) => void;
  onRequestAdForLives: () => void;
}

export const ActiveGameModal: React.FC<ActiveGameModalProps> = ({
  game,
  profile,
  selectedBot,
  challengeScoreToBeat,
  onClose,
  onNextGame,
  onChallengeFriend,
  onShareScore,
  onProfileUpdate,
  onRequestAdForLives,
}) => {
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [isHighScore, setIsHighScore] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [gameKey, setGameKey] = useState(1); // key to instantly restart game component
  const [outOfLives, setOutOfLives] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    sound.playClick();
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Fullscreen cancelled
    }
  };

  // Consume 1 life on start
  useEffect(() => {
    const success = StorageService.useLife();
    if (!success) {
      setOutOfLives(true);
    } else {
      onProfileUpdate(StorageService.loadProfile());
    }
  }, [gameKey]);

  const handleGameOver = (score: number, perfectHits: number = 0) => {
    setFinalScore(score);
    const prevBest = profile.highScores[game.id] || 0;
    const isNewHigh = score > prevBest;
    setIsHighScore(isNewHigh);

    // Calculate coins & xp
    const earnedCoins = Math.max(15, Math.min(250, Math.floor(score / 45)));
    const earnedXp = Math.max(25, Math.min(300, Math.floor(score / 30)));
    setCoinsEarned(earnedCoins);

    const { newProfile } = StorageService.recordGameResult({
      gameId: game.id,
      score,
      isHighScore: isNewHigh,
      coinsEarned: earnedCoins,
      xpEarned: earnedXp,
      durationSeconds: 30,
      perfectHits,
      timestamp: Date.now(),
    });

    onProfileUpdate(newProfile);
    setGameState('gameover');

    if (isNewHigh && score > 0) {
      sound.playVictory();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }
    }
  };

  const handleRetry = () => {
    const success = StorageService.useLife();
    if (!success) {
      setOutOfLives(true);
      return;
    }
    onProfileUpdate(StorageService.loadProfile());
    setGameState('playing');
    setGameKey(k => k + 1);
  };

  // Render individual game engine
  const renderGameContent = () => {
    switch (game.id) {
      case 'arrow-lock':
        return <ArrowLockGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      case 'knife-throw':
        return <KnifeThrowGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      case 'perfect-aim':
        return <PerfectAimGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      case 'drift-king':
        return <DriftKingGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      case 'mini-2048':
        return <Mini2048Game key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      case 'dual-shoot':
        return <DualShootGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} selectedBot={selectedBot} />;
      case 'quick-reaction':
        return <QuickReactionGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      case 'perfect-stack':
        return <PerfectStackGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      case 'dont-tap-red':
        return <DontTapRedGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      case 'one-shot':
        return <OneShotGame key={gameKey} onGameOver={handleGameOver} onExit={onClose} />;
      default:
        // Upcoming mini-game preview with micro practice challenge
        return (
          <div className="flex flex-col items-center justify-center h-80 p-6 text-center">
            <span className="text-6xl mb-3 animate-bounce">{game.icon}</span>
            <h3 className="text-2xl font-black text-white">{game.name}</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs">{game.description}</p>
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              ⚡ Practice Round Ready! Tap below to test fast reflex score.
            </div>
            <button
              onClick={() => handleGameOver(Math.floor(1000 + Math.random() * 2000), 1)}
              className="mt-4 px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-black active:scale-95"
            >
              COMPLETE PRACTICE ROUND 🚀
            </button>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col ${isFullscreen ? 'p-0' : 'sm:items-center sm:justify-center sm:p-2 sm:py-3'} animate-in fade-in duration-150`}>
      {/* Container Frame - 100% full screen on mobile & fullscreen mode, elegant frame on desktop */}
      <div className={`relative w-full h-[100dvh] ${
        isFullscreen
          ? 'sm:max-w-none sm:h-full sm:rounded-none sm:border-0'
          : 'sm:max-w-md sm:h-[96vh] sm:border-2 sm:border-slate-800 sm:rounded-3xl'
      } bg-slate-900 shadow-2xl flex flex-col overflow-hidden`}>
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/95 border-b border-slate-800 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{game.icon}</span>
            <div>
              <h2 className="font-display font-black text-sm sm:text-base text-white tracking-wide">{game.name}</h2>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase">{game.category} • {game.difficulty}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Lives indicator */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span className="text-xs font-bold text-slate-200">{profile.lives}</span>
            </div>

            {/* Fullscreen Toggle button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                isFullscreen
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-extrabold">{isFullscreen ? 'EXIT' : 'EXPAND'}</span>
            </button>

            {/* Exit button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Challenge Target Banner (if playing a friend's challenge) */}
        {challengeScoreToBeat && gameState === 'playing' && (
          <div className="w-full bg-indigo-600/90 text-white px-4 py-1.5 flex items-center justify-between text-xs font-bold shadow-md">
            <span>🔥 TARGET TO BEAT:</span>
            <span className="font-mono text-amber-300 font-extrabold text-sm">{challengeScoreToBeat.toLocaleString()} PTS</span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-hidden relative flex flex-col justify-center">
          {outOfLives ? (
            /* Out of Lives Modal */
            <div className="p-6 text-center my-auto">
              <span className="text-5xl block mb-3">💔</span>
              <h3 className="text-2xl font-black text-white">Out of Lives!</h3>
              <p className="text-xs text-slate-400 mt-2">
                Lives regenerate automatically every 10 minutes. Watch a quick ad to refill now!
              </p>
              <button
                onClick={() => {
                  setOutOfLives(false);
                  onRequestAdForLives();
                }}
                className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black font-display text-lg shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                WATCH AD FOR +5 LIVES ❤️
              </button>

              <button
                onClick={() => {
                  const res = StorageService.buyLivesWithCoins(200);
                  if (res.success) {
                    onProfileUpdate(res.profile);
                    setOutOfLives(false);
                    handleRetry();
                  } else {
                    alert(res.error || 'Not enough coins');
                  }
                }}
                disabled={profile.coins < 200}
                className="mt-2.5 w-full py-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                REFILL WITH 200 COINS 🪙 (Balance: {profile.coins.toLocaleString()})
              </button>
              <button
                onClick={onClose}
                className="mt-3 text-xs text-slate-400 hover:text-slate-200 py-2"
              >
                Back to Arcade Home
              </button>
            </div>
          ) : gameState === 'playing' ? (
            renderGameContent()
          ) : (
            /* GAME OVER SCREEN */
            <div className="flex flex-col items-center justify-between w-full h-full p-5 overflow-y-auto">
              {/* Header result */}
              <div className="text-center my-auto w-full">
                {isHighScore ? (
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 border border-amber-500/40 animate-pulse">
                    🏆 NEW HIGH SCORE!
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    GAME OVER
                  </div>
                )}

                <div className="text-5xl font-black font-display text-white tracking-tight drop-shadow-md">
                  {finalScore.toLocaleString()}
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 block">
                  Best Score: {Math.max(finalScore, profile.highScores[game.id] || 0).toLocaleString()}
                </span>

                {/* Challenge Result banner if applicable */}
                {challengeScoreToBeat && (
                  <div className={`mt-3 p-3 rounded-2xl border text-xs font-bold ${
                    finalScore > challengeScoreToBeat
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500 text-rose-300'
                  }`}>
                    {finalScore > challengeScoreToBeat
                      ? `🎉 YOU BEAT THE CHALLENGE BY ${(finalScore - challengeScoreToBeat).toLocaleString()} PTS!`
                      : `💔 ${(challengeScoreToBeat - finalScore).toLocaleString()} PTS SHORT OF VICTORY!`}
                  </div>
                )}

                {/* Rewards Earned Badge */}
                <div className="flex items-center justify-center gap-4 mt-5 bg-slate-800/80 py-2.5 px-4 rounded-2xl border border-slate-700 w-fit mx-auto">
                  <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-sm">
                    <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
                    +{coinsEarned} Coins
                  </div>
                  <div className="w-px h-4 bg-slate-700" />
                  <div className="flex items-center gap-1.5 text-indigo-400 font-extrabold text-sm">
                    <Award className="w-4 h-4 text-indigo-400" />
                    +50 XP
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5 mt-4">
                {/* Retry Button */}
                <button
                  id="gameover-retry-btn"
                  onClick={handleRetry}
                  className="w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  PLAY AGAIN ⚡
                </button>

                {/* Next Game Button */}
                <button
                  id="gameover-next-btn"
                  onClick={onNextGame}
                  className="w-full py-3.5 rounded-2xl font-black font-display text-base tracking-wide bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  NEXT GAME 🎲
                </button>

                {/* Challenge & Share Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onChallengeFriend(game, finalScore)}
                    className="py-3 px-2 rounded-xl font-bold text-xs bg-slate-800 active:bg-slate-700 border border-slate-700 text-indigo-300 flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    CHALLENGE
                  </button>

                  <button
                    onClick={() => onShareScore(game, finalScore)}
                    className="py-3 px-2 rounded-xl font-bold text-xs bg-slate-800 active:bg-slate-700 border border-slate-700 text-pink-300 flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    SHARE SCORE
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Back to Arcade
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
