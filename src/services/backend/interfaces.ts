/**
 * MiniRush Backend & Cloud Service Interfaces
 * 
 * Defines standard contracts for future cloud backend integration (e.g. Firebase, Supabase, Cloud SQL)
 * without breaking current local gameplay or faking remote infrastructure.
 */

import { UserProfile, LeaderboardEntry } from '../../types';

export type BackendConnectionStatus = 'local_offline' | 'connecting' | 'online_connected' | 'error';

export interface BackendProviderMeta {
  readonly providerName: string;
  readonly isOnline: boolean;
  getConnectionStatus(): BackendConnectionStatus;
}

/**
 * Authentication & Identity
 * Handles guest profiles or Google Play Games Sign-In
 */
export interface IAuthService extends BackendProviderMeta {
  getCurrentUserId(): string;
  isAnonymous(): boolean;
  signInWithGooglePlay(): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<void>;
}

/**
 * Leaderboards
 * Submits verified high scores and fetches global/weekly rankings
 */
export interface ILeaderboardService extends BackendProviderMeta {
  getGlobalLeaderboard(limit?: number): Promise<{ entries: LeaderboardEntry[]; isOnline: boolean }>;
  getWeeklyLeaderboard(limit?: number): Promise<{ entries: LeaderboardEntry[]; isOnline: boolean }>;
  getUserRank(score: number): Promise<{ rank: number; totalPlayers: number; isEstimated: boolean }>;
  submitScore(gameId: string, score: number, signature?: string): Promise<{ success: boolean; newRank?: number }>;
}

/**
 * Challenges & Friend Matches
 * Generates and resolves cross-device game challenges
 */
export interface FriendChallengeData {
  challengeId: string;
  creatorId: string;
  creatorName: string;
  gameId: string;
  targetScore: number;
  createdAt: number;
  expiresAt: number;
}

export interface IChallengeService extends BackendProviderMeta {
  createChallenge(gameId: string, targetScore: number): Promise<{ challengeCode: string; shareUrl: string }>;
  getChallenge(challengeCode: string): Promise<FriendChallengeData | null>;
  recordChallengeAttempt(challengeCode: string, score: number): Promise<{ beaten: boolean; bestScore: number }>;
}

/**
 * Referral Attribution
 * Generates user invite codes and processes attribution
 */
export interface IReferralService extends BackendProviderMeta {
  getReferralCode(): string;
  redeemCode(code: string): Promise<{ success: boolean; bonusCoins: number; error?: string }>;
  hasRedeemed(): boolean;
}

/**
 * Cloud Profile Sync
 * Backs up progression, coins, avatars, and unlocks across devices
 */
export interface ICloudProfileService extends BackendProviderMeta {
  saveProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }>;
  fetchProfile(): Promise<UserProfile | null>;
  syncWithLocal(localProfile: UserProfile): Promise<UserProfile>;
}
