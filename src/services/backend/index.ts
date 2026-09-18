/**
 * MiniRush Central Backend Services Access Point
 */

import {
  LocalAuthProvider,
  LocalLeaderboardProvider,
  LocalChallengeProvider,
  LocalReferralProvider,
  LocalCloudProfileProvider,
} from './localProviders';
import {
  IAuthService,
  ILeaderboardService,
  IChallengeService,
  IReferralService,
  ICloudProfileService,
} from './interfaces';

export * from './interfaces';
export * from './localProviders';

// Active service instances (defaulting to clean, offline-safe local providers)
export const authService: IAuthService = new LocalAuthProvider();
export const leaderboardService: ILeaderboardService = new LocalLeaderboardProvider();
export const challengeService: IChallengeService = new LocalChallengeProvider();
export const referralService: IReferralService = new LocalReferralProvider();
export const cloudProfileService: ICloudProfileService = new LocalCloudProfileProvider();
