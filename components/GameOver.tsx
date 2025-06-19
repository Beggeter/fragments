import React from "react";
import { useGameStore } from "../lib/state/store";
import BackgroundAnimation from "@/components/UI/BackgroundAnimation";
import MenuButton from "@/components/UI/MenuButton";

interface GameOverProps {
  onPlayAgain: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ onPlayAgain }) => {
  const { score } = useGameStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen w-full">
      {/* Фоновая анимация как в MainMenu */}
      <BackgroundAnimation className="absolute inset-0 -z-10" />
      <div className="flex flex-col items-center gap-15 max-w-md w-[90vw]">
        <h2 className="text-6xl font-bold font-figtree text-white mb-2 tracking-wide menu-shadow">
          Game Over
        </h2>
        <div>
          <div className="flex flex-col items-center gap-2 max-w-md w-[90vw]">
            <p className="text-3xl font-figtree text-white font-bold mb-2">
              Your score:
            </p>
            <div className="text-5xl font-extrabold font-figtree text-green-400 mb-4 menu-shadow">
              {score}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 max-w-md w-[90vw]">
            <p className="text-2xl font-figtree text-white font-bold mb-2">
              High score:
            </p>
            <div className="text-5xl font-extrabold font-figtree text-amber-400 mb-4 menu-shadow">
              99999
            </div>
          </div>
        </div>
        <MenuButton
          text="Play Again"
          gradientClass="green-gradient"
          className="rounded-3xl px-8 py-4  font-bold  w-[60%]"
          textClasses="font-black italic text-3xl"
          onClick={onPlayAgain}
        />
      </div>
    </div>
  );
};
