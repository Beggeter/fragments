import React from "react";
import { getThemeByScore } from "./UI/colorThemes";

const boosters = [
  { id: "undo", name: "Undo", icon: "/boosters/back.png" },
  // { id: "laser", name: "Лазер", icon: "/boosters/laser.png" },
  { id: "bomb", name: "Бомба", icon: "/boosters/bomb.png" },
  { id: "spinner", name: "Спиннер", icon: "/boosters/spinner.png" },
];

interface BoostersPanelProps {
  onBoosterClick: (boosterId: string) => void;
  className?: string;
  comboLevel?: number;
}

export const BoostersPanel: React.FC<BoostersPanelProps> = ({
  onBoosterClick,
  className = "",
  comboLevel,
}) => {
  const theme = getThemeByScore(comboLevel);

  return (
    <div
      className={`booster-container bg-gray-800 px-4 h-14 
        rounded-4xl rounded-bl-none rounded-br-none -mt-6
          border-2 border-b-0 shadow-xl ${className}`}
      style={
        {
          "--outline-color": theme.borderMiddle,
        } as React.CSSProperties
      }
    >
      <div className="flex justify-between gap-2 ">
        {boosters.map((booster) => (
          <button
            key={booster.id}
            className="w-11 h-11 rounded-full aspect-square shadow-md
             flex items-center justify-center overflow-hidden hover:scale-110 transition-transform"
            type="button"
            style={{ padding: 0 }}
            onClick={() => onBoosterClick(booster.id)}
          >
            <img
              src={booster.icon}
              alt={booster.name}
              className="w-9 h-9"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
