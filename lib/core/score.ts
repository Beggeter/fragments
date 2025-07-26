import { Block, Matrix } from "../data/types";

// Таблица базовых очков за количество очищенных линий
const LINE_CLEAR_POINTS: { [key: number]: number } = {
  1: 10,
  2: 20,
  3: 60,
  4: 120,
  5: 200
};

interface ScoreResult {
  totalPoints: number;
  clearedLines: number;
  cellsPlaced: number;
  placedBlocksPoints: number;
  clearedLinesPoints: number;
  clearedBlocksPoints: number;
  comboLevel: number;
  comboBonus: number;
  isBoardCleared: boolean;
  movesSinceLastSuccess: number;
}

export class ScoreCalculator {
  private comboCounter: number = 0;
  private lastSuccessfulMove: number = 0;
  private moveCounter: number = 0;
  private isComboOpened: boolean = false;

  private readonly LINE_POINTS = {
    1: 10,
    2: 20,
    3: 60,
    4: 120,
    5: 200
  };

  private readonly BOARD_CLEAR_BONUS = 300;

  resetCombo() {
    this.comboCounter = 0;
    this.lastSuccessfulMove = 0;
    this.moveCounter = 0;
    this.isComboOpened = false;
  }

  private calculateComboBonus(clearedLines: number): number {
    this.moveCounter++;
    
    if (clearedLines > 0) {
      if (!this.isComboOpened) {
        // Открываем комбо, но не увеличиваем счетчик
        this.isComboOpened = true;
        this.lastSuccessfulMove = this.moveCounter;
        return 1;
      } else {
        // Последующие успешные ходы увеличивают комбо
        this.comboCounter += clearedLines;
        this.lastSuccessfulMove = this.moveCounter;
        return this.comboCounter;
      }
    } else if (this.moveCounter - this.lastSuccessfulMove >= 3) {
      // Сбрасываем комбо если прошло 3 хода без успешных
      this.comboCounter = 0;
      this.isComboOpened = false;
      return 1;
    }

    return this.isComboOpened ? this.comboCounter : 1;
  }

  private isFullFigureCleared(block: Block, cellsInLines: number): boolean {
    const totalCells = block.matrix.reduce(
      (sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell.value, 0),
      0
    );
    return cellsInLines === totalCells;
  }

  private getFigureMultiplier(block: Block, cellsInLines: number): number {
    if (!this.isFullFigureCleared(block, cellsInLines)) {
      return 1;
    }

    const [rows, cols] = [block.matrix.length, block.matrix[0].length];
    return (rows === 1 || cols === 1) ? 2 : 5;
  }

  private isBoardCleared(board: Matrix): boolean {
    return board.every(row => row.every(cell => cell.value === 0));
  }

  calculateScore(
    board: Matrix,
    clearedLines: number,
    cellsPlaced: number,
    cellsInLines: number,
    block: Block,
    difficultyModifiers?: { scoreMultiplier: number; comboMultiplier: number }
  ): ScoreResult {
    // Базовые очки за размещенные клетки
    const placedBlocksPoints = cellsPlaced;

    // Очки за очищенные линии
    const clearedLinesPoints = this.LINE_POINTS[clearedLines as keyof typeof this.LINE_POINTS] || 0;

    // Рассчитываем комбо
    const comboBonus = this.calculateComboBonus(clearedLines);

    // Множитель за полную очистку фигуры
    const figureMultiplier = this.getFigureMultiplier(block, cellsInLines);

    // Очки за очищенные блоки
    const clearedBlocksPoints = cellsInLines * figureMultiplier;

    // Проверяем полную очистку поля
    const isBoardCleared = this.isBoardCleared(board);
    const boardClearBonus = isBoardCleared ? this.BOARD_CLEAR_BONUS : 0;

    // Применяем множители сложности
    const scoreMultiplier = difficultyModifiers?.scoreMultiplier || 1.0;
    const comboMultiplier = difficultyModifiers?.comboMultiplier || 1.0;

    // Итоговый подсчет с учетом множителей
    const totalPoints = Math.floor((
      placedBlocksPoints + 
      (clearedLinesPoints * comboBonus * comboMultiplier) + 
      clearedBlocksPoints + 
      boardClearBonus
    ) * scoreMultiplier);

    const movesSinceLastSuccess = this.moveCounter - this.lastSuccessfulMove;

    return {
      totalPoints,
      clearedLines,
      cellsPlaced,
      placedBlocksPoints,
      clearedLinesPoints,
      clearedBlocksPoints,
      comboLevel: this.comboCounter,
      comboBonus: comboBonus * comboMultiplier,
      isBoardCleared,
      movesSinceLastSuccess
    };
  }
} 