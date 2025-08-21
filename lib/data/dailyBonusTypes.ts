export interface DailyBonusReward {
  type: 'currency' | 'booster';
  amount?: number;
  name?: string;
  quantity?: number;
}

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
  lastClaimDate: string | null;
  canClaimToday: boolean;
  todayReward: DailyBonusReward | null;
}

export interface DailyBonusResponse {
  weeks: DailyBonusWeek[];
  currentWeek: number;
  currentDay: number;
  canClaimToday: boolean;
  todayReward: DailyBonusReward | null;
  lastClaimDate: string | null;
} 