"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { useGameStore } from "../lib/state/store";
import { getCellsToClear } from "@/lib/core/engine";
import { findNearestValidPosition } from "../lib/core/positions";
import { Block, BlockColor, Matrix, Position } from "../lib/data/types";
import { getEventCoordinates } from "@/utils/events";
import { ScoreDisplay } from "./board/ScoreDisplay";
import { BlockGenerator } from "../lib/core/blockGenerator";
import { DifficultyEvaluator } from "../lib/core/difficulty";
import { ScoreCalculator } from "../lib/core/scoreCalculator";
import { ComboVisualizer } from "./board/ComboVisualizer";
import { DraggablePiecesSection } from "./DraggablePiecesSection";
import { BoostersPanel } from "./BoostersPanel";
import { BoostersPanelSimple } from "./BoostersPanelSimple";
import { throttle } from "@/utils/helpers";
import BoardCell from "./board/BoardCell";
import useDnDLogic from "@/hooks/useDnDLogic";
import { getCellEffects } from "./board/getCellEffects";
import { calculatePotentialClearLines } from "./board/boardUtils";
import { handlePiecePlacement } from "./board/boardUtils";
import SettingsModal from "@/components/UI/SettingsModal";
import settings from "@/public/settings.svg";
import { playPlacePiece  } from "@/lib/utils/sound";

const DEFAULT_CELL_SIZE = 43.75;
const GAP_SIZE_PX = 2; // Исходя из gap-0.5 в TailwindCSS (0.125rem * 16px)

interface GameBoardProps {
  width?: number;
  height?: number;
  onScoreUpdate: (score: number) => void;
  onGameOver: () => void;
  onExitGame: () => void;
}

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
  } = useDnDLogic();

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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateCoords);
      return () => window.removeEventListener("resize", updateCoords);
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
          playPlacePiece()

          handlePiecePlacement({
            x: hoverCell.x,
            y: hoverCell.y,
            board,
            draggedPiece,
            hoverCell,
            width,
            placePiece,
            setClearingHorizontalLines,
            setClearingVerticalLines,
            setIsAnimating,
            boardRect,
            dynamicCellSize,
            GAP_SIZE_PX,
            useGameStore,
          });
        } else {
          endDrag();
        }
      }
      setHoverCell(null);
      setLastHighlightedPosition(null); // Сбрасываем при окончании перетаскивания
    };

    if (typeof window !== "undefined") {
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

  useEffect(() => {
    if (draggedPiece && hoverCell) {
      const potentialLines = calculatePotentialClearLines(
        board,
        draggedPiece,
        hoverCell,
        width,
        height
      );
      setPotentialClearHighlight(potentialLines);
    } else {
      setPotentialClearHighlight([]);
    }
  }, [draggedPiece, hoverCell, board, width, height]);

  // useEffect(() => {
  //   if (lastScoreResult) {
  //     if (lastScoreResult.clearedLines && lastScoreResult.clearedLines > 0) {
  //       playLineClear();
  //     } else {
  //       playPlacePiece();
  //     }
  //   }
  // }, [lastScoreResult]);

  // useEffect(() => {
  //   if (gameOver) {
  //     playGameOver();
  //   }
  // }, [gameOver]);

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
    <>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRestart={() => {
          resetGame();
          setIsSettingsOpen(false);
        }}
      />
      <div
        className={`flex flex-col items-center gap-5 min-h-screen bg-[var(--game-background)] p-4 no-select will-change-auto`}
      >
        <div className="flex justify-between w-full -mb-5 items-center sm:max-w-xs sm:max-h-xs">
          <div className="text-2xl font-figtree font-bold text-white">
            500 {/* Placeholder for trophy */}
          </div>
          <div className="cursor-pointer flex items-center justify-center " onClick={() => setIsSettingsOpen(true)}>
            <img
              src={settings.src || settings}
              alt="settings"
              className="w-10 h-10 drop-shadow-lg clickable"
              style={{ zIndex: 30, WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
            />
          </div>
        </div>

        <div className="flex justify-center items-center w-full -mt-8 ">
          <ScoreDisplay
            ref={scoreDisplayRef}
            newScore={score}
            moveScore={lastScoreResult}
          />
        </div>

        <BoostersPanelSimple />

        {/* Game Board Container - takes full width and maintains aspect ratio */}

        <div className="w-full aspect-square flex justify-center items-center p-4 sm:max-w-xs sm:max-h-xs">
          <div className="relative w-full h-full">
            <ComboVisualizer speed={4} lastScore={lastScoreResult} />

            <div
              ref={boardRef}
              className="relative z-10 grid grid-cols-8 grid-rows-8 gap-0.5 w-full h-full bg-gray-800 p-1 rounded-lg will-change-transform"
            >
              {board.map((row, y) => (
                <React.Fragment key={y}>
                  {row.map((cell, x) => {
                    const isFirst = y === 0 && x === 0;
                    const { highlight, isInClearingLine, isPotentiallyCleared } =
                      getCellEffects({
                        x,
                        y,
                        draggedPiece,
                        hoverCell,
                        potentialClearHighlight,
                        clearingHorizontalLines,
                        clearingVerticalLines,
                      });

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
                        cellRef={cellRef}
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
      </div>
    </>
  );
};

export default GameBoard;
