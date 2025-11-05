import React, { useEffect, useState } from "react";
import { useGameStore } from "../lib/state/store";
import BackgroundAnimation from "@/components/UI/BackgroundAnimation";
import MenuButton from "@/components/UI/MenuButton";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ScoreDisplay } from "./board/ScoreDisplay";
import { LoadingNumberAnimation } from "./LoadingNumberAnimation";
import { useTranslation } from "react-i18next";
import { AdOverlay } from "./AdOverlay";

interface GameOverProps {
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  gameMode?: 'classic' | 'zen';
}

export const GameOver: React.FC<GameOverProps> = ({ onPlayAgain, onBackToMenu, gameMode = 'classic' }) => {
  const { score } = useGameStore();
  const { user } = useUser();
  const { isAdmin } = useAdminAuth();
  const [adminRecord, setAdminRecord] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number>(gameMode === 'zen' ? (user?.zenRecord ?? 0) : (user?.record ?? 0));
  const [isRecordLoading, setIsRecordLoading] = useState(true);
  const [isAdShowing, setIsAdShowing] = useState(false);
  const { t } = useTranslation();
  
  useEffect(() => {
    const userRecord = gameMode === 'zen' ? (user?.zenRecord ?? 0) : (user?.record ?? 0);
    setHighScore(score > userRecord ? score : userRecord);
  }, [user, score, gameMode]);

  // Показываем рекламу при появлении экрана Game Over
  // Используем window.show который устанавливается в AdManager
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let attempts = 0;
    const maxAttempts = 30; // Пытаемся 30 раз
    let intervalId: NodeJS.Timeout;
    let fastIntervalId: NodeJS.Timeout;
    let adShown = false; // Флаг, чтобы показывать рекламу только один раз
    
    const showAd = () => {
      if (adShown || !window.show) return;
      
      adShown = true;
      console.log(`Showing ad immediately (attempt ${attempts + 1})`);
      
      // Показываем подложку перед показом рекламы
      setIsAdShowing(true);
      
      // When the button is pressed, we activate the obtained SHOW method
      window.show()
        .then(() => {
          console.log("Ad completed successfully");
          // Скрываем подложку после завершения рекламы
          setIsAdShowing(false);
          // Можно добавить логику награды после просмотра рекламы
        })
        .catch((err: any) => {
          // Улучшенная обработка ошибок - логируем детали
          const errorMessage = err?.message || err?.toString() || String(err) || 'Unknown error';
          const errorDetails = {
            message: errorMessage,
            error: err,
            stack: err?.stack,
            name: err?.name
          };
          console.error("Ad error:", errorDetails);
          // Скрываем подложку при ошибке
          setIsAdShowing(false);
          // Игнорируем ошибки рекламы - игра продолжает работать
        });
    };
    
    const tryShowAd = () => {
      // Если реклама уже показана, не пытаемся снова
      if (adShown) {
        clearInterval(intervalId);
        return;
      }
      
      attempts++;
      
      // Используем window.show который устанавливается в AdManager
      if (window.show) {
        clearInterval(intervalId); // Останавливаем интервал
        showAd();
      } else {
        if (attempts % 4 === 0) { // Логируем каждые 4 попытки
          console.log(`Ad not ready yet, attempt ${attempts}/${maxAttempts}`);
        }
        if (attempts >= maxAttempts) {
          console.warn("Ad not available after multiple attempts");
          clearInterval(intervalId);
        }
      }
    };

    // Сразу проверяем, готова ли реклама - если да, запускаем немедленно
    if (window.show) {
      showAd();
    } else {
      // Если реклама не готова, начинаем частые проверки
      // Сначала проверяем каждые 50ms для быстрого старта
      fastIntervalId = setInterval(() => {
        if (window.show) {
          clearInterval(fastIntervalId);
          showAd();
        } else {
          attempts++;
          if (attempts >= 10) {
            // После 10 быстрых попыток (500ms) переходим на обычный интервал
            clearInterval(fastIntervalId);
            intervalId = setInterval(tryShowAd, 250);
          }
        }
      }, 50);
      
      // Ограничиваем время быстрых проверок
      setTimeout(() => {
        clearInterval(fastIntervalId);
        if (!adShown) {
          intervalId = setInterval(tryShowAd, 250);
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (fastIntervalId) clearInterval(fastIntervalId);
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setIsRecordLoading(true);
      fetch("/api/users/610936383")
        .then((res) => res.json())
        .then((data) => {
          setAdminRecord(typeof data.record === "number" ? data.record : 0);
          setIsRecordLoading(false);
        })
        .catch(() => {
          setAdminRecord(0);
          setIsRecordLoading(false);
        });
    } else {
      setAdminRecord(null);
      setIsRecordLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && adminRecord !== null) {
      setHighScore(score > adminRecord ? score : adminRecord);
    }
  }, [isAdmin, adminRecord, score]);

  return (
    <>
      {/* Подложка для рекламы - показывается поверх всего контента */}
      <AdOverlay 
        isVisible={isAdShowing}
        onAdComplete={() => setIsAdShowing(false)}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen w-full fade-in-animation-fast">
        {/* Фоновая анимация как в MainMenu */}
        <BackgroundAnimation className="absolute inset-0 -z-10 -top-15" />
      <div className="flex flex-col items-center gap-15 max-w-md w-[90vw]">
        <h2 className="text-6xl font-bold font-figtree text-white mb-2 tracking-wide menu-shadow">
          Game Over
        </h2>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-1 max-w-md w-[90vw]">
            <p className="text-3xl font-figtree text-white font-bold mb-2">
              {t('game_over.your_score')}
            </p>
            <div className="text-5xl font-extrabold font-figtree text-green-400 mb-4 menu-shadow">
              {score}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 max-w-md w-[90vw]">
            <p className="text-2xl font-figtree text-white font-bold mb-2">
              {t('game_over.high_score')}
            </p>
            {isRecordLoading ? (
              <div className="text-4xl font-extrabold font-figtree text-amber-400 mb-4 menu-shadow">
                <LoadingNumberAnimation
                  isLoading={true}
                  minDigits={4}
                  speed={50}
                />
              </div>
            ) : (
              <div className="text-4xl font-extrabold font-figtree text-amber-400 mb-4 menu-shadow">
                {highScore}
              </div>
            )}
          </div>
        </div>
        <span className="flex flex-col gap-5 w-full items-center">
          <MenuButton
            // text={t('game_over.play_again')}
            text={'Play Again'}
            gradientClass="green-gradient"
            className="rounded-3xl px-8 py-4  font-bold  w-[60%]"
            textClasses="font-black italic text-3xl"
            onClick={onPlayAgain}
          />
          <MenuButton
            text={'Back to menu'}
            gradientClass="orange-gradient"
            className="rounded-3xl px-8 py-4 font-bold w-[60%] mt-2"
            textClasses="font-black italic text-3xl"
            onClick={onBackToMenu}
          />
        </span>
      </div>
      </div>
    </>
  );
};
