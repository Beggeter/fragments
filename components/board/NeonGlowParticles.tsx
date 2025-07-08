import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";

interface NeonGlowParticlesProps {
  d: string; // SVG path (в пикселях) - тот же path что и в NeonGlowOutline
  color: string;
  visible: boolean;
  cellSize?: number; // Размер клетки в пикселях
  className?: string;
}

const CONFETTI_COLORS = [
  "#FF0000", // ярко-красный
  "#00FF00", // ярко-зеленый
  "#0000FF", // ярко-синий
  "#FFFF00", // ярко-желтый
  "#FF00FF", // ярко-малиновый
  "#00FFFF", // ярко-голубой
  "#FF8000", // ярко-оранжевый
  "#8000FF", // ярко-фиолетовый
  "#FF0080", // ярко-розовый
  "#80FF00", // ярко-лаймовый
  "#0080FF", // ярко-синий
  "#FF4000", // ярко-красно-оранжевый
  "#40FF00", // ярко-зелено-желтый
  "#0040FF", // ярко-сине-голубой
  "#FF0040", // ярко-красно-розовый
  "#40FF40", // ярко-зеленый
  "#4040FF", // ярко-синий
  "#FF4040", // ярко-красный
  "#40FF80", // ярко-зелено-голубой
  "#8040FF", // ярко-фиолетовый
];

const MIN_PARTICLE_SIZE = 2;
const MAX_PARTICLE_SIZE = 6;
const ANIMATION_DURATION = 12000; // 12 секунд для очень медленного полета
const FLIGHT_DISTANCE = 0.5; // 0.5 длины клетки
const SPAWN_INTERVAL = 100; // Новые звезды каждые 100ms

type Particle = {
  id: string;
  x: number;
  y: number;
  left: number;
  top: number;
  randomSize: number;
  randomDuration: number;
  transformTo: string;
  transformToY: string;
  randomRotation: number;
  randomColor: string;
  startX: number;
  startY: number;
  side: 'top' | 'right' | 'bottom' | 'left';
  progress: number; // 0-1 для анимации
};

// Функция для парсинга SVG path и извлечения точек
const parseSVGPath = (d: string): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const commands = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  let currentX = 0;
  let currentY = 0;
  
  commands.forEach(command => {
    const type = command[0].toUpperCase();
    const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    switch (type) {
      case 'M': // Move to
        if (coords.length >= 2) {
          currentX = coords[0];
          currentY = coords[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'L': // Line to
        if (coords.length >= 2) {
          currentX = coords[0];
          currentY = coords[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'H': // Horizontal line
        if (coords.length >= 1) {
          currentX = coords[0];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'V': // Vertical line
        if (coords.length >= 1) {
          currentY = coords[0];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'Z': // Close path
        if (points.length > 0) {
          points.push({ x: points[0].x, y: points[0].y });
        }
        break;
    }
  });
  
  return points;
};

// Функция для определения стороны фигуры в точке
const getSideAtPoint = (points: { x: number; y: number }[], point: { x: number; y: number }): 'top' | 'right' | 'bottom' | 'left' => {
  // Находим границы фигуры
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Вычисляем относительную позицию точки от центра
  const relX = (point.x - centerX) / (maxX - minX);
  const relY = (point.y - centerY) / (maxY - minY);
  
  // Определяем, какая сторона ближе
  const distToTop = Math.abs(relY + 1); // -1 = верхняя сторона
  const distToBottom = Math.abs(relY - 1); // 1 = нижняя сторона
  const distToLeft = Math.abs(relX + 1); // -1 = левая сторона
  const distToRight = Math.abs(relX - 1); // 1 = правая сторона
  
  const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
  
  if (minDist === distToTop) return 'top';
  if (minDist === distToBottom) return 'bottom';
  if (minDist === distToLeft) return 'left';
  return 'right';
};

// Функция для генерации псевдослучайного числа
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const NeonGlowParticles: React.FC<NeonGlowParticlesProps> = React.memo(
  ({ d, color, visible, cellSize = 50, className = "" }) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [nextId, setNextId] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationRef = useRef<number | null>(null);
    
    // Парсим path один раз
    const pathPoints = useMemo(() => {
      if (!d || !visible) return [];
      return parseSVGPath(d);
    }, [d, visible]);
    
    // Создаем новую звезду
    const createParticle = useCallback(() => {
      if (pathPoints.length === 0) return;
      
      const id = `particle-${nextId}`;
      setNextId(prev => prev + 1);
      
      // Выбираем случайную точку вдоль всего path с интерполяцией
      const randomPosition = Math.random(); // 0-1 вдоль всего пути
      const totalLength = pathPoints.length - 1;
      const exactIndex = randomPosition * totalLength;
      const index1 = Math.floor(exactIndex);
      const index2 = Math.min(index1 + 1, pathPoints.length - 1);
      const fraction = exactIndex - index1;
      
      // Интерполируем между двумя точками
      const point1 = pathPoints[index1];
      const point2 = pathPoints[index2];
      const startPoint = {
        x: point1.x + (point2.x - point1.x) * fraction,
        y: point1.y + (point2.y - point1.y) * fraction
      };
      
      // Определяем сторону
      const side = getSideAtPoint(pathPoints, startPoint);
      
      // Генерируем параметры
      const randomSize = MIN_PARTICLE_SIZE + Math.random() * (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE);
             const randomDuration = ANIMATION_DURATION - Math.random() * 2000; // 10-12 секунд
      const randomRotation = Math.random() * 360;
      
      // Используем цвет неоновой подсветки или случайный цвет
      const useNeonColor = Math.random() > 0.6; // 40% шанс использовать цвет неона
      const randomColor = useNeonColor ? color : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      
      // Вычисляем направление полета (перпендикулярно стороне)
      let angle = 0;
      const distance = FLIGHT_DISTANCE * cellSize;
      
             switch (side) {
         case 'top':
           angle = -Math.PI / 2; // Вниз (наружу от области)
           break;
         case 'right':
           angle = 0; // Вправо (наружу от области)
           break;
         case 'bottom':
           angle = Math.PI / 2; // Вверх (наружу от области)
           break;
         case 'left':
           angle = Math.PI; // Влево (наружу от области)
           break;
       }
      
      // Добавляем небольшое случайное отклонение
      angle += (Math.random() - 0.5) * 0.3; // ±15 градусов
      
      const endX = startPoint.x + Math.cos(angle) * distance;
      const endY = startPoint.y + Math.sin(angle) * distance;
      
      const newParticle: Particle = {
        id,
        x: startPoint.x,
        y: startPoint.y,
        left: startPoint.x,
        top: startPoint.y,
        randomSize,
        randomDuration,
        transformTo: `${endX - startPoint.x}px`,
        transformToY: `${endY - startPoint.y}px`,
        randomRotation,
        randomColor,
        startX: startPoint.x,
        startY: startPoint.y,
        side,
        progress: 0
      };
      
      setParticles(prev => [...prev, newParticle]);
      
      // Удаляем частицу через время анимации
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== id));
      }, randomDuration);
    }, [pathPoints, nextId, color, cellSize]);
    
    // Управляем созданием новых частиц
    useEffect(() => {
      if (visible && pathPoints.length > 0) {
        intervalRef.current = setInterval(createParticle, SPAWN_INTERVAL);
        
        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        };
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Очищаем все частицы при скрытии
        setParticles([]);
      }
    }, [visible, pathPoints, createParticle]);
    
    // Анимация частиц
    useEffect(() => {
      if (!visible || particles.length === 0) return;
      
      const animate = () => {
                 setParticles(prev => 
           prev.map(particle => ({
             ...particle,
             progress: Math.min(1, particle.progress + 0.004) // ~60fps, но очень медленно
           }))
         );
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    }, [visible, particles.length]);

    if (!visible || particles.length === 0) return null;

    return (
      <div
        className={className}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1201, // Выше NeonGlowOutline
          opacity: 1,
        }}
      >
        {particles.map((pt) => {
          const currentX = pt.startX + parseFloat(pt.transformTo) * pt.progress;
          const currentY = pt.startY + parseFloat(pt.transformToY) * pt.progress;
          const opacity = pt.progress < 0.1 ? pt.progress * 10 : pt.progress > 0.8 ? (1 - pt.progress) * 5 : 1;
          const scale = pt.progress < 0.1 ? 0.3 + pt.progress * 7 : pt.progress > 0.8 ? 1 - (pt.progress - 0.8) * 2.5 : 1;
          
          return (
            <svg
              key={pt.id}
              width={pt.randomSize}
              height={pt.randomSize}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: "absolute",
                left: currentX,
                top: currentY,
                pointerEvents: "none",
                zIndex: 1,
                transform: `rotate(${pt.randomRotation}deg) scale(${scale})`,
                opacity,
                willChange: "transform, opacity"
              }}
            >
              {Math.random() > 0.5 ? (
                <rect x="20" y="20" width="60" height="60" 
                      fill="white" 
                      style={{
                        filter: `drop-shadow(0 0 8px ${pt.randomColor})`
                      }}
                />
              ) : (
                <path 
                  d="M43 0.573095C36.2804 28.3069 27.5969 38.2595 0.573593 42.9995C28.493 47.8597 38.3632 56.5588 43 85.4259C46.4865 56.5515 55.2865 46.0561 85.4264 42.9995C58.0896 38.1858 48.6892 29.0552 43 0.573095Z"
                  fill="white" 
                  style={{
                    filter: `drop-shadow(0 0 8px ${pt.randomColor})`
                  }}
                />
              )}
            </svg>
          );
        })}
      </div>
    );
  }
);

NeonGlowParticles.displayName = "NeonGlowParticles"; 