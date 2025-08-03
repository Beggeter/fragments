import { Block, Matrix } from "../data/types";

export interface DifficultyLevel {
  level: number;
  scoreThreshold: number;
  name: string;
  description: string;
  modifiers: DifficultyModifiers;
}

export interface DifficultyModifiers {
  // Модификаторы генерации фигур
  easyBlockChance: number;      // Шанс появления простых фигур (0-1)
  mediumBlockChance: number;    // Шанс появления средних фигур (0-1)
  hardBlockChance: number;      // Шанс появления сложных фигур (0-1)
  
  // Модификаторы размещения
  maxPlacementAttempts: number; // Максимальное количество попыток размещения
  minValidPlacements: number;   // Минимальное количество валидных размещений
  
  // Модификаторы очков
  scoreMultiplier: number;      // Множитель очков
  comboMultiplier: number;      // Множитель комбо
  
  // Специальные эффекты
  specialEffects: string[];     // Специальные эффекты уровня
}

// Определяем уровни сложности
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    level: 1,
    scoreThreshold: 0,
    name: "Новичок",
    description: "Простое начало для изучения механик",
    modifiers: {
      easyBlockChance: 0.9,    // 90% простых фигур (в основном большие)
      mediumBlockChance: 0.09, // 9% средних фигур
      hardBlockChance: 0.01,   // 1% сложных фигур
      maxPlacementAttempts: 120,
      minValidPlacements: 8,
      scoreMultiplier: 1.0,
      comboMultiplier: 1.0,
      specialEffects: []
    }
  },
  {
    level: 2,
    scoreThreshold: 10000,
    name: "Ученик",
    description: "Игра становится немного сложнее",
    modifiers: {
      easyBlockChance: 0.6,    // 60% простых фигур
      mediumBlockChance: 0.35, // 35% средних фигур
      hardBlockChance: 0.05,   // 5% сложных фигур
      maxPlacementAttempts: 100,
      minValidPlacements: 6,
      scoreMultiplier: 1.1,
      comboMultiplier: 1.1,
      specialEffects: []
    }
  },
  {
    level: 3,
    scoreThreshold: 20000,
    name: "Игрок",
    description: "Средний уровень сложности",
    modifiers: {
      easyBlockChance: 0.4,    // 40% простых фигур
      mediumBlockChance: 0.5,  // 50% средних фигур
      hardBlockChance: 0.1,    // 10% сложных фигур
      maxPlacementAttempts: 80,
      minValidPlacements: 4,
      scoreMultiplier: 1.2,
      comboMultiplier: 1.2,
      specialEffects: []
    }
  },
  {
    level: 4,
    scoreThreshold: 30000,
    name: "Опытный",
    description: "Высокий уровень сложности",
    modifiers: {
      easyBlockChance: 0.25,   // 25% простых фигур
      mediumBlockChance: 0.55, // 55% средних фигур
      hardBlockChance: 0.2,    // 20% сложных фигур
      maxPlacementAttempts: 60,
      minValidPlacements: 3,
      scoreMultiplier: 1.3,
      comboMultiplier: 1.3,
      specialEffects: []
    }
  },
  {
    level: 5,
    scoreThreshold: 40000,
    name: "Мастер",
    description: "Очень сложный уровень",
    modifiers: {
      easyBlockChance: 0.15,   // 15% простых фигур
      mediumBlockChance: 0.45, // 45% средних фигур
      hardBlockChance: 0.4,    // 40% сложных фигур
      maxPlacementAttempts: 50,
      minValidPlacements: 2,
      scoreMultiplier: 1.5,
      comboMultiplier: 1.5,
      specialEffects: []
    }
  },
  {
    level: 6,
    scoreThreshold: 50000,
    name: "Легенда",
    description: "Экстремальная сложность",
    modifiers: {
      easyBlockChance: 0.05,   // 5% простых фигур
      mediumBlockChance: 0.3,  // 30% средних фигур
      hardBlockChance: 0.65,   // 65% сложных фигур
      maxPlacementAttempts: 40,
      minValidPlacements: 1,
      scoreMultiplier: 2.0,
      comboMultiplier: 2.0,
      specialEffects: []
    }
  }
];

// Специальный уровень для преодоления рекорда
export const RECORD_BREAKER_LEVEL: DifficultyLevel = {
  level: 999,
  scoreThreshold: 0, // Активируется при преодолении рекорда
  name: "Рекордсмен",
  description: "Специальный уровень для преодоления рекорда",
  modifiers: {
    easyBlockChance: 0.0,
    mediumBlockChance: 0.2,
    hardBlockChance: 0.8,
    maxPlacementAttempts: 20,
    minValidPlacements: 1,
    scoreMultiplier: 3.0,
    comboMultiplier: 3.0,
    specialEffects: ["record_breaker"]
  }
};

export class DifficultyManager {
  private currentLevel: DifficultyLevel;
  private playerRecord: number = 0;
  private isRecordBreakerMode: boolean = false;

  constructor(initialScore: number = 0, playerRecord: number = 0) {
    this.playerRecord = playerRecord;
    this.currentLevel = this.calculateLevel(initialScore);
  }

  // Вычисляем текущий уровень на основе очков
  calculateLevel(score: number): DifficultyLevel {
    // Проверяем, не преодолел ли игрок свой рекорд
    if (score > this.playerRecord && this.playerRecord > 0) {
      this.isRecordBreakerMode = true;
      return RECORD_BREAKER_LEVEL;
    }

    this.isRecordBreakerMode = false;
    
    // Находим подходящий уровень
    for (let i = DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
      if (score >= DIFFICULTY_LEVELS[i].scoreThreshold) {
        return DIFFICULTY_LEVELS[i];
      }
    }

    return DIFFICULTY_LEVELS[0];
  }

  // Обновляем уровень при изменении очков
  updateLevel(score: number): boolean {
    const newLevel = this.calculateLevel(score);
    const levelChanged = newLevel.level !== this.currentLevel.level;
    
    if (levelChanged) {
      this.currentLevel = newLevel;
      console.log(`Уровень сложности изменен: ${newLevel.name} (${newLevel.description})`);
    }

    return levelChanged;
  }

  // Получаем текущий уровень
  getCurrentLevel(): DifficultyLevel {
    return this.currentLevel;
  }

  // Получаем модификаторы текущего уровня
  getModifiers(): DifficultyModifiers {
    return this.currentLevel.modifiers;
  }

  // Проверяем, активен ли режим преодоления рекорда
  isRecordBreakerActive(): boolean {
    return this.isRecordBreakerMode;
  }

  // Получаем следующий уровень
  getNextLevel(): DifficultyLevel | null {
    const currentIndex = DIFFICULTY_LEVELS.findIndex(level => level.level === this.currentLevel.level);
    if (currentIndex >= 0 && currentIndex < DIFFICULTY_LEVELS.length - 1) {
      return DIFFICULTY_LEVELS[currentIndex + 1];
    }
    return null;
  }

  // Получаем прогресс до следующего уровня
  getProgressToNextLevel(currentScore: number): { progress: number; nextThreshold: number } {
    const nextLevel = this.getNextLevel();
    if (!nextLevel) {
      return { progress: 1.0, nextThreshold: currentScore };
    }

    const currentThreshold = this.currentLevel.scoreThreshold;
    const nextThreshold = nextLevel.scoreThreshold;
    const progress = (currentScore - currentThreshold) / (nextThreshold - currentThreshold);
    
    return {
      progress: Math.min(Math.max(progress, 0), 1),
      nextThreshold
    };
  }

  // Обновляем рекорд игрока
  updatePlayerRecord(newRecord: number): void {
    this.playerRecord = newRecord;
  }

  // Получаем рекорд игрока
  getPlayerRecord(): number {
    return this.playerRecord;
  }

  // Получаем информацию о текущем уровне для UI
  getLevelInfo(currentScore: number = 0): {
    level: number;
    name: string;
    description: string;
    progress: number;
    nextThreshold: number;
    isRecordBreaker: boolean;
  } {
    const progress = this.getProgressToNextLevel(currentScore);
    return {
      level: this.currentLevel.level,
      name: this.currentLevel.name,
      description: this.currentLevel.description,
      progress: progress.progress,
      nextThreshold: progress.nextThreshold,
      isRecordBreaker: this.isRecordBreakerMode
    };
  }
} 