export class ScoreCalculator {
  calculateScore(
    linesCleared: number,
    combo: number,
    board: number[][]
  ): {
    score: number;
    combo: number;
    linesCleared: number;
  } {
    // Базовые очки за очистку линий
    let score = 0;
    const basePoints = 100;

    // Множитель за количество линий
    const lineMultiplier = Math.pow(2, linesCleared - 1);
    score += basePoints * lineMultiplier;

    // Бонус за комбо
    if (combo > 1) {
      score += combo * 50;
    }

    // Бонус за заполнение доски
    const boardFillPercentage = this.calculateBoardFillPercentage(board);
    if (boardFillPercentage > 0.8) {
      score += Math.floor(score * 0.2); // 20% бонус
    }

    return {
      score,
      combo: linesCleared > 0 ? combo + 1 : 0,
      linesCleared,
    };
  }

  private calculateBoardFillPercentage(board: number[][]): number {
    let filledCells = 0;
    let totalCells = 0;

    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[0].length; col++) {
        totalCells++;
        if (board[row][col] !== 0) {
          filledCells++;
        }
      }
    }

    return filledCells / totalCells;
  }

  calculatePotentialScore(
    board: number[][],
    x: number,
    y: number,
    block: number[][]
  ): number {
    // Создаем копию доски для симуляции
    const simulatedBoard = board.map(row => [...row]);

    // Размещаем блок на доске
    for (let row = 0; row < block.length; row++) {
      for (let col = 0; col < block[0].length; col++) {
        if (block[row][col]) {
          const boardX = x + col;
          const boardY = y + row;
          if (
            boardX >= 0 &&
            boardX < board[0].length &&
            boardY >= 0 &&
            boardY < board.length
          ) {
            simulatedBoard[boardY][boardX] = 1;
          }
        }
      }
    }

    // Подсчитываем потенциальные линии
    const linesCleared = this.countLinesToClear(simulatedBoard);
    const combo = 1; // Начальное значение комбо

    // Рассчитываем потенциальный счет
    const { score } = this.calculateScore(linesCleared, combo, simulatedBoard);

    return score;
  }

  private countLinesToClear(board: number[][]): number {
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
} 