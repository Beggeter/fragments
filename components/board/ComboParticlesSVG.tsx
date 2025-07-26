import React, { useEffect, useState } from "react";

// Описание одного партикла
export type Particle = {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: "square" | "diamond" | "star";
  angle: number;
  delay: number;
  duration: number;
  key: string;
};

const PARTICLE_COLORS = ["#00eaff", "#fff", "#ffe066"];
const SHAPES: Particle["shape"][] = ["square", "diamond", "star"];

function getParticles(count = 12): Particle[] {
  // Разбрасываем по кругу, с небольшим рандомом
  const baseR = 60;
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i * 360) / count + Math.random() * 30 - 15;
    const r = baseR + Math.random() * 20 - 10;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * r;
    const y = Math.sin(rad) * r;
    const size = 8 + Math.random() * 8;
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const delay = Math.random() * 120;
    const duration = 700 + Math.random() * 200;
    return {
      x,
      y,
      size,
      color,
      shape,
      angle: Math.random() * 360,
      delay,
      duration,
      key: `${angle}-${size}-${color}-${shape}-${delay}`,
    };
  });
}

const ParticleSVG: React.FC<Particle> = ({
  x,
  y,
  size,
  color,
  shape,
  angle,
  delay,
  duration,
  key,
}) => {
  let shapeEl = null;
  if (shape === "square") {
    shapeEl = (
      <rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        fill={color}
        rx={size * 0.2}
      />
    );
  } else if (shape === "diamond") {
    shapeEl = (
      <rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        fill={color}
        transform="rotate(45)"
        rx={size * 0.15}
      />
    );
  } else if (shape === "star") {
    shapeEl = (
      <polygon
        points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2"
        fill={color}
        transform={`scale(${size / 16})`}
      />
    );
  }
  return (
    <svg
      key={key}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        pointerEvents: "none",
        transform: `translate(-50%, -50%) translate(${x}px,${y}px) rotate(${angle}deg)`,
        opacity: 0,
        animation: `combo-particle-fly ${duration}ms cubic-bezier(.5,0,.5,1) ${delay}ms both`,
        zIndex: 2001,
      }}
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
    >
      {shapeEl}
    </svg>
  );
};

export const ComboParticlesSVG: React.FC<{ trigger: number }> = ({ trigger }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(getParticles(12));
    const timeout = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(timeout);
  }, [trigger]);

  return (
    <>
      {particles.map((p) => (
        <ParticleSVG {...p} key={p.key} />
      ))}
      <style>{`
        @keyframes combo-particle-fly {
          0% { opacity: 1; transform: scale(1) translateY(0);}
          80% { opacity: 1; }
          100% { opacity: 0; transform: scale(0.5) translateY(-30px);}
        }
      `}</style>
    </>
  );
}; 