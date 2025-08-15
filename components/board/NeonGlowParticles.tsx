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
const ANIMATION_DURATION = 4000; // 4 секунды для плавного полета
const FLIGHT_DISTANCE = 0.2; // 0.2 длины клетки
const SPAWN_INTERVAL = 300; // Новые звезды каждые 300ms (уменьшили частоту)
const MAX_PARTICLES = 6; // Максимальное количество частиц одновременно (уменьшили)

type Particle = {
  id: string;
  x: number;
  y: number;
  left: number;
  top: number;
  randomSize: number;
  randomDuration: number;
  transformTo: number;
  transformToY: number;
  randomRotation: number;
  randomColor: string;
  startX: number;
  startY: number;
  side: 'top' | 'right' | 'bottom' | 'left';
  animationKey: string; // Ключ для CSS анимации
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

// Кэшируем Math.sin для лучшей производительности
const sinCache = new Map<number, number>();
const getSeededRandom = (seed: number): number => {
  const key = Math.floor(seed * 1000); // Ограниченная точность для кэша
  if (sinCache.has(key)) {
    return sinCache.get(key)!;
  }
  const x = Math.sin(seed) * 10000;
  const result = x - Math.floor(x);
  // Ограничиваем размер кэша
  if (sinCache.size < 1000) {
    sinCache.set(key, result);
  }
  return result;
};

export const NeonGlowParticles: React.FC<NeonGlowParticlesProps> = React.memo(
  ({ d, color, visible, cellSize = 50, className = "" }) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [nextId, setNextId] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set()); // Отслеживаем все setTimeout
    
    // Кэшируем Math.cos и Math.sin значения
    const mathCosCache = useRef<Map<number, number>>(new Map());
    const mathSinCache = useRef<Map<number, number>>(new Map());
    
    // Парсим path один раз
    const pathPoints = useMemo(() => {
      if (!d || !visible) return [];
      return parseSVGPath(d);
    }, [d, visible]);
    
    // Создаем новую звезду
    const createParticle = useCallback(() => {
      if (pathPoints.length === 0) return;
      
      // Проверяем максимальное количество частиц
      if (particles.length >= MAX_PARTICLES) return;
      
      const currentId = nextId;
      setNextId(prev => prev + 1);
      const id = `particle-${Date.now()}-${currentId}`;
      
      // Используем id для детерминированной позиции вместо Math.random()
      const randomPosition = getSeededRandom(currentId * 0.1) ; // 0-1 вдоль всего пути
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
      
      // Генерируем параметры детерминированно
      const randomSize = MIN_PARTICLE_SIZE + getSeededRandom(currentId * 0.2) * (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE);
      const randomDuration = ANIMATION_DURATION - getSeededRandom(currentId * 0.3) * 2000; // 10-12 секунд
      const randomRotation = getSeededRandom(currentId * 0.4) * 360;
      
      // Используем цвет неоновой подсветки или случайный цвет
      const useNeonColor = getSeededRandom(currentId * 0.5) > 0.6; // 40% шанс использовать цвет неона
      const colorIndex = Math.floor(getSeededRandom(currentId * 0.6) * CONFETTI_COLORS.length);
      const randomColor = useNeonColor ? color : CONFETTI_COLORS[colorIndex];
      
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
      
      // Добавляем небольшое детерминированное отклонение
      angle += (getSeededRandom(currentId * 0.7) - 0.5) * 0.1; // ±5 градусов
      
      // Используем кэшированные cos/sin значения
      const angleKey = Math.floor(angle * 1000);
      let cosAngle = mathCosCache.current.get(angleKey);
      let sinAngle = mathSinCache.current.get(angleKey);
      
      if (cosAngle === undefined) {
        cosAngle = Math.cos(angle);
        sinAngle = Math.sin(angle);
        // Ограничиваем размер кэша
        if (mathCosCache.current.size < 500) {
          mathCosCache.current.set(angleKey, cosAngle);
          mathSinCache.current.set(angleKey, sinAngle!);
        }
      }
      
      const endX = startPoint.x + cosAngle * distance;
      const endY = startPoint.y + sinAngle! * distance;
      
      const newParticle: Particle = {
        id,
        x: startPoint.x,
        y: startPoint.y,
        left: startPoint.x,
        top: startPoint.y,
        randomSize,
        randomDuration,
        transformTo: endX - startPoint.x,
        transformToY: endY - startPoint.y,
        randomRotation,
        randomColor,
        startX: startPoint.x,
        startY: startPoint.y,
        side,
        animationKey: `${id}-${Date.now()}`
      };
      
      setParticles(prev => [...prev, newParticle]);
      
      // Удаляем частицу через время анимации (с отслеживанием для cleanup)
      const timeoutId = setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== id));
        timeoutRefs.current.delete(timeoutId);
      }, randomDuration);
      timeoutRefs.current.add(timeoutId);
    }, [pathPoints, color, cellSize]);
    
    // Управляем созданием новых частиц
    useEffect(() => {
      if (visible && pathPoints.length > 0) {
        intervalRef.current = setInterval(createParticle, SPAWN_INTERVAL);
        
        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Очищаем все активные setTimeout
          timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
          timeoutRefs.current.clear();
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
    
    // ✅ Убрали RAF анимацию - теперь используем CSS transitions для лучшей производительности
    
    // Очищаем частицы при скрытии
    useEffect(() => {
      if (!visible) {
        setParticles([]);
      }
    }, [visible]);

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
        {/* ✅ Добавляем CSS keyframes для каждой частицы */}
        <style>
          {particles.map(pt => `
            @keyframes particle-fly-${pt.animationKey} {
              0% {
                transform: translate3d(0px, 0px, 0) rotate(${pt.randomRotation}deg) scale(0.3);
                opacity: 0;
              }
              10% {
                opacity: 1;
                transform: translate3d(${pt.transformTo * 0.1}px, ${pt.transformToY * 0.1}px, 0) rotate(${pt.randomRotation + 360 * 0.1}deg) scale(1);
              }
              80% {
                opacity: 1;
                transform: translate3d(${pt.transformTo * 0.8}px, ${pt.transformToY * 0.8}px, 0) rotate(${pt.randomRotation + 360 * 0.8}deg) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate3d(${pt.transformTo}px, ${pt.transformToY}px, 0) rotate(${pt.randomRotation + 360}deg) scale(0.8);
              }
            }
          `).join('')}
        </style>
        {particles.map((pt) => {
          // ✅ Убрали сложные расчеты opacity и scale из рендера
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
                left: pt.startX,
                top: pt.startY,
                pointerEvents: "none",
                zIndex: 1,
                // ✅ Используем CSS animation вместо JS математики
                animation: `particle-fly-${pt.animationKey} ${pt.randomDuration}ms ease-out forwards`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden"
              }}
            >
              {pt.id.length % 2 === 0 ? (
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