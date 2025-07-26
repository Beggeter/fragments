"use client";

import { ScoreResult } from "@/lib/data/types";
import { ColorTheme, colorThemes, getThemeByScore } from "../UI/colorThemes";
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { animate, useMotionValue, motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/state/store";
import { vibrate } from "@/utils/helpers";
import { useSettingsStore } from "@/lib/state/settings";
import { PerimeterParticles } from "./PerimeterParticles";

interface ComboVisualizerProps {
  speed?: number;
  className?: string;
  lastScore: ScoreResult | null;
  onExplodeChange?: (isExploding: boolean) => void;
}

/**
 * Calculates blur values based on moves and combo level
 * @returns [blurAmount, blurSpread] tuple
 */
const getBlur = (
  moves: number | undefined,
  comboLevel: number | undefined
): [number, number] => {
  if (!comboLevel || comboLevel < 1) return [0.5, 0.5];
  if (!moves || moves === 0) return [8, 1];
  if (moves === 1) return [6, 2];
  if (moves === 2) return [3, 3];
  if (moves >= 3) return [1, 8];
  return [0.5, 0.5];
};
// Компонент анимации барабана для счетчика комбо
const ComboCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      // Небольшая задержка для более заметной анимации
      const delayTimer = setTimeout(() => {
        setIsAnimating(true);
        
        // Запускаем анимацию
        const timer = setTimeout(() => {
          setDisplayValue(value);
          setIsAnimating(false);
        }, 300); // Время анимации
        
        return () => clearTimeout(timer);
      }, 50); // Задержка перед началом анимации
      
      return () => clearTimeout(delayTimer);
    }
  }, [value, displayValue]);

  const numberStyle = {
    fontFamily: "'Montserrat', Arial, sans-serif",
    fontWeight: 900,
    fontSize: 54,
    stroke: "#2968EA",
    strokeWidth: 6,
    fill: "#FFD600",
    paintOrder: "stroke" as const,
    letterSpacing: 2,
  };

  return (
    <g>
      <AnimatePresence initial={false}>
        {/* Текущее число */}
        <motion.text
          key={`current-${displayValue}`}
          x={0}
          y={0}
          {...numberStyle}
          initial={{ y: 0, opacity: 1 }}
          animate={isAnimating ? { y: -54, opacity: 0 } : { y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {displayValue}
        </motion.text>
        
        {/* Новое число (появляется снизу при анимации) */}
        {isAnimating && (
          <motion.text
            key={`new-${value}`}
            x={0}
            y={0}
            {...numberStyle}
            initial={{ y: 54, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {value}
          </motion.text>
        )}
      </AnimatePresence>
    </g>
  );
};

/**
 * ComboVisualizer component displays a visual representation of combo levels
 * with animated borders and text effects
 */
export const ComboVisualizer: React.FC<ComboVisualizerProps> = ({
  speed = 3,
  className = "",
  lastScore,
  onExplodeChange,
}) => {
  const theme = getThemeByScore(lastScore?.comboLevel);
  const blur = getBlur(lastScore?.movesSinceLastSuccess, lastScore?.comboLevel);
  const bg = useMotionValue(theme.background);
  const borderStart = useMotionValue(theme.borderStart);
  const borderMiddle = useMotionValue(theme.borderMiddle);
  const borderEnd = useMotionValue(theme.borderEnd);
  const blurValue = useMotionValue(`${blur[0]}px`);
  const brightnessValue = useMotionValue(1);
  const vibration = useSettingsStore((state) => state.vibrationValue);

  const scoreDisplayCoords = useGameStore((s) => s.scoreDisplayCoords);

  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(
    getThemeByScore(lastScore?.comboLevel)
  );
  const [currentBlur, setCurrentBlur] = useState<[number, number]>([0.5, 0.5]);
  const [isExploding, setIsExploding] = useState(false);
  const [showComboText, setShowComboText] = useState(false);
  const [showClearText, setShowClearText] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [scorePluses, setScorePluses] = useState<
    {
      id: number;
      x: number;
      y: number;
      value: number;
      to?: { x: number; y: number };
      color: string;
    }[]
  >([]);

  const scorePlusId = React.useRef(0);
  const comboRef = useRef<SVGTextElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [comboWidth, setComboWidth] = useState(0);
  const [comboHeight, setComboHeight] = useState(70); // svg высота по умолчанию
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Unified size calculation with better fallback
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  useLayoutEffect(() => {
    function updateContainerSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newSize = { width: rect.width, height: rect.height };
        
        // Добавляем проверки для production сборки
        // Если размеры слишком маленькие, используем fallback
        const minSize = 200; // минимальный размер для игрового поля
        const fallbackSize = 350; // fallback размер для production
        
        if (newSize.width < minSize || newSize.height < minSize) {
          console.warn('ComboVisualizer: размеры слишком маленькие, используем fallback', newSize);
          // Пытаемся получить размеры из CSS переменной или используем fallback
          const appVw = getComputedStyle(document.documentElement).getPropertyValue('--app-vw');
          const vwValue = appVw ? parseInt(appVw) : fallbackSize;
          const finalSize = Math.max(vwValue, fallbackSize);
          setContainerSize({ width: finalSize, height: finalSize });
          setSize({ width: finalSize, height: finalSize });
        } else {
          setContainerSize(newSize);
          setSize(newSize);
        }
      }
    }
    
    updateContainerSize();
    
    // Добавляем задержку для production сборки
    const timeoutId = setTimeout(updateContainerSize, 100);
    
    window.addEventListener("resize", updateContainerSize);
    return () => {
      window.removeEventListener("resize", updateContainerSize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle combo level changes
  useEffect(() => {
    if (lastScore?.comboLevel !== undefined) {
      if (lastScore.comboLevel > 0) {
        setIsExploding(true);
      if (typeof onExplodeChange === "function") onExplodeChange(true);
        // Only show combo text if container size is available
        if (containerSize.width > 0 && containerSize.height > 0) {
          setShowComboText(true);
        } else {
          // Delay showing combo text until container size is available
          const checkSizeTimer = setInterval(() => {
            if (containerSize.width > 0 && containerSize.height > 0) {
              setShowComboText(true);
              clearInterval(checkSizeTimer);
            }
          }, 50);
          setTimeout(() => clearInterval(checkSizeTimer), 500); // Fallback timeout
        }
        setShowParticles(true);
        setShowClearText(false);
        handleVibrate();

      const explodeTimer = setTimeout(() => {
        setIsExploding(false);
        if (typeof onExplodeChange === "function") onExplodeChange(false);
      }, 400);
      const textTimer = setTimeout(() => setShowComboText(false), 800);
      const particlesTimer = setTimeout(() => setShowParticles(false), 1000);

        return () => {
          clearTimeout(explodeTimer);
          clearTimeout(textTimer);
          clearTimeout(particlesTimer);
        };
      } else {
        // При сбросе комбо до 0 скрываем текст
        setShowComboText(false);
        setShowClearText(false);
        setShowParticles(false);
      }
    }
  }, [lastScore?.comboLevel, containerSize]);

  // Показываем clearText после ComboText (если был) или сразу, если нет
  useEffect(() => {
    let clearTextTimer: NodeJS.Timeout | null = null;
    if (lastScore?.isBoardCleared) {
      if (lastScore?.comboLevel) {
        // ComboText показывается, ждем 800мс
        clearTextTimer = setTimeout(() => {
          setShowClearText(true);
          // Скрываем через 800мс
          clearTextTimer = setTimeout(() => setShowClearText(false), 800);
        }, 800);
      } else {
        // ComboText не показывается, сразу clearText
        setShowClearText(true);
        clearTextTimer = setTimeout(() => setShowClearText(false), 800);
      }
    } else {
      setShowClearText(false);
    }
    return () => {
      if (clearTextTimer) clearTimeout(clearTextTimer);
    };
  }, [lastScore?.isBoardCleared, lastScore?.comboLevel]);

  useEffect(() => {
    if (lastScore?.pixelPosition) {
      const { x, y } = lastScore.pixelPosition;
      const value = lastScore.clearedLinesPoints * lastScore.comboBonus;
      const to = scoreDisplayCoords ? { ...scoreDisplayCoords } : undefined;
      const id = scorePlusId.current++;
      const color = theme.background;
      const delay = 400;
      const duration = 900;

      const delayTimer = setTimeout(() => {
        setScorePluses((prev) => [...prev, { id, x, y, value, to, color }]);
        // Удаляем через duration
        const removeTimer = setTimeout(() => {
          setScorePluses((prev) => prev.filter((sp) => sp.id !== id));
        }, duration);
        // Очищаем removeTimer если компонент размонтируется до удаления
        return () => clearTimeout(removeTimer);
      }, delay);

      return () => clearTimeout(delayTimer);
    }
  }, [lastScore?.pixelPosition]);

  const handleVibrate = () => {
    vibrate(vibration);
  };

  useEffect(() => {
    const t = debugMode ? currentTheme : theme;
    const b = debugMode ? currentBlur : blur;

    animate(bg, t.background, { duration: 0.7 });
    animate(borderStart, t.borderStart, { duration: 0.7 });
    animate(borderMiddle, t.borderMiddle, { duration: 0.7 });
    animate(borderEnd, t.borderEnd, { duration: 0.7 });

    if (isExploding) {
      animate(blurValue, `${Math.min(b[0] * 1.6, 12)}px`, { duration: 0.4 });
      animate(brightnessValue, 1.15, { duration: 0.4 });
    } else {
      animate(blurValue, `${b[0]}px`, { duration: 0.7 });
      animate(brightnessValue, 1, { duration: 0.4 });
    }
  }, [theme, blur, currentTheme, currentBlur, debugMode]);

  useLayoutEffect(() => {
    if (comboRef.current) {
      const bbox = comboRef.current.getBBox();
      setComboWidth(bbox.width);
      setComboHeight(bbox.height + 20); // запас
    }
  }, [lastScore?.comboLevel, showComboText]);

  // 9 позиций внутри поля (с учётом размера надписи)
  function getPossiblePositions() {
    // Use containerSize for more reliable calculations
    const currentWidth = containerSize.width;
    const currentHeight = containerSize.height;
    
    // If container size is not available, use more conservative fallback
    if (currentWidth === 0 || currentHeight === 0) {
      // Use fixed positions that work for most screen sizes
      const minSize = 320; // minimum reasonable container size
      const xs = [minSize * 0.25, minSize * 0.5, minSize * 0.75];
      const ys = [minSize * 0.25, minSize * 0.5, minSize * 0.75];
      
      const positions: { x: number; y: number }[] = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          positions.push({ x: xs[j], y: ys[i] });
        }
      }
      return positions;
    }

    // Use margins to prevent text from going to edges
    const marginX = Math.max(comboWidth / 2 + 20, 50);
    const marginY = Math.max(comboHeight / 2 + 20, 50);
    
    // Ensure positions are within bounds
    const safeWidth = Math.max(currentWidth - 2 * marginX, 100);
    const safeHeight = Math.max(currentHeight - 2 * marginY, 100);
    
    const xs = [
      marginX + safeWidth * 0.2,
      marginX + safeWidth * 0.5,
      marginX + safeWidth * 0.8
    ];
    const ys = [
      marginY + safeHeight * 0.2,
      marginY + safeHeight * 0.5,
      marginY + safeHeight * 0.8
    ];
    
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        positions.push({ x: xs[j], y: ys[i] });
      }
    }
    return positions;
  }

  // Функция поиска ближайшей позиции
  function getNearestPosition(
    target: { x: number; y: number } | undefined | null
  ) {
    const positions = getPossiblePositions();
    if (!target) return positions[4]; // центр
    let minDist = Infinity;
    let best: { x: number; y: number }[] = [];
    for (const pos of positions) {
      const dx = pos.x - target.x;
      const dy = pos.y - target.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist - 1e-3) {
        minDist = d;
        best = [pos];
      } else if (Math.abs(d - minDist) < 1e-3) {
        best.push(pos);
      }
    }
    // Если несколько — выбираем более правую, если x совпадает — более высокую (меньше y)
    best.sort((a, b) => b.x - a.x || a.y - b.y);
    return best[0];
  }

  const borderStyle = {
    "--border-angle": "0deg",
    "--animation-speed": `${speed}s`,
    "--bg-color": bg,
    "--border-start": borderStart,
    "--border-middle": borderMiddle,
    "--border-end": borderEnd,
    "--blur-type": blurValue,
    "--brightness": brightnessValue,
  } as React.CSSProperties;

  const renderScorePlus = (sp: {
    id: number;
    x: number;
    y: number;
    value: number;
    to?: { x: number; y: number };
    color: string;
  }) => {
    if (sp.to) {
      return (
        <div
          key={sp.id}
          style={
            {
              "--scoreplus-x": `${sp.x}px`,
              "--scoreplus-y": `${sp.y}px`,
              "--scoreplus-x-to": `${sp.to.x}px`,
              "--scoreplus-y-to": `${sp.to.y}px`,
              pointerEvents: "none",
              position: "absolute",
            } as React.CSSProperties
          }
          className="scoreplus-fly text-4xl z-2000 font-extrabold font-figtree"
        >
          {sp.value}
        </div>
      );
    }
    // fallback: просто на месте
    return (
      <div
        key={sp.id}
        style={{
          left: sp.x,
          top: sp.y,
          pointerEvents: "none",
          position: "absolute",
        }}
        className="text-4xl z-2000 font-extrabold font-figtree scoreplus-static"
      >
        {sp.value}
      </div>
    );
  };

  useEffect(() => {
    if (!containerRef.current) return;
    function updateSize() {
      const rect = containerRef.current?.getBoundingClientRect();
      const newSize = { width: rect?.width || 0, height: rect?.height || 0 };
      setSize(newSize);
      setContainerSize(newSize);
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Отладка: включить/выключить визуализацию позиций по нажатию D
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setDebugMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      {/* Визуализация возможных позиций для Combo (отладка) */}
      {debugMode && getPossiblePositions().map((pos, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            width: 14,
            height: 14,
            background: "#38BDF8",
            borderRadius: "50%",
            border: "2px solid #fff",
            boxShadow: "0 0 8px 2px #38BDF8",
            transform: "translate(-50%, -50%)",
            zIndex: 2000,
            pointerEvents: "none",
            opacity: 0.7,
          }}
        />
      ))}
      {debugMode && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "8px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 3000,
            fontFamily: "monospace",
          }}
        >
          <div>containerWidth: {containerSize.width}</div>
          <div>containerHeight: {containerSize.height}</div>
          <div>size.width: {size.width}</div>
          <div>size.height: {size.height}</div>
          <div>comboWidth: {comboWidth}</div>
          <div>comboHeight: {comboHeight}</div>
          {lastScore?.pixelPosition && (
            <>
              <div>target.x: {lastScore.pixelPosition.x}</div>
              <div>target.y: {lastScore.pixelPosition.y}</div>
            </>
          )}
        </div>
      )}
      <motion.div
        className={`absolute inset-0 p-2 -m-2 rounded-xl glowing-border ${
          isExploding ? "combo-explosion" : ""
        }`}
                style={borderStyle}
      />
            {/* --- ПЕРИМЕТРАЛЬНЫЕ ЧАСТИЦЫ ПРИ КОМБО --- */}
            {showParticles && size.width > 0 && size.height > 0 && (
        <PerimeterParticles
          width={Math.max(size.width, 200)}
          height={Math.max(size.height, 200)}
          visible={true}
          // color={theme.background}
        />
      )}

      {lastScore &&
        lastScore.comboLevel > 0 &&
        containerSize.width > 0 && containerSize.height > 0 && // Only render when container size is available
        (() => {
          const comboPos = getNearestPosition(lastScore.pixelPosition);
          // Ensure the position is within bounds and prevent negative values
          const totalWidth = comboWidth + 70 + 24;
          const left = Math.max(0, Math.min(comboPos.x - totalWidth / 2, containerSize.width - totalWidth));
          const top = Math.max(0, Math.min(comboPos.y - comboHeight / 2, containerSize.height - comboHeight));
          
          // Высота шрифта "Combo" примерно 48px
          const fontSize = 48;
          const circleDiameter = fontSize;
          const circleRadius = circleDiameter / 2;
          
          return (
            <div
              className={`combo-text ${showComboText ? "show" : ""}`}
              style={{
                left,
                top,
              }}
            >
              {/* Полупрозрачные круги с градиентом */}
              <div className="combo-background-circles">
                {/* Круг 1 - левый */}
                <div 
                  className="combo-circle circle-1"
                  style={{
                    position: 'absolute',
                    width: `${circleDiameter}px`,
                    height: `${circleDiameter}px`,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 255, 0, 0.4) 0%, rgba(255, 255, 0, 0.2) 50%, rgba(255, 255, 0, 0.05) 80%, transparent 100%)',
                    left: `${totalWidth / 2 - circleRadius * 2}px`,
                    top: `${comboHeight / 2}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: -1,
                    animation: 'combo-circle-pulse 2s ease-in-out infinite'
                  }}
                />
                {/* Круг 2 */}
                <div 
                  className="combo-circle circle-2"
                  style={{
                    position: 'absolute',
                    width: `${circleDiameter}px`,
                    height: `${circleDiameter}px`,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 255, 0, 0.3) 0%, rgba(0, 150, 255, 0.2) 40%, rgba(0, 150, 255, 0.1) 70%, transparent 100%)',
                    left: `${totalWidth / 2 - circleRadius}px`,
                    top: `${comboHeight / 2}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: -2,
                    animation: 'combo-circle-pulse 2s ease-in-out infinite 0.4s'
                  }}
                />
                {/* Круг 3 - центр */}
                <div 
                  className="combo-circle circle-3"
                  style={{
                    position: 'absolute',
                    width: `${circleDiameter}px`,
                    height: `${circleDiameter}px`,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 255, 0, 0.25) 0%, rgba(0, 150, 255, 0.25) 50%, rgba(0, 150, 255, 0.15) 80%, transparent 100%)',
                    left: `${totalWidth / 2}px`,
                    top: `${comboHeight / 2}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: -3,
                    animation: 'combo-circle-pulse 2s ease-in-out infinite 0.8s'
                  }}
                />
                {/* Круг 4 */}
                <div 
                  className="combo-circle circle-4"
                  style={{
                    position: 'absolute',
                    width: `${circleDiameter}px`,
                    height: `${circleDiameter}px`,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0, 150, 255, 0.3) 0%, rgba(0, 150, 255, 0.2) 60%, rgba(0, 150, 255, 0.1) 80%, transparent 100%)',
                    left: `${totalWidth / 2 + circleRadius}px`,
                    top: `${comboHeight / 2}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: -4,
                    animation: 'combo-circle-pulse 2s ease-in-out infinite 1.2s'
                  }}
                />
                {/* Круг 5 - правый */}
                <div 
                  className="combo-circle circle-5"
                  style={{
                    position: 'absolute',
                    width: `${circleDiameter}px`,
                    height: `${circleDiameter}px`,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0, 150, 255, 0.4) 0%, rgba(0, 150, 255, 0.2) 70%, rgba(0, 150, 255, 0.05) 90%, transparent 100%)',
                    left: `${totalWidth / 2 + circleRadius * 2}px`,
                    top: `${comboHeight / 2}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: -5,
                    animation: 'combo-circle-pulse 2s ease-in-out infinite 1.6s'
                  }}
                />
              </div>
              
              <svg
                width={totalWidth}
                height={comboHeight}
                style={{ display: "block", position: "relative", zIndex: 1 }}
              >
                <text
                  ref={comboRef}
                  x={10}
                  y={comboHeight - 18}
                  fontFamily="'Montserrat', Arial, sans-serif"
                  fontWeight="900"
                  fontSize="48"
                  stroke="#2968EA"
                  strokeWidth="6"
                  fill="#fff"
                  paintOrder="stroke"
                  style={{ letterSpacing: 2 }}
                >
                  Combo
                </text>
                <g transform={`translate(${comboWidth + 16}, ${comboHeight - 18})`}>
                  <ComboCounter value={lastScore.comboLevel} />
                </g>
              </svg>
            </div>
          );
        })()}
      {showClearText && (
        <div
          className=" clear-text text-red-200  absolute flex items-center justify-center
        inset-0 z-1000 font-figtree font-bold tracking-wider text-5xl"
        >
          Cleared!
        </div>
      )}
      {scorePluses.map((sp) => renderScorePlus(sp))}
    </div>
  );
};
