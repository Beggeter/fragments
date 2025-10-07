export type DailyBonusReward =
  | {
      type: 'currency';
      amount: number;
    }
  | {
      type: 'booster';
      name: string;
      quantity: number;
      amount?: number;
    };

export interface DailyBonusDay {
  day: number;
  regular: DailyBonusReward;
  premium: DailyBonusReward;
}

export interface DailyBonusWeek {
  week: number;
  days: DailyBonusDay[];
}

export interface DailyBonusConfig {
  weeks: DailyBonusWeek[];
}

export interface DailyBonusState {
  currentWeek: number;
  currentDay: number;
  canClaimToday: boolean;
  isClaimedToday: boolean;
  lastClaimDate: string | null;
  nextClaimAvailableAt: string | null;
  streakLength: number;
  todayReward: DailyBonusReward | null;
}

export interface DailyBonusResponse {
  weeks: DailyBonusWeek[];
  currentWeek: number;
  currentDay: number;
  canClaimToday: boolean;
  isClaimedToday: boolean;
  streakLength: number;
  lastClaimDate: string | null;
  nextClaimAvailableAt: string | null;
  todayReward: DailyBonusReward | null;
} 