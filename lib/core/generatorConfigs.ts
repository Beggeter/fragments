import { GeneratorConfig } from './baseBlockGenerator';

export const CLASSIC_CONFIG: GeneratorConfig = {
  mode: 'classic',
  difficultySteps: 2000,           // Каждые 2000 очков
  baseEasyChance: 0.9,            // Базовый шанс простых фигур
  minEasyChance: 0.1,             // Минимальный шанс простых
  rescueThreshold: 0.85,          // Порог спасения (85%)
  rescueBonus: 0.4,               // Бонус к простым фигурам при спасении
  enableRescueForRecordBreakers: false, // Отключить спасение для рекордсменов
};

export const ZEN_CONFIG: GeneratorConfig = {
  mode: 'zen',
  difficultySteps: 5000,          // Более медленное усложнение
  baseEasyChance: 0.95,           // Всегда много простых фигур
  minEasyChance: 0.8,             // Минимальный шанс простых
  rescueThreshold: 0.9,           // Более высокий порог спасения
  rescueBonus: 0.05,              // Минимальный бонус
  enableRescueForRecordBreakers: true, // Включить спасение для рекордсменов
};

export const LEGACY01_CONFIG: GeneratorConfig = {
  mode: 'legacy01',
  difficultySteps: 2000,
  baseEasyChance: 0.9,
  minEasyChance: 0.1,
  rescueThreshold: 0.85,
  rescueBonus: 0.4,
  enableRescueForRecordBreakers: false,
};

export const LEGACY02_CONFIG: GeneratorConfig = {
  mode: 'legacy02',
  difficultySteps: 2000,
  baseEasyChance: 0.9,
  minEasyChance: 0.1,
  rescueThreshold: 0.85,
  rescueBonus: 0.4,
  enableRescueForRecordBreakers: false,
}; 