import React, {
  useEffect,
  useState,
  forwardRef,
  useCallback,
  useRef,
} from "react";
import { ScoreResult } from "../../lib/data/types";

interface ScoreDisplayProps {
  newScore: number;
  moveScore: ScoreResult | null;
  className?: string;
}

export const ScoreDisplay = forwardRef<HTMLDivElement, ScoreDisplayProps>(
  ({ newScore, moveScore, className = "" }, ref) => {
    // Ensure newScore is a valid number
    const validNewScore =
      isNaN(newScore) || newScore === undefined ? 0 : newScore;
    const [displayScore, setDisplayScore] = useState(validNewScore);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number | undefined>(undefined);

    const animateScore = useCallback((startScore: number, endScore: number) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      setIsAnimating(true);
      let animationDuration: number;
      if (endScore === 0) {
        animationDuration = 300;
      } else {
        // Базовое время анимации
        const baseDuration = 2000; // 2 секунды
        // Вычисляем разницу между значениями
        const scoreDifference = Math.abs(endScore - startScore);
        // Увеличиваем время анимации в зависимости от разницы
        // Например, каждые 1000 очков добавляем 1 секунду
        const additionalDuration = Math.floor(scoreDifference / 50) * 500;
        animationDuration = baseDuration + additionalDuration;
      }

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Плавная анимация с использованием easeOutQuad
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        const currentScore = Math.round(
          startScore + (endScore - startScore) * easeProgress
        );

        // Ensure the calculated score is valid
        const validCurrentScore = isNaN(currentScore) ? endScore : currentScore;
        setDisplayScore(validCurrentScore);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          animationRef.current = undefined;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
      if (validNewScore !== displayScore) {
        animateScore(displayScore, validNewScore);
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [validNewScore, displayScore, animateScore]);

    return (
      <div ref={ref} className={`flex flex-col items-center ${className}`}>
        <div className="relative h-[7rem] flex items-center justify-center">
          <div
            className={`text-[3.5rem] font-extrabold font-figtree text-white transition-all duration-300 relative ${
              isAnimating ? "scale-110" : "scale-100"
            }`}
          >
            {displayScore}
          </div>
        </div>
      </div>
    );
  }
);
ScoreDisplay.displayName = "ScoreDisplay";
