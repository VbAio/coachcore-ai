export type SubscriptionTier = 'free' | 'premium' | 'team';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  tier: SubscriptionTier;
  createdAt: string;
}

export interface UserStats {
  userId: string;
  totalReplays: number;
  winRate: number;
  avgMistakesPerGame: number;
  improvementScore: number;
  favoriteHeroes: Array<{ hero: string; games: number; winRate: number }>;
  skillHistory: Array<{ date: string; scores: Record<string, number> }>;
  mmrPrediction: number;
}

export interface DailyRecommendation {
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}
