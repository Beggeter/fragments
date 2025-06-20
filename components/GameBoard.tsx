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
import { LaserMode } from "./BoostersPanelSimple";
import Particles from "@tsparticles/react";

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
  onClick?: () => void;
  style?: React.CSSProperties;
}>(({ cell, x, y, highlight, isInClearingLine, isPotentiallyCleared, isFirst, cellRef, onClick, style }) => {
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
      onClick={onClick}
      style={style}
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

// Компонент для партиклов в клетке
const CellParticles = ({ x, y, trigger }: { x: number; y: number; trigger: boolean }) => {
  if (!trigger) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none", width: 40, height: 40, zIndex: 20 }}>
      <Particles
        id={`cell-particles-${x}-${y}`}
        options={{
          particles: {
            color: { value: ["#fff", "#fbbf24", "#38bdf8", "#f472b6"] },
            number: { value: 18 },
            shape: { type: "circle" },
            size: { value: { min: 2, max: 6 } },
            move: { enable: true, speed: 7, direction: "none", outModes: { default: "destroy" } },
            opacity: { value: 0.8 },
          },
          detectRetina: true,
          fullScreen: { enable: false },
        }}
        style={{ width: 40, height: 40 }}
      />
    </div>
  );
};

const spiralOrder = (n: number, m: number) => {
  // Возвращает массив координат [y, x] в порядке спирали из центра
  const res: [number, number][] = [];
  const visited = Array.from({ length: n }, () => Array(m).fill(false));
  // 4 центральные клетки для старта
  const centers: [number, number][] = [
    [Math.floor((n-1)/2), Math.floor((m-1)/2)],
    [Math.floor((n-1)/2), Math.ceil((m-1)/2)],
    [Math.ceil((n-1)/2), Math.floor((m-1)/2)],
    [Math.ceil((n-1)/2), Math.ceil((m-1)/2)],
  ];
  let q = [...centers];
  let idx = 0;
  while (q.length) {
    const [y, x] = q.shift()!;
    if (y < 0 || y >= n || x < 0 || x >= m || visited[y][x]) continue;
    visited[y][x] = true;
    res.push([y, x]);
    // Добавляем соседей по часовой стрелке
    q.push([y, x+1], [y+1, x], [y, x-1], [y-1, x]);
  }
  // Убираем дубли
  return res.filter(([y, x], i) => res.findIndex(([yy, xx]) => yy===y&&xx===x)===i);
};

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

  // Добавляем состояние laserMode, реализую обработку кликов по лазеру с переключением режимов, передаю laserMode в доску, реализую очистку линии по клику и сброс режима после применения.
  const [laserMode, setLaserMode] = useState<LaserMode>("off");
  const [laserActiveLine, setLaserActiveLine] = useState<number | null>(null);
  const [isLaserTouching, setIsLaserTouching] = useState(false);

  // Обработчик кликов по бустерам
  const handleBoosterClick = (idx: number) => {
    if (idx === 0) {
      useGameStore.getState().undo();
    } else if (idx === 1) {
      setLaserMode((prev) => {
        if (prev === "off") return "vertical";
        if (prev === "vertical") return "horizontal";
        return "off";
      });
    } else if (idx === 2) {
      // Спиннер: спиральная анимация очистки с ускорением
      const n = board.length;
      const m = board[0].length;
      const spiral = spiralOrder(n, m);
      let step = 0;
      setSpiralClearing({});
      setSpiralParticles({});
      setIsAnimating(true);
      let currentBoard = board.map(row => row.map(cell => ({ ...cell })));
      const N = 120; // начальная задержка (медленно)
      const minN = 40; // конечная задержка (быстро)
      const total = spiral.length;
      const clearNext = () => {
        if (step >= total) {
          setTimeout(() => {
            useGameStore.setState({
              lastScoreResult: null,
            });
            setSpiralClearing({});
            setSpiralParticles({});
            setIsAnimating(false);
          }, 400);
          return;
        }
        const [y, x] = spiral[step];
        setSpiralClearing((prev) => ({ ...prev, [`${y},${x}`]: true }));
        if (currentBoard[y][x].value !== 0) {
          setSpiralParticles((prev) => ({ ...prev, [`${y},${x}`]: Date.now() }));
          setTimeout(() => {
            setSpiralParticles((prev) => ({ ...prev, [`${y},${x}`]: 0 }));
          }, 400);
        }
        // Очищаем клетку сразу
        currentBoard[y][x] = { ...currentBoard[y][x], value: 0 };
        useGameStore.setState({ board: currentBoard });
        step++;
        // Линейное ускорение: задержка уменьшается от N до minN
        const delay = Math.round(N - (N - minN) * (step / total));
        setTimeout(clearNext, delay);
      };
      clearNext();
    }
  };

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

  // Pointer events for laser
  const handlePointerDown = (e: React.PointerEvent) => {
    if (laserMode === "off" || !boardRef.current) return;
    setIsLaserTouching(true);
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (laserMode === "vertical") {
      const col = Math.floor((x / rect.width) * width);
      setLaserActiveLine(col >= 0 && col < width ? col : null);
    } else if (laserMode === "horizontal") {
      const row = Math.floor((y / rect.height) * height);
      setLaserActiveLine(row >= 0 && row < height ? row : null);
    }
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isLaserTouching || laserMode === "off" || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (laserMode === "vertical") {
      const col = Math.floor((x / rect.width) * width);
      setLaserActiveLine(col >= 0 && col < width ? col : null);
    } else if (laserMode === "horizontal") {
      const row = Math.floor((y / rect.height) * height);
      setLaserActiveLine(row >= 0 && row < height ? row : null);
    }
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isLaserTouching || laserMode === "off" || !boardRef.current) return;
    setIsLaserTouching(false);
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let idx: number | null = null;
    let canClear = false;
    if (laserMode === "vertical") {
      idx = Math.floor((x / rect.width) * width);
      canClear = idx !== null && idx >= 0 && idx < width && board.some((row) => row[idx].value !== 0);
    } else if (laserMode === "horizontal") {
      idx = Math.floor((y / rect.height) * height);
      if (idx !== null && idx >= 0 && idx < height) {
        canClear = board[idx].some((cell) => cell.value !== 0);
      } else {
        canClear = false;
      }
    }
    if (typeof idx === 'number' && canClear) {
      handleLaserLineClick(idx);
    }
    setLaserActiveLine(null);
  };

  // Обработка клика по линии для лазера
  const handleLaserLineClick = (lineIdx: number) => {
    if (laserMode === "vertical") {
      // Очищаем вертикальную линию (столбец)
      clearVerticalLine(lineIdx);
      setLaserMode("off");
      setIsLaserTouching(false);
    } else if (laserMode === "horizontal") {
      // Очищаем горизонтальную линию (строку)
      clearHorizontalLine(lineIdx);
      setLaserMode("off");
      setIsLaserTouching(false);
    }
  };

  // Функции очистки линий и увеличения комбо
  const clearVerticalLine = (colIdx: number) => {
    const currentBoard = useGameStore.getState().board;
    const newBoard = currentBoard.map((row) => row.map((cell, x) => (x === colIdx ? { ...cell, value: 0 } : cell)));
    useGameStore.setState({ board: newBoard });
    setClearingVerticalLines([colIdx]);
    setIsAnimating(true);

    // --- Score calculation for laser ---
    // Виртуальный блок-столбец
    const virtualBlock: Block = {
      id: "laser-vertical",
      uniqueId: "laser-vertical",
      name: "Laser Vertical",
      matrix: Array(currentBoard.length).fill(0).map(() => [{ value: 1, color: "blue" }]),
      difficulty: "easy",
      color: "blue",
    };
    const scoreCalculator = new (require("../lib/core/score").ScoreCalculator)();
    const clearedLines = 1;
    const cellsPlaced = 0;
    const cellsInLines = currentBoard.length;
    const scoreResult = scoreCalculator.calculateScore(
      newBoard,
      clearedLines,
      cellsPlaced,
      cellsInLines,
      virtualBlock
    );
    useGameStore.setState((state: any) => ({
      score: state.score + scoreResult.totalPoints,
      lastScoreResult: scoreResult,
    }));
    // --- End score calculation ---

    setTimeout(() => {
      setClearingVerticalLines([]);
      setIsAnimating(false);
    }, 300);
  };
  const clearHorizontalLine = (rowIdx: number) => {
    const currentBoard = useGameStore.getState().board;
    const newBoard = currentBoard.map((row, y) => (y === rowIdx ? row.map((cell) => ({ ...cell, value: 0 })) : row));
    useGameStore.setState({ board: newBoard });
    setClearingHorizontalLines([rowIdx]);
    setIsAnimating(true);

    // --- Score calculation for laser ---
    // Виртуальный блок-строка
    const virtualBlock: Block = {
      id: "laser-horizontal",
      uniqueId: "laser-horizontal",
      name: "Laser Horizontal",
      matrix: [Array(currentBoard[0].length).fill({ value: 1, color: "blue" })],
      difficulty: "easy",
      color: "blue",
    };
    const scoreCalculator = new (require("../lib/core/score").ScoreCalculator)();
    const clearedLines = 1;
    const cellsPlaced = 0;
    const cellsInLines = currentBoard[0].length;
    const scoreResult = scoreCalculator.calculateScore(
      newBoard,
      clearedLines,
      cellsPlaced,
      cellsInLines,
      virtualBlock
    );
    useGameStore.setState((state: any) => ({
      score: state.score + scoreResult.totalPoints,
      lastScoreResult: scoreResult,
    }));
    // --- End score calculation ---

    setTimeout(() => {
      setClearingHorizontalLines([]);
      setIsAnimating(false);
    }, 300);
  };
  const incrementCombo = () => {
    useGameStore.setState((state: any) => ({
      lastScoreResult: {
        ...state.lastScoreResult,
        comboLevel: (state.lastScoreResult?.comboLevel || 0) + 1,
      },
    }));
  };

  const [spiralClearing, setSpiralClearing] = useState<{[key:string]:boolean}>({});
  const [spiralParticles, setSpiralParticles] = useState<{[key:string]:number}>({}); // number = timestamp

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
      <BoostersPanelSimple onBoosterClick={handleBoosterClick} laserMode={laserMode} />
      {/* Game Board Container - takes full width and maintains aspect ratio */}

      <div className="w-full aspect-square flex justify-center items-center p-4 md:max-w-xs md:max-h-xs">
        <div className="relative w-full h-full">
          {lastScoreResult && (
            <ComboVisualizer speed={4} lastScore={lastScoreResult} />
          )}

          <div
            ref={boardRef}
            className="relative z-10 grid grid-cols-8 grid-rows-8 gap-0.5 w-full h-full bg-gray-800 p-1 rounded-lg will-change-transform"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: "none" }}
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

                  // Добавляем обработку клика по линии для лазера
                  let laserClickable = false;
                  let isLaserActive = false;
                  let canClear = true;
                  let laserHighlightColor: string | undefined = undefined;
                  if (laserMode === "vertical") {
                    laserClickable = true;
                    isLaserActive = laserActiveLine === x && isLaserTouching;
                    canClear = board.some((row) => row[x].value !== 0);
                    if (isLaserActive) {
                      laserHighlightColor = canClear ? "#7fdfff" : "#ff4d4d";
                    }
                  }
                  if (laserMode === "horizontal") {
                    laserClickable = true;
                    isLaserActive = laserActiveLine === y && isLaserTouching;
                    canClear = board[y].some((cell) => cell.value !== 0);
                    if (isLaserActive) {
                      laserHighlightColor = canClear ? "#7fdfff" : "#ff4d4d";
                    }
                  }

                  const spiralKey = `${y},${x}`;
                  const isSpiral = spiralClearing[spiralKey];
                  const particleKey = spiralParticles[spiralKey] || 0;

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
                      } ${isSpiral ? "clearing-highlight" : ""}`}
                      onClick={() => {
                        if (laserClickable) {
                          handleLaserLineClick(y);
                        } else if (canClear) {
                          handlePiecePlacement(x, y);
                        }
                      }}
                      style={{ position: "relative", zIndex: isSpiral ? 10 : undefined }}
                    >
                      {cell.value === 1 && cell.color && (
                        <Piece
                          color={cell.color}
                          size="100%"
                          isClearing={isInClearingLine}
                        />
                      )}
                      {particleKey > 0 && (
                        <CellParticles x={x*dynamicCellSize} y={y*dynamicCellSize} trigger={true} key={`cell-particles-${x}-${y}-${particleKey}`} />
                      )}
                    </div>
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
