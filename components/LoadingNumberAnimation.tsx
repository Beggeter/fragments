import React, { useEffect, useState, useRef, useCallback } from "react";

interface LoadingNumberAnimationProps {
  isLoading: boolean;
  minDigits?: number;
  speed?: number; // миллисекунды между изменениями
}

export const LoadingNumberAnimation: React.FC<LoadingNumberAnimationProps> = ({
  isLoading,
  minDigits = 4,
  speed = 50,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Функция для генерации случайного числа с заданным количеством цифр
  const generateRandomNumber = useCallback((digits: number): number => {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }, []);

  // Запуск анимации загрузки
  const startLoadingAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const randomValue = generateRandomNumber(minDigits);
      setDisplayValue(randomValue);
    }, speed);
  }, [minDigits, generateRandomNumber, speed]);

  // Остановка анимации
  const stopLoadingAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    // Сбрасываем значение к 0 при остановке
    setDisplayValue(0);
  }, []);

  useEffect(() => {
    if (isLoading) {
      startLoadingAnimation();
    } else {
      stopLoadingAnimation();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading, startLoadingAnimation, stopLoadingAnimation]);

  return <>{displayValue.toLocaleString()}</>;
}; 