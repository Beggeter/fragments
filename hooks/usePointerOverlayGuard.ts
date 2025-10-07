import { useEffect } from 'react';

export const usePointerOverlayGuard = () => {
  useEffect(() => {
    const fixOverlays = () => {
      document
        .querySelectorAll('[data-bg-overlay]')
        .forEach((el) => ((el as HTMLElement).style.pointerEvents = 'none'));
    };

    fixOverlays();
    const intervalId = window.setInterval(fixOverlays, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
};
