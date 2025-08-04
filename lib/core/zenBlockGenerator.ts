import { Block, Matrix } from "../data/types";
import { BaseBlockGenerator } from "./baseBlockGenerator";
import { DifficultyModifiers } from "./difficultyManager";
import { ZEN_CONFIG } from "./generatorConfigs";

export class ZenBlockGenerator extends BaseBlockGenerator {
  constructor(initialScore: number = 0, playerRecord: number = 0) {
    super(ZEN_CONFIG, initialScore, playerRecord);
  }

  protected initializeBlockBag(): void {
    // В Zen режиме используем только простые фигуры для более легкой игры
    this.blockBag = [
      // Простые фигуры 1x1, 1x2, 2x1
      { id: 'zen_single', matrix: [[1]], color: 'red' },
      { id: 'zen_horizontal', matrix: [[1, 1]], color: 'blue' },
      { id: 'zen_vertical', matrix: [[1], [1]], color: 'green' },
      { id: 'zen_square', matrix: [[1, 1], [1, 1]], color: 'yellow' },
      { id: 'zen_l', matrix: [[1, 0], [1, 1]], color: 'purple' },
      { id: 'zen_t', matrix: [[1, 1, 1], [0, 1, 0]], color: 'orange' },
      { id: 'zen_z', matrix: [[1, 1, 0], [0, 1, 1]], color: 'cyan' },
    ];
    this.previewBlock = null;
  }

  public generateNextBlocks(board: Matrix): Block[] {
    const blocks: Block[] = [];
    
    // В Zen режиме генерируем только 2 фигуры вместо 3 для упрощения
    for (let i = 0; i < 2; i++) {
      const block = this.getRandomBlock();
      if (block) {
        blocks.push({
          ...block,
          uniqueId: `${block.id}_${Date.now()}_${Math.random()}`,
        });
      }
    }
    
    return blocks;
  }

  private getRandomBlock(): Block | null {
    if (this.blockBag.length === 0) {
      this.initializeBlockBag();
    }
    
    // В Zen режиме всегда выбираем простые фигуры
    const simpleBlocks = this.blockBag.filter(block => {
      const size = block.matrix.length * block.matrix[0].length;
      return size <= 4; // Только фигуры размером 4 клетки и меньше
    });
    
    if (simpleBlocks.length === 0) {
      return this.blockBag[Math.floor(Math.random() * this.blockBag.length)];
    }
    
    return simpleBlocks[Math.floor(Math.random() * simpleBlocks.length)];
  }

  public getPreviewBlock(): Block | null {
    if (!this.previewBlock) {
      this.previewBlock = this.getRandomBlock();
    }
    return this.previewBlock;
  }

  public getDifficultyModifiers(): DifficultyModifiers {
    return this.difficultyManager.getModifiers();
  }

  // В Zen режиме сложность растет очень медленно
  public updateDifficulty(score: number): boolean {
    // Zen режим остается простым на протяжении всей игры
    return this.difficultyManager.updateDifficulty(score);
  }
} 