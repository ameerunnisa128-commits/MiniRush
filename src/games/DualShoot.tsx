import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../services/sound';
import { BOT_OPPONENTS } from '../data/games';
import { BotOpponent } from '../types';

interface DualShootProps {
  onGameOver: (score: number, perfects: number) => void;
  onExit: () => void;
  selectedBot?: BotOpponent;
}

type DuelState = 'idle' | 'waiting' | 'ready' | 'draw' | 'result';

export const DualShootGame: React.FC<DualShootProps> = ({ onGameOver, selectedBot }) => {
  const bot = selectedBot || BOT_OPPONENTS[1]; // Default to Speed Bot

  const [state, setState] = useState<DuelState>('idle');
  const [playerRoundWins, setPlayerRoundWins] = useState(0);
  const [botRoundWins, setBotRoundWins] = useState(0);
  const [round, setRound] = useState(1);
  const [playerMs, setPlayerMs] = useState<number | null>(null);
  const [botMs, setBotMs] = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<'player' | 'bot' | 'foul' | null>(null);
  const [foulMessage, setFoulMessage] = useState<string | null>(null);

  const drawTimestampRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = useCallback(() => {
    setState('waiting');
    setPlayerMs(null);
    setBotMs(null);
    setRoundWinner(null);
    setFoulMessage(null);
    sound.playTick();

    // After 1.2s, transition to 'ready'
    timerRef.current = setTimeout(() => {
      setState('ready');
      sound.playTick();

      // Random delay between 1.2s and 3.8s before DRAW!
      const delay = 1200 + Math.random() * 2600;
      timerRef.current = setTimeout(() => {
        setState('draw');
        drawTimestampRef.current = Date.now();
        sound.playLaser();
      }, delay);
    }, 1200);
  }, []);

  const handleShoot = () => {
    if (state === 'idle') {
      setPlayerRoundWins(0);
      setBotRoundWins(0);
      setRound(1);
      startRound();
      return;
    }

    if (state === 'waiting' || state === 'ready') {
      // Early tap = FOUL!
      if (timerRef.current) clearTimeout(timerRef.current);
      sound.playCrash();
      setState('result');
      setRoundWinner('foul');
      setFoulMessage('FOUL! You drew before the signal! ❌');
      setBotRoundWins(b => b + 1);
      checkMatchWinner(playerRoundWins, botRoundWins + 1);
      return;
    }

    if (state === 'draw') {
      const reactionTime = Date.now() - drawTimestampRef.current;
      setPlayerMs(reactionTime);

      // Bot reaction time based on bot profile + slight random jitter
      const botJitter = (Math.random() - 0.5) * 60;
      const simulatedBotReaction = Math.max(120, Math.round(bot.reactionTimeMs + botJitter));
      setBotMs(simulatedBotReaction);

      setState('result');

      if (reactionTime < simulatedBotReaction) {
        // Player wins!
        sound.playBullseye();
        setRoundWinner('player');
        const newPlayerWins = playerRoundWins + 1;
        setPlayerRoundWins(newPlayerWins);
        checkMatchWinner(newPlayerWins, botRoundWins);
      } else {
        // Bot wins!
        sound.playGameOver();
        setRoundWinner('bot');
        const newBotWins = botRoundWins + 1;
        setBotRoundWins(newBotWins);
        checkMatchWinner(playerRoundWins, newBotWins);
      }
    }
  };

  const checkMatchWinner = (pWins: number, bWins: number) => {
    if (pWins >= 2 || bWins >= 2) {
      setTimeout(() => {
        const didWin = pWins > bWins;
        if (didWin) sound.playVictory();
        else sound.playGameOver();
        const finalScore = pWins * 1200 + Math.max(0, 1000 - (playerMs || 300) * 2);
        onGameOver(finalScore, didWin ? 1 : 0);
      }, 1600);
    } else {
      setTimeout(() => {
        setRound(r => r + 1);
        startRound();
      }, 1800);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 select-none touch-game"
      onClick={handleShoot}
    >
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-800/80 backdrop-blur rounded-2xl px-4 py-2.5 border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤠</span>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">YOU</span>
            <span className="text-lg font-black text-amber-400">{playerRoundWins} WINS</span>
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Round</span>
          <span className="text-base font-black text-white">{round} of 3</span>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">{bot.name}</span>
            <span className="text-lg font-black text-rose-400">{botRoundWins} WINS</span>
          </div>
          <span className="text-xl">{bot.avatar}</span>
        </div>
      </div>

      {/* 3-Second Rule */}
      <div className="text-center my-1">
        <p className="text-xs font-medium text-slate-400">
          🔫 <span className="text-amber-300 font-semibold">Wait for DRAW!</span> Tap immediately when green flashes!
        </p>
      </div>

      {/* Western Duel Arena */}
      <div className={`relative w-full h-80 rounded-3xl border-2 flex flex-col items-center justify-center overflow-hidden transition-colors duration-150 ${
        state === 'draw'
          ? 'bg-emerald-950/80 border-emerald-400 shadow-emerald-500/50'
          : state === 'ready'
          ? 'bg-amber-950/50 border-amber-500'
          : 'bg-slate-950 border-slate-800'
      }`}>
        {/* Duel Signals */}
        {state === 'idle' && (
          <div className="text-center p-6">
            <span className="text-6xl block mb-3">🤠 ⚔️ 🤖</span>
            <h3 className="text-2xl font-black text-amber-400">Dual Shoot</h3>
            <p className="text-xs text-slate-400 mt-1">Face {bot.name} in a high-noon quick draw!</p>
          </div>
        )}

        {state === 'waiting' && (
          <div className="text-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-red-600 border-4 border-red-400 mx-auto mb-3 shadow-lg shadow-red-500/50" />
            <h3 className="text-2xl font-black text-red-400">WAIT...</h3>
            <p className="text-xs text-slate-400 mt-1">Keep your finger ready!</p>
          </div>
        )}

        {state === 'ready' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500 border-4 border-amber-300 mx-auto mb-3 shadow-lg shadow-amber-400/50" />
            <h3 className="text-2xl font-black text-amber-400">STEADY...</h3>
            <p className="text-xs text-slate-400 mt-1">Don't jump early!</p>
          </div>
        )}

        {state === 'draw' && (
          <div className="text-center animate-ping">
            <div className="w-20 h-20 rounded-full bg-emerald-400 border-4 border-white mx-auto mb-2 shadow-2xl shadow-emerald-400" />
            <h2 className="text-5xl font-black text-white tracking-widest">DRAW! ⚡</h2>
          </div>
        )}

        {state === 'result' && (
          <div className="text-center p-4">
            {roundWinner === 'foul' && (
              <div className="text-rose-400">
                <span className="text-5xl block mb-2">🚫</span>
                <h3 className="text-xl font-black">{foulMessage}</h3>
              </div>
            )}
            {roundWinner === 'player' && (
              <div>
                <span className="text-5xl block mb-2">🎯</span>
                <h3 className="text-2xl font-black text-emerald-400">YOU WON THE DRAW!</h3>
                <div className="flex justify-center gap-6 mt-3 font-mono text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">YOUR TIME</span>
                    <span className="text-emerald-300 font-bold text-lg">{playerMs} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">{bot.name}</span>
                    <span className="text-slate-400 font-bold text-lg">{botMs} ms</span>
                  </div>
                </div>
              </div>
            )}
            {roundWinner === 'bot' && (
              <div>
                <span className="text-5xl block mb-2">💀</span>
                <h3 className="text-2xl font-black text-rose-400">{bot.name} WAS FASTER!</h3>
                <div className="flex justify-center gap-6 mt-3 font-mono text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">YOUR TIME</span>
                    <span className="text-rose-300 font-bold text-lg">{playerMs} ms</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">{bot.name}</span>
                    <span className="text-emerald-400 font-bold text-lg">{botMs} ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shoot Button */}
      <div className="w-full mt-2">
        <button
          id="dual-shoot-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleShoot();
          }}
          className={`w-full py-4 rounded-2xl font-black font-display text-lg tracking-wide shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            state === 'draw'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-emerald-500/50 scale-105'
              : state === 'waiting' || state === 'ready'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-red-600/30'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30'
          }`}
        >
          {state === 'idle' ? 'START DUEL ⚔️' : state === 'draw' ? 'DRAW NOW! 🔥' : 'TAP TO DRAW! 🔫'}
        </button>
      </div>
    </div>
  );
};
