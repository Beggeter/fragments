"use client";

import React, { useEffect, useMemo, useState } from 'react';
import NeonGlowOutline from '../NeonGlowOutline';
import { NeonGlowParticles } from '../board/NeonGlowParticles';
import { Matrix } from '@/lib/data/types';

type HighlightMatrix = Array<Array<boolean | string>>;

const scalePath = (
  path: string,
  boardWidthPx: number,
  boardHeightPx: number,
  boardWidthCells: number,
  boardHeightCells: number,
) => {
  const scaleX = boardWidthPx / boardWidthCells;
  const scaleY = boardHeightPx / boardHeightCells;

  return path.replace(/([ML])\s*([\d.]+)\s*([\d.]+)/g, (_match, command, x, y) => {
    return `${command} ${Number(x) * scaleX} ${Number(y) * scaleY}`;
  });
};

const findConnectedAreasMemo = (() => {
  const cache = new Map<string, number[][][]>();

  return (matrix: HighlightMatrix): number[][][] => {
    const key = JSON.stringify(matrix);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const height = matrix.length;
    const width = matrix[0]?.length ?? 0;
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const areas: number[][][] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!matrix[y][x] || visited[y][x]) continue;

        const queue: [number, number][] = [[y, x]];
        const area: [number, number][] = [];
        visited[y][x] = true;

        while (queue.length) {
          const [cy, cx] = queue.shift()!;
          area.push([cy, cx]);

          for (const [dy, dx] of [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
          ]) {
            const ny = cy + dy;
            const nx = cx + dx;
            if (
              ny >= 0 &&
              ny < height &&
              nx >= 0 &&
              nx < width &&
              matrix[ny][nx] &&
              !visited[ny][nx]
            ) {
              visited[ny][nx] = true;
              queue.push([ny, nx]);
            }
          }
        }

        areas.push(area);
      }
    }

    cache.set(key, areas);
    return areas;
  };
})();

const getCellEdgesMemo = (() => {
  const cache = new Map<string, Array<[[number, number], [number, number]]>>();

  return (area: [number, number][], matrix: HighlightMatrix) => {
    const key = JSON.stringify({ area, matrix });
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const edges: Array<[[number, number], [number, number]]> = [];
    const areaSet = new Set(area.map(([y, x]) => `${y},${x}`));

    for (const [y, x] of area) {
      if (!areaSet.has(`${y - 1},${x}`))
        edges.push([
          [x, y],
          [x + 1, y],
        ]);
      if (!areaSet.has(`${y},${x + 1}`))
        edges.push([
          [x + 1, y],
          [x + 1, y + 1],
        ]);
      if (!areaSet.has(`${y + 1},${x}`))
        edges.push([
          [x + 1, y + 1],
          [x, y + 1],
        ]);
      if (!areaSet.has(`${y},${x - 1}`))
        edges.push([
          [x, y + 1],
          [x, y],
        ]);
    }

    cache.set(key, edges);
    return edges;
  };
})();

const edgesToPathMemo = (() => {
  const cache = new Map<string, string>();

  return (edges: Array<[[number, number], [number, number]]>): string => {
    const key = JSON.stringify(edges);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    if (edges.length === 0) {
      return '';
    }

    const edgeMap = new Map<string, [number, number]>();
    edges.forEach(([[x1, y1], [x2, y2]]) => {
      edgeMap.set(`${x1},${y1}`, [x2, y2]);
    });

    const pointCounts = new Map<string, number>();
    edges.flat().forEach(([x, y]) => {
      const pointKey = `${x},${y}`;
      pointCounts.set(pointKey, (pointCounts.get(pointKey) || 0) + 1);
    });

    const startKey =
      Array.from(pointCounts.entries()).find(([, count]) => count === 1)?.[0] ||
      `${edges[0][0][0]},${edges[0][0][1]}`;

    let path = `M ${startKey.replace(',', ' ')}`;
    let currentKey = startKey;
    let steps = 0;

    while (steps < edges.length + 5) {
      const next = edgeMap.get(currentKey);
      if (!next) break;
      path += ` L ${next[0]} ${next[1]}`;
      currentKey = `${next[0]},${next[1]}`;
      if (currentKey === startKey) break;
      steps++;
    }

    path += ' Z';
    cache.set(key, path);
    return path;
  };
})();

const buildPaths = (matrix: HighlightMatrix) => {
  const areas = findConnectedAreasMemo(matrix);
  return areas.map((area) => edgesToPathMemo(getCellEdgesMemo(area as any, matrix)));
};

const useContourPaths = (
  matrix: HighlightMatrix,
  workerRef: React.MutableRefObject<Worker | null>
) => {
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) {
      setPaths(buildPaths(matrix));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'paths') {
        setPaths(event.data.d ?? []);
      }
    };

    worker.addEventListener('message', handleMessage);
    try {
      worker.postMessage({ type: 'buildPaths', matrix });
    } catch {
      setPaths(buildPaths(matrix));
    }

    return () => {
      worker.removeEventListener('message', handleMessage);
    };
  }, [matrix, workerRef]);

  return paths;
};

interface ContoursOverlayProps {
  matrix: HighlightMatrix;
  board: Matrix;
  color: string;
  boardRef: React.RefObject<HTMLDivElement | null>;
  workerRef: React.MutableRefObject<Worker | null>;
}

export const ContoursOverlay: React.FC<ContoursOverlayProps> = ({
  matrix,
  board,
  color,
  boardRef,
  workerRef,
}) => {
  const paths = useContourPaths(matrix, workerRef);

  const scaledPaths = useMemo(() => {
    if (!boardRef.current) {
      return [];
    }

    const widthPx = boardRef.current.offsetWidth;
    const heightPx = boardRef.current.offsetHeight;
    const widthCells = board[0]?.length ?? 0;
    const heightCells = board.length;

    return paths.map((path) =>
      scalePath(path, widthPx, heightPx, widthCells, heightCells),
    );
  }, [board, boardRef, paths]);

  if (!scaledPaths.length || !boardRef.current) {
    return null;
  }

  const boardWidthPx = boardRef.current.offsetWidth;
  const boardHeightPx = boardRef.current.offsetHeight;

  return (
    <>
      {scaledPaths.map((path, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: boardWidthPx,
            height: boardHeightPx,
            pointerEvents: 'none',
            zIndex: 1001,
          }}
        >
          <NeonGlowOutline
            d={path}
            color={color}
            glowRadius={10}
            strokeWidth={12}
            opacity={0.5}
            style={{ width: '100%', height: '100%' }}
          />
          <NeonGlowParticles d={path} color={color} visible />
        </div>
      ))}
    </>
  );
};
