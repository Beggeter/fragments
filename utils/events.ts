import { PointerEvent } from "react";

export const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  return { clientX, clientY };
};

export const handlePointerUp = (e: PointerEvent, callback?: () => void) => {
  const buttonRect = e.currentTarget?.getBoundingClientRect();
  const isInside = (
    e.clientX >= buttonRect.left &&
    e.clientX <= buttonRect.right &&
    e.clientY >= buttonRect.top &&
    e.clientY <= buttonRect.bottom
  );

  if (isInside) {
    callback?.()
  }
};
