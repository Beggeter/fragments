import { ScoreResult } from "@/lib/data/types";
import { ColorTheme, colorThemes } from "../UI/colorThemes";
import React, { useState, useEffect } from "react";
import { animate, useMotionValue, motion } from "framer-motion";
import { useGameStore } from "../../lib/state/store";

interface ComboVisualizerProps {
  speed?: number;
  className?: string;
  lastScore: ScoreResult | null;
}

/**
 * Gets the appropriate color theme based on the combo level
 */
const getThemeByScore = (score: number | undefined): ColorTheme => {
  if (!score) return colorThemes.level1;
  if (score > 21) return colorThemes.level21;
  return colorThemes[`level${score}` as keyof typeof colorThemes];
};

/**
 * Calculates blur values based on moves and combo level
 * @returns [blurAmount, blurSpread] tuple
 */
const getBlur = (
  moves: number | undefined,
  comboLevel: number | undefined
): [number, number] => {
  if (!comboLevel || comboLevel < 1) return [0.5, 0.5];
  if (!moves || moves === 0) return [25, 1];
  if (moves === 1) return [15, 2];
  if (moves === 2) return [5, 3];
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

  const scoreDisplayCoords = useGameStore((s) => s.scoreDisplayCoords);

  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(
    getThemeByScore(lastScore?.comboLevel)
  );
  const [currentBlur, setCurrentBlur] = useState<[number, number]>([0.5, 0.5]);
  const [isExploding, setIsExploding] = useState(false);
  const [showComboText, setShowComboText] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [activeTheme, setActiveTheme] = useState(1);
  const [activeBlur, setActiveBlur] = useState(1);
  const [showScorePlus, setShowScorePlus] = useState(false);

  // Handle combo level changes
  useEffect(() => {
    if (lastScore?.comboLevel) {
      setIsExploding(true);
      handleVibrate();
      const timer = setTimeout(() => setIsExploding(false), 400);
      return () => clearTimeout(timer);
    }
  }, [lastScore?.comboLevel]);

  useEffect(() => {
    if (lastScore?.comboLevel) {
      setShowComboText(true);
      const timer = setTimeout(() => setShowComboText(false), 800);
      return () => clearTimeout(timer);
    }
  }, [lastScore?.comboLevel]);

  useEffect(() => {
    if (lastScore?.pixelPosition) {
      setShowScorePlus(false);

      const delay = 600;
      const duration = 900;

      const delayTimer = setTimeout(() => {
        setShowScorePlus(true);
        const hideTimer = setTimeout(() => setShowScorePlus(false), duration);
        return () => clearTimeout(hideTimer);
      }, delay);

      return () => clearTimeout(delayTimer);
    }
  }, [lastScore?.pixelPosition]);

  const handleVibrate = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([20]);
    }
  };

  useEffect(() => {
    const t = debugMode ? currentTheme : theme;
    const b = debugMode ? currentBlur : blur;

    animate(bg, t.background, { duration: 0.7 });
    animate(borderStart, t.borderStart, { duration: 0.7 });
    animate(borderMiddle, t.borderMiddle, { duration: 0.7 });
    animate(borderEnd, t.borderEnd, { duration: 0.7 });

    if (isExploding) {
      animate(blurValue, `${b[0] * 1.6}px`, { duration: 0.4 });
      animate(brightnessValue, 1.4, { duration: 0.4 }); // Добавляем анимацию brightness
    } else {
      animate(blurValue, `${b[0]}px`, { duration: 0.7 });
      animate(brightnessValue, 1, { duration: 0.4 }); // Возвращаем к нормальному brightness
    }
  }, [theme, blur, currentTheme, currentBlur, debugMode]);

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

  const renderScorePlus = () => {
    if (!lastScore?.pixelPosition) return null;
    const { x, y } = lastScore.pixelPosition;
    if (scoreDisplayCoords) {
      return (
        <div
          style={
            {
              "--scoreplus-x": `${x}px`,
              "--scoreplus-y": `${y}px`,
              "--scoreplus-x-to": `${scoreDisplayCoords.x}px`,
              "--scoreplus-y-to": `${scoreDisplayCoords.y}px`,
              pointerEvents: "none",
              color: theme.background,
              textShadow: "0 0 8px #000, 0 0 2px #fff",
              position: "absolute",
            } as React.CSSProperties
          }
          className="scoreplus-fly text-4xl z-2000 font-extrabold font-figtree"
        >
          +{lastScore?.clearedLinesPoints * lastScore?.comboBonus}
        </div>
      );
    }
    // fallback: просто на месте
    return (
      <div
        style={{
          left: x,
          top: y,
          pointerEvents: "none",
          color: theme.background,
          textShadow: "0 0 8px #000, 0 0 2px #fff",
          position: "absolute",
        }}
        className="text-4xl z-2000 font-extrabold font-figtree"
      >
        +{lastScore?.clearedLinesPoints * lastScore?.comboBonus}
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
          } text-amber-100 absolute flex items-center justify-center inset-0
           z-1000 font-figtree font-extrabold italic text-4xl drop-shadow-[3px_px_10px_rgba(255,255,255,0.4)]`}
        >
          {`Combo ${
            lastScore.comboLevel > 1 ? `X${lastScore.comboLevel}` : ""
          }!`}
        </div>
      )}

      <div className="absolute -top-10 right-0 z-[1001] flex flex-col gap-2 p-2 max-h-[50vh] overflow-y-scroll">
        <button
          className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700"
          onClick={() => setDebugMode(!debugMode)}
        >
          {debugMode ? "Hide Debug" : "Show Debug"}
        </button>

        {debugMode && (
          <div className="flex flex-col gap-1 bg-gray-800/80 p-2 rounded">
            <div className="text-xs text-white mb-1">Theme Level:</div>
            {[
              1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
              20, 21,
            ].map((level) => (
              <button
                key={level}
                className={`${
                  level === activeTheme ? "outline" : ""
                } px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600`}
                onClick={() => {
                  setCurrentTheme(getThemeByScore(level));
                  setActiveTheme(level);
                }}
              >
                Level {level}
              </button>
            ))}

            <div className="text-xs text-white mt-2 mb-1">Blur Level:</div>
            {[0, 1, 2, 3].map((moves) => (
              <button
                key={moves}
                className={`${
                  moves === activeBlur ? "outline" : ""
                } px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600`}
                onClick={() => {
                  setCurrentBlur(getBlur(moves, 3));
                  setActiveBlur(moves);
                }}
              >
                Moves: {moves}
              </button>
            ))}
          </div>
        )}
      </div>
      {showScorePlus && renderScorePlus()}
    </>
  );
};
