import React, { useMemo } from "react";
import { Block } from "../lib/data/types";
import { DraggablePiece } from "./DraggablePiece";
import { Position } from "../lib/data/types";
import { getEventCoordinates } from "@/utils/events";
import { useGameStore } from "@/lib/state/store";

interface DraggablePiecesProps {
  currentPieces: Block[];
  draggedPiece: Block | null;
  dragPosition: Position | null;
  dynamicCellSize: number;
  calculateDynamicOffset: (x: number, y: number) => Position;
  onPieceStart: (piece: Block, x: number, y: number) => void;
  panelRefs?: React.RefObject<HTMLDivElement>[];
  disabled?: boolean;
}

export const DraggablePiecesSection: React.FC<DraggablePiecesProps> = ({
  currentPieces,
  draggedPiece,
  dragPosition,
  dynamicCellSize,
  calculateDynamicOffset,
  onPieceStart,
  panelRefs,
  disabled = false,
}) => {
  
  // Создаем массив с фиксированными позициями
  const piecesWithPositions = useMemo(() => [0, 1, 2].map((index) => {
    const piece = currentPieces.find(
      (p) => p.uniqueId.split("_")[2] === String(index)
    );
    return piece;
  }), [currentPieces]);
  
  const { justGeneratedPieces } = useGameStore();

  // Мемоизируем расчет позиции чтобы вызывать calculateDynamicOffset только 1 раз
  const draggedPieceStyle = useMemo(() => {
    if (!draggedPiece || !dragPosition) return {};
    
    // ✅ Вызываем calculateDynamicOffset только ОДИН раз!
    const offset = calculateDynamicOffset(dragPosition.x, dragPosition.y);
    const pieceWidth = draggedPiece.matrix[0].length * dynamicCellSize;
    const pieceHeight = draggedPiece.matrix.length * dynamicCellSize;
    const heightMultiplier = draggedPiece.matrix.length < 2 ? 2 : 1;
    
    return {
      left: dragPosition.x - (pieceWidth / 2) * offset.x,
      top: dragPosition.y - pieceHeight * offset.y * heightMultiplier,
    };
  }, [draggedPiece, dragPosition, dynamicCellSize, calculateDynamicOffset]);

  const handleStart = (
    e: React.MouseEvent | React.TouchEvent,
    piece: Block,
    containerIndex: number
  ) => {
    if (!piece || draggedPiece?.uniqueId === piece.uniqueId) return;
    const { clientY } = getEventCoordinates(e);
    
    // Получаем центр контейнера фигуры по X
    const container = e.currentTarget as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    
    onPieceStart(piece, centerX, clientY);
  };

  return (
    <div 
      className={`${disabled ? 'pointer-events-none' : ''} draggable-pieces-section flex flex-row gap-2 w-[100%] sm:max-w-xs justify-between h-[30%] max-h-[30%] min-h-[30%] relative`}
      style={{ touchAction: 'none' }}
    >
      {[0, 1, 2].map((containerIndex) => {
        const activePiece = piecesWithPositions[containerIndex];
        return (
          <div
            key={containerIndex}
            className="w-1/3 h-[20vh] flex justify-center items-center -mt-10 relative"
            onMouseDown={(e) => activePiece && handleStart(e, activePiece, containerIndex)}
            onTouchStart={(e) => activePiece && handleStart(e, activePiece, containerIndex)}
            ref={panelRefs ? panelRefs[containerIndex] : undefined}
          >
            {activePiece && (
              <DraggablePiece
                key={activePiece.uniqueId}
                piece={activePiece}
                style={
                  draggedPiece?.uniqueId === activePiece.uniqueId
                    ? draggedPieceStyle
                    : {}
                }
                isGhost={draggedPiece?.uniqueId === activePiece.uniqueId}
                ghostSize={dynamicCellSize}
                originalSize={dynamicCellSize * 0.5}
                animateAppear={justGeneratedPieces}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
