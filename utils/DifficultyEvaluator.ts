import { Block } from '../types/game';

export class DifficultyEvaluator {
  evaluateBlock(block: Block, board: number[][]): {
    difficulty: number;
    scorePotential: number;
  } {
    const placementOptions = this.findValidPlacements(block, board);
    
    if (placementOptions.length === 0) {
      return {
        difficulty: 1,
        scorePotential: 0,
      };
    }

    const difficulties = placementOptions.map(option => 
      this.calculatePlacementDifficulty(option, board)
    );

    const minDifficulty = Math.min(...difficulties);
    const maxScorePotential = Math.max(...placementOptions.map(option =>
      this.calculateScorePotential(option, board)
    ));

    return {
      difficulty: minDifficulty,
      scorePotential: maxScorePotential,
    };
  }

  private findValidPlacements(block: Block, board: number[][]): Array<{
    x: number;
    y: number;
    rotation: number;
  }> {
    const placements: Array<{
      x: number;
      y: number;
      rotation: number;
    }> = [];

    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[0].length; x++) {
        for (let rotation = 0; rotation < 4; rotation++) {
          if (this.isValidPlacement(block, x, y, rotation, board)) {
            placements.push({ x, y, rotation });
          }
        }
      }
    }

    return placements;
  }

  private calculatePlacementDifficulty(
    placement: { x: number; y: number; rotation: number },
    board: number[][]
  ): number {
    const { x, y, rotation } = placement;
    let difficulty = 0;

    // Штраф за размещение в верхней части доски
    difficulty += y / board.length * 0.3;

    // Штраф за размещение рядом с другими блоками
    const adjacentBlocks = this.countAdjacentBlocks(x, y, board);
    difficulty += adjacentBlocks * 0.1;

    // Штраф за создание "дыр"
    const holesCreated = this.countHolesCreated(x, y, board);
    difficulty += holesCreated * 0.2;

    return Math.min(difficulty, 1);
  }

  private calculateScorePotential(
    placement: { x: number; y: number; rotation: number },
    board: number[][]
  ): number {
    const { x, y } = placement;
    let potential = 0;

    // Бонус за возможность очистки линий
    const linesCleared = this.countPotentialLinesCleared(x, y, board);
    potential += linesCleared * 100;

    // Бонус за создание комбо
    const comboPotential = this.calculateComboPotential(x, y, board);
    potential += comboPotential * 50;

    return potential;
  }

  private isValidPlacement(
    block: Block,
    x: number,
    y: number,
    rotation: number,
    board: number[][]
  ): boolean {
    const rotatedShape = this.rotateShape(block.shape, rotation);

    for (let row = 0; row < rotatedShape.length; row++) {
      for (let col = 0; col < rotatedShape[0].length; col++) {
        if (rotatedShape[row][col]) {
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

  private rotateShape(shape: number[][], rotation: number): number[][] {
    let rotated = shape;
    for (let i = 0; i < rotation; i++) {
      rotated = this.rotate90Degrees(rotated);
    }
    return rotated;
  }

  private rotate90Degrees(shape: number[][]): number[][] {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: number[][] = Array(cols)
      .fill(0)
      .map(() => Array(rows).fill(0));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        rotated[col][rows - 1 - row] = shape[row][col];
      }
    }

    return rotated;
  }

  private countAdjacentBlocks(x: number, y: number, board: number[][]): number {
    let count = 0;
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (
        newX >= 0 &&
        newX < board[0].length &&
        newY >= 0 &&
        newY < board.length &&
        board[newY][newX] !== 0
      ) {
        count++;
      }
    }

    return count;
  }

  private countHolesCreated(x: number, y: number, board: number[][]): number {
    let holes = 0;
    const visited = new Set<string>();

    const dfs = (x: number, y: number) => {
      const key = `${x},${y}`;
      if (visited.has(key)) return;
      visited.add(key);

      if (
        x < 0 ||
        x >= board[0].length ||
        y < 0 ||
        y >= board.length ||
        board[y][x] !== 0
      ) {
        return;
      }

      // Проверяем, есть ли блок сверху
      if (y > 0 && board[y - 1][x] !== 0) {
        holes++;
      }

      dfs(x + 1, y);
      dfs(x - 1, y);
      dfs(x, y + 1);
      dfs(x, y - 1);
    };

    dfs(x, y);
    return holes;
  }

  private countPotentialLinesCleared(
    x: number,
    y: number,
    board: number[][]
  ): number {
    let lines = 0;

    // Проверяем горизонтальные линии
    for (let row = 0; row < board.length; row++) {
      let isLineComplete = true;
      for (let col = 0; col < board[0].length; col++) {
        if (board[row][col] === 0) {
          isLineComplete = false;
          break;
        }
      }
      if (isLineComplete) lines++;
    }

    // Проверяем вертикальные линии
    for (let col = 0; col < board[0].length; col++) {
      let isLineComplete = true;
      for (let row = 0; row < board.length; row++) {
        if (board[row][col] === 0) {
          isLineComplete = false;
          break;
        }
      }
      if (isLineComplete) lines++;
    }

    return lines;
  }

  private calculateComboPotential(
    x: number,
    y: number,
    board: number[][]
  ): number {
    let comboPotential = 0;
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (
        newX >= 0 &&
        newX < board[0].length &&
        newY >= 0 &&
        newY < board.length &&
        board[newY][newX] !== 0
      ) {
        comboPotential++;
      }
    }

    return comboPotential;
  }
} 