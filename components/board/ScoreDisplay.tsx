import React, { useEffect, useState, forwardRef } from "react";
import { ScoreResult } from "../../lib/data/types";

interface ScoreDisplayProps {
  newScore: number;
  moveScore: ScoreResult | null;
  className?: string;
}

export const ScoreDisplay = forwardRef<HTMLDivElement, ScoreDisplayProps>(
  ({ newScore, moveScore, className = "" }, ref) => {
    const [displayScore, setDisplayScore] = useState(newScore);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      if (newScore !== displayScore) {
        setIsAnimating(true);
        // Анимация изменения счета
        const animationDuration = 500; // ms
        const startScore = displayScore;
        const endScore = newScore;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);

          // Плавная анимация с использованием easeOutQuad
          const easeProgress = 1 - (1 - progress) * (1 - progress);
          const currentScore = Math.round(
            startScore + (endScore - startScore) * easeProgress
          );

          setDisplayScore(currentScore);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      }
    }, [newScore]);

    return (
      <div ref={ref} className={`flex flex-col items-center ${className}`}>
        <div className="relative">
          <div
            className={`text-[4rem] font-extrabold font-figtree text-white transition-all duration-300 relative ${
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
