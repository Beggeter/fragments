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
import { playGameOver, playPlacePiece } from "@/lib/utils/sound";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import trophyImg from "@/public/record.png";
import { LoadingSpinner } from "./LoadingSpinner";
import Particles from "@tsparticles/react";

const DEFAULT_CELL_SIZE = 43.75;
const GAP_SIZE_PX = 2; // Исходя из gap-0.5 в TailwindCSS (0.125rem * 16px)

interface GameBoardProps {
  width?: number;
  height?: number;
  onScoreUpdate: (score: number) => void;
  onGameOver: () => void;
  onExitGame: () => void;
  onShowSpinner?: () => void;
  onBoardRectChange?: (rect: DOMRect | null) => void;
  clearedLine?: number | null;
}

// Тип для аргументов handlePiecePlacement
type HandlePiecePlacementArgs = {
  x: number;
  y: number;
  board: any[][];
  draggedPiece: any;
  hoverCell: any;
  width: number;
  placePiece: (x: number, y: number) => void;
  setClearingHorizontalLines: (lines: number[]) => void;
  setClearingVerticalLines: (lines: number[]) => void;
  setIsAnimating: (anim: boolean) => void;
  boardRect: DOMRect | null;
  dynamicCellSize: number;
  GAP_SIZE_PX: number;
  useGameStore: any;
};

// Компонент для партиклов в клетке
const CellParticles = ({
  x,
  y,
  trigger,
}: {
  x: number;
  y: number;
  trigger: boolean;
}) => {
  if (!trigger) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        width: 40,
        height: 40,
        zIndex: 20,
      }}
    >
      <Particles
        id={`cell-particles-${x}-${y}`}
        options={{
          particles: {
            color: { value: ["#fff", "#fbbf24", "#38bdf8", "#f472b6"] },
            number: { value: 18 },
            shape: { type: "circle" },
            size: { value: { min: 2, max: 6 } },
            move: {
              enable: true,
              speed: 7,
              direction: "none",
              outModes: { default: "destroy" },
            },
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
    [Math.floor((n - 1) / 2), Math.floor((m - 1) / 2)],
    [Math.floor((n - 1) / 2), Math.ceil((m - 1) / 2)],
    [Math.ceil((n - 1) / 2), Math.floor((m - 1) / 2)],
    [Math.ceil((n - 1) / 2), Math.ceil((m - 1) / 2)],
  ];
  let q = [...centers];
  let idx = 0;
  while (q.length) {
    const [y, x] = q.shift()!;
    if (y < 0 || y >= n || x < 0 || x >= m || visited[y][x]) continue;
    visited[y][x] = true;
    res.push([y, x]);
    // Добавляем соседей по часовой стрелке
    q.push([y, x + 1], [y + 1, x], [y, x - 1], [y - 1, x]);
  }
  // Убираем дубли
  return res.filter(
    ([y, x], i) => res.findIndex(([yy, xx]) => yy === y && xx === x) === i
  );
};

export const GameBoard: React.FC<
  GameBoardProps & { onShowSpinner?: () => void }
> = ({
  width = 8,
  height = 8,
  onScoreUpdate,
  onGameOver,
  onExitGame,
  onShowSpinner,
  onBoardRectChange,
  clearedLine,
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
    piecesPlaced,
  } = useGameStore();

  const {
    boardRef,
    cellRef,
    calculateGridPosition,
    dynamicCellSize,
    boardRect,
    calculateDynamicOffset,
  } = useDnDLogic();

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
  // const [laserMode, setLaserMode] = useState<LaserMode>("off");
  const [laserActiveLine, setLaserActiveLine] = useState<number | null>(null);
  const [isLaserTouching, setIsLaserTouching] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [laserMode, setLaserMode] = useState(false);

  // История ходов для undo (board, score, currentPieces, piecesPlaced)
  const [history, setHistory] = useState<
    {
      board: Matrix;
      score: number;
      currentPieces: Block[];
      piecesPlaced: number;
    }[]
  >([]);

  const blockGenerator = new BlockGenerator();
  const scoreCalculator = new ScoreCalculator();
  const difficultyEvaluator = new DifficultyEvaluator();

  const scoreDisplayRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();
  const { isAdmin } = useAdminAuth();

  const [adminRecord, setAdminRecord] = useState<number | null>(null);

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
          playPlacePiece();

          onPiecePlaced({
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

  // Устанавливаем onGameOver callback в store
  useEffect(() => {
    setOnGameOver(() => {
      playGameOver();
      onGameOver();
    });

    return () => {
      setOnGameOver(null);
    };
  }, [onGameOver, setOnGameOver]);

  // Получаем рекорд для админа при монтировании/смене статуса
  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users/610936383")
        .then((res) => res.json())
        .then((data) =>
          setAdminRecord(typeof data.record === "number" ? data.record : 0)
        )
        .catch(() => setAdminRecord(0));
    } else {
      setAdminRecord(null);
    }
  }, [isAdmin]);

  // Функция для удаления строки или столбца
  const handleLaserCellClick = (row: number, col: number) => {
    console.log("Laser click", row, col);
    if (!board) return;
    const isRow = true; // TODO: добавить определение по координате клика
    let newBoard = board.map((rowArr) => rowArr.map((cell) => ({ ...cell })));
    if (isRow) {
      newBoard[row] = newBoard[row].map(() => ({ value: 0 }));
    } else {
      newBoard = newBoard.map((r) =>
        r.map((cell, idx) => (idx === col ? { value: 0 } : cell))
      );
    }
    useGameStore.setState({ board: newBoard });
    setLaserMode(false);
    // Сохраняем в history для undo
    setHistory((prev) => [
      ...prev,
      {
        board: newBoard.map((row) => row.map((cell) => ({ ...cell }))),
        score,
        currentPieces: currentPieces.map((piece) => ({ ...piece })),
        piecesPlaced: piecesPlaced,
      },
    ]);
  };

  // Новый обработчик undo
  const handleUndo = useCallback(() => {
    let last: (typeof history)[number] | undefined;
    setHistory((prev) => {
      if (prev.length < 2) return prev;
      const newHistory = prev.slice(0, -1);
      last = newHistory[newHistory.length - 1];
      return newHistory;
    });
    // setHistory асинхронный, поэтому используем setTimeout, чтобы last был актуальным
    setTimeout(() => {
      if (last) {
        useGameStore.setState({
          board: last.board.map((row) => row.map((cell) => ({ ...cell }))),
          score: last.score,
          currentPieces: last.currentPieces.map((piece) => ({ ...piece })),
          piecesPlaced: last.piecesPlaced,
        });
      }
    }, 0);
  }, [history]);

  // Обработчик кликов по бустерам
  const handleBoosterClick = useCallback(
    (boosterId: string) => {
      if (boosterId === "laser") {
        setLaserMode(true);
      } else if (boosterId === "undo") {
        handleUndo();
      } else if (boosterId === "spinner") {
        if (onShowSpinner) onShowSpinner();
        // const emptyBoard = board.map((row) => row.map(() => ({ value: 0 })));
        // useGameStore.setState({ board: emptyBoard, score: score + 300 });
        useGameStore.setState({ score: score + 300 });
        // setHistory((prev) => [
        //   ...prev,
        //   {
        //     board: emptyBoard.map((row) => row.map((cell) => ({ ...cell }))),
        //     score: score + 300,
        //     currentPieces: currentPieces.map((piece) => ({ ...piece })),
        //     piecesPlaced: 0,
        //   },
        // ]);
      } else {
        alert(`Бустер ${boosterId} пока не реализован`);
      }
    },
    [board, score, currentPieces, handleUndo, onShowSpinner]
  );

  // Функция-обёртка для размещения фигуры с сохранением истории и рекорда
  const onPiecePlaced = useCallback(
    (args: HandlePiecePlacementArgs) => {
      handlePiecePlacement({
        ...args,
        onAfterPlacement: async () => {
          const { board, score, currentPieces, piecesPlaced } =
            useGameStore.getState();

          // Сохраняем в историю
          setHistory((prev) => [
            ...prev,
            {
              board: board.map((row) => row.map((cell) => ({ ...cell }))),
              score,
              currentPieces: currentPieces.map((piece) => ({ ...piece })),
              piecesPlaced,
            },
          ]);

          // --- Сохранение рекорда ---
          const targetTelegramId = isAdmin ? "610936383" : user?.telegramId;
          const currentRecord = isAdmin ? adminRecord : user?.record;
          if (
            targetTelegramId &&
            typeof currentRecord === "number" &&
            score > currentRecord
          ) {
            try {
              await fetch(`/api/users/${targetTelegramId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ record: score }),
              });
              if (isAdmin) setAdminRecord(score);
            } catch (e) {
              /* ignore */
            }
          }
        },
      });
    },
    [user, adminRecord, isAdmin]
  );

  useEffect(() => {
    if (onBoardRectChange) {
      onBoardRectChange(boardRect);
    }
  }, [boardRect, onBoardRectChange]);

  // Получаем цвет фигуры для подсветки
  const potentialLineColor = draggedPiece?.color ? draggedPiece.color : "#fff";

  // Функция для генерации партиклов
  function renderParticles(
    lineType: "row" | "col",
    idx: number,
    color: string
  ) {
    const count = 7 + Math.floor(Math.random() * 4); // 7-10 партиклов
    const particles = [];
    for (let i = 0; i < count; i++) {
      const size = 6 + Math.random() * 8;
      const anim = Math.random() > 0.5 ? "star-fade" : "star-scale";
      const delay = Math.random() * 1.5;
      let style: React.CSSProperties = {
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, #fff 60%, ${color} 100%)`,
        opacity: 0.7 + Math.random() * 0.3,
        filter: "blur(0.5px)",
        animation: `${anim} 1.5s ${delay}s infinite`,
        zIndex: 30,
        pointerEvents: "none",
      };
      if (lineType === "row") {
        style.left = `${(i + 0.5) * (100 / (count + 1))}%`;
        style.top = `${50 + (Math.random() - 0.5) * 60}%`;
        style.transform = `translate(-50%, -50%)`;
      } else {
        style.top = `${(i + 0.5) * (100 / (count + 1))}%`;
        style.left = `${50 + (Math.random() - 0.5) * 60}%`;
        style.transform = `translate(-50%, -50%)`;
      }
      particles.push(<div key={i} className="star-particle" style={style} />);
    }
    return particles;
  }

  // Простая логика определения потенциальных линий
  const potentialRows: number[] = [];
  const potentialCols: number[] = [];

  if (potentialClearHighlight && potentialClearHighlight.length > 0) {
    // Проверяем горизонтальные линии
    for (let y = 0; y < potentialClearHighlight.length; y++) {
      const row = potentialClearHighlight[y];
      if (
        row &&
        row.some((cell: any) => typeof cell === "string" && cell === "row")
      ) {
        potentialRows.push(y);
      }
    }

    // Проверяем вертикальные линии
    for (let x = 0; x < (potentialClearHighlight[0]?.length || 0); x++) {
      let hasCol = false;
      for (let y = 0; y < potentialClearHighlight.length; y++) {
        const cell = potentialClearHighlight[y]?.[x];
        if (typeof cell === "string" && cell === "col") {
          hasCol = true;
          break;
        }
      }
      if (hasCol) {
        potentialCols.push(x);
      }
    }
  }

  useEffect(() => {
    if (!clearedLine || clearedLine === null) return;
    let updated = false;
    let newBoard = board;
    if (clearedLine !== null && !newBoard[clearedLine].every(cell => cell.value === 0)) {
      newBoard = newBoard.map((row, y) =>
        y === clearedLine ? row.map(() => ({ value: 0 })) : row
      );
      updated = true;
    }
    if (updated) {
      Promise.resolve().then(() => {
        useGameStore.setState({ board: newBoard });
        setHistory((prev) => [
          ...prev,
          {
            board: newBoard.map((row) => row.map((cell) => ({ ...cell }))),
            score,
            currentPieces: currentPieces.map((piece) => ({ ...piece })),
            piecesPlaced: piecesPlaced,
          },
        ]);
      });
    }
  }, [clearedLine]);

  return (
    <div className="relative">
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
          {/* <div className="text-2xl font-figtree font-bold text-white">
            500 
          </div> */}
          <div className="flex flex-col items-center">
            <span className="record-trophy">
              {isAdmin ? adminRecord ?? 0 : user?.record ?? 0}
            </span>
            <img
              src={trophyImg.src}
              alt="Трофей"
              style={{ width: 40, height: 40, marginTop: 8 }}
            />
          </div>
          <div
            className="cursor-pointer flex items-center justify-center "
            onClick={() => setIsSettingsOpen(true)}
          >
            <img
              src={settings.src || settings}
              alt="settings"
              className="w-10 h-10 drop-shadow-lg clickable"
              style={{
                zIndex: 30,
                WebkitTransform: "translateZ(0)",
                transform: "translateZ(0)",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
              }}
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

        <BoostersPanel onBoosterClick={handleBoosterClick} />

        <div className="w-full aspect-square flex justify-center items-center p-4 sm:max-w-xs sm:max-h-xs relative">
          <div className="relative w-full h-full">
            <ComboVisualizer speed={4} lastScore={lastScoreResult} />
            {/* Glow-оверлеи для потенциальных линий */}
            {potentialRows.map((y) => (
              <div
                key={`glow-row-${y}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: `calc(${y} * 12.5% + 0.5px * ${y})`,
                  width: "100%",
                  height: "12.5%",
                  pointerEvents: "none",
                  zIndex: 200,
                  boxShadow: "0 0 32px 16px #ff0, 0 0 64px 32px #f00",
                  borderRadius: 8,
                  background: "rgba(255,0,0,0.5)",
                  opacity: 1,
                }}
                className="find-me"
              >
                {renderParticles("row", y, potentialLineColor)}
              </div>
            ))}
            {potentialCols.map((x) => (
              <div
                key={`glow-col-${x}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: `calc(${x} * 12.5% + 0.5px * ${x})`,
                  width: "12.5%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 200,
                  boxShadow: "0 0 32px 16px #ff0, 0 0 64px 32px #f00",
                  borderRadius: 8,
                  background: "rgba(255,0,0,0.5)",
                  opacity: 1,
                }}
              >
                {renderParticles("col", x, potentialLineColor)}
              </div>
            ))}
            <div
              ref={boardRef}
              id="game-board-grid"
              className="relative z-10 grid grid-cols-8 grid-rows-8 gap-0.5 w-full h-full bg-gray-800 p-1 rounded-lg will-change-transform"
            >
              {board.map((row, y) => (
                <React.Fragment key={y}>
                  {row.map((cell, x) => {
                    const isFirst = y === 0 && x === 0;
                    const {
                      highlight,
                      isInClearingLine,
                      isPotentiallyCleared,
                      potentialClearColor,
                    } = getCellEffects({
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
                        potentialClearColor={potentialClearColor}
                        isFirst={isFirst}
                        cellRef={cellRef}
                        onClick={
                          laserMode
                            ? () => handleLaserCellClick(y, x)
                            : undefined
                        }
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
    </div>
  );
};

export default GameBoard;
