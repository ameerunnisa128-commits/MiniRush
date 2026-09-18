import { UserProfile, AppSettings, FriendChallenge, GameSessionResult, Achievement, LeaderboardEntry, CoinTransaction, CoinTransactionType } from '../types';
import { DEFAULT_ACHIEVEMENTS, BOT_OPPONENTS, ALL_GAMES } from '../data/games';

const USER_KEY = 'minirush_user_profile_v1';
const SETTINGS_KEY = 'minirush_settings_v1';
const CHALLENGES_KEY = 'minirush_challenges_v1';
const ACHIEVEMENTS_KEY = 'minirush_achievements_v1';

const REFILL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes per life

function generateReferralCode(): string {
  const chars = 'RUSH2025ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = 'RUSH-';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function getDefaultProfile(): UserProfile {
  return {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    username: 'ArcadeRacer',
    avatarId: 'rushy',
    level: 1,
    xp: 0,
    coins: 350, // Starter coins
    lives: 5,
    maxLives: 5,
    nextLifeRefillTime: 0,
    streakDays: 1,
    lastDailyBoxClaim: 0,
    referralCode: generateReferralCode(),
    referralsClaimed: 0,
    totalGamesPlayed: 0,
    totalWins: 0,
    perfectShots: 12,
    favorites: ['arrow-lock', 'perfect-aim'],
    highScores: {
      'arrow-lock': 1800,
      'knife-throw': 900,
      'perfect-aim': 2400,
      'perfect-park': 1200,
      'mini-2048': 1024,
      'dual-shoot': 280,
      'quick-reaction': 8200,
      'perfect-stack': 14,
      'dont-tap-red': 1600,
      'one-shot': 1500,
    },
    unlockedAvatars: ['rushy', 'blitz', 'pixel'],
    achievements: DEFAULT_ACHIEVEMENTS,
  };
}

export function getDefaultSettings(): AppSettings {
  return {
    soundEnabled: true,
    musicEnabled: false,
    hapticsEnabled: true,
    reducedMotion: false,
  };
}

export class StorageService {
  public static loadProfile(): UserProfile {
    try {
      const data = localStorage.getItem(USER_KEY);
      if (!data) {
        const initial = getDefaultProfile();
        this.saveProfile(initial);
        return initial;
      }
      const parsed: UserProfile = JSON.parse(data);
      if (!parsed.achievements) parsed.achievements = DEFAULT_ACHIEVEMENTS;
      if (typeof parsed.perfectShots !== 'number') parsed.perfectShots = 0;
      // Check life refill timer
      const now = Date.now();
      if (parsed.lives < parsed.maxLives) {
        if (!parsed.nextLifeRefillTime || parsed.nextLifeRefillTime <= 0) {
          parsed.nextLifeRefillTime = now + REFILL_INTERVAL_MS;
        } else if (now >= parsed.nextLifeRefillTime) {
          const recovered = Math.floor((now - parsed.nextLifeRefillTime) / REFILL_INTERVAL_MS) + 1;
          parsed.lives = Math.min(parsed.maxLives, parsed.lives + recovered);
          parsed.nextLifeRefillTime = parsed.lives < parsed.maxLives ? now + REFILL_INTERVAL_MS : 0;
          this.saveProfile(parsed);
        }
      }
      return parsed;
    } catch {
      return getDefaultProfile();
    }
  }

  public static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch {
      // Storage full or restricted
    }
  }

  public static loadSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : getDefaultSettings();
    } catch {
      return getDefaultSettings();
    }
  }

  public static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  public static loadAchievements(): Achievement[] {
    try {
      const data = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (!data) {
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(DEFAULT_ACHIEVEMENTS));
        return DEFAULT_ACHIEVEMENTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_ACHIEVEMENTS;
    }
  }

  public static saveAchievements(achievements: Achievement[]): void {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch {
      // ignore
    }
  }

  public static loadChallenges(): FriendChallenge[] {
    try {
      const data = localStorage.getItem(CHALLENGES_KEY);
      if (!data) {
        // Seed initial friendly challenge demo
        const initialChallenges: FriendChallenge[] = [
          {
            id: 'chal_demo_1',
            code: 'AIM-8742',
            gameId: 'perfect-aim',
            gameName: 'Perfect Aim',
            gameIcon: '🎯',
            challengerName: 'Faiz',
            challengerAvatar: '🦊',
            challengerScore: 2400,
            status: 'pending',
            createdAt: Date.now() - 3600000,
          },
          {
            id: 'chal_demo_2',
            code: 'KNIFE-1500',
            gameId: 'knife-throw',
            gameName: 'Knife Throw',
            gameIcon: '🔪',
            challengerName: 'Maya',
            challengerAvatar: '🌟',
            challengerScore: 1100,
            status: 'pending',
            createdAt: Date.now() - 7200000,
          },
        ];
        localStorage.setItem(CHALLENGES_KEY, JSON.stringify(initialChallenges));
        return initialChallenges;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static saveChallenges(challenges: FriendChallenge[]): void {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    } catch {
      // ignore
    }
  }

  public static addChallenge(challenge: FriendChallenge): void {
    const list = this.loadChallenges();
    list.unshift(challenge);
    this.saveChallenges(list);
  }

  public static updateChallenge(challenge: FriendChallenge): void {
    const list = this.loadChallenges().map(c => c.id === challenge.id ? challenge : c);
    this.saveChallenges(list);
  }

  public static recordGameResult(result: GameSessionResult): {
    newProfile: UserProfile;
    unlockedAchievements: Achievement[];
  } {
    const profile = this.loadProfile();
    const achievements = this.loadAchievements();

    // Anti-cheat verification
    const saneScore = Math.min(result.score, 100000);
    const prevBest = profile.highScores[result.gameId] || 0;
    const isNewHigh = saneScore > prevBest;

    if (isNewHigh) {
      profile.highScores[result.gameId] = saneScore;
    }

    profile.totalGamesPlayed += 1;
    if (result.coinsEarned > 0) {
      this.transactCoins('EARN', result.coinsEarned, `Match Score: ${saneScore} (${result.gameId})`, profile);
    }
    profile.xp += result.xpEarned;

    // Check level progression (every 500 XP = 1 Level)
    const newLevel = Math.floor(profile.xp / 500) + 1;
    if (newLevel > profile.level) {
      profile.level = newLevel;
      this.transactCoins('BONUS', 100, `Level Up to Level ${newLevel}!`, profile);
    }

    // Check achievements
    const newlyCompleted: Achievement[] = [];
    achievements.forEach(ach => {
      if (!ach.completed) {
        ach.currentCount = ach.currentCount ?? 0;
        const target = ach.targetCount ?? ach.maxProgress ?? 1;

        if (ach.id === 'first_win') {
          ach.currentCount = profile.totalGamesPlayed;
        } else if (ach.id === 'games_10') {
          ach.currentCount = profile.totalGamesPlayed;
        } else if (ach.id === 'perfect_scores' && (result.perfectHits || 0) > 0) {
          ach.currentCount += result.perfectHits || 1;
        }

        if (ach.currentCount >= target) {
          ach.completed = true;
          ach.unlocked = true;
          newlyCompleted.push(ach);
        }
      }
    });

    this.saveProfile(profile);
    this.saveAchievements(achievements);

    return {
      newProfile: profile,
      unlockedAchievements: newlyCompleted,
    };
  }

  // Deduct 1 life to play a game
  public static useLife(): boolean {
    const profile = this.loadProfile();
    if (profile.lives <= 0) return false;
    profile.lives -= 1;
    if (profile.nextLifeRefillTime === 0) {
      profile.nextLifeRefillTime = Date.now() + REFILL_INTERVAL_MS;
    }
    this.saveProfile(profile);
    return true;
  }

  // Refill full lives (e.g. from coins or rewarded ad)
  public static refillLives(amount?: number): UserProfile {
    const profile = this.loadProfile();
    profile.lives = amount ? Math.min(profile.maxLives, profile.lives + amount) : profile.maxLives;
    profile.nextLifeRefillTime = profile.lives >= profile.maxLives ? 0 : profile.nextLifeRefillTime;
    this.saveProfile(profile);
    return profile;
  }

  // Universal Coin Transaction Engine
  public static transactCoins(
    type: CoinTransactionType,
    amount: number,
    reason: string,
    existingProfile?: UserProfile
  ): { success: boolean; profile: UserProfile; transaction?: CoinTransaction; error?: string } {
    const profile = existingProfile || this.loadProfile();
    const cleanAmount = Math.floor(amount);

    if (cleanAmount <= 0 || !Number.isFinite(cleanAmount)) {
      return { success: false, profile, error: 'Transaction amount must be a positive integer.' };
    }

    if (type === 'SPEND') {
      if (profile.coins < cleanAmount) {
        return { 
          success: false, 
          profile, 
          error: `Insufficient coins: balance is ${profile.coins}, requires ${cleanAmount}.` 
        };
      }
      profile.coins = Math.max(0, profile.coins - cleanAmount);
    } else {
      // EARN, BONUS, REFUND
      profile.coins += cleanAmount;
    }

    const transaction: CoinTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      amount: cleanAmount,
      reason,
      timestamp: Date.now(),
      balanceAfter: profile.coins,
    };

    profile.coinTransactions = [transaction, ...(profile.coinTransactions || [])].slice(0, 50);

    this.saveProfile(profile);
    return { success: true, profile, transaction };
  }

  // Purchase full life refill using coins (200 coins)
  public static buyLivesWithCoins(cost: number = 200): { success: boolean; profile: UserProfile; error?: string } {
    const profile = this.loadProfile();
    if (profile.lives >= profile.maxLives) {
      return { success: false, profile, error: 'Lives are already full.' };
    }
    const res = this.transactCoins('SPEND', cost, 'Refilled 5 Lives with Coins', profile);
    if (!res.success) {
      return { success: false, profile, error: res.error };
    }
    res.profile.lives = res.profile.maxLives;
    res.profile.nextLifeRefillTime = 0;
    this.saveProfile(res.profile);
    return { success: true, profile: res.profile };
  }

  // Redeem a referral code with anti-abuse validation
  public static redeemReferralCode(code: string): { success: boolean; profile: UserProfile; error?: string } {
    const profile = this.loadProfile();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      return { success: false, profile, error: 'Please enter a referral code.' };
    }

    if (cleanCode === profile.referralCode.toUpperCase()) {
      return { success: false, profile, error: 'You cannot redeem your own referral code.' };
    }

    if (profile.redeemedReferralCodes && profile.redeemedReferralCodes.includes(cleanCode)) {
      return { success: false, profile, error: 'You have already redeemed this referral code.' };
    }

    if ((profile.redeemedReferralCodes?.length || 0) >= 1) {
      return { success: false, profile, error: 'Referral reward already claimed for this device.' };
    }

    if (!cleanCode.startsWith('RUSH-') || cleanCode.length < 8) {
      return { success: false, profile, error: 'Invalid code format. Format is RUSH-XXXX.' };
    }

    const tx = this.transactCoins('BONUS', 500, `Redeemed Referral Code (${cleanCode})`, profile);
    if (!tx.success) {
      return { success: false, profile, error: tx.error };
    }

    tx.profile.redeemedReferralCodes = [...(tx.profile.redeemedReferralCodes || []), cleanCode];
    tx.profile.referralsClaimed = (tx.profile.referralsClaimed || 0) + 1;
    this.saveProfile(tx.profile);

    return { success: true, profile: tx.profile };
  }

  // Check if daily box is ready
  public static canClaimDailyBox(profile: UserProfile): boolean {
    const now = new Date();
    const lastClaim = new Date(profile.lastDailyBoxClaim);
    // If not claimed today
    return (
      profile.lastDailyBoxClaim === 0 ||
      now.getDate() !== lastClaim.getDate() ||
      now.getMonth() !== lastClaim.getMonth() ||
      now.getFullYear() !== lastClaim.getFullYear()
    );
  }

  // Generate realistic leaderboard entries for any game
  public static getLeaderboardForGame(gameId: string, currentUserProfile: UserProfile): LeaderboardEntry[] {
    const userBest = currentUserProfile.highScores[gameId] || 0;
    const game = ALL_GAMES.find(g => g.id === gameId);
    const baseScore = userBest > 0 ? userBest : 1200;

    const entries: LeaderboardEntry[] = [
      { rank: 1, playerName: '⚡ ApexRacer', avatar: '🚀', score: Math.round(baseScore * 1.45) + 350, badge: '👑 Arcade King' },
      { rank: 2, playerName: '🎯 BullseyeQueen', avatar: '🌟', score: Math.round(baseScore * 1.3) + 180, badge: '🥈 Master' },
      { rank: 3, playerName: '🤖 Sharpshooter', avatar: '👾', score: Math.round(baseScore * 1.15) + 90, isBot: true },
      { rank: 4, playerName: currentUserProfile.username, avatar: currentUserProfile.avatarId === 'rushy' ? '⚡' : '🦊', score: userBest, isCurrentUser: true },
      { rank: 5, playerName: '🔥 PixelStorm', avatar: '🦾', score: Math.max(100, Math.round(baseScore * 0.95) - 40) },
      { rank: 6, playerName: '🎮 RetroKid', avatar: '🐱', score: Math.max(80, Math.round(baseScore * 0.8) - 120) },
      { rank: 7, playerName: '🤖 Speed Bot', avatar: '🤖', score: Math.max(50, Math.round(baseScore * 0.7) - 200), isBot: true },
    ];

    // Sort descending by score
    entries.sort((a, b) => b.score - a.score);
    // Re-assign ranks
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return entries;
  }
}
