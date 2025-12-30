import {
  Block,
  Matrix,
  BlockColor,
  BLOCK_COLORS,
  Position,
} from "../data/types";
import { DifficultyEvaluator } from "./difficulty";
import { findAllValidPositions } from "./positions";
import { BlockSetFinder } from "./blockSetFinder";
import { DifficultyManager, DifficultyModifiers } from "./difficultyManager";

export interface GeneratorConfig {
  mode: 'classic' | 'zen' | 'legacy01' | 'legacy02';
  difficultySteps: number;
  baseEasyChance: number;
  minEasyChance: number;
  rescueThreshold: number;
  rescueBonus: number;
  enableRescueForRecordBreakers: boolean;
}

export abstract class BaseBlockGenerator {
  protected readonly evaluator: DifficultyEvaluator;
  protected readonly blockSetFinder: BlockSetFinder;
  protected readonly difficultyManager: DifficultyManager;
  protected lastGeneratedBlocks: Block[] = [];
  protected blockBag: Block[] = [];
  protected previewBlock: Block | null = null;

  constructor(
    protected config: GeneratorConfig,
    initialScore: number = 0,
    playerRecord: number = 0
  ) {
    this.evaluator = new DifficultyEvaluator();
    this.difficultyManager = new DifficultyManager(initialScore, playerRecord);
    this.blockSetFinder = new BlockSetFinder([]);
    this.initializeBlockBag();
  }

  // Абстрактные методы, которые должны реализовать наследники
  abstract generateNextBlocks(board: Matrix): Block[];
  abstract getDifficultyModifiers(): DifficultyModifiers;

  // Общие методы для всех генераторов
  updateDifficulty(score: number): boolean {
    return this.difficultyManager.updateLevel(score);
  }

  getLevelInfo() {
    return this.difficultyManager.getLevelInfo();
  }

  updatePlayerRecord(newRecord: number): void {
    this.difficultyManager.updatePlayerRecord(newRecord);
  }

  isRecordBreakerActive(): boolean {
    return this.difficultyManager.isRecordBreakerActive();
  }

  getPreviewBlock(): Block | null {
    return this.previewBlock;
  }

  // Защищенные методы для наследников
  protected abstract initializeBlockBag(): void;

  protected getRandomColor(): BlockColor {
    const colorWeights: Record<BlockColor, number> = {
      red: 1,
      blue: 1,
      green: 1,
      yellow: 1,
      purple: 1,
      orange: 1,
      pink: 1 / (Number.MAX_SAFE_INTEGER - 1),
      cyan: 1,
    };
    const colors = BLOCK_COLORS;
    const weights = colors.map((color) => colorWeights[color]);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rnd = Math.random() * totalWeight;
    for (let i = 0; i < colors.length; i++) {
      if (rnd < weights[i]) {
        return colors[i];
      }
      rnd -= weights[i];
    }
    return colors[0];
  }

  protected canPlaceBlock(
    board: Matrix,
    block: Block,
    position: Position
  ): boolean {
    const { x, y } = position;
    const matrix = block.matrix;

    if (
      y + matrix.length > board.length ||
      x + matrix[0].length > board[0].length
    ) {
      return false;
    }

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j].value === 1) {
          if (y + i >= board.length || x + j >= board[0].length) {
            return false;
          }
          if (board[y + i][x + j].value === 1) {
            return false;
          }
        }
      }
    }

    return true;
  }

  protected calculateBoardFillRatio(board: Matrix): number {
    const totalCells = board.length * board[0].length;
    const filledCells = board.reduce(
      (sum, row) => sum + row.filter((cell) => cell.value === 1).length,
      0
    );
    return filledCells / totalCells;
  }

  protected findBestBlockPlacement(
    board: Matrix,
    block: Block
  ): { position: Position | null; score: number } {
    const validPositions = findAllValidPositions(board, block);
    let bestScore = -1;
    let bestPosition = null;

    for (const position of validPositions) {
      const score = this.evaluateBlockPlacement(board, block, position);
      if (score > bestScore) {
        bestScore = score;
        bestPosition = position;
      }
    }

    return { position: bestPosition, score: bestScore };
  }

  protected evaluateBlockPlacement(
    board: Matrix,
    block: Block,
    position: Position
  ): number {
    let score = 0;
    const tempBoard = board.map((row) => [...row]);

    block.matrix.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.value === 1) {
          tempBoard[position.y + y][position.x + x] = {
            value: 1,
            color: block.color,
          };
        }
      });
    });

    const linesToClear = this.countLinesToClear(tempBoard);
    score += linesToClear * 100;

    return score;
  }

  protected countLinesToClear(board: Matrix): number {
    let count = 0;

    for (let y = 0; y < board.length; y++) {
      if (board[y].every((cell) => cell.value === 1)) count++;
    }

    for (let x = 0; x < board[0].length; x++) {
      if (board.every((row) => row[x].value === 1)) count++;
    }

    return count;
  }

  protected canPlaceAllBlocks(board: Matrix, blocks: Block[]): boolean {
    const permutations = this.getPermutations(blocks);

    for (const permutation of permutations) {
      let tempBoard = board.map((row) => [...row]);
      let canPlaceAll = true;

      for (const block of permutation) {
        const { position } = this.findBestBlockPlacement(tempBoard, block);
        if (!position) {
          canPlaceAll = false;
          break;
        }

        block.matrix.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell.value === 1) {
              tempBoard[position.y + y][position.x + x] = {
                value: 1,
                color: block.color,
              };
            }
          });
        });
      }

      if (canPlaceAll) return true;
    }

    return false;
  }

  protected getPermutations<T>(arr: T[]): T[][] {
    if (arr.length <= 1) return [arr];

    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const remainingPerms = this.getPermutations(remaining);

      for (const perm of remainingPerms) {
        result.push([current, ...perm]);
      }
    }

    return result;
  }
} 