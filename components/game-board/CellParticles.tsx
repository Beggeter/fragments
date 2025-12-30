"use client";

import Particles from '@tsparticles/react';
import { CellParticlesProps } from './types';

export const CellParticles: React.FC<CellParticlesProps> = ({ x, y, trigger }) => {
  if (!trigger) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        width: 40,
        height: 40,
        zIndex: 20,
      }}
    >
      <Particles
        id={`cell-particles-${x}-${y}`}
        options={{
          particles: {
            color: { value: ['#fff', '#fbbf24', '#38bdf8', '#f472b6'] },
            number: { value: 18 },
            shape: { type: 'circle' },
            size: { value: { min: 2, max: 6 } },
            move: {
              enable: true,
              speed: 7,
              direction: 'none',
              outModes: { default: 'destroy' },
            },
            opacity: { value: 0.8 },
          },
          detectRetina: true,
          fullScreen: { enable: false },
        }}
        style={{ width: 40, height: 40 }}
      />
    </div>
  );
};
