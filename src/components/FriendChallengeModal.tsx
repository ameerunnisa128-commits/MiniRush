import React, { useState } from 'react';
import { GameDefinition, UserProfile, FriendChallenge } from '../types';
import { StorageService } from '../services/storage';
import { sound } from '../services/sound';
import { X, Users, Swords, Copy, Check, ArrowRight } from 'lucide-react';

interface FriendChallengeModalProps {
  game?: GameDefinition;
  initialScore?: number;
  profile: UserProfile;
  onClose: () => void;
  onLaunchChallengeGame: (challenge: FriendChallenge) => void;
}

export const FriendChallengeModal: React.FC<FriendChallengeModalProps> = ({
  game,
  initialScore,
  profile,
  onClose,
  onLaunchChallengeGame,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(game ? 'create' : 'join');
  const [joinCode, setJoinCode] = useState('');
  const [createdChallenge, setCreatedChallenge] = useState<FriendChallenge | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateChallenge = () => {
    if (!game) return;
    sound.playBullseye();

    const code = `${game.name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newChal: FriendChallenge = {
      id: 'chal_' + Date.now(),
      code,
      gameId: game.id,
      gameName: game.name,
      gameIcon: game.icon,
      challengerName: profile.username,
      challengerAvatar: profile.avatarId === 'rushy' ? '⚡' : '🦊',
      challengerScore: initialScore || profile.highScores[game.id] || 1500,
      status: 'pending',
      createdAt: Date.now(),
    };

    StorageService.addChallenge(newChal);
    setCreatedChallenge(newChal);
  };

  const handleJoinByCode = () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) return;

    const list = StorageService.loadChallenges();
    const found = list.find(c => c.code.toUpperCase() === trimmed);

    if (found) {
      sound.playClick();
      onLaunchChallengeGame(found);
      onClose();
    } else {
      // Mock friendly match challenge resolution for external codes
      const parts = trimmed.split('-');
      const gameId = game?.id || 'perfect-aim';
      const syntheticChallenge: FriendChallenge = {
        id: 'chal_ext_' + Date.now(),
        code: trimmed,
        gameId: gameId,
        gameName: game?.name || 'Perfect Aim',
        gameIcon: game?.icon || '🎯',
        challengerName: 'RivalPlayer',
        challengerAvatar: '🌟',
        challengerScore: parts[1] ? Number(parts[1]) : 2100,
        status: 'pending',
        createdAt: Date.now(),
      };
      StorageService.addChallenge(syntheticChallenge);
      sound.playClick();
      onLaunchChallengeGame(syntheticChallenge);
      onClose();
    }
  };

  const handleCopyCode = () => {
    if (!createdChallenge) return;
    sound.playCoin();
    navigator.clipboard.writeText(createdChallenge.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Toggle */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700 mb-5">
          {game && (
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              CREATE CHALLENGE
            </button>
          )}
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'join' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            JOIN CHALLENGE CODE
          </button>
        </div>

        {activeTab === 'create' && game && (
          <div>
            {!createdChallenge ? (
              <div>
                <span className="text-4xl block mb-2">{game.icon}</span>
                <h3 className="text-lg font-black text-white">{game.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Send your score to friends and see if they can beat you!
                </p>

                <div className="my-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                  <span className="text-xs text-slate-400 block font-semibold">YOUR RECORD SCORE</span>
                  <span className="text-3xl font-black text-amber-400 font-display">
                    {(initialScore || profile.highScores[game.id] || 0).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={handleCreateChallenge}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Swords className="w-4 h-4" />
                  GENERATE CHALLENGE CODE ⚡
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="text-4xl block mb-1">🎉</span>
                <h3 className="text-lg font-black text-white">Challenge Created!</h3>
                <p className="text-xs text-slate-400">Share this code with your friend:</p>

                <div className="p-4 rounded-2xl bg-indigo-950/60 border-2 border-dashed border-indigo-500 flex items-center justify-between">
                  <span className="text-2xl font-black font-mono tracking-widest text-amber-300">
                    {createdChallenge.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-indigo-600 text-white active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'join' && (
          <div>
            <span className="text-4xl block mb-2">⚔️</span>
            <h3 className="text-lg font-black text-white">Enter Challenge Code</h3>
            <p className="text-xs text-slate-400 mt-1">
              Have a friend's code? Enter it below to battle their score!
            </p>

            <div className="my-5">
              <input
                type="text"
                placeholder="e.g. AIM-8742"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full py-3.5 px-4 text-center font-mono font-black text-lg bg-slate-950 border-2 border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase"
              />
              {error && <span className="text-xs text-rose-400 mt-1 block">{error}</span>}
            </div>

            <button
              onClick={handleJoinByCode}
              disabled={!joinCode.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              LAUNCH CHALLENGE MATCH <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
