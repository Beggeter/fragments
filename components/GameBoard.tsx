"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import { useGameStore } from "../lib/state/store";
import { Block, BlockColor, Matrix, Position } from "../lib/data/types";
import { getEventCoordinates } from "@/utils/events";
import { ScoreDisplay } from "./board/ScoreDisplay";
import { BlockGenerator } from "../lib/core/blockGenerator";
import { DifficultyEvaluator } from "../lib/core/difficulty";
import { ScoreCalculator } from "../lib/core/scoreCalculator";
import { ComboVisualizer } from "./board/ComboVisualizer";
import { DraggablePiecesSection } from "./DraggablePiecesSection";
import { BoostersPanel } from "./BoostersPanel";
import BoardCell from "./board/BoardCell";
import useDnDLogic from "@/hooks/useDnDLogic";
import { getCellEffects } from "./board/getCellEffects";
import { calculatePotentialClearLines } from "./board/boardUtils";
import { handlePiecePlacement } from "./board/boardUtils";
import SettingsModal from "@/components/UI/SettingsModal";
import settings from "@/public/settings.svg";
import { playPlacePiece } from "@/lib/utils/sound";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useGameSave } from "@/hooks/useGameSave";
import trophyImg from "@/public/record.png";
import Particles from "@tsparticles/react";
import { getThemeByScore } from "./UI/colorThemes";
import { useGameOver } from "@/hooks/useGameOver";
import { LoadingNumberAnimation } from "./LoadingNumberAnimation";
import { motion } from "framer-motion";
import { Piece } from "./pieces/Piece";
import NeonGlowOutline from "./NeonGlowOutline";
import { NeonGlowParticles } from "./board/NeonGlowParticles";
import BoardClearAnimationsOverlay from "./board/BoardClearAnimationsOverlay";
import { v4 as uuidv4 } from "uuid";

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
  onGoHome?: () => void;
  isIntentionalRestart?: boolean;
  onRestartComplete?: () => void;
  onOpenShop?: () => void;
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

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

// --- соответствие BlockColor -> HEX ---
const COLOR_HEX: Record<string, string> = {
  blue: "#2968EA",
  red: "#D03024",
  orange: "#FF9D28",
  yellow: "#FFC832",
  cyan: "#4FC4D3",
  purple: "#8329C6",
  green: "#6AD469",
  pink: "#FF4C76",
};

// Восстановлено локальное определение типа AnimationCell
// чтобы не было ошибок типов
// (раньше импортировался, теперь определяем здесь)
type AnimationCell = {
  id: string;
  x: number;
  y: number;
  color: BlockColor;
  delay?: number;
};

export const GameBoard: React.FC<
  GameBoardProps & { onShowSpinner?: () => void }
> = ({
  width = 8,
  height = 8,
  onScoreUpdate,
  onGameOver,
  onShowSpinner,
  onBoardRectChange,
  clearedLine,
  onGoHome,
  isIntentionalRestart: externalIsIntentionalRestart,
  onRestartComplete,
  onOpenShop,
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
  // const [potentialClearHighlight, setPotentialClearHighlight] = useState<
  //   boolean[][]
  // >([]);
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
  const [bombMode, setBombMode] = useState(false);
  const [bombCenter, setBombCenter] = useState<{ x: number; y: number } | null>(
    null
  );

  // История ходов для undo (board, score, currentPieces, piecesPlaced)
  const [history, setHistory] = useState<
    {
      board: Matrix;
      score: number;
      currentPieces: Block[];
      piecesPlaced: number;
    }[]
  >([]);

  const [clearAnimations, setClearAnimations] = useState<AnimationCell[]>([]);

  const blockGenerator = new BlockGenerator();
  const scoreCalculator = new ScoreCalculator();
  const difficultyEvaluator = new DifficultyEvaluator();

  const scoreDisplayRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();
  const { isAdmin } = useAdminAuth();
  const { loadGame, forceSave, saveAfterAction, clearSaves } = useGameSave();

  const [boosters, setBoosters] = useState<any[]>([]);

  // Добавляем состояние для отслеживания намеренного перезапуска
  const [isIntentionalRestart, setIsIntentionalRestart] = useState(false);

  // Создаем стабильную функцию для завершения перезапуска
  const handleRestartComplete = useCallback(() => {
    setIsIntentionalRestart(false);
    if (onRestartComplete) {
      onRestartComplete();
    }
  }, [onRestartComplete]);

  // --- Вынести fetchBoosters наружу, чтобы использовать в useBooster ---
  const fetchBoosters = useCallback(async () => {
    let tgid: number | undefined = user?.telegramId;
    if (isAdmin && process.env.NODE_ENV === 'development') {
      tgid = 610936383;
    }
    if (!tgid) return;
    const res = await fetch(`/api/users/${tgid}/boosters`);
    const data = await res.json();
    const boostersForPanel = (data.availableBoosters as Array<any>).map((booster: any) => {
      const userBooster = (data.userBoosters as Array<any>).find(
        (ub: any) => ub.boosterTypeId === booster.id
      );
      let icon = '';
      if (booster.name === 'undo') icon = '/boosters/back.png';
      if (booster.name === 'bomb') icon = '/boosters/bomb.svg';
      if (booster.name === 'whirlwind') icon = '/boosters/spinner.png';
      return {
        id: booster.name,
        name: booster.name,
        icon,
        quantity: userBooster ? userBooster.quantity : 0,
        boosterTypeId: booster.id,
      };
    });
    setBoosters(boostersForPanel);
  }, [user?.telegramId, isAdmin]);

  useEffect(() => {
    fetchBoosters();
  }, [fetchBoosters]);

  const [adminRecord, setAdminRecord] = useState<number | null>(null);
  const [isRecordLoading, setIsRecordLoading] = useState(true); // Состояние загрузки рекорда

  // Получить текущую тему на основе последнего результата
  const currentTheme = getThemeByScore(lastScoreResult?.comboLevel);

  const [explodingCells, setExplodingCells] = useState<null | {
    cells: {
      x: number;
      y: number;
      color: string;
      dx: number;
      dy: number;
      rot: number;
    }[];
    cellSize: number;
  }>(null);

  const [isComboExploding, setIsComboExploding] = useState(false);

  const potentialClearHighlight = useMemo(() => {
    if (!draggedPiece || !hoverCell) return [];
    return calculatePotentialClearLines(
      board,
      draggedPiece,
      hoverCell,
      width,
      height
    );
  }, [draggedPiece, hoverCell, board, width, height]);

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
    const initializeGameWithSave = async () => {
      if (currentPieces.length === 0) {
        // Если это намеренный перезапуск, не загружаем сохранение
        if (isIntentionalRestart || externalIsIntentionalRestart) {
          console.log('Intentional restart, starting new game');
          initializeGame();
          handleRestartComplete(); // Используем стабильную функцию
          return;
        }
        
        // Пытаемся загрузить сохраненную игру
        const gameLoaded = await loadGame();
        
        if (!gameLoaded) {
          // Если сохраненной игры нет, начинаем новую
          console.log('No saved game found, starting new game');
          initializeGame();
        } else {
          console.log('Saved game loaded successfully');
        }
      }
    };

    initializeGameWithSave();
  }, [currentPieces.length, initializeGame, loadGame, isIntentionalRestart, externalIsIntentionalRestart, handleRestartComplete]);

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
    const handleMove = (e: MouseEvent | TouchEvent) => {
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
    };

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

  // Создаем стабильную функцию для game over
  const handleGameOver = useCallback(() => {
    // Очищаем все сохранения при проигрыше
    clearSaves();
    onGameOver();
  }, [clearSaves, onGameOver]);

  // Устанавливаем onGameOver callback в store
  useGameOver({
    onGameOver: handleGameOver,
    width,
    height,
  });

  // Получаем рекорд для админа при монтировании/смене статуса
  useEffect(() => {
    if (isAdmin) {
      setIsRecordLoading(true);
      fetch("/api/users/610936383")
        .then((res) => res.json())
        .then((data) => {
          setAdminRecord(typeof data.record === "number" ? data.record : 0);
          setIsRecordLoading(false);
        })
        .catch(() => {
          setAdminRecord(0);
          setIsRecordLoading(false);
        });[
    {
        "id": "block-25",
        "uniqueId": "block-25_1751917052455_0",
        "color": "blue",
        "matrixSize": "2x3"
    },
    {
        "id": "block-2",
        "uniqueId": "block-2_1751917052455_1",
        "color": "green",
        "matrixSize": "1x4"
    },
    {
        "id": "block-7",
        "uniqueId": "block-7_1751917052455_2",
        "color": "yellow",
        "matrixSize": "5x1"
    }
]
    } else {
      setAdminRecord(null);
      setIsRecordLoading(false);
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
    
    // Сохраняем игру после использования лазера
    saveAfterAction();
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

  // --- Добавляю функцию списывания бустера ---
  const useBooster = async (boosterName: string) => {
    let boosterTypeId: number | undefined;
    const booster = boosters.find((b) => b.id === boosterName);
    if (!booster) return;
    boosterTypeId = booster.boosterTypeId || booster.id;
    if (!boosterTypeId) return;
    let tgid: number | undefined = user?.telegramId;
    if (isAdmin && process.env.NODE_ENV === 'development') {
      tgid = 610936383;
    }
    if (!tgid) return;
    const res = await fetch(`/api/users/${tgid}/boosters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'use',
        boosterTypeId,
        quantity: 1,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Ошибка списания бустера');
      return false;
    }
    await fetchBoosters();
    return true;
  };

  // --- В обработчиках применения бомбы ---
  const handleBombMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bombMode || bombCenter === null) return;
    const cell = getCellFromPointer(e.clientX, e.clientY);
    if (cell) {
      const gridW = board[0].length;
      const gridH = board.length;
      const cx = clamp(cell.x, 1, gridW - 2);
      const cy = clamp(cell.y, 1, gridH - 2);
      const cellSize = boardRef.current ? boardRef.current.offsetWidth / gridW : 40;
      const cells = [];
      const maxDist = 120;
      const minDist = 80;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
            const cellData = board[y][x];
            if (cellData.value) {
              // Вектор от центра к клетке
              const vecX = x - cx;
              const vecY = y - cy;
              let dxx, dyy;
              if (vecX === 0 && vecY === 0) {
                const angle = Math.random() * 2 * Math.PI;
                const dist = minDist + Math.random() * (maxDist - minDist);
                dxx = Math.cos(angle) * dist;
                dyy = Math.sin(angle) * dist;
              } else {
                const len = Math.sqrt(vecX * vecX + vecY * vecY) || 1;
                const normX = vecX / len;
                const normY = vecY / len;
                const dist = minDist + Math.random() * (maxDist - minDist);
                dxx = normX * dist;
                dyy = normY * dist;
              }
              const rot = (Math.random() - 0.5) * 60;
              cells.push({
                x,
                y,
                color: String(cellData.color || "gray"),
                dx: dxx,
                dy: dyy,
                rot,
              });
            }
          }
        }
      }
      setExplodingCells({ cells, cellSize });
      // Очищаем клетки с поля
      const newBoard = board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (Math.abs(rowIdx - cy) <= 1 && Math.abs(colIdx - cx) <= 1) {
            return { ...cell, value: 0 };
          }
          return cell;
        })
      );
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
      setTimeout(() => setExplodingCells(null), 500);
      // --- Списываем бустер только после успешного применения ---
      await useBooster('bomb');
      // Сохраняем игру после использования бомбы
      saveAfterAction();
    }
    setBombMode(false);
    setBombCenter(null);
  };

  const handleBombTouchEnd = async (e: React.TouchEvent<HTMLDivElement>) => {
    if (!bombMode || bombCenter === null) return;
    const touch = e.changedTouches[0];
    if (!touch) {
      setBombMode(false);
      setBombCenter(null);
      return;
    }
    const cell = getCellFromPointer(touch.clientX, touch.clientY);
    if (cell) {
      const gridW = board[0].length;
      const gridH = board.length;
      const cx = clamp(cell.x, 1, gridW - 2);
      const cy = clamp(cell.y, 1, gridH - 2);
      const cellSize = boardRef.current ? boardRef.current.offsetWidth / gridW : 40;
      const cells = [];
      const maxDist = 120;
      const minDist = 80;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < gridW && y >= 0 && y < gridH) {
            const cellData = board[y][x];
            if (cellData.value) {
              // Вектор от центра к клетке
              const vecX = x - cx;
              const vecY = y - cy;
              let dxx, dyy;
              if (vecX === 0 && vecY === 0) {
                const angle = Math.random() * 2 * Math.PI;
                const dist = minDist + Math.random() * (maxDist - minDist);
                dxx = Math.cos(angle) * dist;
                dyy = Math.sin(angle) * dist;
              } else {
                const len = Math.sqrt(vecX * vecX + vecY * vecY) || 1;
                const normX = vecX / len;
                const normY = vecY / len;
                const dist = minDist + Math.random() * (maxDist - minDist);
                dxx = normX * dist;
                dyy = normY * dist;
              }
              const rot = (Math.random() - 0.5) * 60;
              cells.push({
                x,
                y,
                color: String(cellData.color || "gray"),
                dx: dxx,
                dy: dyy,
                rot,
              });
            }
          }
        }
      }
      setExplodingCells({ cells, cellSize });
      // Очищаем клетки с поля
      const newBoard = board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (Math.abs(rowIdx - cy) <= 1 && Math.abs(colIdx - cx) <= 1) {
            return { ...cell, value: 0 };
          }
          return cell;
        })
      );
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
      setTimeout(() => setExplodingCells(null), 500);
      // --- Списываем бустер только после успешного применения ---
      await useBooster('bomb');
      // Сохраняем игру после использования бомбы
      saveAfterAction();
    }
    setBombMode(false);
    setBombCenter(null);
  };

  // Функция для добавления анимаций очистки
  const addClearAnimations = useCallback((
    board: any[][],
    cellsToClear: boolean[][],
    placedPieceColor?: BlockColor
  ) => {
    const newAnims: AnimationCell[] = [];
    // Определяем очищаемые строки и столбцы
    const rowsToClear = new Set<number>();
    const colsToClear = new Set<number>();
    for (let y = 0; y < cellsToClear.length; y++) {
      let fullRow = true;
      for (let x = 0; x < cellsToClear[0].length; x++) {
        if (!cellsToClear[y][x]) fullRow = false;
      }
      if (fullRow) rowsToClear.add(y);
    }
    for (let x = 0; x < cellsToClear[0].length; x++) {
      let fullCol = true;
      for (let y = 0; y < cellsToClear.length; y++) {
        if (!cellsToClear[y][x]) fullCol = false;
      }
      if (fullCol) colsToClear.add(x);
    }
    // Горизонтальные линии
    for (let y = 0; y < cellsToClear.length; y++) {
      if (rowsToClear.has(y)) {
        for (let x = 0; x < cellsToClear[0].length; x++) {
          if (cellsToClear[y][x]) {
            newAnims.push({
              id: uuidv4(),
              x,
              y,
              color: usePlacedPieceColorInClearAnim
                ? placedPieceColor
                : board[y][x]?.color || placedPieceColor,
              delay: (cellsToClear[0].length - 1 - x) * 0.03,
            });
          }
        }
      }
    }
    // Вертикальные линии
    for (let x = 0; x < cellsToClear[0].length; x++) {
      if (colsToClear.has(x)) {
        for (let y = 0; y < cellsToClear.length; y++) {
          if (cellsToClear[y][x]) {
            newAnims.push({
              id: uuidv4(),
              x,
              y,
              color: usePlacedPieceColorInClearAnim
                ? placedPieceColor
                : board[y][x]?.color || placedPieceColor,
              delay: y * 0.03,
            });
          }
        }
      }
    }
    if (newAnims.length) {
      setClearAnimations((prev: AnimationCell[]) => [...prev, ...newAnims]);
      // Учитываем максимальный delay и длительность анимации взрыва (0.55s), плюс запас
      const ANIMATION_DURATION = 0.55; // должно совпадать с BoardClearAnimationsOverlay
      const maxDelay = Math.max(...newAnims.map((a) => a.delay ?? 0));
      setTimeout(() => {
        setClearAnimations((prev: AnimationCell[]) =>
          prev.filter((cell) => !newAnims.some((anim) => anim.id === cell.id))
        );
      }, (maxDelay + ANIMATION_DURATION) * 1000 + 80);
    }
  }, []);

  // Функция-обёртка для размещения фигуры с сохранением истории и рекорда
  const onPiecePlaced = useCallback(
    (args: HandlePiecePlacementArgs) => {
      handlePiecePlacement({
        ...args,
        addClearAnimations,
        onAfterPlacement: async () => {
          const { board, score, currentPieces, piecesPlaced } =
            useGameStore.getState();
          setHistory((prev) => [
            ...prev,
            {
              board: board.map((row) => row.map((cell) => ({ ...cell }))),
              score,
              currentPieces: currentPieces.map((piece) => ({ ...piece })),
              piecesPlaced,
            },
          ]);
          
          // Сохраняем игру после размещения фигуры
          saveAfterAction();
        },
      });
    },
    [setHistory, saveAfterAction, addClearAnimations]
  );

  useEffect(() => {
    if (onBoardRectChange) {
      onBoardRectChange(boardRect);
    }
  }, [boardRect, onBoardRectChange]);

  // Получаем цвет фигуры для подсветки
  const potentialLineColor = draggedPiece?.color ? draggedPiece.color : "#fff";

  // --- Управление цветом анимации очистки линий ---
  const usePlacedPieceColorInClearAnim = true; // Вынесено в переменную для удобства

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
    if (
      clearedLine !== null &&
      !newBoard[clearedLine].every((cell) => cell.value === 0)
    ) {
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

  const getCellFromPointer = (clientX: number, clientY: number) => {
    const boardEl = document.getElementById("game-board-grid");
    if (!boardEl) return null;
    const rect = boardEl.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const x = Math.floor(
      ((clientX - rect.left) / rect.width) * board[0].length
    );
    const y = Math.floor(((clientY - rect.top) / rect.height) * board.length);
    if (x < 0 || y < 0 || x >= board[0].length || y >= board.length)
      return null;
    return { x, y };
  };

  // Mouse events
  const handleBombMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bombMode) return;
    const cell = getCellFromPointer(e.clientX, e.clientY);
    if (!cell) return;
    setBombCenter(cell);
  };
  const handleBombMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bombMode || bombCenter === null) return;
    const cell = getCellFromPointer(e.clientX, e.clientY);
    setBombCenter(cell);
  };
  const handleBombMouseLeave = () => {
    if (!bombMode || bombCenter === null) return;
    setBombMode(false);
    setBombCenter(null);
  };

  // Touch events
  const handleBombTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!bombMode) return;
    const touch = e.touches[0];
    if (!touch) return;
    const cell = getCellFromPointer(touch.clientX, touch.clientY);
    if (!cell) return;
    setBombCenter(cell);
  };
  const handleBombTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!bombMode || bombCenter === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const cell = getCellFromPointer(touch.clientX, touch.clientY);
    setBombCenter(cell);
  };
  const handleBombTouchCancel = () => {
    if (!bombMode || bombCenter === null) return;
    setBombMode(false);
    setBombCenter(null);
  };

  function getBorderSides(
    area: boolean[][],
    x: number,
    y: number
  ):
    | { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean }
    | undefined {
    if (!area[y] || !area[y][x]) return undefined;
    const h = area.length;
    const w = area[0].length;
    return {
      top: y === 0 || !area[y - 1][x],
      bottom: y === h - 1 || !area[y + 1][x],
      left: x === 0 || !area[y][x - 1],
      right: x === w - 1 || !area[y][x + 1],
    };
  }

  // Возвращает центр выделения для рамки 3x3 так, чтобы рамка не выходила за границы поля, а выбранная клетка попадала внутрь
  function getBombHighlightCenter(
    cell: { x: number; y: number } | null,
    gridW: number,
    gridH: number
  ) {
    if (!cell) return null;
    let cx = cell.x;
    let cy = cell.y;
    if (cx < 1) cx = 1;
    if (cx > gridW - 2) cx = gridW - 2;
    if (cy < 1) cy = 1;
    if (cy > gridH - 2) cy = gridH - 2;
    return { cx, cy };
  }

  // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ КОНТУРА ---
  // BFS для поиска всех связанных областей в булевой матрице
  function findConnectedAreas(matrix: boolean[][]): number[][][] {
    const h = matrix.length;
    const w = matrix[0]?.length || 0;
    const visited = Array.from({ length: h }, () => Array(w).fill(false));
    const areas: number[][][] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (matrix[y][x] && !visited[y][x]) {
          // BFS
          const queue: [number, number][] = [[y, x]];
          const area: [number, number][] = [];
          visited[y][x] = true;
          while (queue.length) {
            const [cy, cx] = queue.shift()!;
            area.push([cy, cx]);
            for (const [dy, dx] of [
              [0, 1],
              [1, 0],
              [0, -1],
              [-1, 0],
            ]) {
              const ny = cy + dy,
                nx = cx + dx;
              if (
                ny >= 0 &&
                ny < h &&
                nx >= 0 &&
                nx < w &&
                matrix[ny][nx] &&
                !visited[ny][nx]
              ) {
                visited[ny][nx] = true;
                queue.push([ny, nx]);
              }
            }
          }
          areas.push(area);
        }
      }
    }
    return areas;
  }
  // Алгоритм обхода границы области (clockwise, возвращает массив точек)
  function traceBorder(
    area: [number, number][],
    matrix: boolean[][]
  ): [number, number][] {
    // area: массив [y, x], matrix: булева матрица
    // Находим стартовую точку (верхний левый угол области)
    const set = new Set(area.map(([y, x]) => `${y},${x}`));
    let minY = Infinity,
      minX = Infinity;
    for (const [y, x] of area) {
      if (y < minY || (y === minY && x < minX)) {
        minY = y;
        minX = x;
      }
    }
    let y: number = minY,
      x: number = minX;
    // Направления: вверх, вправо, вниз, влево
    const dirs = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    let dir = 1; // стартуем вправо
    const border: [number, number][] = [];
    const start: [number, number, number] = [y, x, dir];
    let steps = 0;
    do {
      border.push([x, y]);
      // Проверяем клетку слева относительно текущего направления
      let leftDir = (dir + 3) % 4;
      let [dy, dx] = dirs[leftDir];
      let ny = y + dy,
        nx = x + dx;
      if (set.has(`${ny},${nx}`)) {
        // Поворачиваем налево
        y = ny;
        x = nx;
        dir = leftDir;
      } else {
        // Иначе поворачиваем направо
        dir = (dir + 1) % 4;
      }
      steps++;
    } while (
      !(y === start[0] && x === start[1] && dir === start[2]) &&
      steps < 1000
    );
    return border;
  }
  // Новая функция: возвращает массив рёбер (отрезков) по границе области
  function getCellEdges(area: [number, number][], matrix: boolean[][]) {
    const edges: Array<[[number, number], [number, number]]> = [];
    const set = new Set(area.map(([y, x]) => `${y},${x}`));
    for (const [y, x] of area) {
      // top
      if (!set.has(`${y - 1},${x}`))
        edges.push([
          [x, y],
          [x + 1, y],
        ]);
      // right
      if (!set.has(`${y},${x + 1}`))
        edges.push([
          [x + 1, y],
          [x + 1, y + 1],
        ]);
      // bottom
      if (!set.has(`${y + 1},${x}`))
        edges.push([
          [x + 1, y + 1],
          [x, y + 1],
        ]);
      // left
      if (!set.has(`${y},${x - 1}`))
        edges.push([
          [x, y + 1],
          [x, y],
        ]);
    }
    return edges;
  }
  // Функция для построения замкнутого пути по рёбрам (greedy walk)
  function edgesToPath(
    edges: Array<[[number, number], [number, number]]>
  ): string {
    if (edges.length === 0) return "";
    // Строим карту: start -> end
    const edgeMap = new Map<string, [number, number]>();
    const used = new Set<number>();
    edges.forEach(([[x1, y1], [x2, y2]], i) => {
      edgeMap.set(`${x1},${y1}`, [x2, y2]);
    });
    // Находим стартовую точку (ту, которая встречается только один раз)
    const points = edges.flat();
    const count = new Map<string, number>();
    points.forEach(([x, y]) => {
      const k = `${x},${y}`;
      count.set(k, (count.get(k) || 0) + 1);
    });
    let startKey =
      Array.from(count.entries()).find(([k, v]) => v === 1)?.[0] ||
      `${edges[0][0][0]},${edges[0][0][1]}`;
    let path = `M ${startKey.replace(",", " ")}`;
    let currKey = startKey;
    let steps = 0;
    while (steps < edges.length + 5) {
      const next = edgeMap.get(currKey);
      if (!next) break;
      path += ` L ${next[0]} ${next[1]}`;
      currKey = `${next[0]},${next[1]}`;
      if (currKey === startKey) break;
      steps++;
    }
    path += " Z";
    return path;
  }

  // --- Обработчик клика по бустеру ---
  const handleBoosterClick = async (boosterId: string) => {
    if (boosterId === 'bomb') {
      setBombMode(true);
      setBombCenter(null);
      return;
    }
    const ok = await useBooster(boosterId);
    if (!ok) return;
    if (boosterId === 'undo') {
      handleUndo();
    }
    // ... другие действия для других бустеров ...
    
    // Сохраняем игру после использования бустера
    forceSave();
  };

  // --- iOS viewport width fix ---
  useEffect(() => {
    const setVw = () => {
      document.documentElement.style.setProperty('--app-vw', `${window.innerWidth}px`);
    };
    setVw();
    window.addEventListener('resize', setVw);
    return () => window.removeEventListener('resize', setVw);
  }, []);

  return (
    <div className="relative">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRestart={() => {
          setIsIntentionalRestart(true); // Устанавливаем флаг перед сбросом
          resetGame();
          setIsSettingsOpen(false);
        }}
        onGoHome={onGoHome}
        onOpenShop={onOpenShop}
      />
      <div
        className={`flex flex-col items-center gap-5 min-h-screen bg-[var(--game-background)] p-4 no-select will-change-auto`}
      >
        <div className="flex justify-between w-full -mb-2 items-center sm:max-w-xs sm:max-h-xs">
          <div className="flex flex-row items-center jusyify-center gap-2">
            <img
              src={trophyImg.src}
              alt="Трофей"
              style={{ width: 20, height: 20 }}
              className="menu-shadow"
            />
            {isRecordLoading ? (
              <span className="text-[1.5rem] record-trophy font-extrabold font-figtree">
                <LoadingNumberAnimation
                  isLoading={true}
                  minDigits={4}
                  speed={50}
                />
              </span>
            ) : (
              <ScoreDisplay
                newScore={isAdmin ? adminRecord ?? 0 : user?.record ?? 0}
                variant="record"
                showAnimation={false}
                className=" "
              />
            )}
          </div>
          <div className="flex flex-row gap-2">
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
        </div>

        <div className="flex justify-center items-center w-full -mt-8 -mb-2">
          <ScoreDisplay
            ref={scoreDisplayRef}
            newScore={score}
            moveScore={lastScoreResult}
          />
        </div>
        
        <BoostersPanel
          boosters={boosters}
          onBoosterClick={handleBoosterClick}
          className="-mb-9"
          comboLevel={lastScoreResult?.comboLevel}
        />
        {/* Визуализатор комбо и анимаций очков */}
        <div
          className="flex justify-center items-center p-4 sm:max-w-xs sm:max-h-xs relative"
          style={{ width: 'var(--app-vw)', height: 'var(--app-vw)', maxWidth: '100vw', maxHeight: '100vw' }}
        >
          <div className="glowing-border relative w-full h-full">
            <div className="relative w-full h-full">
              {/* Визуализатор комбо и анимаций очков теперь внутри поля */}
              <ComboVisualizer lastScore={lastScoreResult} onExplodeChange={setIsComboExploding} />
              <BoardClearAnimationsOverlay
                cells={clearAnimations}
                cellSize={dynamicCellSize || DEFAULT_CELL_SIZE}
                gap={GAP_SIZE_PX}
                boardRect={null}
              />
              {/* Неоновый контур потенциально очищаемых областей */}
              {potentialClearHighlight &&
                potentialClearHighlight.length > 0 &&
                draggedPiece &&
                boardRef.current &&
                (() => {
                  // Получаем размеры доски в px
                  const boardW = boardRef.current.offsetWidth;
                  const boardH = boardRef.current.offsetHeight;
                  // Переводим path из относительных координат (0-8) в пиксели
                  const scaleX = boardW / board[0].length;
                  const scaleY = boardH / board.length;
                  function scalePath(d: string) {
                    // Преобразует d="M x y L x y ..." в пиксели
                    return d.replace(
                      /([ML])\s*([\d.]+)\s*([\d.]+)/g,
                      (_m, cmd, x, y) => {
                        return `${cmd} ${+x * scaleX} ${+y * scaleY}`;
                      }
                    );
                  }
                  // --- Вспомогательные функции ---
                  function findConnectedAreas(
                    matrix: boolean[][]
                  ): number[][][] {
                    const h = matrix.length;
                    const w = matrix[0]?.length || 0;
                    const visited = Array.from({ length: h }, () =>
                      Array(w).fill(false)
                    );
                    const areas: number[][][] = [];
                    for (let y = 0; y < h; y++) {
                      for (let x = 0; x < w; x++) {
                        if (matrix[y][x] && !visited[y][x]) {
                          // BFS
                          const queue: [number, number][] = [[y, x]];
                          const area: [number, number][] = [];
                          visited[y][x] = true;
                          while (queue.length) {
                            const [cy, cx] = queue.shift()!;
                            area.push([cy, cx]);
                            for (const [dy, dx] of [
                              [0, 1],
                              [1, 0],
                              [0, -1],
                              [-1, 0],
                            ]) {
                              const ny = cy + dy,
                                nx = cx + dx;
                              if (
                                ny >= 0 &&
                                ny < h &&
                                nx >= 0 &&
                                nx < w &&
                                matrix[ny][nx] &&
                                !visited[ny][nx]
                              ) {
                                visited[ny][nx] = true;
                                queue.push([ny, nx]);
                              }
                            }
                          }
                          areas.push(area);
                        }
                      }
                    }
                    return areas;
                  }
                  function getCellEdges(
                    area: [number, number][],
                    matrix: boolean[][]
                  ) {
                    const edges: Array<[[number, number], [number, number]]> =
                      [];
                    const set = new Set(area.map(([y, x]) => `${y},${x}`));
                    for (const [y, x] of area) {
                      // top
                      if (!set.has(`${y - 1},${x}`))
                        edges.push([
                          [x, y],
                          [x + 1, y],
                        ]);
                      // right
                      if (!set.has(`${y},${x + 1}`))
                        edges.push([
                          [x + 1, y],
                          [x + 1, y + 1],
                        ]);
                      // bottom
                      if (!set.has(`${y + 1},${x}`))
                        edges.push([
                          [x + 1, y + 1],
                          [x, y + 1],
                        ]);
                      // left
                      if (!set.has(`${y},${x - 1}`))
                        edges.push([
                          [x, y + 1],
                          [x, y],
                        ]);
                    }
                    return edges;
                  }
                  function edgesToPath(
                    edges: Array<[[number, number], [number, number]]>
                  ): string {
                    if (edges.length === 0) return "";
                    // Строим карту: start -> end
                    const edgeMap = new Map<string, [number, number]>();
                    edges.forEach(([[x1, y1], [x2, y2]]) => {
                      edgeMap.set(`${x1},${y1}`, [x2, y2]);
                    });
                    // Находим стартовую точку (ту, которая встречается только один раз)
                    const points = edges.flat();
                    const count = new Map<string, number>();
                    points.forEach(([x, y]) => {
                      const k = `${x},${y}`;
                      count.set(k, (count.get(k) || 0) + 1);
                    });
                    let startKey =
                      Array.from(count.entries()).find(
                        ([k, v]) => v === 1
                      )?.[0] || `${edges[0][0][0]},${edges[0][0][1]}`;
                    let path = `M ${startKey.replace(",", " ")}`;
                    let currKey = startKey;
                    let steps = 0;
                    while (steps < edges.length + 5) {
                      const next = edgeMap.get(currKey);
                      if (!next) break;
                      path += ` L ${next[0]} ${next[1]}`;
                      currKey = `${next[0]},${next[1]}`;
                      if (currKey === startKey) break;
                      steps++;
                    }
                    path += " Z";
                    return path;
                  }
                  return findConnectedAreas(potentialClearHighlight).map(
                    (area, idx) => {
                      const edges = getCellEdges(
                        area as [number, number][],
                        potentialClearHighlight
                      );
                      if (edges.length === 0) return null;
                      const d = edgesToPath(edges);
                      const dPx = scalePath(d);
                      const color = COLOR_HEX[draggedPiece.color] || "#fff";
                      return (
                        <div
                          key={idx}
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: boardW,
                            height: boardH,
                            pointerEvents: "none",
                            zIndex: 1001,
                          }}
                        >
                          <NeonGlowOutline
                            d={dPx}
                            color={color}
                            glowRadius={10}
                            strokeWidth={12}
                            opacity={0.5}
                            style={{ width: "100%", height: "100%" }}
                          />
                          <NeonGlowParticles
                            d={dPx}
                            color={color}
                            visible={true}
                          />
                        </div>
                      );
                    }
                  );
                })()}
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
                className="relative z-10 grid grid-cols-8 grid-rows-8 gap-0.5 w-full h-full bg-gray-800 p-1 rounded-lg will-change-transform "
                onMouseDown={bombMode ? handleBombMouseDown : undefined}
                onMouseMove={bombMode ? handleBombMouseMove : undefined}
                onMouseUp={bombMode ? handleBombMouseUp : undefined}
                onMouseLeave={bombMode ? handleBombMouseLeave : undefined}
                onTouchStart={bombMode ? handleBombTouchStart : undefined}
                onTouchMove={bombMode ? handleBombTouchMove : undefined}
                onTouchEnd={bombMode ? handleBombTouchEnd : undefined}
                onTouchCancel={bombMode ? handleBombTouchCancel : undefined}
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
                        showPreviewPiece,
                        previewPieceColor,
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
                          highlight={
                            !!(
                              highlight ||
                              (!bombMode &&
                                bombCenter &&
                                Math.abs(bombCenter.x - x) <= 1 &&
                                Math.abs(bombCenter.y - y) <= 1)
                            )
                          }
                          isInClearingLine={isInClearingLine}
                          isPotentiallyCleared={isPotentiallyCleared}
                          potentialClearColor={potentialClearColor}
                          showPreviewPiece={showPreviewPiece}
                          previewPieceColor={previewPieceColor}
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
              {bombMode &&
                bombCenter &&
                (() => {
                  const gridW = board[0].length;
                  const gridH = board.length;
                  const highlight = getBombHighlightCenter(
                    bombCenter,
                    gridW,
                    gridH
                  );
                  if (!highlight) return null;
                  return (
                    <div
                      style={{
                        position: "absolute",
                        zIndex: 1000,
                        pointerEvents: "none",
                        left: `calc(${(highlight.cx - 1) * (100 / gridW)}%)`,
                        top: `calc(${(highlight.cy - 1) * (100 / gridH)}%)`,
                        width: `calc(3 * (100% / ${gridW}))`,
                        height: `calc(3 * (100% / ${gridH}))`,
                        boxSizing: "border-box",
                        border: "3px solid #ff0033",
                        borderRadius: 12,
                        boxShadow:
                          "0 0 16px 8px #ff0033, 0 0 32px 16px #ff0033aa, 0 0 64px 32px #ff003388",
                        transition: "left 0.05s, top 0.05s",
                      }}
                    />
                  );
                })()}
              {/* Анимация взрыва бомбы теперь внутри поля */}
              {explodingCells && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 2000,
                  }}
                >
                  {explodingCells.cells.map((cell) => {
                    const xPx = cell.x * explodingCells.cellSize;
                    const yPx = cell.y * explodingCells.cellSize;
                    return (
                      <motion.div
                        key={`${cell.x}-${cell.y}`}
                        initial={{
                          x: xPx,
                          y: yPx,
                          scale: 1,
                          rotate: 0,
                          opacity: 1,
                        }}
                        animate={{
                          x: xPx + cell.dx,
                          y: yPx + cell.dy,
                          scale: 1.2,
                          rotate: cell.rot,
                          opacity: 0,
                        }}
                        transition={{ duration: 0.28, ease: "easeIn" }}
                        style={{
                          position: "absolute",
                          width: explodingCells.cellSize,
                          height: explodingCells.cellSize,
                        }}
                      >
                        <Piece color={cell.color as any} size="100%" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Панель бустеров под игровым полем */}

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
