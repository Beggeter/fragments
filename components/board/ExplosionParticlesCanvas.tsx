import React, { useRef, useEffect } from "react";
import { useSettingsStore } from "@/lib/state/settings";

export interface ExplosionParticlesCanvasProps {
  centerX: number;
  centerY: number;
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
  gap: number;
  isActive: boolean;
  onComplete?: () => void;
  mode?: "explode" | "gather";
  gatherTargets?: { x: number; y: number }[];
}

type ParticleType = "fire" | "spark" | "debris" | "star" | "smoke" | "glitter";

interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  duration: number;
  rotation: number;
  startTime: number;
}

const PARTICLE_TYPES: ParticleType[] = ["fire", "spark", "debris", "star", "smoke", "glitter"];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n: number, inset: number) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.moveTo(0, 0 - r);
  for (let i = 0; i < n; i++) {
    ctx.rotate(Math.PI / n);
    ctx.lineTo(0, 0 - r * inset);
    ctx.rotate(Math.PI / n);
    ctx.lineTo(0, 0 - r);
  }
  ctx.closePath();
  ctx.restore();
  ctx.fill();
}

const ExplosionParticlesCanvas: React.FC<ExplosionParticlesCanvasProps> = ({
  centerX,
  centerY,
  boardWidth,
  boardHeight,
  cellSize,
  gap,
  isActive,
  onComplete,
  mode = "explode",
  gatherTargets = [],
}) => {
  const { animationsEnabled, performanceMode } = useSettingsStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Ранний возврат если анимации отключены
  if (!isActive || !animationsEnabled) {
    if (onComplete) onComplete();
    return null;
  }
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  
  // Оптимизация для мобильных устройств
  const lastFrameTimeRef = useRef(0);
  const TARGET_FPS = 30; // Ограничиваем до 30 FPS для частиц на мобильных
  const FRAME_TIME = 1000 / TARGET_FPS;
  
  const padding = 300; // px
  // Управление размером частиц
  const particleSizeMultiplier = 0.5; // Измените это значение для увеличения/уменьшения размера частиц

  // Генерация частиц
  useEffect(() => {
    if (!isActive) return;
    finishedRef.current = false;
    const now = performance.now();
    const particles: Particle[] = [];
    const centerXPx = centerX * (cellSize + gap) + cellSize / 2 + padding;
    const centerYPx = centerY * (cellSize + gap) + cellSize / 2 + padding;
    if (mode === "gather" && gatherTargets.length > 0) {
      gatherTargets.forEach((target, i) => {
        const startX = target.x * (cellSize + gap) + cellSize / 2 + padding;
        const startY = target.y * (cellSize + gap) + cellSize / 2 + padding;
        const type = PARTICLE_TYPES[i % PARTICLE_TYPES.length];
        particles.push({
          id: `gather-${i}`,
          type,
          x: startX,
          y: startY,
          endX: centerXPx,
          endY: centerYPx,
          size:
            (type === "fire"
              ? 10 + Math.random() * 6
              : type === "spark"
              ? 4 + Math.random() * 3
              : type === "debris"
              ? 6 + Math.random() * 4
              : type === "star"
              ? 6 + Math.random() * 3
              : type === "smoke"
              ? 12 + Math.random() * 8
              : 4 + Math.random() * 2) * particleSizeMultiplier,
          color:
            type === "fire"
              ? `hsl(${0 + Math.random() * 30}, 100%, 60%)`
              : type === "spark"
              ? `hsl(${45 + Math.random() * 30}, 100%, 80%)`
              : type === "debris"
              ? `hsl(${20 + Math.random() * 40}, 70%, 50%)`
              : type === "star"
              ? `hsl(${Math.random() * 60}, 100%, 80%)`
              : type === "smoke"
              ? `hsl(0, 0%, ${30 + Math.random() * 40}%)`
              : `hsl(${Math.random() * 360}, 100%, 70%)`,
          duration: 220 + Math.random() * 80, // ms
          rotation: Math.random() * 360,
          startTime: now,
        });
      });
    } else {
      PARTICLE_TYPES.forEach((type, typeIndex) => {
        // Адаптивное количество частиц в зависимости от настроек производительности
        let baseCount = type === "fire" ? 15 : type === "spark" ? 10 : type === "smoke" ? 8 : 6;
        if (performanceMode === 'low') {
          baseCount = Math.ceil(baseCount * 0.3); // 30% частиц
        } else if (performanceMode === 'medium') {
          baseCount = Math.ceil(baseCount * 0.6); // 60% частиц
        }
        const count = baseCount;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + (typeIndex * Math.PI / 6);
          const distance = 120 + Math.random() * 180;
          const endX = centerXPx + Math.cos(angle) * distance;
          const endY = centerYPx + Math.sin(angle) * distance;
          particles.push({
            id: `${type}-${i}`,
            type,
            x: centerXPx,
            y: centerYPx,
            endX,
            endY,
            size:
              (type === "fire"
                ? 10 + Math.random() * 6
                : type === "spark"
                ? 4 + Math.random() * 3
                : type === "debris"
                ? 6 + Math.random() * 4
                : type === "star"
                ? 6 + Math.random() * 3
                : type === "smoke"
                ? 12 + Math.random() * 8
                : 4 + Math.random() * 2) * particleSizeMultiplier,
            color:
              type === "fire"
                ? `hsl(${0 + Math.random() * 30}, 100%, 60%)`
                : type === "spark"
                ? `hsl(${45 + Math.random() * 30}, 100%, 80%)`
                : type === "debris"
                ? `hsl(${20 + Math.random() * 40}, 70%, 50%)`
                : type === "star"
                ? `hsl(${Math.random() * 60}, 100%, 80%)`
                : type === "smoke"
                ? `hsl(0, 0%, ${30 + Math.random() * 40}%)`
                : `hsl(${Math.random() * 360}, 100%, 70%)`,
            duration: 400 + Math.random() * 200, // ms
            rotation: Math.random() * 360,
            startTime: now,
          });
        }
      });
    }
    particlesRef.current = particles;
    // Запуск анимации
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animate(now);
    // eslint-disable-next-line
  }, [isActive, centerX, centerY, boardWidth, boardHeight, cellSize, gap, mode, JSON.stringify(gatherTargets)]);

  // Основная анимация с throttling для мобильных
  function animate(startTime: number) {
    const now = performance.now();
    
    // Throttling для лучшей производительности на мобильных
    if (now - lastFrameTimeRef.current < FRAME_TIME) {
      animationRef.current = requestAnimationFrame(() => animate(startTime));
      return;
    }
    lastFrameTimeRef.current = now;
    
    const ctx = canvasRef.current?.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!ctx) return;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    let alive = 0;
    for (const p of particlesRef.current) {
      const t = Math.min(1, (now - p.startTime) / p.duration);
      if (t >= 1) continue;
      alive++;
      // Позиция
      const x = lerp(p.x, p.endX, t);
      const y = lerp(p.y, p.endY, t);
      // Scale/opacity (имитация motion)
      let scale = t < 0.2 ? lerp(0, 1, t / 0.2) : t > 0.8 ? lerp(1, 0, (t - 0.8) / 0.2) : 1;
      let opacity = t < 0.2 ? lerp(0.7, 1, t / 0.2) : t > 0.8 ? lerp(1, 0, (t - 0.8) / 0.2) : 1;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      // Упрощенные тени только для важных эффектов (лучше производительность на мобильных)
      if (p.type === "fire" || p.type === "star") {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4; // Уменьшили blur для производительности
      }
      // Рисуем форму
      if (p.type === "star") {
        ctx.fillStyle = p.color;
        drawStar(ctx, 0, 0, (p.size * scale) / 2, 5, 0.5);
      } else if (p.type === "debris") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.rect(
          -((p.size * scale) / 2),
          -((p.size * scale) / 2),
          p.size * scale,
          p.size * scale * (0.6 + Math.random() * 0.4)
        );
        ctx.fill();
      } else if (p.type === "smoke") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, (p.size * scale) / 2, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, (p.size * scale) / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.restore();
    }
    if (alive > 0) {
      animationRef.current = requestAnimationFrame(() => animate(startTime));
    } else {
      if (!finishedRef.current) {
        finishedRef.current = true;
        if (onComplete) onComplete();
      }
    }
  }

  // Автоматический ресайз canvas под размеры поля
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = boardWidth * (cellSize + gap) - gap;
    const height = boardHeight * (cellSize + gap) - gap;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (width + padding * 2) * dpr;
    canvas.height = (height + padding * 2) * dpr;
    canvas.style.width = (width + padding * 2) + "px";
    canvas.style.height = (height + padding * 2) + "px";
  }, [boardWidth, boardHeight, cellSize, gap]);

  // Очистка анимации при размонтировании
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        left: -padding,
        top: -padding,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2000,
      }}
    />
  );
};

export default ExplosionParticlesCanvas; 