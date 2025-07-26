import { Block, Matrix, Position } from "../data/types";
import { findAllValidPositions } from "./positions";

interface BlockEvaluation {
    difficulty: number;      // 0-100, где 100 - максимальная сложность
    scorePotential: number;  // Оценка потенциальных очков
    placementOptions: number; // Количество возможных размещений
}

export class DifficultyEvaluator {
    // Веса для оценки сложности
    private readonly DIFFICULTY_WEIGHTS = {
        size: 0.3,           // Размер фигуры
        shape: 0.2,          // Форма фигуры (линейная/квадратная/сложная)
        placements: 0.3,     // Количество возможных размещений
        clearPotential: 0.2  // Потенциал очистки линий
    };

    // Веса для оценки потенциальных очков
    private readonly SCORE_WEIGHTS = {
        clearPotential: 0.4, // Потенциал очистки линий
        comboPotential: 0.3, // Потенциал комбо
        placementOptions: 0.3 // Количество возможных размещений
    };

    evaluateBlock(block: Block, board: Matrix): BlockEvaluation {
        const placements = findAllValidPositions(board, block);
        const placementOptions = placements.length;

        // Оценка сложности
        const sizeScore = this.evaluateSize(block);
        const shapeScore = this.evaluateShape(block);
        const placementsScore = this.evaluatePlacements(placementOptions);
        const clearPotentialScore = this.evaluateClearPotential(block, board);

        const difficulty = 
            sizeScore * this.DIFFICULTY_WEIGHTS.size +
            shapeScore * this.DIFFICULTY_WEIGHTS.shape +
            placementsScore * this.DIFFICULTY_WEIGHTS.placements +
            clearPotentialScore * this.DIFFICULTY_WEIGHTS.clearPotential;

        // Оценка потенциальных очков
        const scorePotential = this.evaluateScorePotential(
            block,
            board,
            placements,
            clearPotentialScore
        );

        return {
            difficulty,
            scorePotential,
            placementOptions
        };
    }

    private evaluateSize(block: Block): number {
        // Проверяем, что матрица существует и имеет правильную форму
        if (!block.matrix || !block.matrix.length || !block.matrix[0] || !block.matrix[0].length) {
            console.warn('Invalid block matrix in evaluateSize:', block);
            return 0;
        }

        const totalCells = block.matrix.reduce(
            (sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell.value, 0),
            0
        );
        // Нормализуем размер от 0 до 1 (максимум 5 клеток)
        return Math.min(totalCells / 5, 1);
    }

    private evaluateShape(block: Block): number {
        // Проверяем, что матрица существует и имеет правильную форму
        if (!block.matrix || !block.matrix.length || !block.matrix[0] || !block.matrix[0].length) {
            console.warn('Invalid block matrix in evaluateShape:', block);
            return 0;
        }

        const [rows, cols] = [block.matrix.length, block.matrix[0].length];
        
        // Линейные фигуры (1xN или Nx1)
        if (rows === 1 || cols === 1) return 0.3;
        
        // Квадратные фигуры
        if (rows === cols) return 0.6;
        
        // Сложные фигуры (L, T, S и т.д.)
        return 1.0;
    }

    private evaluatePlacements(placementOptions: number): number {
        // Нормализуем количество размещений (максимум 20 вариантов)
        return Math.min(placementOptions / 20, 1);
    }

    private evaluateClearPotential(block: Block, board: Matrix): number {
        // Проверяем, что матрица существует и имеет правильную форму
        if (!block.matrix || !block.matrix.length || !block.matrix[0] || !block.matrix[0].length) {
            console.warn('Invalid block matrix in evaluateClearPotential:', block);
            return 0;
        }

        let potential = 0;
        const [rows, cols] = [board.length, board[0].length];

        // Проверяем потенциал очистки строк
        for (let y = 0; y < rows; y++) {
            const rowCells = board[y].filter(cell => cell.value === 1).length;
            if (rowCells + block.matrix[0].length === cols) {
                potential += 0.5;
            }
        }

        // Проверяем потенциал очистки столбцов
        for (let x = 0; x < cols; x++) {
            const colCells = board.filter(row => row[x].value === 1).length;
            if (colCells + block.matrix.length === rows) {
                potential += 0.5;
            }
        }

        return Math.min(potential, 1);
    }

    private evaluateScorePotential(
        block: Block,
        board: Matrix,
        placements: Position[],
        clearPotential: number
    ): number {
        // Оцениваем потенциал комбо
        const comboPotential = this.evaluateComboPotential(block, board, placements);

        // Оцениваем количество вариантов размещения
        const placementScore = Math.min(placements.length / 20, 1);

        return (
            clearPotential * this.SCORE_WEIGHTS.clearPotential +
            comboPotential * this.SCORE_WEIGHTS.comboPotential +
            placementScore * this.SCORE_WEIGHTS.placementOptions
        ) * 100; // Нормализуем до 100 очков
    }

    private evaluateComboPotential(
        block: Block,
        board: Matrix,
        placements: Position[]
    ): number {
        // Проверяем, что матрица существует и имеет правильную форму
        if (!block.matrix || !block.matrix.length || !block.matrix[0] || !block.matrix[0].length) {
            console.warn('Invalid block matrix in evaluateComboPotential:', block);
            return 0;
        }

        let maxComboPotential = 0;

        for (const pos of placements) {
            let comboPotential = 0;
            const { matrix } = block;
            const { x, y } = pos;

            // Проверяем потенциал очистки строк
            for (let i = 0; i < matrix.length; i++) {
                const rowCells = board[y + i].filter(cell => cell.value === 1).length;
                const blockCells = matrix[i].filter(cell => cell.value === 1).length;
                if (rowCells + blockCells === board[0].length) {
                    comboPotential += 0.5;
                }
            }

            // Проверяем потенциал очистки столбцов
            for (let j = 0; j < matrix[0].length; j++) {
                const colCells = board.filter(row => row[x + j].value === 1).length;
                const blockCells = matrix.filter(row => row[j].value === 1).length;
                if (colCells + blockCells === board.length) {
                    comboPotential += 0.5;
                }
            }

            maxComboPotential = Math.max(maxComboPotential, comboPotential);
        }

        return Math.min(maxComboPotential, 1);
    }
} 