import { debounce } from "@/utils/helpers";
import { useRef, useState, useEffect, useCallback } from "react";
import { useGameStore } from "../lib/state/store";
import { findNearestValidPosition } from "../lib/core/positions";
import { getEventCoordinates } from "@/utils/events";
import { Position } from "../lib/data/types";

// Константы для dnd-логики и размеров
const DEFAULT_CELL_SIZE = 43.75;
const GAP_SIZE_PX = 2;

const MIN_OFFSET_Y = 1;
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
      }
    };

    const debouncedUpdateSizes = debounce(updateSizes, 150); // Увеличили до 150ms для мобильных

    // Update sizes initially
    updateSizes();

    // Add resize observer to boardRef for more accurate updates with RAF throttling
    let resizeRafId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.target === boardRef.current)) {
        // RAF throttling для ResizeObserver
        if (resizeRafId) return;
        resizeRafId = requestAnimationFrame(() => {
          resizeRafId = null;
          debouncedUpdateSizes();
        });
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
        if (resizeRafId) {
          cancelAnimationFrame(resizeRafId);
        }
        window.removeEventListener("resize", debouncedUpdateSizes);
      };
    }

    return () => {
      resizeObserver.disconnect();
      if (resizeRafId) {
        cancelAnimationFrame(resizeRafId);
      }
    };
  }, [boardRef, cellRef]);

  return { boardRef, cellRef, boardRect, dynamicCellSize };
};

export const useDnDLogic = () => {
  const { validPositions } = useGameStore();

  const { boardRef, cellRef, boardRect, dynamicCellSize } =
    useBoardAndCellSizes();

  // Кэшируем window размеры для производительности
  const windowSizeRef = useRef({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateWindowSize = () => {
      if (typeof window !== "undefined") {
        windowSizeRef.current = {
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
    };
    
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  const calculateDynamicOffset = useCallback(
    (cursorX: number, cursorY: number): Position => {
      if (typeof window === "undefined") {
        return { x: 1, y: 2 };
      }

      // ✅ Используем кэшированные размеры вместо DOM доступа!
      const referenceHeight = windowSizeRef.current.height || window.innerHeight;
      const referenceWidth = windowSizeRef.current.width || window.innerWidth;
      const referenceCenter = referenceWidth / 2;

      const normalizedCursorY = Math.max(
        0,
        Math.min(1, cursorY / referenceHeight)
      );

      // const normalizedCursorX = (cursorX - referenceCenter) / referenceCenter;

      
      const dynamicOffsetY =
        MIN_OFFSET_Y + (1 - normalizedCursorY) * (MAX_OFFSET_Y - MIN_OFFSET_Y);

      // Фигура всегда центрируется относительно курсора по X
      const dynamicOffsetX = 1;


      return { x: dynamicOffsetX, y: dynamicOffsetY };
    },
    []
  );

  // Кэш для результатов calculateGridPosition (без JSON.stringify!)
  const gridPositionCache = useRef(new Map<string, Position | null>());
  const lastComputedResult = useRef<{key: string, result: Position | null}>({ key: '', result: null });

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

        return null;
      }

      const { clientX, clientY } = getEventCoordinates(e);

      const { draggedPiece } = useGameStore.getState();
      if (!draggedPiece) return null;

      // Создаем простой строковый ключ БЕЗ JSON.stringify!
      const cacheKey = `${Math.round(clientX)}_${Math.round(clientY)}_${currentDragPosition.x}_${currentDragPosition.y}_${draggedPiece.uniqueId}_${Math.round(rect.left)}_${Math.round(rect.top)}_${Math.round(dynamicCellSize * 100)}_${validPositions.length}`;
      
      // Быстрая проверка последнего результата
      if (lastComputedResult.current.key === cacheKey) {
        return lastComputedResult.current.result;
      }

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
      lastComputedResult.current = { key: cacheKey, result: nearestPosition };

      // Ограничиваем размер кэша (максимум 500 записей для лучшей производительности)
      if (gridPositionCache.current.size > 500) {
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