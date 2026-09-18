import React from 'react';
import { AppSettings, UserProfile } from '../types';
import { StorageService, getDefaultProfile } from '../services/storage';
import { sound } from '../services/sound';
import { X, Volume2, VolumeX, Music, Smartphone, RotateCcw, ShieldCheck, Info } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  profile: UserProfile;
  onClose: () => void;
  onSettingsUpdate: (settings: AppSettings) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  profile,
  onClose,
  onSettingsUpdate,
  onProfileUpdate,
}) => {
  const toggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    sound.soundEnabled = updated.soundEnabled;
    StorageService.saveSettings(updated);
    onSettingsUpdate(updated);
    if (updated.soundEnabled) sound.playTick();
  };

  const toggleMusic = () => {
    const updated = { ...settings, musicEnabled: !settings.musicEnabled };
    sound.toggleMusic(updated.musicEnabled);
    StorageService.saveSettings(updated);
    onSettingsUpdate(updated);
  };

  const toggleHaptics = () => {
    const updated = { ...settings, hapticsEnabled: !settings.hapticsEnabled };
    sound.hapticsEnabled = updated.hapticsEnabled;
    StorageService.saveSettings(updated);
    onSettingsUpdate(updated);
    if (updated.hapticsEnabled) sound.vibrate(30);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all MiniRush progress and scores? This cannot be undone.')) {
      const fresh = getDefaultProfile();
      StorageService.saveProfile(fresh);
      onProfileUpdate(fresh);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-black font-display text-white mb-1">Arcade Settings</h3>
        <p className="text-xs text-slate-400 mb-5">Audio, haptics and preferences</p>

        <div className="space-y-3">
          {/* Sound FX */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Sound Effects</span>
                <span className="text-[11px] text-slate-400">Game audio & chimes</span>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Music */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Background Music</span>
                <span className="text-[11px] text-slate-400">Ambient arcade synth</span>
              </div>
            </div>
            <button
              onClick={toggleMusic}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                settings.musicEnabled ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Haptics */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Haptic Feedback</span>
                <span className="text-[11px] text-slate-400">Phone vibration on impacts</span>
              </div>
            </div>
            <button
              onClick={toggleHaptics}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                settings.hapticsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.hapticsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Reset Data */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <button
            onClick={handleResetData}
            className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            RESET ARCADE DATA
          </button>
        </div>

        {/* Version */}
        <div className="text-center mt-4">
          <span className="text-[11px] text-slate-500 block font-mono">MiniRush v1.0.0 • Mobile Arcade Edition</span>
          <span className="text-[10px] text-slate-600 block mt-0.5">Tiny Games. Endless Challenges.</span>
        </div>
      </div>
    </div>
  );
};
