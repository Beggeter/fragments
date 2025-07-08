import React from "react";
import { getThemeByScore } from "./UI/colorThemes";

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
}

export const BoostersPanel: React.FC<BoostersPanelProps> = ({
  boosters,
  onBoosterClick,
  className = "",
  comboLevel,
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
          // Цвета для пузырика
          let bubbleColor = '#2868C3';
          let bubbleBorder = '#3AA3FB';
          if (booster.id === 'bomb') {
            bubbleColor = '#A90E24';
            bubbleBorder = '#E53142';
          } else if (booster.id === 'whirlwind') {
            bubbleColor = '#481C8D';
            bubbleBorder = '#6E2DAE';
          }
          return (
            <button
              key={booster.id}
              className="w-11 h-11 rounded-full aspect-square shadow-md
               flex items-center justify-center hover:scale-110 transition-transform relative"
              type="button"
              style={{ padding: 0 }}
              onClick={() => booster.quantity > 0 && onBoosterClick(booster.id)}
              disabled={booster.quantity === 0}
            >
              <span
                className={`absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow ${booster.quantity === 0 ? 'opacity-50' : ''}`}
                style={{
                  minWidth: 18,
                  minHeight: 18,
                  lineHeight: '18px',
                  pointerEvents: 'none',
                  background: bubbleColor,
                  border: `2.5px solid ${bubbleBorder}`,
                  boxSizing: 'border-box',
                }}
              >
                {booster.quantity}
              </span>
              <img
                src={booster.icon}
                alt={booster.name}
                className={`w-9 h-9 ${booster.quantity === 0 ? 'opacity-40 grayscale' : ''}`}
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
