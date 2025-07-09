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
}

export const BoostersPanel: React.FC<BoostersPanelProps> = ({
  boosters,
  onBoosterClick,
  className = "",
  comboLevel,
  activeBooster,
  gameOver,
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
                  booster.quantity > 0 && onBoosterClick(booster.id)
                }
                disabled={isDisabled || gameOver}
              >
                <span
                  className={`
    absolute right-0 top-0 translate-x-1/5 -translate-y-1/5
    text-white text-[11px] font-bold
    rounded-full px-1 py-0.5
    transition-all duration-200
    border-2 border-gray-700
   
    select-none
  `}
                  style={{
                    minWidth: 16,
                    minHeight: 16,
                    lineHeight: "14px",
                    pointerEvents: "none",
                    background: `#1e2939 `,
                    boxShadow: "0 1px 4px 0 rgba(0,0,0,0.18)",
                    fontSize: 11,
                    textShadow: "0 1px 2px rgba(0,0,0,0.18)",
                    zIndex: 2,
                  }}
                >
                  {booster.quantity}
                </span>
                <img
                  src={booster.icon}
                  alt={booster.name}
                  className={`w-9 h-9 ${
                    gameOver || isDisabled ? "opacity-40 grayscale" : ""
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
