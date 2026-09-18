export type GameCategory = 
  | 'Reflex' 
  | 'Aim' 
  | 'Skill' 
  | 'Vehicles' 
  | 'Puzzles' 
  | 'Survival' 
  | 'Duels' 
  | 'Fun Casual';

export type BotTier = 'Rookie' | 'Speed' | 'Sharpshooter' | 'Pro' | 'Master';

export interface BotOpponent {
  id: string;
  name: string;
  avatar: string;
  tier: BotTier;
  difficulty?: string;
  winRate?: number;
  reactionTimeMs: number; // e.g. 240ms for Master, 550ms for Rookie
  accuracy: number; // 0 to 1
  scoreBias: number;
}

export interface GameDefinition {
  id: string;
  name: string;
  icon: string;
  category: GameCategory;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  rules: string;
  scoringRule: string;
  gradient: string;
  accentColor: string;
  tag?: string;
  isTrending?: boolean;
  isNew?: boolean;
  playable: boolean;
  estimatedDurationSec: number;
}

export interface GameSessionResult {
  gameId: string;
  score: number;
  isHighScore: boolean;
  coinsEarned: number;
  xpEarned: number;
  durationSeconds: number;
  perfectHits?: number;
  timestamp: number;
}

export interface FriendChallenge {
  id: string;
  code: string;
  gameId: string;
  gameName: string;
  gameIcon: string;
  challengerName: string;
  challengerAvatar: string;
  challengerScore: number;
  opponentName?: string;
  opponentAvatar?: string;
  opponentScore?: number;
  status: 'pending' | 'completed' | 'declined';
  winner?: 'challenger' | 'opponent' | 'tie';
  createdAt: number;
  isBot?: boolean;
}

export interface LeaderboardEntry {
  id?: string;
  rank: number;
  playerName?: string;
  username?: string;
  avatar: string;
  score: number;
  country?: string;
  badge?: string;
  isCurrentUser?: boolean;
  isBot?: boolean;
}

export interface Achievement {
  id: string;
  name?: string;
  title?: string;
  description: string;
  icon: string;
  rewardCoins: number;
  rewardXp?: number;
  targetCount?: number;
  maxProgress?: number;
  currentCount?: number;
  progress?: number;
  completed?: boolean;
  unlocked?: boolean;
  claimed: boolean;
}

export type CoinTransactionType = 'EARN' | 'SPEND' | 'BONUS' | 'REFUND';

export interface CoinTransaction {
  id: string;
  type: CoinTransactionType;
  amount: number;
  reason: string;
  timestamp: number;
  balanceAfter: number;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarId: string;
  level: number;
  xp: number;
  coins: number;
  lives: number;
  maxLives: number;
  nextLifeRefillTime: number; // timestamp
  streakDays: number;
  lastDailyBoxClaim: number; // timestamp
  lastDailyBoxDoubled?: number; // timestamp
  referralCode: string;
  referralsClaimed: number;
  redeemedReferralCodes?: string[];
  totalGamesPlayed: number;
  totalWins: number;
  perfectShots: number;
  favorites: string[]; // game IDs
  highScores: Record<string, number>;
  unlockedAvatars: string[];
  achievements: Achievement[];
  coinTransactions?: CoinTransaction[];
}

export interface AppSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
}

export type MainTab = 'home' | 'games' | 'challenge' | 'leaderboard' | 'profile';
