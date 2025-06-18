"use client";

import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { useGameStore } from "../lib/state/store";
import { getCellsToClear } from "@/lib/core/engine";
import { findNearestValidPosition } from "../lib/core/positions";
import { Block, BlockColor, Matrix, Position } from "../lib/data/types";
import { getEventCoordinates } from "@/utils/events";
import { ScoreDisplay } from "./board/ScoreDisplay";
import { BlockGenerator } from "../lib/core/blockGenerator";
import { DifficultyEvaluator } from "../lib/core/difficulty";
import { GameOver } from "./GameOver";
import { ScoreCalculator } from "../lib/core/scoreCalculator";
import { Piece } from "./pieces/Piece";
import { ComboVisualizer } from "./board/ComboVisualizer";
import { SVGPreloader } from "@/utils/SVGPreloader";
import { DraggablePiecesSection } from "./DraggablePiecesSection";
import { BoostersPanel } from "./BoostersPanel";
import { BoostersPanelSimple } from "./BoostersPanelSimple";

// Throttling utility
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// Debouncing utility
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  }
};

const DEFAULT_CELL_SIZE = 43.75;

// Добавьте константу для размера зазора в пикселях
const GAP_SIZE_PX = 2; // Исходя из gap-0.5 в TailwindCSS (0.125rem * 16px)

interface GameBoardProps {
  width?: number;
  height?: number;
  onScoreUpdate: (score: number) => void;
  onGameOver: () => void;
  onExitGame: () => void;
}

// Динамически определяет размер клетки для корректной работы DnD
const useBoardAndCellSizes = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);
  const [dynamicCellSize, setDynamicCellSize] = useState(DEFAULT_CELL_SIZE);

  useEffect(() => {
    const updateSizes = () => {
      if (boardRef.current) {
        setBoardRect(boardRef.current.getBoundingClientRect());
      }
      if (cellRef.current) {
        setDynamicCellSize(cellRef.current.getBoundingClientRect().width);
        console.log(
          "Updated dynamicCellSize:",
          cellRef.current.getBoundingClientRect().width
        );
      }
    };

    const debouncedUpdateSizes = debounce(updateSizes, 100);

    // Update sizes initially
    updateSizes();

    // Add resize observer to boardRef for more accurate updates
    const resizeObserver = new ResizeObserver((entries) => {
      // Only update if boardRef is among the observed entries
      if (entries.some((entry) => entry.target === boardRef.current)) {
        debouncedUpdateSizes();
      }
    });

    if (boardRef.current) {
      resizeObserver.observe(boardRef.current);
    }

    // Also listen to window resize as a fallback/additional measure
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", debouncedUpdateSizes);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", debouncedUpdateSizes);
      };
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [boardRef, cellRef]);

  return { boardRef, cellRef, boardRect, dynamicCellSize };
};

const useGridPosition = () => {
  const { validPositions } = useGameStore();

  const { boardRef, cellRef, boardRect, dynamicCellSize } =
    useBoardAndCellSizes();

  // Для удобного "ускорения" движения призрака фигуры
  const calculateDynamicOffset = useCallback(
    (cursorX: number, cursorY: number): Position => {
      if (typeof window === 'undefined') {
        return { x: 1, y: 2 };
      }
      
      const referenceHeight = window.innerHeight;
      const referenceWidth = window.innerWidth;
      const referenceCenter = referenceWidth / 2;
      const minOffsetY = 1.5;
      const maxOffsetY = 3.5;
      const maxOffsetX = 2;

      const normalizedCursorY = Math.max(
        0,
        Math.min(1, cursorY / referenceHeight)
      );
      const normalizedCursorX = (cursorX - referenceCenter) / referenceCenter;

      const dynamicOffsetY =
        minOffsetY + (1 - normalizedCursorY) * (maxOffsetY - minOffsetY);

      const dynamicOffsetX = 1 - normalizedCursorX * maxOffsetX;

      return { x: dynamicOffsetX, y: dynamicOffsetY };
    },
    []
  );

  const calculateGridPosition = useCallback(
    (
      e: MouseEvent | TouchEvent,
      currentDragPosition: Position | null,
      lastHighlightedPosition: Position | null
    ) => {
      const rect = boardRect;

      if (!rect || !currentDragPosition) {
        console.warn(
          "boardRect or dragPosition not available in calculateGridPosition"
        );
        return null;
      }

      const { clientX, clientY } = getEventCoordinates(e);

      const { draggedPiece } = useGameStore.getState();
      if (!draggedPiece) return null;

      const { x: dynamicOffsetX, y: dynamicOffsetY } = calculateDynamicOffset(
        currentDragPosition.x,
        currentDragPosition.y
      );

      const pieceWidthCells = draggedPiece.matrix[0].length;
      const pieceHeightCells = draggedPiece.matrix.length;

      const offsetYMultiplier = pieceHeightCells < 2 ? 2 : 1;

      const offsetX =
        ((pieceWidthCells * dynamicCellSize) / 2) * dynamicOffsetX;
      const offsetY =
        pieceHeightCells * dynamicCellSize * dynamicOffsetY * offsetYMultiplier;

      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      // Здесь мы учитываем gap при вычислении индекса клетки
      const pitch = dynamicCellSize + GAP_SIZE_PX;

      const baseX = Math.round((relativeX - offsetX) / pitch);
      const baseY = Math.round((relativeY - offsetY) / pitch);

      const nearestPosition = findNearestValidPosition(
        validPositions,
        { x: baseX, y: baseY },
        lastHighlightedPosition
      );

      return nearestPosition;
    },
    [validPositions, boardRect, dynamicCellSize, calculateDynamicOffset]
  );

  return {
    boardRef,
    calculateGridPosition,
    dynamicCellSize,
    cellRef,
    boardRect,
    calculateDynamicOffset,
  };
};

// Memoized cell component for better performance
const BoardCell = React.memo<{
  cell: any;
  x: number;
  y: number;
  highlight: boolean;
  isInClearingLine: boolean;
  isPotentiallyCleared: boolean;
  isFirst: boolean;
  cellRef: React.RefObject<HTMLDivElement | null>;
}>(({ cell, x, y, highlight, isInClearingLine, isPotentiallyCleared, isFirst, cellRef }) => {
  return (
    <div
      key={x}
      ref={isFirst ? cellRef : undefined}
      className={`rounded-[3px] ${
        cell.value ? "bg-gray-700" : "bg-gray-900"
      } ${highlight ? "ring-2 ring-blue-500" : ""} ${
        isInClearingLine ? "clearing-line-horizontal" : ""
      } ${isInClearingLine ? "clearing-line-vertical" : ""} ${
        isPotentiallyCleared ? "potential-clear-highlight" : ""
      }`}
    >
      {cell.value === 1 && cell.color && (
        <Piece
          color={cell.color}
          size="100%"
          isClearing={isInClearingLine}
        />
      )}
    </div>
  );
});

export const GameBoard: React.FC<GameBoardProps> = ({
  width = 8,
  height = 8,
  onScoreUpdate,
  onGameOver,
  onExitGame,
}) => {
  const {
    board,
    currentPieces,
    placePiece,
    draggedPiece,
    dragPosition,
    startDrag,
    updateDrag,
    endDrag,
    setHoverCell,
    hoverCell,
    validPositions,
    initializeGame,
    score,
    lastScoreResult,
    setCurrentPieces,
    previewBlock,
    setPreviewBlock,
    resetGame,
    gameOver,
    setOnGameOver,
  } = useGameStore();

  const {
    boardRef,
    cellRef,
    calculateGridPosition,
    dynamicCellSize,
    boardRect,
    calculateDynamicOffset,
  } = useGridPosition();

  // Создаем новый ref с правильным типом для BoardCell
  const boardCellRef = useRef<HTMLDivElement>(null);

  const [clearingCells, setClearingCells] = useState<boolean[][]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nextBlocks, setNextBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [combo, setCombo] = useState(0);
  const [blockEvaluations, setBlockEvaluations] = useState<
    Array<{
      difficulty: number;
      scorePotential: number;
    }>
  >([]);
  const [pieceEvaluations, setPieceEvaluations] = useState<
    Array<{
      difficulty: number;
      scorePotential: number;
    }>
  >([]);
  const [potentialClearHighlight, setPotentialClearHighlight] = useState<
    boolean[][]
  >([]);
  const [placedPiecesCount, setPlacedPiecesCount] = useState(0);
  const [isGeneratingNewSet, setIsGeneratingNewSet] = useState(false);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);

  const [lastHighlightedPosition, setLastHighlightedPosition] =
    useState<Position | null>(null);

  // Добавим новые состояния для хранения линий
  const [clearingHorizontalLines, setClearingHorizontalLines] = useState<
    number[]
  >([]);
  const [clearingVerticalLines, setClearingVerticalLines] = useState<number[]>(
    []
  );

  // Добавляем состояние для валюты (временно захардкодим для демонстрации)
  const [currency, setCurrency] = useState(100);

  // Обработчик кликов по бустерам
  const handleBoosterClick = useCallback((boosterId: string) => {
    console.log(`Бустер ${boosterId} активирован!`);
    // Здесь будет логика бустеров
  }, []);

  const blockGenerator = new BlockGenerator();
  const scoreCalculator = new ScoreCalculator();
  const difficultyEvaluator = new DifficultyEvaluator();

  const scoreDisplayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function updateCoords() {
      if (scoreDisplayRef.current && boardRef.current) {
        const scoreRect = scoreDisplayRef.current.getBoundingClientRect();
        const boardRectDom = boardRef.current.getBoundingClientRect();
        const scoreDisplayCoords = {
          x: scoreRect.left - boardRectDom.left,
          y: scoreRect.top + scoreRect.height / 2 - boardRectDom.top,
        };
        useGameStore.setState({ scoreDisplayCoords });
      }
    }
    updateCoords();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateCoords);
      return () => window.removeEventListener('resize', updateCoords);
    }
    
    return undefined;
  }, []);


  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setClearingCells([]);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  useEffect(() => {
    if (currentPieces.length === 0) {
      initializeGame();
    }
  }, [currentPieces.length, initializeGame]);

  useEffect(() => {
    if (currentPieces.length > 0) {
      // Оцениваем каждую текущую фигуру
      const evaluations = currentPieces.map((piece) =>
        difficultyEvaluator.evaluateBlock(piece, board)
      );
      setPieceEvaluations(evaluations);
    }
  }, [currentPieces, board]);

  const generateNewBlocks = useCallback(() => {
    if (!isGeneratingNewSet) {
      setIsGeneratingNewSet(true);
      const newBlocks = blockGenerator.generateNextBlocks(board);
      setCurrentPieces(newBlocks);
      setPreviewBlock(blockGenerator.getPreviewBlock());
      setPlacedPiecesCount(0);
      setIsGeneratingNewSet(false);
    }
  }, [
    board,
    blockGenerator,
    setCurrentPieces,
    setPreviewBlock,
    isGeneratingNewSet,
  ]);

  const handlePieceStart = useCallback(
    (piece: Block, x: number, y: number) => {
      if (boardRef.current) {
        startDrag(piece);
        updateDrag({ x, y });
      }
    },
    [startDrag, updateDrag, boardRef]
  );

  const handlePiecePlacement = (x: number, y: number) => {
    if (draggedPiece && hoverCell) {
      const cellsToClear = getCellsToClear(board, draggedPiece, hoverCell);
      const hasCellsToClear = cellsToClear.some((row) =>
        row.some((cell) => cell)
      );

      if (hasCellsToClear) {
        // Находим горизонтальные линии
        const horizontalLines = cellsToClear
          .map((row, index) => (row.every((cell) => cell) ? index : -1))
          .filter((index) => index !== -1);

        // Находим вертикальные линии
        const verticalLines = Array(width)
          .fill(0)
          .map((_, colIndex) => {
            const isFullLine = cellsToClear.every((row) => row[colIndex]);
            return isFullLine ? colIndex : -1;
          })
          .filter((index) => index !== -1);

        // Сначала размещаем фигуру
        placePiece(x, y);

        // Затем запускаем анимацию
        requestAnimationFrame(() => {
          setClearingHorizontalLines(horizontalLines);
          setClearingVerticalLines(verticalLines);
          setIsAnimating(true);

          // Очищаем состояния анимации через некоторое время
          setTimeout(() => {
            setClearingHorizontalLines([]);
            setClearingVerticalLines([]);
            setIsAnimating(false);
          }, 300);
        });

        // --- ДОБАВЛЕНО: сохраняем пиксельные координаты в lastScoreResult ---
        setTimeout(() => {
          const { lastScoreResult } = useGameStore.getState();
          if (lastScoreResult && boardRect && dynamicCellSize) {
            const pixelX = hoverCell.x * (dynamicCellSize + GAP_SIZE_PX) 
            const pixelY = hoverCell.y * (dynamicCellSize + GAP_SIZE_PX) 
            lastScoreResult.pixelPosition = { x: pixelX, y: pixelY };
            useGameStore.setState({ lastScoreResult: { ...lastScoreResult } });
          }
        }, 0);
        // --- КОНЕЦ ДОБАВЛЕНИЯ ---
      } else {
        placePiece(x, y);
      }
    }
  };

  useEffect(() => {
    const handleMove = throttle((e: MouseEvent | TouchEvent) => {
      if (!draggedPiece || !boardRef.current) return;

      if (e instanceof TouchEvent) {
        e.preventDefault();
      }

      const { clientX, clientY } = getEventCoordinates(e);
      const currentDragPosition = { x: clientX, y: clientY };
      updateDrag(currentDragPosition);

      const nearestPosition = calculateGridPosition(
        e,
        currentDragPosition,
        lastHighlightedPosition
      );

      // Обновляем последнюю подсвеченную позицию только если есть новая позиция
      if (nearestPosition) {
        setLastHighlightedPosition(nearestPosition);
      } else {
        // Сбрасываем lastHighlightedPosition когда хайлайт исчезает
        setLastHighlightedPosition(null);
      }

      setHoverCell(nearestPosition);
    }, 16); // ~60fps throttling

    const handleStart = (e: TouchEvent) => {
      // e.preventDefault();
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (draggedPiece) {
        if (hoverCell) {
          handlePiecePlacement(hoverCell.x, hoverCell.y);
        } else {
          endDrag();
        }
      }
      setHoverCell(null);
      setLastHighlightedPosition(null); // Сбрасываем при окончании перетаскивания
    };

    if (typeof window !== 'undefined') {
      window.addEventListener("touchstart", handleStart, { passive: false });
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchend", handleEnd);
      window.addEventListener("touchcancel", handleEnd);

      return () => {
        window.removeEventListener("touchstart", handleStart);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchend", handleEnd);
        window.removeEventListener("touchcancel", handleEnd);
      };
    }
    
    return undefined;
  }, [
    draggedPiece,
    updateDrag,
    endDrag,
    setHoverCell,
    board,
    calculateGridPosition,
    hoverCell,
    lastHighlightedPosition,
  ]);

  const calculatePotentialClearLines = useCallback(
    (piece: Block, position: Position) => {
      if (!position) return [];

      // Создаем временную копию доски
      const tempBoard = board.map((row) => [...row]);

      // Размещаем фигуру на временной доске
      piece.matrix.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell.value === 1) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (
              boardY >= 0 &&
              boardY < height &&
              boardX >= 0 &&
              boardX < width
            ) {
              tempBoard[boardY][boardX] = { value: 1, color: piece.color };
            }
          }
        });
      });

      // Оптимизированная проверка линий
      const horizontalLines = new Array(height).fill(false);
      const verticalLines = new Array(width).fill(false);

      // Проверяем горизонтальные линии
      for (let y = 0; y < height; y++) {
        horizontalLines[y] = tempBoard[y].every((cell) => cell.value === 1);
      }

      // Проверяем вертикальные линии
      for (let x = 0; x < width; x++) {
        verticalLines[x] = tempBoard.every((row) => row[x].value === 1);
      }

      // Создаем матрицу подсветки только если есть линии для очистки
      const hasLinesToClear = horizontalLines.some(line => line) || verticalLines.some(line => line);
      if (!hasLinesToClear) return [];

      const highlightMatrix = tempBoard.map((row, y) => {
        return row.map((_, x) => {
          return horizontalLines[y] || verticalLines[x];
        });
      });

      return highlightMatrix;
    },
    [board, width, height]
  );

  useEffect(() => {
    if (draggedPiece && hoverCell) {
      const potentialLines = calculatePotentialClearLines(
        draggedPiece,
        hoverCell
      );
      setPotentialClearHighlight(potentialLines);
    } else {
      setPotentialClearHighlight([]);
    }
  }, [draggedPiece, hoverCell, calculatePotentialClearLines]);

  // const [ScoreResult, lastScoreResult] = useGameStore()
  const allColors: BlockColor[] = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "orange",
  ]; // добавьте все ваши цвета

  // Устанавливаем onGameOver callback в store
  useEffect(() => {
    setOnGameOver(() => {
      onGameOver();
    });
    
    return () => {
      setOnGameOver(null);
    };
  }, [onGameOver, setOnGameOver]);

  return (
    <div className={`flex flex-col items-center gap-6 min-h-screen bg-[var(--game-background)] p-4 no-select will-change-auto`}>
      <SVGPreloader colors={allColors} />
      {/* Top section: Score and Settings (placeholder) */}

      <div className="flex justify-between w-full -mb-6 items-center md:max-w-xs md:max-h-xs">
        <div className="text-2xl font-figtree font-bold text-white">
          500 {/* Placeholder for trophy */}
        </div>
        <div className="text-2xl font-bold text-white" onClick={onExitGame}>
          ⚙️ {/* Placeholder for settings icon */}
        </div>
      </div>
      <div className="flex justify-center items-center w-full -mb-6">
        <ScoreDisplay ref={scoreDisplayRef} newScore={score} moveScore={lastScoreResult} />
      </div>
      <BoostersPanelSimple />
      {/* Game Board Container - takes full width and maintains aspect ratio */}

      <div className="w-full aspect-square flex justify-center items-center p-4 md:max-w-xs md:max-h-xs">
        <div className="relative w-full h-full">
          {lastScoreResult && (
            <ComboVisualizer speed={4} lastScore={lastScoreResult} />
          )}

          <div
            ref={boardRef}
            className="relative z-10 grid grid-cols-8 grid-rows-8 gap-0.5 w-full h-full bg-gray-800 p-1 rounded-lg will-change-transform"
          >
            {board.map((row, y) => (
              <React.Fragment key={y}>
                {row.map((cell, x) => {
                  const isFirst = y === 0 && x === 0;
                  let highlight = false;
                  let isInClearingLine = false;
                  let isPotentiallyCleared = false;

                  if (draggedPiece && hoverCell) {
                    const pieceMatrix = draggedPiece.matrix;
                    const pieceX = x - hoverCell.x;
                    const pieceY = y - hoverCell.y;

                    if (
                      pieceY >= 0 &&
                      pieceY < pieceMatrix.length &&
                      pieceX >= 0 &&
                      pieceX < pieceMatrix[0].length
                    ) {
                      highlight = pieceMatrix[pieceY][pieceX].value === 1;
                    }
                  }

                  // Check if this cell is marked for potential clearing on hover
                  if (potentialClearHighlight[y]?.[x]) {
                    isPotentiallyCleared = true;
                  }
                  // Проверяем, находится ли ячейка в очищаемой линии
                  isInClearingLine =
                    clearingHorizontalLines.includes(y) ||
                    clearingVerticalLines.includes(x);

                  return (
                    <BoardCell
                      key={x}
                      cell={cell}
                      x={x}
                      y={y}
                      highlight={highlight}
                      isInClearingLine={isInClearingLine}
                      isPotentiallyCleared={isPotentiallyCleared}
                      isFirst={isFirst}
                      cellRef={boardCellRef}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Draggable Pieces */}
      <DraggablePiecesSection
        currentPieces={currentPieces}
        draggedPiece={draggedPiece}
        dragPosition={dragPosition}
        dynamicCellSize={dynamicCellSize}
        calculateDynamicOffset={calculateDynamicOffset}
        onPieceStart={handlePieceStart}
      />
      
      {/* Game Over Modal */}
      {gameOver && (
        <GameOver 
          onPlayAgain={() => {
            resetGame();
          }} 
        />
      )}
    
    </div>
  );
};

export default GameBoard;
