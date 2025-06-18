// components/BoostersPanelSimple.tsx
import React from "react";

const boosterIcons = [
  { src: "/boosters/back.png", alt: "Undo" },
  { src: "/boosters/laser.png", alt: "Laser" },
  { src: "/boosters/spinner.png", alt: "Spinner" },
];

export const BoostersPanelSimple: React.FC = () => (
  <div className="flex justify-center gap-3 mb-1">
    {boosterIcons.map((icon) => (
      <button
        key={icon.alt}
        className="w-11 h-11 rounded-full aspect-square bg-white/90 shadow-md flex items-center justify-center overflow-hidden border border-gray-200 hover:scale-110 transition-transform"
        tabIndex={-1}
        type="button"
        style={{ padding: 0 }}
      >
        <img
          src={icon.src}
          alt={icon.alt}
          className="w-9 h-9"
          draggable={false}
        />
      </button>
    ))}
  </div>
);
