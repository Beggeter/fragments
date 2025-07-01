import React from "react";

const boosters = [
  { id: "undo", name: "Undo", icon: "/boosters/back.png" },
  // { id: "laser", name: "Лазер", icon: "/boosters/laser.png" },
  { id: "bomb", name: "Бомба", icon: "/boosters/bomb.png" },
  { id: "spinner", name: "Спиннер", icon: "/boosters/spinner.png" },
];

interface BoostersPanelProps {
  onBoosterClick: (boosterId: string) => void;
  className?: string;
}

export const BoostersPanel: React.FC<BoostersPanelProps> = ({
  onBoosterClick,
  className = "",
}) => (
  <div
    className={`z-3000 min-w-fit min-h-fit items-center justify-center flex bg-gray-800 w-fit px-4 h-14 rounded-4xl -mt-6 outline-[#1F5EFF] outline-2 shadow-xl ${className}`}
  >
    <div className="flex justify-between gap-2">
      {boosters.map((booster) => (
        <button
          key={booster.id}
          className="w-11 h-11 rounded-full aspect-square shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform"
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
