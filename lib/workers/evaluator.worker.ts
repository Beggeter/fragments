// Web Worker: batch evaluate blocks difficulty/score potential
// Input: { type: 'evaluate', blocks: any[], board: any[][] }
// Output: { type: 'evaluated', evaluations: Array<{ difficulty: number; scorePotential: number }> }

function evaluateBlock(block: any, board: any[][]) {
  // Lightweight heuristic as placeholder; real logic can be ported
  const cells = block?.matrix?.flat?.() || [];
  const ones = cells.filter((c: any) => c && c.value === 1).length;
  const boardFill = board.flat().filter(c => c && c.value === 1).length;
  const difficulty = Math.max(1, Math.min(10, Math.round((ones || 1) + (boardFill % 7))));
  const scorePotential = ones * 10;
  return { difficulty, scorePotential };
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent) => {
  const data = e.data;
  if (!data || data.type !== 'evaluate') return;
  try {
    const { blocks, board } = data;
    const evaluations = (blocks || []).map((b: any) => evaluateBlock(b, board || []));
    // eslint-disable-next-line no-restricted-globals
    (self as any).postMessage({ type: 'evaluated', evaluations });
  } catch (err) {
    // eslint-disable-next-line no-restricted-globals
    (self as any).postMessage({ type: 'evaluated', evaluations: [] });
  }
};


