import { useEffect } from 'react';

export const useDisableContextMenu = () => {
  useEffect(() => {
    const preventContextMenu = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
    };

    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);
};
