"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import star from "@/public/romn.svg";
import Image from "next/image";
import { createArray, getRandomItem } from "@/utils/helpers";
import { getOptimizedResourceCount } from "@/lib/utils/resourceCache";

interface BackgroundAnimationProps {
  className?: string;
}

// ✅ Адаптивное количество элементов в зависимости от типа соединения
const BASE_ELEMENT_COUNT = 20;
const NUM_ELEMENTS = getOptimizedResourceCount(BASE_ELEMENT_COUNT);
const SIZES = [20, 30, 40, 50, 60, 70];
const START_LEFT = 3; // Начальная позиция слева
const END_LEFT = 97; // Конечная позиция слева
const STEP_LEFT = (END_LEFT - START_LEFT) / (NUM_ELEMENTS - 1);
const leftOffsets = createArray(START_LEFT, END_LEFT + STEP_LEFT, STEP_LEFT); // Создаем массив отступов

const generateRandomElements = () => {
  const elements = [];
  for (let i = 0; i < NUM_ELEMENTS; i++) {
    const size = getRandomItem(SIZES);
    const duration = Math.random() * 10 + 8;
    const delay = Math.random() * 5 + 1;
    const initialLeft = leftOffsets[i];

    elements.push({
      id: i,
      size,
      duration,
      delay,
      initialLeft,
    });
  }
  return elements;
};

const BackgroundAnimation: FC<BackgroundAnimationProps> = ({ className }) => {
  const [animatedElements, setAnimatedElements] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // ✅ Добавляем состояние загрузки

  useEffect(() => {
    // ✅ Задержка инициализации анимации для приоритета критичного контента
    const initTimer = setTimeout(() => {
      setAnimatedElements(generateRandomElements());
      setIsLoaded(true);
    }, 100); // Небольшая задержка для лучшей производительности
    
    return () => clearTimeout(initTimer);
  }, []);

  return (
    <div className={className} style={{ pointerEvents: 'none' }}>
      {isLoaded && animatedElements.map((element) =>
        element.id % 2 === 0 ? (
          <div
            key={element.id}
            className="falling-element absolute falling-square rounded" // Используем базовый класс loh и tailwind классы
            style={
              {
                width: `${element.size}px`,
                height: `${element.size}px`,
                left: `${element.initialLeft}%`,
                // Применяем рандомную длительность и задержку через CSS переменные
                "--animation-duration": `${element.duration}s`,
                "--animation-delay": `${element.delay}s`,
              } as React.CSSProperties
            } // Указываем тип для поддержки CSS переменных
          ></div>
        ) : (
          <img
            key={element.id}
            src={star.src}
            alt="star"
            className="falling-element absolute"
            style={
              {
                width: `${element.size * 2}px`,
                height: `${element.size * 2}px`,
                left: `${element.initialLeft}%`,
                "--animation-duration": `${element.duration}s`,
                "--animation-delay": `${element.delay}s`,
                WebkitTransform: 'translateZ(0)',
                transform: 'translateZ(0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              } as React.CSSProperties
            }
          />
        )
      )}
    </div>
  );
};

export default BackgroundAnimation;
