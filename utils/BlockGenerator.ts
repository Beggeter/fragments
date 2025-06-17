import { Block, BlockType } from '../types/game';
import { DifficultyEvaluator } from './DifficultyEvaluator';
import { ScoreCalculator } from './ScoreCalculator';

export class BlockGenerator {
  private difficultyEvaluator: DifficultyEvaluator;
  private scoreCalculator: ScoreCalculator;
  private previewBlock: Block | null = null;

  constructor() {
    this.difficultyEvaluator = new DifficultyEvaluator();
    this.scoreCalculator = new ScoreCalculator();
  }

  generateNextBlocks(board: number[][]): Block[] {
    const blocks: Block[] = [];
    const maxAttempts = 100;
    let attempts = 0;

    while (blocks.length < 3 && attempts < maxAttempts) {
      const block = this.generateBlock();
      const evaluation = this.difficultyEvaluator.evaluateBlock(block, board);
      
      // Проверяем, можно ли разместить блок
      const canPlace = this.canPlaceBlock(block, board);
      
      if (canPlace && evaluation.difficulty <= 0.7) {
        blocks.push(block);
      }
      
      attempts++;
    }

    // Если не удалось сгенерировать достаточно блоков, добавляем простые блоки
    while (blocks.length < 3) {
      blocks.push(this.generateSimpleBlock());
    }

    // Генерируем предварительный блок
    this.previewBlock = this.generateBlock();

    return blocks;
  }

  private generateBlock(): Block {
    const types: BlockType[] = ['I', 'L', 'J', 'O', 'S', 'T', 'Z'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      type,
      shape: this.getShapeForType(type),
      color: this.getColorForType(type),
      uniqueId: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private generateSimpleBlock(): Block {
    const simpleTypes: BlockType[] = ['I', 'O'];
    const type = simpleTypes[Math.floor(Math.random() * simpleTypes.length)];
    
    return {
      type,
      shape: this.getShapeForType(type),
      color: this.getColorForType(type),
      uniqueId: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private canPlaceBlock(block: Block, board: number[][]): boolean {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[0].length; x++) {
        if (this.isValidPlacement(block, x, y, board)) {
          return true;
        }
      }
    }
    return false;
  }

  private isValidPlacement(block: Block, x: number, y: number, board: number[][]): boolean {
    for (let row = 0; row < block.shape.length; row++) {
      for (let col = 0; col < block.shape[0].length; col++) {
        if (block.shape[row][col]) {
          const boardX = x + col;
          const boardY = y + row;
          
          if (
            boardX < 0 ||
            boardX >= board[0].length ||
            boardY < 0 ||
            boardY >= board.length ||
            board[boardY][boardX] !== 0
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  getPreviewBlock(): Block | null {
    return this.previewBlock;
  }

  private getShapeForType(type: BlockType): number[][] {
    switch (type) {
      case 'I':
        return [[1, 1, 1, 1]];
      case 'L':
        return [
          [1, 0],
          [1, 0],
          [1, 1],
        ];
      case 'J':
        return [
          [0, 1],
          [0, 1],
          [1, 1],
        ];
      case 'O':
        return [
          [1, 1],
          [1, 1],
        ];
      case 'S':
        return [
          [0, 1, 1],
          [1, 1, 0],
        ];
      case 'T':
        return [
          [1, 1, 1],
          [0, 1, 0],
        ];
      case 'Z':
        return [
          [1, 1, 0],
          [0, 1, 1],
        ];
      default:
        return [[1]];
    }
  }

  private getColorForType(type: BlockType): string {
    switch (type) {
      case 'I':
        return '#00f0f0';
      case 'L':
        return '#f0a000';
      case 'J':
        return '#0000f0';
      case 'O':
        return '#f0f000';
      case 'S':
        return '#00f000';
      case 'T':
        return '#a000f0';
      case 'Z':
        return '#f00000';
      default:
        return '#ffffff';
    }
  }
} 