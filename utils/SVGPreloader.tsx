import React, { useEffect } from 'react';
import { BlockColor } from '../lib/data/types';

interface SVGPreloaderProps {
  colors: BlockColor[];
}

export const SVGPreloader: React.FC<SVGPreloaderProps> = ({ colors }) => {
  useEffect(() => {
    // Предзагружаем все SVG файлы
    colors.forEach(color => {
      const img = new Image();
      img.src = `/${color}.svg`;
    });
  }, [colors]);

  return null;
}; 