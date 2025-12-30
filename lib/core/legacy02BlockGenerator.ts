import { Block, Matrix } from "../data/types";
import { BaseBlockGenerator } from "./baseBlockGenerator";
import { DifficultyModifiers } from "./difficultyManager";
import { LEGACY02_CONFIG } from "./generatorConfigs";

export class Legacy02BlockGenerator extends BaseBlockGenerator {
  constructor(initialScore: number = 0, playerRecord: number = 0) {
    super(LEGACY02_CONFIG, initialScore, playerRecord);
  }

  protected initializeBlockBag(): void {
    // Пока заглушка
    this.blockBag = [];
    this.previewBlock = null;
  }

  public generateNextBlocks(board: Matrix): Block[] {
    // Пока заглушка - возвращаем пустой массив
    return [];
  }

  public getDifficultyModifiers(): DifficultyModifiers {
    return this.difficultyManager.getModifiers();
  }
} 