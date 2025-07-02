"use client";

import { ScoreResult } from "@/lib/data/types";
import { ColorTheme, colorThemes, getThemeByScore } from "../UI/colorThemes";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { animate, useMotionValue, motion } from "framer-motion";
import { useGameStore } from "@/lib/state/store";
import { vibrate } from "@/utils/helpers";
import { useSettingsStore } from "@/lib/state/settings";

interface ComboVisualizerProps {
  speed?: number;
  className?: string;
  lastScore: ScoreResult | null;
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

/**
 * ComboVisualizer component displays a visual representation of combo levels
 * with animated borders and text effects
 */
export const ComboVisualizer: React.FC<ComboVisualizerProps> = ({
  speed = 3,
  className = "",
  lastScore,
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
  const [comboWidth, setComboWidth] = useState(0);

  // Handle combo level changes
  useEffect(() => {
    if (lastScore?.comboLevel) {
      setIsExploding(true);
      setShowComboText(true);
      setShowClearText(false);
      handleVibrate();

      const explodeTimer = setTimeout(() => setIsExploding(false), 400);
      const textTimer = setTimeout(() => setShowComboText(false), 800);

      return () => {
        clearTimeout(explodeTimer);
        clearTimeout(textTimer);
      };
    }
  }, [lastScore?.comboLevel]);

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
      setComboWidth(comboRef.current.getBBox().width);
    }
  }, [lastScore?.comboLevel, showComboText]);

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
              color: sp.color,
              WebkitTextStroke: "1.2px #38BDF8",
              textShadow: undefined,
              position: "absolute",
            } as React.CSSProperties
          }
          className="scoreplus-fly text-4xl z-2000 font-extrabold font-figtree"
        >
          +{sp.value}
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
          color: sp.color,
          WebkitTextStroke: "1.2px #38BDF8",
          textShadow: undefined,
          position: "absolute",
        }}
        className="text-4xl z-2000 font-extrabold font-figtree"
      >
        {sp.value}
      </div>
    );
  };

  return (
    <>
      <motion.div
        className={`absolute inset-0 p-2 -m-2 rounded-xl glowing-border ${
          isExploding ? "combo-explosion" : ""
        }`}
        style={borderStyle}
      />
      {lastScore && lastScore.comboLevel > 0 && (
        <div
          className={`combo-text ${
            showComboText ? "show" : ""
          } absolute flex items-center justify-center inset-0 z-1000`}
          // style={{ pointerEvents: "none" }}
          style={{
            position: "absolute",
            left: lastScore.pixelPosition?.x,
            top: lastScore.pixelPosition?.y,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <svg
            width={comboWidth + (lastScore.comboLevel > 1 ? 70 : 0) + 24}
            height={70}
            style={{ display: "block" }}
          >
            <text
              ref={comboRef}
              x={10}
              y={52}
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
            {lastScore.comboLevel > 1 && (
              <text
                x={comboWidth + 16}
                y={52}
                fontFamily="'Montserrat', Arial, sans-serif"
                fontWeight="900"
                fontSize="54"
                stroke="#2968EA"
                strokeWidth="6"
                fill="#FFD600"
                paintOrder="stroke"
                style={{ letterSpacing: 2 }}
              >
                {lastScore.comboLevel}
              </text>
            )}
          </svg>
        </div>
      )}

      {showClearText && (
        <div
          className=" clear-text text-red-200  absolute flex items-center justify-center
        inset-0 z-1000 font-figtree font-bold tracking-wider text-5xl"
        >
          Cleared!
        </div>
      )}

      {scorePluses.map((sp) => renderScorePlus(sp))}
    </>
  );
};
