export const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
  return { clientX, clientY };
};
