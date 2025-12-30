import { Block, Matrix } from "../data/types";
import { BaseBlockGenerator } from "./baseBlockGenerator";
import { DifficultyModifiers } from "./difficultyManager";
import { LEGACY01_CONFIG } from "./generatorConfigs";

export class Legacy01BlockGenerator extends BaseBlockGenerator {
  constructor(initialScore: number = 0, playerRecord: number = 0) {
    super(LEGACY01_CONFIG, initialScore, playerRecord);
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