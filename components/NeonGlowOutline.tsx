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
        <defs>
          {/* Внешнее мягкое свечение */}
          <filter id="outer-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={glowRadius * 2} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Среднее свечение */}
          <filter id="middle-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={glowRadius} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Внутреннее яркое свечение */}
          <filter id="inner-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glowRadius * 0.5} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Внешний мягкий слой */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth * 1.5}
          filter="url(#outer-glow)"
          opacity={opacity * 0.3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Средний слой */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          filter="url(#middle-glow)"
          opacity={opacity * 0.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Внутренний яркий слой */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth * 0.7}
          filter="url(#inner-glow)"
          opacity={opacity * 0.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Основная четкая линия */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={3}
          opacity={0.9}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Центральная яркая линия */}
        <path
          d={d}
          fill="none"
          stroke="white"
          strokeWidth={1}
          opacity={0.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default NeonGlowOutline;

