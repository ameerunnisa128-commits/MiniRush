/**
 * MiniRush Local Backend Providers
 * 
 * Default offline-first implementations adhering to IAuthService, ILeaderboardService, etc.
 * Uses localStorage, local Julian day algorithms, and URL-hash parameters.
 * Clearly reports `isOnline: false` so that online features are never falsely advertised.
 */

import {
  IAuthService,
  ILeaderboardService,
  IChallengeService,
  IReferralService,
  ICloudProfileService,
  BackendConnectionStatus,
  FriendChallengeData,
} from './interfaces';
import { UserProfile, LeaderboardEntry, FriendChallenge } from '../../types';
import { StorageService } from '../storage';

const FALLBACK_GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', rank: 1, username: 'PixelKing', avatar: '👑', score: 48500, country: 'KR' },
  { id: '2', rank: 2, username: 'SpeedDemon', avatar: '⚡', score: 45200, country: 'US' },
  { id: '3', rank: 3, username: 'NeoArcade', avatar: '🕹️', score: 42900, country: 'JP' },
  { id: '4', rank: 4, username: 'Vortex77', avatar: '🌀', score: 39400, country: 'BR' },
  { id: '5', rank: 5, username: 'CyberNinja', avatar: '🥷', score: 36100, country: 'DE' },
  { id: '6', rank: 6, username: 'NovaRush', avatar: '🌟', score: 33800, country: 'GB' },
  { id: '7', rank: 7, username: 'CosmicAce', avatar: '🚀', score: 31200, country: 'CA' },
  { id: '8', rank: 8, username: 'FlashStrike', avatar: '💥', score: 29500, country: 'FR' },
  { id: '9', rank: 9, username: 'ShadowBlade', avatar: '🗡️', score: 27900, country: 'ES' },
  { id: '10', rank: 10, username: 'Zenith', avatar: '🔮', score: 26400, country: 'AU' },
];

const FALLBACK_WEEKLY_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'w1', rank: 1, username: 'SpeedDemon', avatar: '⚡', score: 14800, country: 'US' },
  { id: 'w2', rank: 2, username: 'NovaRush', avatar: '🌟', score: 13950, country: 'GB' },
  { id: 'w3', rank: 3, username: 'PixelKing', avatar: '👑', score: 13100, country: 'KR' },
  { id: 'w4', rank: 4, username: 'CyberNinja', avatar: '🥷', score: 11400, country: 'DE' },
  { id: 'w5', rank: 5, username: 'Vortex77', avatar: '🌀', score: 10800, country: 'BR' },
];

/**
 * Local Authentication Provider (Device-bound guest profile)
 */
export class LocalAuthProvider implements IAuthService {
  readonly providerName = 'Local Guest Device Storage';
  readonly isOnline = false;

  getConnectionStatus(): BackendConnectionStatus {
    return 'local_offline';
  }

  getCurrentUserId(): string {
    const profile = StorageService.loadProfile();
    return profile.id || 'guest_user';
  }

  isAnonymous(): boolean {
    return true;
  }

  async signInWithGooglePlay(): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Google Play Games Sign-In requires an active Google Play Console developer project and SHA-1 certificate configuration.',
    };
  }

  async signOut(): Promise<void> {
    // No-op for local guest
  }
}

/**
 * Local Leaderboard Provider
 * Uses verified client high scores merged into offline simulation rosters
 */
export class LocalLeaderboardProvider implements ILeaderboardService {
  readonly providerName = 'Local High Scores & Arcade Simulation';
  readonly isOnline = false;

  getConnectionStatus(): BackendConnectionStatus {
    return 'local_offline';
  }

  async getGlobalLeaderboard(_limit = 50): Promise<{ entries: LeaderboardEntry[]; isOnline: boolean }> {
    const profile = StorageService.loadProfile();
    const userScore = Object.values(profile.highScores).reduce((a, b) => a + b, 0);

    const merged = [...FALLBACK_GLOBAL_LEADERBOARD];
    const existingUserIndex = merged.findIndex(e => e.id === 'user-player');
    if (existingUserIndex >= 0) {
      merged[existingUserIndex].score = Math.max(merged[existingUserIndex].score, userScore);
    }
    merged.sort((a, b) => b.score - a.score);

    return { entries: merged, isOnline: false };
  }

  async getWeeklyLeaderboard(_limit = 50): Promise<{ entries: LeaderboardEntry[]; isOnline: boolean }> {
    return { entries: [...FALLBACK_WEEKLY_LEADERBOARD], isOnline: false };
  }

  async getUserRank(score: number): Promise<{ rank: number; totalPlayers: number; isEstimated: boolean }> {
    if (score <= 0) return { rank: 1420, totalPlayers: 10000, isEstimated: true };
    const simulatedRank = Math.max(1, Math.min(10000, Math.floor(10000 / (score / 350 + 1))));
    return { rank: simulatedRank, totalPlayers: 10000, isEstimated: true };
  }

  async submitScore(gameId: string, score: number): Promise<{ success: boolean; newRank?: number }> {
    const profile = StorageService.loadProfile();
    const currentHigh = profile.highScores[gameId] || 0;
    if (score > currentHigh) {
      profile.highScores[gameId] = score;
      StorageService.saveProfile(profile);
    }
    return { success: true };
  }
}

/**
 * Local Challenge Provider
 * Encodes friend matches into shareable URL parameters & local challenge logs
 */
export class LocalChallengeProvider implements IChallengeService {
  readonly providerName = 'URL-Parameter & Local Challenge Bridge';
  readonly isOnline = false;

  getConnectionStatus(): BackendConnectionStatus {
    return 'local_offline';
  }

  async createChallenge(gameId: string, targetScore: number): Promise<{ challengeCode: string; shareUrl: string }> {
    const code = `${gameId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://minirush.app';
    const shareUrl = `${base}/#game=${encodeURIComponent(gameId)}&score=${targetScore}&code=${code}`;

    StorageService.addChallenge({
      id: code,
      code,
      gameId,
      gameName: gameId,
      gameIcon: '🎮',
      challengerName: StorageService.loadProfile().username,
      challengerAvatar: StorageService.loadProfile().avatarId,
      challengerScore: targetScore,
      status: 'pending',
      createdAt: Date.now(),
    });

    return { challengeCode: code, shareUrl };
  }

  async getChallenge(challengeCode: string): Promise<FriendChallengeData | null> {
    const local = StorageService.loadChallenges().find((c: FriendChallenge) => c.code === challengeCode || c.id === challengeCode);
    if (!local) return null;
    return {
      challengeId: local.id,
      creatorId: 'local_friend',
      creatorName: local.challengerName,
      gameId: local.gameId,
      targetScore: local.challengerScore,
      createdAt: local.createdAt,
      expiresAt: local.createdAt + 86400000 * 7,
    };
  }

  async recordChallengeAttempt(challengeCode: string, score: number): Promise<{ beaten: boolean; bestScore: number }> {
    const challenges = StorageService.loadChallenges();
    const target = challenges.find((c: FriendChallenge) => c.code === challengeCode || c.id === challengeCode);
    const beaten = Boolean(target && score > target.challengerScore);
    if (target && beaten) {
      target.status = 'completed';
      target.opponentScore = score;
      target.winner = 'opponent';
      StorageService.updateChallenge(target);
    }
    return { beaten, bestScore: score };
  }
}

/**
 * Local Referral Provider
 * Enforces single-device anti-abuse and validation without external server
 */
export class LocalReferralProvider implements IReferralService {
  readonly providerName = 'Local Referral Validator';
  readonly isOnline = false;

  getConnectionStatus(): BackendConnectionStatus {
    return 'local_offline';
  }

  getReferralCode(): string {
    return StorageService.loadProfile().referralCode;
  }

  async redeemCode(code: string): Promise<{ success: boolean; bonusCoins: number; error?: string }> {
    const res = StorageService.redeemReferralCode(code);
    if (!res.success) {
      return { success: false, bonusCoins: 0, error: res.error };
    }
    return { success: true, bonusCoins: 500 };
  }

  hasRedeemed(): boolean {
    const p = StorageService.loadProfile();
    return Boolean(p.redeemedReferralCodes && p.redeemedReferralCodes.length > 0);
  }
}

/**
 * Local Cloud Profile Provider
 * Uses IndexedDB/localStorage until Firebase/Supabase is initialized
 */
export class LocalCloudProfileProvider implements ICloudProfileService {
  readonly providerName = 'Local Device Profile Storage';
  readonly isOnline = false;

  getConnectionStatus(): BackendConnectionStatus {
    return 'local_offline';
  }

  async saveProfile(profile: UserProfile): Promise<{ success: boolean }> {
    StorageService.saveProfile(profile);
    return { success: true };
  }

  async fetchProfile(): Promise<UserProfile | null> {
    return StorageService.loadProfile();
  }

  async syncWithLocal(localProfile: UserProfile): Promise<UserProfile> {
    return localProfile;
  }
}
