import React from "react";
import { getThemeByScore } from "./UI/colorThemes";
import ClickEffect from "./ClickEffect";

interface BoosterWithCount {
  id: string;
  name: string;
  icon: string;
  quantity: number;
}

interface BoostersPanelProps {
  boosters: BoosterWithCount[];
  onBoosterClick: (boosterId: string) => void;
  className?: string;
  comboLevel?: number;
  activeBooster?: string;
  gameOver?: boolean;
  onOpenShop?: () => void;
}

export const BoostersPanel: React.FC<BoostersPanelProps> = ({
  boosters,
  onBoosterClick,
  className = "",
  comboLevel,
  activeBooster,
  gameOver,
  onOpenShop,
}) => {
  const theme = getThemeByScore(comboLevel);

  return (
    <div
      className={`booster-container bg-gray-800 px-4 py-4 h-14 
        rounded-4xl rounded-bl-none rounded-br-none -mt-6
          border-2 border-b-0 shadow-xl ${className}`}
      style={
        {
          "--outline-color": theme.borderMiddle,
        } as React.CSSProperties
      }
    >
      <div className="flex justify-between gap-2 ">
        {boosters.map((booster) => {
          const isDisabled =
            booster.quantity === 0 ||
            (!!activeBooster && activeBooster !== booster.name);
          const isAvailable = booster.quantity > 0;
          // Цвета для пузырика
          // let bubbleColor = "#2868C3";
          // let bubbleBorder = "#3AA3FB";
          // if (booster.id === "bomb") {
          //   bubbleColor = "#A90E24";
          //   bubbleBorder = "#E53142";
          // } else if (booster.id === "whirlwind") {
          //   bubbleColor = "#481C8D";
          //   bubbleBorder = "#6E2DAE";
          // }
          return (
            <ClickEffect key={booster.id}>
              <button
                className={`w-11 h-11 rounded-full aspect-square shadow-md
               flex items-center justify-center hover:scale-110 transition-transform relative
               ${activeBooster === booster.name ? "ring-3 ring-red-500 " : ""}`}
                type="button"
                style={{ padding: 0 }}
                onClick={() =>
                  isAvailable ? onBoosterClick(booster.id) : onOpenShop?.()
                }
                disabled={gameOver}
              >
                <span
                  className={`absolute right-0 top-0 flex items-center justify-center
                     translate-x-1/5 -translate-y-1/5 text-white font-bold rounded-full
                      transition-all duration-200 border-2 border-gray-700 select-none  tracking-wider ${
                        isAvailable
                          ? "font-figtree min-w-[16px] min-h-[16px] px-1 py-0.5 text-[11px] leading-[14px]"
                          : "w-[20px] h-[20px] font-black text-[16px] leading-none"
                      } `}
                  style={{
                    pointerEvents: "none",
                    background: isAvailable ? `#1e2939 ` : "#16a34a",
                    boxShadow: "0 1px 4px 0 rgba(0,0,0,0.18)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.18)",
                    zIndex: 2,
                  }}
                >
                  <span className="-mb-[1px]">
                    {booster.quantity === 0 ? "+" : booster.quantity}
                  </span>
                </span>
                <img
                  src={booster.icon}
                  alt={booster.name}
                  className={`w-9 h-9 ${
                    gameOver ? "opacity-40 grayscale" : ""
                  }`}
                  draggable={false}
                />
              </button>
            </ClickEffect>
          );
        })}
      </div>
    </div>
  );
};
