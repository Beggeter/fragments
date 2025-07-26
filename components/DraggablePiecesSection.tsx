import React from "react";
import { Block } from "../lib/data/types";
import { DraggablePiece } from "./DraggablePiece";
import { Position } from "../lib/data/types";
import { getEventCoordinates } from "@/utils/events";

interface DraggablePiecesProps {
  currentPieces: Block[];
  draggedPiece: Block | null;
  dragPosition: Position | null;
  dynamicCellSize: number;
  calculateDynamicOffset: (x: number, y: number) => Position;
  onPieceStart: (piece: Block, x: number, y: number) => void;
  panelRefs?: React.RefObject<HTMLDivElement>[];
}

export const DraggablePiecesSection: React.FC<DraggablePiecesProps> = ({
  currentPieces,
  draggedPiece,
  dragPosition,
  dynamicCellSize,
  calculateDynamicOffset,
  onPieceStart,
  panelRefs,
}) => {
  // Создаем массив с фиксированными позициями
  const piecesWithPositions = [0, 1, 2].map((index) => {
    const piece = currentPieces.find(
      (p) => p.uniqueId.split("_")[2] === String(index)
    );
    return piece;
  });

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
    <div className="draggable-pieces-section flex flex-row gap-2 w-[100%] sm:max-w-xs justify-between h-[30%] max-h-[30%] min-h-[30%] relative">
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
                  draggedPiece?.uniqueId === activePiece.uniqueId &&
                  dragPosition
                    ? {
                        left:
                          dragPosition.x -
                          ((activePiece.matrix[0].length * dynamicCellSize) /
                            2) *
                            calculateDynamicOffset(
                              dragPosition.x,
                              dragPosition.y
                            ).x,
                        top:
                          dragPosition.y -
                          activePiece.matrix.length *
                            dynamicCellSize *
                            calculateDynamicOffset(
                              dragPosition.x,
                              dragPosition.y
                            ).y *
                            (activePiece.matrix.length < 2 ? 2 : 1),
                      }
                    : {}
                }
                isGhost={draggedPiece?.uniqueId === activePiece.uniqueId}
                ghostSize={dynamicCellSize}
                originalSize={dynamicCellSize * 0.5}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
