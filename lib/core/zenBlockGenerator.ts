import { Block, Matrix } from "../data/types";
import { BaseBlockGenerator } from "./baseBlockGenerator";
import { DifficultyModifiers } from "./difficultyManager";
import { ZEN_CONFIG } from "./generatorConfigs";

export class ZenBlockGenerator extends BaseBlockGenerator {
  constructor(initialScore: number = 0, playerRecord: number = 0) {
    super(ZEN_CONFIG, initialScore, playerRecord);
  }

  protected initializeBlockBag(): void {
    // Пока заглушка - используем простые фигуры
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