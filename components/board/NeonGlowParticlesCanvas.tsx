import React, { useRef, useEffect, useCallback, useMemo } from 'react';

interface NeonGlowParticlesCanvasProps {
  d: string; // SVG path в пикселях
  color: string;
  visible: boolean;
  cellSize?: number;
  className?: string;
}

const CONFETTI_COLORS = [
  "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
  "#FF8000", "#8000FF", "#FF0080", "#80FF00", "#0080FF", "#FF4000",
  "#40FF00", "#0040FF", "#FF0040", "#40FF40", "#4040FF", "#FF4040",
  "#40FF80", "#8040FF",
];

const MIN_PARTICLE_SIZE = 2;
const MAX_PARTICLE_SIZE = 6;
const ANIMATION_DURATION = 4000;
const FLIGHT_DISTANCE = 0.2;
const SPAWN_INTERVAL = 200;
const MAX_PARTICLES = 8;

type Particle = {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  startTime: number;
  duration: number;
  progress: number;
};

// Парсим SVG path для получения точек
const parsePathPoints = (d: string): { x: number; y: number }[] => {
  if (!d) return [];
  
  const points: { x: number; y: number }[] = [];
  const commands = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  let currentX = 0;
  let currentY = 0;
  
  commands.forEach(cmd => {
    const type = cmd[0].toUpperCase();
    const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    if (type === 'M' && args.length >= 2) {
      currentX = args[0];
      currentY = args[1];
      points.push({ x: currentX, y: currentY });
    } else if (type === 'L' && args.length >= 2) {
      for (let i = 0; i < args.length; i += 2) {
        if (args[i + 1] !== undefined) {
          currentX = args[i];
          currentY = args[i + 1];
          points.push({ x: currentX, y: currentY });
        }
      }
    }
  });
  
  return points;
};

export const NeonGlowParticlesCanvas: React.FC<NeonGlowParticlesCanvasProps> = ({
  d, color, visible, cellSize = 50, className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpawnTime = useRef(0);

  // Мемоизированные точки пути
  const pathPoints = useMemo(() => parsePathPoints(d), [d]);

  // Создание частицы
  const createParticle = useCallback(() => {
    if (pathPoints.length === 0 || particlesRef.current.length >= MAX_PARTICLES) return;
    
    const now = performance.now();
    if (now - lastSpawnTime.current < SPAWN_INTERVAL) return;
    lastSpawnTime.current = now;

    const pointIndex = Math.floor(Math.random() * pathPoints.length);
    const point = pathPoints[pointIndex];
    
    const randomAngle = Math.random() * Math.PI * 2;
    const distance = FLIGHT_DISTANCE * cellSize;
    
    const newParticle: Particle = {
      id: `${Date.now()}-${Math.random()}`,
      x: point.x,
      y: point.y,
      targetX: point.x + Math.cos(randomAngle) * distance,
      targetY: point.y + Math.sin(randomAngle) * distance,
      size: MIN_PARTICLE_SIZE + Math.random() * (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      startTime: now,
      duration: ANIMATION_DURATION * (0.8 + Math.random() * 0.4),
      progress: 0
    };
    
    particlesRef.current.push(newParticle);
  }, [pathPoints, cellSize]);

  // Основной цикл анимации с throttling
  useEffect(() => {
    if (!visible) {
      particlesRef.current = [];
      return;
    }

    let lastFrame = 0;
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;

    const animate = (now: number) => {
      if (now - lastFrame < frameTime) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrame = now;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Очистка canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Обновление и отрисовка частиц
      particlesRef.current = particlesRef.current.filter(particle => {
        const elapsed = now - particle.startTime;
        const progress = Math.min(elapsed / particle.duration, 1);

        if (progress >= 1) return false; // Удаляем завершенные частицы

        // Обновляем позицию с easing
        const easeProgress = 1 - (1 - progress) * (1 - progress); // easeOutQuad
        const x = particle.x + (particle.targetX - particle.x) * easeProgress;
        const y = particle.y + (particle.targetY - particle.y) * easeProgress;

        // Opacity based on progress
        const opacity = progress < 0.2 ? progress / 0.2 : 
                       progress > 0.8 ? (1 - progress) / 0.2 : 1;

        // Отрисовка частицы
        ctx.save();
        ctx.globalAlpha = opacity * 0.8;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(x, y, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });

      // Создаем новые частицы
      createParticle();

      if (visible) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visible, createParticle]);

  // Автоматический ресайз canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Очистка при скрытии
  useEffect(() => {
    if (!visible) {
      particlesRef.current = [];
    }
  }, [visible]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1002
      }}
    />
  );
};
