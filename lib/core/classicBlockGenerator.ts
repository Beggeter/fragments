import {
  Block,
  Matrix,
  BlockColor,
  BLOCK_COLORS,
  Position,
  Cell,
} from "../data/types";
import { BaseBlockGenerator, GeneratorConfig } from "./baseBlockGenerator";
import { DifficultyModifiers } from "./difficultyManager";
import { CLASSIC_CONFIG } from "./generatorConfigs";

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

// Группируем фигуры по сложности
const BLOCKS_BY_DIFFICULTY = {
  // Простые: большие фигуры (4-5 клеток) и простые линии
  easy: [
    0, 1, 2, 3, 4, 5, 6, 7,  // Горизонтальные и вертикальные линии (2-5 клеток)
    8, 9,                     // Квадраты 2x2 и 3x3
    24, 25,                   // Прямоугольники 2x3
  ],
  // Средние: угловые фигуры, L-образные, T-образные
  medium: [
    10, 11, 12, 13,          // Угловые фигуры 2x2
    14, 15, 16, 17,          // Угловые фигуры 3x3
    18, 19, 20, 21,          // L-образные фигуры
    26, 27, 28, 29,          // T-образные фигуры
  ],
  // Сложные: S-образные и диагональные фигуры
  hard: [
    30, 31, 32, 33,          // S-образные фигуры
    34, 35, 36, 37, 38, 39, 40, 41, 42, 43, // Диагональные фигуры
  ],
};

export class ClassicBlockGenerator extends BaseBlockGenerator {
  // Константы для Classic режима
  private readonly minLinesToClear = 2;
  private readonly comboMaintenanceThreshold = 0.7;
  private readonly blockTypeWeights: Record<string, number> = {
    line: 0.8,    // Уменьшаем вес простых линий
    square: 1.0,  // Нейтральный вес квадратов
    corner: 1.5,  // Увеличиваем вес угловых фигур
    other: 1.8,   // Увеличиваем вес сложных фигур
  };

  constructor(initialScore: number = 0, playerRecord: number = 0) {
    super(CLASSIC_CONFIG, initialScore, playerRecord);
  }

  protected initializeBlockBag(): void {
    this.blockBag = ALL_BLOCKS.map((matrix, index) => ({
      id: `block-${index}`,
      uniqueId: `block-${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  public generateNextBlocks(board: Matrix): Block[] {
    const modifiers = this.getDifficultyModifiers();
    let attempts = 0;
    const maxAttempts = modifiers.maxPlacementAttempts;

    while (attempts < maxAttempts) {
      // Пытаемся создать логически сложный набор
      const complexBlocks = this.generateLogicallyComplexBlocks(board, modifiers);
      if (complexBlocks.length > 0) {
        return complexBlocks;
      }

      // Если не удалось, генерируем обычный набор
      const blocks = this.generateWeightedRandomBlocksWithDifficulty(board, modifiers);

      if (this.canPlaceAllBlocks(board, blocks)) {
        return blocks;
      }

      attempts++;
    }

    const fallbackBlocks = this.generateFallbackBlocks(board, modifiers);
    return fallbackBlocks;
  }

  public getDifficultyModifiers(): DifficultyModifiers {
    return this.difficultyManager.getModifiers();
  }

  private getDifficultyForIndex(index: number): "easy" | "medium" | "hard" {
    if (BLOCKS_BY_DIFFICULTY.easy.includes(index)) return "easy";
    if (BLOCKS_BY_DIFFICULTY.medium.includes(index)) return "medium";
    return "hard";
  }

  private calculateEasyChance(score: number, boardFillRatio: number): number {
    // Очень агрессивное усложнение каждые 1000 очков
    let easyChance = this.config.baseEasyChance - 
      (Math.floor(score / this.config.difficultySteps) * 0.25); // Увеличили до 0.25
    
    // Дополнительное усложнение на средних уровнях
    if (score > 5000) {
      easyChance -= 0.15; // Дополнительно уменьшаем на 15%
    }
    if (score > 10000) {
      easyChance -= 0.2; // Еще больше уменьшаем на 20%
    }
    if (score > 15000) {
      easyChance -= 0.25; // Максимальное усложнение
    }
    
    easyChance = Math.max(easyChance, this.config.minEasyChance);
    
    // Логика спасения (только в крайних случаях)
    if (boardFillRatio > this.config.rescueThreshold) {
      // Проверяем, не побил ли игрок рекорд
      if (!this.config.enableRescueForRecordBreakers || 
          !this.isRecordBreakerActive()) {
        easyChance += this.config.rescueBonus;
      }
    }
    
    return Math.min(easyChance, 1.0);
  }

  private generateWeightedRandomBlocksWithDifficulty(board: Matrix, modifiers: DifficultyModifiers): Block[] {
    const selectedBlocks: Block[] = [];
    const availableBlocks = [...this.blockBag];
    const boardFillRatio = this.calculateBoardFillRatio(board);
    const currentScore = this.difficultyManager.getCurrentLevel().scoreThreshold;

    while (selectedBlocks.length < 3 && availableBlocks.length > 0) {
      // Вычисляем текущий шанс простых фигур
      const easyChance = this.calculateEasyChance(currentScore, boardFillRatio);
      const mediumChance = (1 - easyChance) * 0.7;
      const hardChance = (1 - easyChance) * 0.3;

      // Фильтруем блоки по сложности
      const filteredBlocks = availableBlocks.filter(block => {
        const difficulty = this.getDifficultyForIndex(parseInt(block.id.split('-')[1]));
        const random = Math.random();
        
        switch (difficulty) {
          case 'easy':
            return random < easyChance;
          case 'medium':
            return random < mediumChance;
          case 'hard':
            return random < hardChance;
          default:
            return true;
        }
      });

      const candidates = filteredBlocks.length > 0 ? filteredBlocks : availableBlocks;

      // Вычисляем веса для каждого блока
      const weights = candidates.map((block) => {
        const blockType = this.getBlockType(block);
        const typeWeight = this.blockTypeWeights[blockType] || 1.0;
        const { score } = this.findBestBlockPlacement(board, block);
        return typeWeight * (score + 1);
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

      const selectedBlock = candidates[selectedIndex];
      selectedBlocks.push({
        ...selectedBlock,
        uniqueId: `${selectedBlock.id}_${Date.now()}_${selectedBlocks.length}_${Math.random().toString(36).substr(2, 9)}`,
        color: this.getRandomColor(),
      });

      // Удаляем выбранный блок из доступных
      const blockIndex = availableBlocks.findIndex(b => b.id === selectedBlock.id);
      if (blockIndex !== -1) {
        availableBlocks.splice(blockIndex, 1);
      }
    }

    return selectedBlocks;
  }

  private generateFallbackBlocks(board: Matrix, modifiers: DifficultyModifiers): Block[] {
    const fallbackBlocks: Block[] = [];
    const easyBlocks = this.blockBag.filter(block => 
      this.getDifficultyForIndex(parseInt(block.id.split('-')[1])) === 'easy'
    );

    while (fallbackBlocks.length < 3 && easyBlocks.length > 0) {
      const randomIndex = Math.floor(Math.random() * easyBlocks.length);
      const selectedBlock = easyBlocks[randomIndex];
      
      fallbackBlocks.push({
        ...selectedBlock,
        uniqueId: `${selectedBlock.id}_${Date.now()}_${fallbackBlocks.length}_${Math.random().toString(36).substr(2, 9)}`,
        color: this.getRandomColor(),
      });

      easyBlocks.splice(randomIndex, 1);
    }

    while (fallbackBlocks.length < 3 && this.blockBag.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.blockBag.length);
      const selectedBlock = this.blockBag[randomIndex];
      
      fallbackBlocks.push({
        ...selectedBlock,
        uniqueId: `${selectedBlock.id}_${Date.now()}_${fallbackBlocks.length}_${Math.random().toString(36).substr(2, 9)}`,
        color: this.getRandomColor(),
      });
    }

    return fallbackBlocks;
  }

  private getBlockType(block: Block): string {
    const rows = block.matrix.length;
    const cols = block.matrix[0].length;

    if (rows === 1 || cols === 1) return "line";
    if (rows === cols && rows <= 3) return "square";
    if (this.isCornerShape(block)) return "corner";
    return "other";
  }

  private isCornerShape(block: Block): boolean {
    const rows = block.matrix.length;
    const cols = block.matrix[0].length;

    if (rows < 2 || cols < 2) return false;

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

  private generateLogicallyComplexBlocks(board: Matrix, modifiers: DifficultyModifiers): Block[] {
    // Определяем частоту логически сложных наборов
    const boardFillRatio = this.calculateBoardFillRatio(board);
    const currentScore = this.difficultyManager.getCurrentLevel().scoreThreshold;
    const playerRecord = this.difficultyManager.getPlayerRecord();
    
    let complexChance = 0.4; // Базовая частота 40% (было 20%)
    
    // При заполненности >70% увеличиваем до 50%
    if (boardFillRatio > 0.7) {
      complexChance = 0.5;
    }
    
    // При счете >50% рекорда дополнительно увеличиваем
    if (currentScore > playerRecord * 0.5) {
      complexChance *= 2.5; // Увеличиваем в 2.5 раза
    }
    
    // Проверяем, нужно ли создавать логически сложный набор
    if (Math.random() > complexChance) {
      return []; // Возвращаем пустой массив - не создаем сложный набор
    }
    
    // Пытаемся создать логически сложный набор
    const maxAttempts = 50;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const complexBlocks = this.attemptCreateComplexBlockSet(board);
      if (complexBlocks.length > 0) {
        return complexBlocks;
      }
    }
    
    return []; // Не удалось создать сложный набор
  }

  private attemptCreateComplexBlockSet(board: Matrix): Block[] {
    const selectedBlocks: Block[] = [];
    const availableBlocks = [...this.blockBag];
    
    // Выбираем 3 базовые фигуры
    while (selectedBlocks.length < 3 && availableBlocks.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableBlocks.length);
      const selectedBlock = availableBlocks[randomIndex];
      
      selectedBlocks.push({
        ...selectedBlock,
        uniqueId: `${selectedBlock.id}_${Date.now()}_${selectedBlocks.length}_${Math.random().toString(36).substr(2, 9)}`,
        color: this.getRandomColor(),
      });
      
      availableBlocks.splice(randomIndex, 1);
    }
    
    if (selectedBlocks.length < 3) {
      return []; // Недостаточно блоков
    }
    
    // Проверяем, какие фигуры нельзя разместить сразу
    const unplaceableBlocks = selectedBlocks.filter(block => {
      const { position } = this.findBestBlockPlacement(board, block);
      return position === null;
    });
    
    // Если нет сложно размещаемых фигур, это не логически сложный набор
    if (unplaceableBlocks.length === 0) {
      return [];
    }
    
    // Если слишком много сложно размещаемых фигур (>2), пробуем другой набор
    if (unplaceableBlocks.length > 2) {
      return [];
    }
    
    // Проверяем, что после размещения размещаемых фигур сложно размещаемые станут доступными
    const placeableBlocks = selectedBlocks.filter(block => !unplaceableBlocks.includes(block));
    
    // Создаем временную доску и размещаем доступные фигуры
    let tempBoard = board.map(row => [...row]);
    for (const block of placeableBlocks) {
      const { position } = this.findBestBlockPlacement(tempBoard, block);
      if (position) {
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
    }
    
    // Проверяем, стали ли сложно размещаемые фигуры доступными
    const stillUnplaceable = unplaceableBlocks.filter(block => {
      const { position } = this.findBestBlockPlacement(tempBoard, block);
      return position === null;
    });
    
    // Если все сложно размещаемые фигуры стали доступными, это валидный логически сложный набор
    if (stillUnplaceable.length === 0) {
      return selectedBlocks;
    }
    
    return []; // Не удалось создать валидный логически сложный набор
  }
} 