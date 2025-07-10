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
  moveScore?: ScoreResult | null;
  className?: string;
  variant?: "score" | "record";
  showAnimation?: boolean;
  isFirstMount?: boolean;
}

export const ScoreDisplay = forwardRef<HTMLDivElement, ScoreDisplayProps>(
  (
    {
      newScore,
      moveScore,
      className = "",
      variant = "score",
      showAnimation = true,
      isFirstMount
    },
    ref
  ) => {
    // Ensure newScore is a valid number
    const validNewScore =
      isNaN(newScore) || newScore === undefined ? 0 : newScore;
    const [displayScore, setDisplayScore] = useState(validNewScore);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number | undefined>(undefined);
    const prevTargetRef = useRef(validNewScore);

    // Функция мгновенно досчитывает до предыдущего целевого значения
    const finishAnimation = useCallback(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      setDisplayScore(prevTargetRef.current);
      setIsAnimating(false);
    }, []);

    const animateScore = useCallback(
      (startScore: number, endScore: number) => {
        if (!showAnimation) {
          setDisplayScore(endScore);
          return;
        }

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        setIsAnimating(true);
        let animationDuration: number;
        if (endScore === 0 || isFirstMount) {
          animationDuration = 1000;
        } else {
          // Базовое время анимации
          const baseDuration = variant === "record" ? 1000 : 2000; // Быстрее для рекорда
          // Вычисляем разницу между значениями
          const scoreDifference = Math.abs(endScore - startScore);
          // Увеличиваем время анимации в зависимости от разницы
          const additionalDuration = Math.floor(scoreDifference / 50) * 1000;
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
          const validCurrentScore = isNaN(currentScore)
            ? endScore
            : currentScore;
          setDisplayScore(validCurrentScore);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
            animationRef.current = undefined;
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      },
      [showAnimation, variant]
    );

    useEffect(() => {
      const prevScore = prevTargetRef.current;
      prevTargetRef.current = validNewScore;

      // Если целевое значение не изменилось, ничего не делаем
      if (prevScore === validNewScore) {
        return;
      }

      // Если предыдущая анимация еще идет, отменяем ее
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Новая анимация всегда начинается с предыдущего целевого значения.
      // Это создает эффект "прыжка" к прошлому результату перед новой анимацией.
      const startScore = prevScore;
      animateScore(startScore, validNewScore);

      // Функция для очистки при размонтировании компонента
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [validNewScore, animateScore]);

    // Определяем стили в зависимости от варианта

    const getScoreStyles = () => {
      const baseStyles =
        "font-extrabold font-figtree transition-all duration-300 relative";

      if (variant === "record") {
        // Стили для рекорда - меньше размер, без анимации масштабирования
        return `${className} text-[1.5rem] record-trophy ${baseStyles}`;
      }

      // Стили для основного счета
      const animationClass = isAnimating ? "scale-110" : "scale-100";
      return `${className} text-white text-[3rem] ${baseStyles} ${animationClass}`;
    };

    const getWrapperStyles = () => {
      if (variant === "record") {
        return "relative h-[2rem] flex items-center justify-center"; // Компактная высота для рекорда
      }
      return "relative h-[7rem] flex items-center justify-center"; // Обычная высота для счета
    };

    return (
      <div ref={ref} className={getWrapperStyles()}>
        <div className={getScoreStyles()}>{displayScore}</div>
      </div>
    );
  }
);
ScoreDisplay.displayName = "ScoreDisplay";
