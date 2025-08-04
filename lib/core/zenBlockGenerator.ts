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
      { id: 'zen_single', uniqueId: 'zen_single', name: 'Zen Single', matrix: [[{ value: 1, color: 'red' }]], color: 'red', difficulty: 'easy' },
      { id: 'zen_horizontal', uniqueId: 'zen_horizontal', name: 'Zen Horizontal', matrix: [[{ value: 1, color: 'blue' }, { value: 1, color: 'blue' }]], color: 'blue', difficulty: 'easy' },
      { id: 'zen_vertical', uniqueId: 'zen_vertical', name: 'Zen Vertical', matrix: [[{ value: 1, color: 'green' }], [{ value: 1, color: 'green' }]], color: 'green', difficulty: 'easy' },
      { id: 'zen_square', uniqueId: 'zen_square', name: 'Zen Square', matrix: [[{ value: 1, color: 'yellow' }, { value: 1, color: 'yellow' }], [{ value: 1, color: 'yellow' }, { value: 1, color: 'yellow' }]], color: 'yellow', difficulty: 'easy' },
      { id: 'zen_l', uniqueId: 'zen_l', name: 'Zen L', matrix: [[{ value: 1, color: 'purple' }, { value: 0, color: 'purple' }], [{ value: 1, color: 'purple' }, { value: 1, color: 'purple' }]], color: 'purple', difficulty: 'easy' },
      { id: 'zen_t', uniqueId: 'zen_t', name: 'Zen T', matrix: [[{ value: 1, color: 'orange' }, { value: 1, color: 'orange' }, { value: 1, color: 'orange' }], [{ value: 0, color: 'orange' }, { value: 1, color: 'orange' }, { value: 0, color: 'orange' }]], color: 'orange', difficulty: 'easy' },
      { id: 'zen_z', uniqueId: 'zen_z', name: 'Zen Z', matrix: [[{ value: 1, color: 'cyan' }, { value: 1, color: 'cyan' }, { value: 0, color: 'cyan' }], [{ value: 0, color: 'cyan' }, { value: 1, color: 'cyan' }, { value: 1, color: 'cyan' }]], color: 'cyan', difficulty: 'easy' },
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
    return this.difficultyManager.updateLevel(score);
  }
} 