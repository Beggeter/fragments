import {
  Block,
  Matrix,
  BlockColor,
  BLOCK_COLORS,
  Position,
  Cell,
} from "../data/types";
import { DifficultyEvaluator } from "./difficulty";
import { findAllValidPositions } from "./positions";
import { BlockSetFinder } from "./blockSetFinder";

// Все возможные варианты фигур
const ALL_BLOCKS: Matrix[] = [
  // Горизонтальные линии (2-5)
  [[{ value: 1 }, { value: 1 }]],
  [[{ value: 1 }, { value: 1 }, { value: 1 }]],
  [[{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }]],
  [[{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }]],

  // Вертикальные линии (2-5)
  [[{ value: 1 }], [{ value: 1 }]],
  [[{ value: 1 }], [{ value: 1 }], [{ value: 1 }]],
  [[{ value: 1 }], [{ value: 1 }], [{ value: 1 }], [{ value: 1 }]],
  [
    [{ value: 1 }],
    [{ value: 1 }],
    [{ value: 1 }],
    [{ value: 1 }],
    [{ value: 1 }],
  ],

  // Квадраты (не требуют поворотов)
  [
    [{ value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 1 }, { value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }, { value: 1 }],
  ],

  // Угловые фигуры (2x2) - 4 варианта
  [
    [{ value: 1 }, { value: 0 }],
    [{ value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 0 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 0 }],
  ],
  [
    [{ value: 1 }, { value: 1 }],
    [{ value: 0 }, { value: 1 }],
  ],

  // Угловые фигуры (3x3) - 4 варианта
  [
    [{ value: 1 }, { value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 0 }, { value: 0 }],
    [{ value: 1 }, { value: 0 }, { value: 0 }],
  ],
  [
    [{ value: 1 }, { value: 1 }, { value: 1 }],
    [{ value: 0 }, { value: 0 }, { value: 1 }],
    [{ value: 0 }, { value: 0 }, { value: 1 }],
  ],
  [
    [{ value: 1 }, { value: 0 }, { value: 0 }],
    [{ value: 1 }, { value: 0 }, { value: 0 }],
    [{ value: 1 }, { value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 0 }, { value: 0 }, { value: 1 }],
    [{ value: 0 }, { value: 0 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }, { value: 1 }],
  ],

  // L-образные фигуры - 4 варианта
  [
    [{ value: 1 }, { value: 0 }],
    [{ value: 1 }, { value: 0 }],
    [{ value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 0 }, { value: 1 }],
    [{ value: 0 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 0 }],
    [{ value: 1 }, { value: 0 }],
  ],
  [
    [{ value: 1 }, { value: 1 }],
    [{ value: 0 }, { value: 1 }],
    [{ value: 0 }, { value: 1 }],
  ],

  // Прямоугольники (2x3) - 2 варианта
  [
    [{ value: 1 }, { value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }],
  ],

  // T-образные фигуры - 4 варианта
  [
    [{ value: 1 }, { value: 1 }, { value: 1 }],
    [{ value: 0 }, { value: 1 }, { value: 0 }],
  ],
  [
    [{ value: 0 }, { value: 1 }, { value: 0 }],
    [{ value: 1 }, { value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 1 }, { value: 0 }],
    [{ value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 0 }],
  ],
  [
    [{ value: 0 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }],
    [{ value: 0 }, { value: 1 }],
  ],

  // S-образные фигуры - 4 варианта
  [
    [{ value: 0 }, { value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }, { value: 0 }],
  ],
  [
    [{ value: 1 }, { value: 1 }, { value: 0 }],
    [{ value: 0 }, { value: 1 }, { value: 1 }],
  ],
  [
    [{ value: 1 }, { value: 0 }],
    [{ value: 1 }, { value: 1 }],
    [{ value: 0 }, { value: 1 }],
  ],
  [
    [{ value: 0 }, { value: 1 }],
    [{ value: 1 }, { value: 1 }],
    [{ value: 1 }, { value: 0 }],
  ],

  // Диагональные фигуры (3 клетки) - 4 варианта
  [
    [{ value: 0 }, { value: 0 }, { value: 1 }],
    [{ value: 0 }, { value: 1 }, { value: 0 }],
    [{ value: 1 }, { value: 0 }, { value: 0 }],
  ],
  [
    [{ value: 1 }, { value: 0 }, { value: 0 }],
    [{ value: 0 }, { value: 1 }, { value: 0 }],
    [{ value: 0 }, { value: 0 }, { value: 1 }],
  ],

  // Диагональные фигуры (2 клетки) - 2 варианта
  [
    [{ value: 0 }, { value: 1 }],
    [{ value: 1 }, { value: 0 }],
  ],
];

// Проверяем все матрицы на правильность формы
ALL_BLOCKS.forEach((matrix, index) => {
  if (!matrix || !matrix.length || !matrix[0] || !matrix[0].length) {
    console.error(`Invalid matrix at index ${index}:`, matrix);
  }
});

// Группируем фигуры по сложности
const BLOCKS_BY_DIFFICULTY = {
  easy: [0, 1, 2, 24, 25], // I, O (2x2), 2x3, 3x3
  medium: [
    3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  ], // T, L, J, S, Z
  hard: [
    26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
  ], // остальные
};

export class BlockGenerator {
  private readonly evaluator: DifficultyEvaluator;
  private readonly blockSetFinder: BlockSetFinder;
  private lastGeneratedBlocks: Block[] = [];
  private blockBag: Block[] = [];
  private previewBlock: Block | null = null;

  // Новые константы для улучшенной логики
  private readonly minLinesToClear = 2;
  private readonly comboMaintenanceThreshold = 0.7; // 70% заполненности поля
  private readonly blockTypeWeights: Record<string, number> = {
    line: 1.5, // Линии (горизонтальные и вертикальные)
    square: 1.3, // Квадраты
    corner: 1.2, // Угловые фигуры
    other: 1.0, // Остальные фигуры
  };

  constructor() {
    this.evaluator = new DifficultyEvaluator();
    this.blockSetFinder = new BlockSetFinder(
      ALL_BLOCKS.map((matrix, index) => ({
        id: `block-${index}`,
        uniqueId: `block-${index}_${Date.now()}`,
        name: `Block ${index + 1}`,
        matrix,
        difficulty: this.getDifficultyForIndex(index),
        color: this.getRandomColor(),
      }))
    );
    this.fillBlockBag();
  }

  private getDifficultyForIndex(index: number): "easy" | "medium" | "hard" {
    if (BLOCKS_BY_DIFFICULTY.easy.includes(index)) return "easy";
    if (BLOCKS_BY_DIFFICULTY.medium.includes(index)) return "medium";
    return "hard";
  }

  private getBaseFigureType(block: Block): string {
    const rows = block.matrix.length;
    const cols = block.matrix[0].length;
    const size = this.calculateBlockSize(block);

    // Определяем базовый тип фигуры
    if (size === 4) {
      if (rows === 2 && cols === 2) return "square";
      if (rows === 1 || cols === 1) return "line";
    }
    if (size === 3) {
      // Проверяем L-образные фигуры
      if (this.isLShape(block)) return "L";
      // Проверяем T-образные фигуры
      if (this.isTShape(block)) return "T";
      // Проверяем S/Z-образные фигуры
      if (this.isSShape(block)) return "S";
    }
    return "other";
  }

  private isLShape(block: Block): boolean {
    const matrix = block.matrix;
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Проверяем все возможные L-образные формы
    const patterns = [
      [
        [1, 0],
        [1, 0],
        [1, 1],
      ], // L
      [
        [0, 1],
        [0, 1],
        [1, 1],
      ], // L отраженная
      [
        [1, 1],
        [1, 0],
        [1, 0],
      ], // L перевернутая
      [
        [1, 1],
        [0, 1],
        [0, 1],
      ], // L перевернутая отраженная
    ];

    return patterns.some((pattern) => {
      if (pattern.length !== rows || pattern[0].length !== cols) return false;
      return pattern.every((row, y) =>
        row.every((val, x) => matrix[y][x].value === val)
      );
    });
  }

  private isTShape(block: Block): boolean {
    const matrix = block.matrix;
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Проверяем все возможные T-образные формы
    const patterns = [
      [
        [1, 1, 1],
        [0, 1, 0],
      ], // T
      [
        [0, 1, 0],
        [1, 1, 1],
      ], // T перевернутая
      [
        [1, 0],
        [1, 1],
        [1, 0],
      ], // T повернутая
      [
        [0, 1],
        [1, 1],
        [0, 1],
      ], // T повернутая отраженная
    ];

    return patterns.some((pattern) => {
      if (pattern.length !== rows || pattern[0].length !== cols) return false;
      return pattern.every((row, y) =>
        row.every((val, x) => matrix[y][x].value === val)
      );
    });
  }

  private isSShape(block: Block): boolean {
    const matrix = block.matrix;
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Проверяем все возможные S-образные формы
    const patterns = [
      [
        [0, 1, 1],
        [1, 1, 0],
      ], // S
      [
        [1, 1, 0],
        [0, 1, 1],
      ], // S отраженная
      [
        [1, 0],
        [1, 1],
        [0, 1],
      ], // S повернутая
      [
        [0, 1],
        [1, 1],
        [1, 0],
      ], // S повернутая отраженная
    ];

    return patterns.some((pattern) => {
      if (pattern.length !== rows || pattern[0].length !== cols) return false;
      return pattern.every((row, y) =>
        row.every((val, x) => matrix[y][x].value === val)
      );
    });
  }

  private areMatricesSimilar(matrix1: Matrix, matrix2: Matrix): boolean {
    if (
      matrix1.length !== matrix2.length ||
      matrix1[0].length !== matrix2[0].length
    ) {
      return false;
    }

    return matrix1.every((row, y) =>
      row.every((cell, x) => cell.value === matrix2[y][x].value)
    );
  }

  private calculateBlockSize(block: Block): number {
    return block.matrix.reduce(
      (sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell.value, 0),
      0
    );
  }

  private getRandomColor(): BlockColor {
    // Вес для каждого цвета: pink — абсурдно маленький, остальные — одинаковые
    const colorWeights: Record<BlockColor, number> = {
      red: 1,
      blue: 1,
      green: 1,
      yellow: 1,
      purple: 1,
      orange: 1,
      pink: 1 / (Number.MAX_SAFE_INTEGER - 1), // абсурдно маленький шанс
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
    // fallback (не должен сработать)
    return colors[0];
  }

  private fillBlockBag() {
    this.blockBag = ALL_BLOCKS.map((matrix, index) => ({
      id: `block-${index}`,
      uniqueId: `block-${index}_${Date.now()}`,
      name: `Block ${index + 1}`,
      matrix,
      difficulty: this.getDifficultyForIndex(index),
      color: this.getRandomColor(),
    }));

    // Перемешиваем мешок
    for (let i = this.blockBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.blockBag[i], this.blockBag[j]] = [
        this.blockBag[j],
        this.blockBag[i],
      ];
    }

    // Устанавливаем preview блок
    this.previewBlock = this.blockBag[0];
  }

  private findComboOpportunities(
    board: Matrix
  ): { positions: Position[]; score: number }[] {
    const opportunities: { positions: Position[]; score: number }[] = [];
    const rows = board.length;
    const cols = board[0].length;

    // Проверяем каждую позицию на доске
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Пропускаем занятые клетки
        if (board[y][x].value === 1) continue;

        // Проверяем все возможные фигуры
        for (const block of this.blockBag) {
          const positions = findAllValidPositions(board, block);

          for (const pos of positions) {
            // Проверяем, сколько линий может быть очищено
            const linesToClear = this.countLinesToClear(board);
            if (linesToClear >= this.minLinesToClear) {
              opportunities.push({
                positions: [pos],
                score: linesToClear,
              });
            }
          }
        }
      }
    }

    // Сортируем возможности по количеству потенциальных линий
    return opportunities.sort((a, b) => b.score - a.score);
  }

  private countLinesToClear(board: Matrix): number {
    let count = 0;

    // Проверяем строки
    for (let y = 0; y < board.length; y++) {
      if (board[y].every((cell) => cell.value === 1)) count++;
    }

    // Проверяем столбцы
    for (let x = 0; x < board[0].length; x++) {
      if (board.every((row) => row[x].value === 1)) count++;
    }

    return count;
  }

  private findComplementaryBlocks(
    board: Matrix,
    firstBlock: Block,
    firstPosition: Position
  ): Block[] {
    const complementaryBlocks: Block[] = [];
    const rows = board.length;
    const cols = board[0].length;

    // Создаем временную доску с размещенной первой фигурой
    const tempBoard = board.map((row) => [...row]);
    firstBlock.matrix.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell.value === 1) {
          tempBoard[firstPosition.y + dy][firstPosition.x + dx] = {
            value: 1,
            color: firstBlock.color,
          };
        }
      });
    });

    // Ищем фигуры, которые могут создать комбо с первой
    for (const block of this.blockBag) {
      if (block.id === firstBlock.id) continue;

      const positions = findAllValidPositions(tempBoard, block);
      for (const pos of positions) {
        const linesToClear = this.countLinesToClear(tempBoard);
        if (linesToClear >= this.minLinesToClear) {
          complementaryBlocks.push(block);
          break;
        }
      }
    }

    return complementaryBlocks;
  }

  private getBlockType(block: Block): string {
    const rows = block.matrix.length;
    const cols = block.matrix[0].length;

    // Проверяем, является ли фигура линией
    if (rows === 1 || cols === 1) return "line";

    // Проверяем, является ли фигура квадратом
    if (rows === cols && rows <= 3) return "square";

    // Проверяем, является ли фигура угловой
    if (this.isCornerShape(block)) return "corner";

    return "other";
  }

  private isCornerShape(block: Block): boolean {
    const rows = block.matrix.length;
    const cols = block.matrix[0].length;

    if (rows < 2 || cols < 2) return false;

    // Проверяем различные варианты угловых фигур
    const patterns = [
      // 2x2 углы
      [
        [1, 0],
        [1, 1],
      ],
      [
        [0, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 0],
      ],
      [
        [1, 1],
        [0, 1],
      ],

      // 3x3 углы
      [
        [1, 1, 1],
        [1, 0, 0],
        [1, 0, 0],
      ],
      [
        [1, 1, 1],
        [0, 0, 1],
        [0, 0, 1],
      ],
      [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ],
      [
        [0, 0, 1],
        [0, 0, 1],
        [1, 1, 1],
      ],
    ];

    return patterns.some((pattern) => {
      if (pattern.length !== rows || pattern[0].length !== cols) return false;
      return pattern.every((row, y) =>
        row.every((val, x) => block.matrix[y][x].value === val)
      );
    });
  }

  private isDiagonalShape(block: Block): boolean {
    const matrix = block.matrix;
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Проверяем все возможные диагональные формы
    const patterns = [
      [
        [0, 1],
        [1, 0],
      ], // Диагональ 2x2
      [
        [1, 0],
        [0, 1],
      ], // Диагональ 2x2 отраженная
      [
        [0, 0, 1],
        [0, 1, 0],
        [1, 0, 0],
      ], // Диагональ 3x3
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ], // Диагональ 3x3 отраженная
    ];

    return patterns.some((pattern) => {
      if (pattern.length !== rows || pattern[0].length !== cols) return false;
      return pattern.every((row, y) =>
        row.every((val, x) => matrix[y][x].value === val)
      );
    });
  }

  private canPlaceBlock(
    board: Matrix,
    block: Block,
    position: Position
  ): boolean {
    const { x, y } = position;
    const matrix = block.matrix;

    // Проверяем границы доски
    if (
      y + matrix.length > board.length ||
      x + matrix[0].length > board[0].length
    ) {
      return false;
    }

    // Проверяем каждую клетку блока
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j].value === 1) {
          // Проверяем, не выходит ли за границы
          if (y + i >= board.length || x + j >= board[0].length) {
            return false;
          }
          // Проверяем, не занята ли клетка
          if (board[y + i][x + j].value === 1) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private evaluateBlockForCombo(block: Block, board: Matrix): number {
    let maxComboPotential = 0;
    const rows = board.length;
    const cols = board[0].length;

    // Проверяем все возможные позиции размещения
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (this.canPlaceBlock(board, block, { x, y })) {
          const comboPotential = this.simulatePlacementForCombo(board, block, {
            x,
            y,
          });
          maxComboPotential = Math.max(maxComboPotential, comboPotential);
        }
      }
    }

    return maxComboPotential;
  }

  private simulatePlacementForCombo(
    board: Matrix,
    block: Block,
    position: Position
  ): number {
    const simulatedBoard = board.map((row) => [...row]);
    const { x, y } = position;
    const matrix = block.matrix;

    // Размещаем блок
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j].value === 1) {
          simulatedBoard[y + i][x + j] = { value: 1, color: block.color };
        }
      }
    }

    // Подсчитываем потенциал комбо
    let comboPotential = 0;

    // Проверяем строки
    for (let i = 0; i < simulatedBoard.length; i++) {
      if (simulatedBoard[i].every((cell) => cell.value === 1)) {
        comboPotential++;
      }
    }

    // Проверяем столбцы
    for (let j = 0; j < simulatedBoard[0].length; j++) {
      if (simulatedBoard.every((row) => row[j].value === 1)) {
        comboPotential++;
      }
    }

    return comboPotential;
  }

  private getWeightedRandomBlock(candidates: Block[]): Block {
    // Группируем блоки по типам
    const blocksByType = candidates.reduce((acc, block) => {
      const type = this.getBlockType(block);
      if (!acc[type]) acc[type] = [];
      acc[type].push(block);
      return acc;
    }, {} as Record<string, Block[]>);

    // Вычисляем веса для каждого типа
    const typeWeights = Object.entries(blocksByType).map(([type, blocks]) => ({
      type,
      weight:
        this.blockTypeWeights[type as keyof typeof this.blockTypeWeights] *
        blocks.length,
    }));

    // Выбираем тип с учетом весов
    const totalWeight = typeWeights.reduce(
      (sum, { weight }) => sum + weight,
      0
    );
    let random = Math.random() * totalWeight;

    let selectedType = typeWeights[0].type;
    for (const { type, weight } of typeWeights) {
      random -= weight;
      if (random <= 0) {
        selectedType = type;
        break;
      }
    }

    // Выбираем случайный блок выбранного типа
    const blocksOfSelectedType = blocksByType[selectedType];
    return blocksOfSelectedType[
      Math.floor(Math.random() * blocksOfSelectedType.length)
    ];
  }

  public generateNextBlocks(board: Matrix): Block[] {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Генерируем набор блоков
      const blocks = this.generateWeightedRandomBlocks(board);

      // Проверяем, можно ли разместить все блоки
      if (this.canPlaceAllBlocks(board, blocks)) {
        // Логируем успешную генерацию
        this.logGameState(board, blocks, 0, 0);
        return blocks;
      }

      attempts++;
    }

    // Если не удалось найти подходящий набор, возвращаем случайные блоки
    const fallbackBlocks = this.generateWeightedRandomBlocks(board);
    this.logGameState(board, fallbackBlocks, 0, 0);
    return fallbackBlocks;
  }

  private shouldMaintainCombo(board: Matrix): boolean {
    // Проверяем заполненность поля
    const totalCells = board.length * board[0].length;
    const filledCells = board.reduce(
      (sum, row) => sum + row.filter((cell) => cell.value === 1).length,
      0
    );
    const fillRatio = filledCells / totalCells;

    // Если поле заполнено более чем на 70%, пытаемся поддерживать комбо
    return fillRatio > this.comboMaintenanceThreshold;
  }

  private findBlocksForComboMaintenance(board: Matrix): Block[] {
    const candidates = this.blockBag.map((block) => ({
      block,
      comboPotential: this.evaluateBlockForCombo(block, board),
    }));

    // Сортируем по потенциалу комбо
    candidates.sort((a, b) => b.comboPotential - a.comboPotential);

    // Выбираем лучшие блоки с учетом весов типов
    return candidates
      .filter(({ comboPotential }) => comboPotential >= this.minLinesToClear)
      .map(({ block }) => block)
      .slice(0, 3);
  }

  private findBlocksForLineClearing(board: Matrix): Block[] {
    const candidates = this.blockBag.map((block) => ({
      block,
      linesToClear: this.evaluateBlockForCombo(block, board),
    }));

    // Сортируем по количеству линий для очистки
    candidates.sort((a, b) => b.linesToClear - a.linesToClear);

    // Выбираем блоки, способные очистить минимум 2 линии
    return candidates
      .filter(({ linesToClear }) => linesToClear >= this.minLinesToClear)
      .map(({ block }) => block)
      .slice(0, 3);
  }

  private generateWeightedRandomBlocks(board: Matrix): Block[] {
    const selectedBlocks: Block[] = [];
    const availableBlocks = [...this.blockBag];

    while (selectedBlocks.length < 3 && availableBlocks.length > 0) {
      // Вычисляем веса для каждого блока
      const weights = availableBlocks.map((block) => {
        const blockType = this.getBlockType(block);
        const typeWeight = this.blockTypeWeights[blockType] || 1.0;
        const { score } = this.findBestBlockPlacement(board, block);
        return typeWeight * (score + 1); // +1 чтобы избежать нулевых весов
      });

      // Выбираем блок с учетом весов
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }

      const selectedBlock = availableBlocks[selectedIndex];
      selectedBlocks.push({
        ...selectedBlock,
        uniqueId: `${selectedBlock.id}_${Date.now()}_${selectedBlocks.length}`,
        color: this.getRandomColor(),
      });

      // Удаляем выбранный блок из доступных
      availableBlocks.splice(selectedIndex, 1);
    }

    return selectedBlocks;
  }

  private async logGameState(
    board: Matrix,
    blocks: Block[],
    score: number,
    linesCleared: number
  ) {
    try {
      await fetch("/api/game-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board,
          blocks,
          score,
          linesCleared,
          gameState: "block_generation",
        }),
      });
    } catch (error) {
      console.error("Failed to log game state:", error);
    }
  }

  private findBestBlockPlacement(
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

  private evaluateBlockPlacement(
    board: Matrix,
    block: Block,
    position: Position
  ): number {
    let score = 0;

    // Создаем временную копию доски
    const tempBoard = board.map((row) => [...row]);

    // Размещаем блок
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

    // Подсчитываем потенциальные линии
    const linesToClear = this.countLinesToClear(tempBoard);
    score += linesToClear * 100;

    // Добавляем бонус за тип блока
    const blockType = this.getBlockType(block);
    score *= this.blockTypeWeights[blockType] || 1.0;

    return score;
  }

  private canPlaceAllBlocks(board: Matrix, blocks: Block[]): boolean {
    // Проверяем все возможные перестановки блоков
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

        // Размещаем блок на временной доске
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

  private getPermutations<T>(arr: T[]): T[][] {
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

  getPreviewBlock(): Block | null {
    return this.previewBlock;
  }
}
