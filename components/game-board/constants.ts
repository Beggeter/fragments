export const DEFAULT_CELL_SIZE = 43.75;
export const GAP_SIZE_PX = 2;

export const COLOR_HEX: Record<string, string> = {
  blue: '#2968EA',
  red: '#D03024',
  orange: '#FF9D28',
  yellow: '#FFC832',
  cyan: '#4FC4D3',
  purple: '#8329C6',
  green: '#6AD469',
  pink: '#FF4C76',
};

export const spiralOrder = (rows: number, cols: number) => {
  const result: [number, number][] = [];
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  const centers: [number, number][] = [
    [Math.floor((rows - 1) / 2), Math.floor((cols - 1) / 2)],
    [Math.floor((rows - 1) / 2), Math.ceil((cols - 1) / 2)],
    [Math.ceil((rows - 1) / 2), Math.floor((cols - 1) / 2)],
    [Math.ceil((rows - 1) / 2), Math.ceil((cols - 1) / 2)],
  ];

  const queue = [...centers];

  while (queue.length) {
    const [y, x] = queue.shift()!;
    if (y < 0 || y >= rows || x < 0 || x >= cols || visited[y][x]) continue;
    visited[y][x] = true;
    result.push([y, x]);
    queue.push([y, x + 1], [y + 1, x], [y, x - 1], [y - 1, x]);
  }

  return result.filter(
    ([row, col], index, array) =>
      array.findIndex(([r, c]) => r === row && c === col) === index,
  );
};

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

