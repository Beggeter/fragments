import { GeneratorConfig } from './baseBlockGenerator';

export const CLASSIC_CONFIG: GeneratorConfig = {
  mode: 'classic',
  difficultySteps: 1000,           // Очень быстрое усложнение
  baseEasyChance: 0.4,            // Очень мало простых фигур
  minEasyChance: 0.02,            // Минимальный шанс простых
  rescueThreshold: 0.95,          // Спасение только в крайних случаях
  rescueBonus: 0.1,               // Минимальный бонус
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