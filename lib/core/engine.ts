import { Block, Matrix, Position, Cell } from "../data/types";
import { findAllValidPositions } from "./positions";
import { BLOCKS } from "../data/pieces";

export function canPlaceBlock(
  board: Matrix,
  block: Block,
  position: Position
): boolean {
  const { matrix } = block;
  const { x, y } = position;

  // Проверяем границы поля
  if (
    x < 0 ||
    y < 0 ||
    x + matrix[0].length > board[0].length ||
    y + matrix.length > board.length
  ) {
    return false;
  }

  // Проверяем коллизии с существующими блоками
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j].value === 1 && board[y + i][x + j].value === 1) {
        return false;
      }
    }
  }

  return true;
}

export function placeBlock(
  board: Matrix,
  block: Block,
  position: Position
): Matrix {
  if (!canPlaceBlock(board, block, position)) {
    return board;
  }

  const newBoard = board.map((row) => [...row]);
  const { matrix } = block;
  const { x, y } = position;

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j].value === 1) {
        newBoard[y + i][x + j] = {
          value: 1,
          color: block.color
        };
      }
    }
  }

  return newBoard;
}

function findCellsToClear(board: Matrix): boolean[][] {
  const height = board.length;
  const width = board[0].length;

  // Создаем матрицу для пометки клеток, которые нужно очистить
  const cellsToClear = board.map((row) => row.map(() => false));

  // Проверяем строки
  for (let y = 0; y < height; y++) {
    if (board[y].every((cell) => cell.value === 1)) {
      // Помечаем все клетки в строке для очистки
      for (let x = 0; x < width; x++) {
        cellsToClear[y][x] = true;
      }
    }
  }

  // Проверяем столбцы
  for (let x = 0; x < width; x++) {
    if (board.every((row) => row[x].value === 1)) {
      // Помечаем все клетки в столбце для очистки
      for (let y = 0; y < height; y++) {
        cellsToClear[y][x] = true;
      }
    }
  }

  return cellsToClear;
}

export function clearLines(board: Matrix): {
  newBoard: Matrix;
  clearedLines: number;
  clearedCells: boolean[][];
} {
  const cellsToClear = findCellsToClear(board);

  // Подсчитываем количество очищенных линий правильно
  const height = board.length;
  const width = board[0].length;
  let clearedLines = 0;

  // Проверяем горизонтальные линии
  for (let y = 0; y < height; y++) {
    if (board[y].every((cell) => cell.value === 1)) {
      clearedLines++;
    }
  }

  // Проверяем вертикальные линии
  for (let x = 0; x < width; x++) {
    if (board.every((row) => row[x].value === 1)) {
      clearedLines++;
    }
  }

  // Создаем новую доску, очищая помеченные клетки
  const newBoard = board.map((row, y) =>
    row.map((cell, x) => (cellsToClear[y][x] ? { value: 0 } : cell))
  );

  return {
    newBoard,
    clearedLines,
    clearedCells: cellsToClear,
  };
}

export function getCellsToClear(
  board: Matrix,
  block: Block,
  position: Position
): boolean[][] {
  // Создаем временную доску с размещенным блоком
  const tempBoard = placeBlock(board, block, position);

  // Используем общую функцию для определения клеток, которые будут очищены
  return findCellsToClear(tempBoard);
}

export function isGameOver(board: Matrix): boolean {
  // Проверяем, есть ли заполненные клетки в верхней строке
  return board[0].some((cell) => cell.value === 1);
}

interface BlockPlacement {
    block: Block;
    positions: Position[];
}

function generateRandomBlocks(): Block[] {
    // Select 3 random blocks from BLOCKS
    const shuffled = [...BLOCKS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
}

export function generateGuaranteedBlocks(board: Matrix): Block[] {
    // Получаем все возможные размещения для каждой фигуры
    const blockPlacements: BlockPlacement[] = BLOCKS.map(block => ({
        block,
        positions: findAllValidPositions(board, block)
    }));

    // Фильтруем фигуры, которые можно разместить
    const placeableBlocks = blockPlacements.filter(bp => bp.positions.length > 0);

    // Если нет размещаемых фигур, возвращаем случайные
    if (placeableBlocks.length === 0) {
        return generateRandomBlocks();
    }

    // Выбираем первую фигуру, которая гарантированно размещается
    const firstBlock = placeableBlocks[Math.floor(Math.random() * placeableBlocks.length)];
    
    // Создаем временную доску с размещенной первой фигурой
    const tempBoard = JSON.parse(JSON.stringify(board));
    const firstPosition = firstBlock.positions[Math.floor(Math.random() * firstBlock.positions.length)];
    placeBlock(tempBoard, firstBlock.block, firstPosition);

    // Ищем фигуры, которые можно разместить после первой
    const secondPlacements = blockPlacements
        .filter(bp => bp.block.id !== firstBlock.block.id)
        .map(bp => ({
            block: bp.block,
            positions: findAllValidPositions(tempBoard, bp.block)
        }))
        .filter(bp => bp.positions.length > 0);

    // Если нет фигур для второго размещения, возвращаем случайные
    if (secondPlacements.length === 0) {
        return generateRandomBlocks();
    }

    // Выбираем вторую фигуру
    const secondBlock = secondPlacements[Math.floor(Math.random() * secondPlacements.length)];
    
    // Размещаем вторую фигуру
    const secondPosition = secondBlock.positions[Math.floor(Math.random() * secondBlock.positions.length)];
    placeBlock(tempBoard, secondBlock.block, secondPosition);

    // Ищем фигуры для третьего размещения
    const thirdPlacements = blockPlacements
        .filter(bp => bp.block.id !== firstBlock.block.id && bp.block.id !== secondBlock.block.id)
        .map(bp => ({
            block: bp.block,
            positions: findAllValidPositions(tempBoard, bp.block)
        }))
        .filter(bp => bp.positions.length > 0);

    // Если нет фигур для третьего размещения, возвращаем случайные
    if (thirdPlacements.length === 0) {
        return generateRandomBlocks();
    }

    // Выбираем третью фигуру
    const thirdBlock = thirdPlacements[Math.floor(Math.random() * thirdPlacements.length)];

    // Возвращаем все три фигуры
    return [firstBlock.block, secondBlock.block, thirdBlock.block];
}
