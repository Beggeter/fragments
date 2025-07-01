"use client";

import React, { useRef, useLayoutEffect, useState } from "react";
// import dynamic from "next/dynamic";
// import React, { useEffect, useState, useMemo } from "react";
// import { initParticlesEngine } from "@tsparticles/react";
// import { loadSlim } from "@tsparticles/slim";
// import Particles from "@tsparticles/react";
// const Particles = dynamic(() => import("@tsparticles/react"), { ssr: false });

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
      id="neon-glow-outline"
      className="neon-glow-outline"
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glowRadius} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Glow-слой */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          filter="url(#neon-glow)"
          opacity={opacity}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Тонкая четкая линия */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default NeonGlowOutline;

