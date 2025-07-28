import React, { useEffect, useState } from "react";
import { useGameStore } from "../lib/state/store";
import BackgroundAnimation from "@/components/UI/BackgroundAnimation";
import MenuButton from "@/components/UI/MenuButton";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ScoreDisplay } from "./board/ScoreDisplay";
import { LoadingNumberAnimation } from "./LoadingNumberAnimation";
import { useTranslation } from "react-i18next";

interface GameOverProps {
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ onPlayAgain, onBackToMenu }) => {
  const { score } = useGameStore();
  const { user } = useUser();
  const { isAdmin } = useAdminAuth();
  const [adminRecord, setAdminRecord] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number>(user?.record ?? 0);
  const [isRecordLoading, setIsRecordLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const userRecord = user?.record ?? 0;
    setHighScore(score > userRecord ? score : userRecord);
  }, [user, score]);

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
          gradientClass="yellow-gradient"
          className="rounded-3xl px-8 py-4 font-bold w-[60%] mt-2"
          textClasses="font-black italic text-3xl"
          onClick={onBackToMenu}
        />
      </div>
    </div>
  );
};
