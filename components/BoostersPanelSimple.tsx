// components/BoostersPanelSimple.tsx
import React from "react";

const boosterIcons = [
  { src: "/boosters/back.png", alt: "Undo" },
  { src: "/boosters/laser.png", alt: "Laser" },
  { src: "/boosters/spinner.png", alt: "Spinner" },
];

export type LaserMode = "off" | "vertical" | "horizontal";

interface BoostersPanelSimpleProps {
  onBoosterClick: (idx: number) => void;
  laserMode: LaserMode;
}

export const BoostersPanelSimple: React.FC<BoostersPanelSimpleProps> = ({ onBoosterClick, laserMode }) => (
  <div className="flex justify-center gap-3 mb-1">
    {boosterIcons.map((icon, idx) => {
      let src = icon.src;
      let style: React.CSSProperties = {};
      let extraClass = "";
      if (idx === 1) { // Laser
        if (laserMode === "vertical") {
          style.transform = "rotate(90deg)";
        } else if (laserMode === "horizontal") {
          src = "/boosters/close.png";
        }
        if (laserMode !== "off") {
          extraClass = "ring-4 ring-blue-400 shadow-blue-400/50 animate-pulse";
        }
      }
      return (
        <button
          key={icon.alt}
          className={`w-11 h-11 rounded-full aspect-square bg-white/90 shadow-md flex items-center justify-center overflow-hidden border border-gray-200 hover:scale-110 transition-transform ${extraClass}`}
          tabIndex={-1}
          type="button"
          style={{ padding: 0, ...style }}
          onClick={() => onBoosterClick(idx)}
        >
          <img
            src={src}
            alt={icon.alt}
            className="w-9 h-9"
            style={style}
            draggable={false}
          />
        </button>
      );
    })}
  </div>
);
