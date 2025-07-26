import { Block, Matrix, Position } from "../data/types";

interface ScoreResult {
    clearedLines: number;
    cellsPlaced: number;
    placedBlocksPoints: number;
    clearedLinesPoints: number;
    clearedBlocksPoints: number;
    comboLevel: number;
    comboBonus: number;
    isBoardCleared: boolean;
    totalPoints: number;
}

export class ScoreCalculator {
    private readonly BASE_POINTS_PER_CELL = 10;
    private readonly BASE_POINTS_PER_LINE = 100;
    private readonly COMBO_MULTIPLIER = 1.5;
    private readonly BOARD_CLEAR_BONUS = 300;
    private comboLevel: number = 0;

    getComboLevel(): number {
        return this.comboLevel;
    }

    resetCombo(): void {
        this.comboLevel = 0;
    }

    calculateScore(
        board: Matrix,
        clearedLines: number,
        cellsPlaced: number,
        cellsInLines: number,
        placedBlock: Block
    ): ScoreResult {
        // Базовые очки за размещение
        const placedBlocksPoints = cellsPlaced * this.BASE_POINTS_PER_CELL;

        // Очки за очистку линий
        const clearedLinesPoints = clearedLines * this.BASE_POINTS_PER_LINE;

        // Очки за очистку блоков
        const clearedBlocksPoints = cellsInLines * this.BASE_POINTS_PER_CELL;

        // Расчет комбо
        this.comboLevel = clearedLines > 0 ? this.comboLevel + 1 : 0;
        const comboBonus = this.comboLevel > 1 ? Math.pow(this.COMBO_MULTIPLIER, this.comboLevel - 1) : 1;

        // Общий подсчет очков
        let totalPoints = placedBlocksPoints + clearedLinesPoints + clearedBlocksPoints;
        totalPoints = Math.round(totalPoints * comboBonus);
        
        const isBoardCleared = this.isBoardCleared(board);
        if (isBoardCleared) {
            totalPoints += this.BOARD_CLEAR_BONUS;
        }

        return {
            clearedLines,
            cellsPlaced,
            placedBlocksPoints,
            clearedLinesPoints,
            clearedBlocksPoints,
            comboLevel: this.comboLevel,
            comboBonus,
            isBoardCleared,
            totalPoints
        };
    }

    private isBoardCleared(board: Matrix): boolean {
        return board.every(row => row.every(cell => cell.value === 1));
    }
} 