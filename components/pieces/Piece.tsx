import React, { useState, useEffect } from "react";
import { BlockColor } from "@/lib/data/types";

interface PieceProps {
  color: BlockColor;
  size?: number | string;
  inset?: number;
  radius?: number;
  isClearing?: boolean;
  isPreview?: boolean;
}

// CSS градиенты как fallback для каждого цвета
const colorGradients: Record<BlockColor, string> = {
  blue: "linear-gradient(135deg, #528BFF 0%, #0045D4 100%)",
  red: "linear-gradient(135deg, #FF6955 0%, #9C140A 100%)",
  green: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
  yellow: "linear-gradient(135deg, #FFD700 0%, #FFA000 100%)",
  purple: "linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)",
  orange: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
  pink: "linear-gradient(135deg, #E91E63 0%, #C2185B 100%)",
  cyan: "linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)",
};

// Preload всех SVG файлов один раз
const preloadedImages = new Map<BlockColor, HTMLImageElement>();
const isPreloading = new Set<BlockColor>();
let isPreloadingAll = false;

const preloadImage = (color: BlockColor) => {
  if (preloadedImages.has(color) || isPreloading.has(color)) return;
  
  isPreloading.add(color);
  const img = new Image();
  img.onload = () => {
    preloadedImages.set(color, img);
    isPreloading.delete(color);
  };
  img.onerror = () => {
    isPreloading.delete(color);
  };
  img.src = `/${color}.svg`;
};

// Preload всех цветов сразу для максимальной производительности
const preloadAllImages = () => {
  if (isPreloadingAll) return;
  isPreloadingAll = true;
  
  const allColors: BlockColor[] = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
  allColors.forEach(preloadImage);
};

export const Piece: React.FC<PieceProps> = ({ color, size = 32, isClearing, isPreview = false }) => {
  const [imageError, setImageError] = useState(false);
  
  // Preload всех изображений при первом рендере любой фигуры
  useEffect(() => {
    preloadAllImages();
  }, []);

  // console.log('🔍 Piece render:', {
  //   color,
  //   size,
  //   isClearing,
  //   isPreview,
  //   imageError,
  //   imageSrc: `/${color}.svg`
  // });

  const opacity = isPreview ? 0.4 : 1;

  // Если изображение не загрузилось, используем CSS градиент
  if (imageError) {
    return (
      <div 
        className={`relative no-select piece-container ${isClearing ? "clearing-piece" : ""}`} 
        style={{ 
          width: size, 
          height: size,
          background: colorGradients[color],
          borderRadius: '5px',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3)',
          opacity,
        }}
      />
    );
  }

  // Если preloaded изображение доступно, используем его через background-image для лучшей производительности
  const preloadedImg = preloadedImages.get(color);
  if (preloadedImg) {
    return (
      <div 
        className={`relative no-select piece-container ${isClearing ? "clearing-piece" : ""}`}
        style={{ 
          width: size, 
          height: size,
          backgroundImage: `url(${preloadedImg.src})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          opacity,
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      />
    );
  }

  return (
    <div className="relative no-select piece-container" style={{ width: size, height: size }}>
      <img
        src={`/${color}.svg`}
        alt={`${color} piece`}
        className={isClearing ? "clearing-piece" : ""}
        style={{
          width: '100%',
          height: '100%',
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          opacity,
        }}
        onError={() => {
          // console.log('❌ Image failed to load:', `/${color}.svg`);
          setImageError(true);
        }}
      />
    </div>
  );
};
