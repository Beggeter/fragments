import { debounce } from "@/utils/helpers";
import { useRef, useState, useEffect, useCallback } from "react";
import { useGameStore } from "../lib/state/store";
import { findNearestValidPosition } from "../lib/core/positions";
import { getEventCoordinates } from "@/utils/events";
import { Position } from "../lib/data/types";

// Константы для dnd-логики и размеров
const DEFAULT_CELL_SIZE = 43.75;
const GAP_SIZE_PX = 2;

const MIN_OFFSET_Y = 1.5;
const MAX_OFFSET_Y = 3.5;
const MAX_OFFSET_X = 2;

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
      if (entries.some((entry) => entry.target === boardRef.current)) {
        debouncedUpdateSizes();
      }
    });

    if (boardRef.current) {
      resizeObserver.observe(boardRef.current);
    }

    // Also listen to window resize as a fallback/additional measure
    if (typeof window !== "undefined") {
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

export const useDnDLogic = () => {
  const { validPositions } = useGameStore();

  const { boardRef, cellRef, boardRect, dynamicCellSize } =
    useBoardAndCellSizes();

  const calculateDynamicOffset = useCallback(
    (cursorX: number, cursorY: number): Position => {
      if (typeof window === "undefined") {
        return { x: 1, y: 2 };
      }

      const referenceHeight = window.innerHeight;
      const referenceWidth = window.innerWidth;
      const referenceCenter = referenceWidth / 2;

      const normalizedCursorY = Math.max(
        0,
        Math.min(1, cursorY / referenceHeight)
      );
      const normalizedCursorX = (cursorX - referenceCenter) / referenceCenter;

      const dynamicOffsetY =
        MIN_OFFSET_Y + (1 - normalizedCursorY) * (MAX_OFFSET_Y - MIN_OFFSET_Y);

      const dynamicOffsetX = 1 - normalizedCursorX * MAX_OFFSET_X;

      return { x: dynamicOffsetX, y: dynamicOffsetY };
    },
    []
  );

  // Кэш для результатов calculateGridPosition
  const gridPositionCache = useRef(new Map<string, Position | null>());

  // Очищаем кэш при изменении важных параметров
  useEffect(() => {
    gridPositionCache.current.clear();
  }, [validPositions, boardRect, dynamicCellSize]);

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

      // Создаем ключ кэша на основе входных параметров
      const cacheKey = JSON.stringify({
        clientX: Math.round(clientX),
        clientY: Math.round(clientY),
        currentDragPosition,
        lastHighlightedPosition,
        draggedPieceId: draggedPiece.uniqueId,
        boardRect: {
          left: Math.round(rect.left),
          top: Math.round(rect.top)
        },
        dynamicCellSize: Math.round(dynamicCellSize * 100) / 100, // Округляем для стабильности
        validPositionsLength: validPositions.length
      });

      // Проверяем кэш
      if (gridPositionCache.current.has(cacheKey)) {
        return gridPositionCache.current.get(cacheKey);
      }

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

      const pitch = dynamicCellSize + GAP_SIZE_PX;

      const baseX = Math.round((relativeX - offsetX) / pitch);
      const baseY = Math.round((relativeY - offsetY) / pitch);

      const nearestPosition = findNearestValidPosition(
        validPositions,
        { x: baseX, y: baseY },
        lastHighlightedPosition
      );

      // Сохраняем результат в кэш
      gridPositionCache.current.set(cacheKey, nearestPosition);

      // Ограничиваем размер кэша (максимум 1000 записей)
      if (gridPositionCache.current.size > 1000) {
        const firstKey = gridPositionCache.current.keys().next().value;
        if (firstKey) {
          gridPositionCache.current.delete(firstKey);
        }
      }

      return nearestPosition;
    },
    [validPositions, boardRect, dynamicCellSize, calculateDynamicOffset]
  );

  // Функция для очистки кэша при изменении важных параметров
  const clearGridPositionCache = useCallback(() => {
    gridPositionCache.current.clear();
  }, []);

  return {
    boardRef,
    calculateGridPosition,
    dynamicCellSize,
    cellRef,
    boardRect,
    calculateDynamicOffset,
    clearGridPositionCache,
  };
};


export default useDnDLogic;