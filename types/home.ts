export type HomeScreen =
  | 'admin login'
  | 'telegram login'
  | 'main menu'
  | 'classic mode'
  | 'zen mode'
  | 'settings'
  | 'gameover'
  | 'shop'
  | 'leaderboard'
  | 'zen';

export type AppStateStatus = 'idle' | 'transitioning' | 'error' | 'loading';
