import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { sound } from '../services/sound';
import { notificationService } from '../services/notificationService';
import confetti from 'canvas-confetti';
import { Coins, Bell, BellRing, Sparkles, Check, Clock } from 'lucide-react';

interface CoinStashCardProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

export const CoinStashCard: React.FC<CoinStashCardProps> = ({ profile, onProfileUpdate }) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [claimedRecently, setClaimedRecently] = useState<boolean>(false);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  const isReminderOn = profile.coinReminderEnabled ?? true;

  // Real-time countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const canClaim = StorageService.canClaimCoinStash(profile);
      setIsReady(canClaim);

      if (canClaim) {
        setTimeLeftStr('READY TO CLAIM!');
      } else {
        const nextTime = StorageService.getNextCoinStashTime(profile);
        const diffMs = Math.max(0, nextTime - Date.now());
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setTimeLeftStr(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  // Handle claiming the 100 free coins
  const handleClaim = () => {
    const result = StorageService.claimCoinStash(profile, 100);
    if (result.success) {
      sound.playCoinCascade();
      setClaimedRecently(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
      onProfileUpdate(result.profile);
      setTimeout(() => setClaimedRecently(false), 2500);
    }
  };

  // Toggle notification reminder
  const handleToggleReminder = async () => {
    sound.playClick();
    const newStatus = !isReminderOn;
    const updated = { ...profile, coinReminderEnabled: newStatus };
    StorageService.saveProfile(updated);
    onProfileUpdate(updated);

    if (newStatus) {
      if (notificationService.isSupported()) {
        const granted = await notificationService.requestPermission();
        if (granted) {
          setAlertFeedback('🔔 Push reminders enabled!');
        } else {
          setAlertFeedback('🔔 In-app coin alerts enabled!');
        }
      } else {
        setAlertFeedback('🔔 In-app coin alerts enabled!');
      }
    } else {
      setAlertFeedback('Reminders paused.');
    }
    setTimeout(() => setAlertFeedback(null), 2500);
  };

  // Trigger test alert so the user can verify on their phone
  const handleTestAlert = () => {
    sound.playClick();
    notificationService.triggerCoinReminderAlert();
    setAlertFeedback('🔔 Alert sent! Check notification banner.');
    setTimeout(() => setAlertFeedback(null), 3000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-slate-900 border-2 border-amber-500/30 p-4 sm:p-5 shadow-xl">
      {/* Glow highlight */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shadow-md">
              🪙
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-black text-sm text-white tracking-wide">
                  Arcade Coin Vault
                </h4>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-black border border-amber-500/30">
                  +100 FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hourly free coin drop to keep streaks & games active
              </p>
            </div>
          </div>

          {/* Reminder Toggle */}
          <button
            onClick={handleToggleReminder}
            title={isReminderOn ? 'Disable Reminder Alert' : 'Enable Reminder Alert'}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
              isReminderOn
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isReminderOn ? <BellRing className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4" />}
            <span className="text-[10px] hidden sm:inline">{isReminderOn ? 'Alerts ON' : 'Alerts OFF'}</span>
          </button>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur rounded-2xl p-3 border border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isReady ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                Status
              </span>
              <span className={`text-xs font-mono font-black ${isReady ? 'text-amber-300' : 'text-slate-300'}`}>
                {timeLeftStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Test alert button */}
            <button
              onClick={handleTestAlert}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 border border-slate-700 active:scale-95 transition-all"
            >
              🔔 Test Alert
            </button>

            {/* Claim button */}
            <button
              onClick={handleClaim}
              disabled={!isReady || claimedRecently}
              className={`px-4 py-2 rounded-xl font-black text-xs font-display tracking-wide shadow-md active:scale-95 transition-all flex items-center gap-1.5 ${
                isReady && !claimedRecently
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 animate-pulse shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {claimedRecently ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  CLAIMED!
                </>
              ) : isReady ? (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  CLAIM +100 COINS
                </>
              ) : (
                'CLAIMED'
              )}
            </button>
          </div>
        </div>

        {/* Feedback alert message */}
        {alertFeedback && (
          <div className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-center animate-in fade-in duration-200">
            {alertFeedback}
          </div>
        )}
      </div>
    </div>
  );
};
