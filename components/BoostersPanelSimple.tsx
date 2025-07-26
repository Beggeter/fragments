// components/BoostersPanelSimple.tsx
import React from "react";

const boosterIcons = [
  { src: "/boosters/back.png", alt: "Undo" },
  { src: "/boosters/bomb.svg", alt: "Bomb" },
  { src: "/boosters/whirlwind.svg", alt: "Whirlwind" },
];

export const BoostersPanelSimple: React.FC = () => (
  <div className="z-3000 min-w-fit min-h-fit items-center justify-center
   flex bg-gray-800 w-40 h-14 rounded-4xl -mt-6  outline-[#1F5EFF] outline-2 shadow-xl">
  <div className="flex justify-between gap-2  ">
    {boosterIcons.map((icon) => (
      <button
        key={icon.alt}
        className="w-11 h-11 rounded-full aspect-square shadow-md flex
         items-center justify-center overflow-hidden  hover:scale-110 transition-transform"
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
  </div>
);
