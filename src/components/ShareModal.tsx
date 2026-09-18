import React, { useState } from 'react';
import { GameDefinition } from '../types';
import { sound } from '../services/sound';
import { X, Share2, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  game: GameDefinition;
  score: number;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ game, score, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `🔥 I just scored ${score.toLocaleString()} in ${game.name} on MiniRush! Can you beat me? Play now!`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/#game=${game.id}&score=${score}` : '';

  const handleNativeShare = async () => {
    sound.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MiniRush — ${game.name}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    sound.playCoin();
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
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

        <h3 className="text-lg font-black font-display text-white mb-4">Share Score Card</h3>

        {/* Branded Arcade Share Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 border-2 border-indigo-500/50 shadow-2xl relative overflow-hidden text-left mb-5">
          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center font-black text-sm text-slate-950 shadow">
                ⚡
              </div>
              <div>
                <span className="text-xs font-black tracking-widest text-indigo-300 block">MINIRUSH</span>
                <span className="text-[10px] text-slate-400">Tiny Games. Endless Challenges.</span>
              </div>
            </div>
            <span className="text-2xl">{game.icon}</span>
          </div>

          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">{game.name}</span>
          <div className="text-4xl font-black font-display text-white tracking-tight my-1">
            {score.toLocaleString()}
          </div>
          <span className="text-xs text-amber-400 font-extrabold block">🔥 Can you beat me?</span>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30 active:scale-95 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            SHARE WITH FRIENDS 🚀
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs active:scale-95 flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'COPIED TO CLIPBOARD!' : 'COPY CHALLENGE LINK'}
          </button>
        </div>
      </div>
    </div>
  );
};
