"use client";

import React from "react";

interface NeonGlowOutlineProps {
  d: string; // SVG path (в пикселях)
  color: string;
  glowRadius?: number; // px, радиус свечения
  strokeWidth?: number; // px, толщина свечения
  opacity?: number; // прозрачность свечения
  style?: React.CSSProperties;
}

const NeonGlowOutline: React.FC<NeonGlowOutlineProps> = ({
  d,
  color,
  glowRadius = 6,
  strokeWidth = 8,
  opacity = 0.5,
  style,
}) => {
  return (
    <div
      style={{ 
        position: "relative", 
        width: "100%", 
        height: "100%", 
        ...style 
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* Свечение через blur и brightness */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            filter: `blur(${glowRadius}px) brightness(1.5)`,
            
          }}
          className="transition-filter "
        />
      </svg>
    </div>
  );
};

export default NeonGlowOutline;

