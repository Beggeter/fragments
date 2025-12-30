// Web Worker: builds SVG path commands (normalized grid coords) for connected areas
// Input: { type: 'buildPaths', matrix: any[][] }
// Output: { type: 'paths', d: string[] }

type Matrix = any[][];

function findConnectedAreas(matrix: Matrix): number[][][] {
  const h = matrix.length;
  const w = matrix[0]?.length || 0;
  const visited: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
  const areas: number[][][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!!matrix[y][x] && !visited[y][x]) {
        const queue: [number, number][] = [[y, x]];
        const area: [number, number][] = [];
        visited[y][x] = true;
        while (queue.length) {
          const [cy, cx] = queue.shift()!;
          area.push([cy, cx]);
          for (const [dy, dx] of [[0,1],[1,0],[0,-1],[-1,0]]) {
            const ny = cy + dy, nx = cx + dx;
            if (
              ny >= 0 && ny < h && nx >= 0 && nx < w &&
              !!matrix[ny][nx] && !visited[ny][nx]
            ) {
              visited[ny][nx] = true;
              queue.push([ny, nx]);
            }
          }
        }
        areas.push(area);
      }
    }
  }
  return areas;
}

function getCellEdges(area: [number, number][], matrix: Matrix) {
  const edges: Array<[[number, number], [number, number]]> = [];
  const set = new Set(area.map(([y, x]) => `${y},${x}`));
  for (const [y, x] of area) {
    if (!set.has(`${y - 1},${x}`)) edges.push([[x, y], [x + 1, y]]);       // top
    if (!set.has(`${y},${x + 1}`)) edges.push([[x + 1, y], [x + 1, y + 1]]); // right
    if (!set.has(`${y + 1},${x}`)) edges.push([[x + 1, y + 1], [x, y + 1]]); // bottom
    if (!set.has(`${y},${x - 1}`)) edges.push([[x, y + 1], [x, y]]);         // left
  }
  return edges;
}

function edgesToPath(edges: Array<[[number, number], [number, number]]>): string {
  if (edges.length === 0) return '';
  const edgeMap = new Map<string, [number, number]>();
  edges.forEach(([[x1, y1], [x2, y2]]) => {
    edgeMap.set(`${x1},${y1}`, [x2, y2]);
  });
  const points = edges.flat();
  const count = new Map<string, number>();
  points.forEach(([x, y]) => {
    const k = `${x},${y}`;
    count.set(k, (count.get(k) || 0) + 1);
  });
  let startKey = Array.from(count.entries()).find(([_, v]) => v === 1)?.[0] || `${edges[0][0][0]},${edges[0][0][1]}`;
  let path = `M ${startKey.replace(',', ' ')}`;
  let currKey = startKey;
  let steps = 0;
  while (steps < edges.length + 5) {
    const next = edgeMap.get(currKey);
    if (!next) break;
    path += ` L ${next[0]} ${next[1]}`;
    currKey = `${next[0]},${next[1]}`;
    if (currKey === startKey) break;
    steps++;
  }
  path += ' Z';
  return path;
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent) => {
  const data = e.data;
  if (!data || data.type !== 'buildPaths') return;
  const matrix: Matrix = data.matrix || [];
  try {
    const areas = findConnectedAreas(matrix);
    const d = areas.map((area) => edgesToPath(getCellEdges(area as any, matrix)));
    // eslint-disable-next-line no-restricted-globals
    (self as any).postMessage({ type: 'paths', d });
  } catch (err) {
    // eslint-disable-next-line no-restricted-globals
    (self as any).postMessage({ type: 'paths', d: [] });
  }
};


