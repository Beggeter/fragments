import { Block, Cell } from './types';

// Define the raw matrix data
export const ALL_BLOCKS: Cell[][][] = [
    // Horizontal lines (2-5)
    [[{ value: 1 }, { value: 1 }]],
    [[{ value: 1 }, { value: 1 }, { value: 1 }]],
    [[{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }]],
    [[{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }]],

    // Vertical lines (2-5)
    [[{ value: 1 }], [{ value: 1 }]],
    [[{ value: 1 }], [{ value: 1 }], [{ value: 1 }]],
    [[{ value: 1 }], [{ value: 1 }], [{ value: 1 }], [{ value: 1 }]],
    [[{ value: 1 }], [{ value: 1 }], [{ value: 1 }], [{ value: 1 }], [{ value: 1 }]],

    // Squares
    [
        [{ value: 1 }, { value: 1 }],
        [{ value: 1 }, { value: 1 }]
    ],
    [
        [{ value: 1 }, { value: 1 }, { value: 1 }],
        [{ value: 1 }, { value: 1 }, { value: 1 }],
        [{ value: 1 }, { value: 1 }, { value: 1 }]
    ],

    // Corners
    [
        [{ value: 1 }, { value: 0 }],
        [{ value: 1 }, { value: 1 }]
    ],
    [
        [{ value: 1 }, { value: 1 }, { value: 1 }],
        [{ value: 1 }, { value: 0 }, { value: 0 }],
        [{ value: 1 }, { value: 0 }, { value: 0 }]
    ],

    // L-shapes
    [
        [{ value: 1 }, { value: 0 }],
        [{ value: 1 }, { value: 0 }],
        [{ value: 1 }, { value: 1 }]
    ],

    // Rectangles
    [
        [{ value: 1 }, { value: 1 }, { value: 1 }],
        [{ value: 1 }, { value: 1 }, { value: 1 }]
    ],

    // T-shapes
    [
        [{ value: 1 }, { value: 1 }, { value: 1 }],
        [{ value: 0 }, { value: 1 }, { value: 0 }]
    ],

    // S-shapes
    [
        [{ value: 0 }, { value: 1 }, { value: 1 }],
        [{ value: 1 }, { value: 1 }, { value: 0 }]
    ],

    // Diagonals
    [
        [{ value: 0 }, { value: 0 }, { value: 1 }],
        [{ value: 0 }, { value: 1 }, { value: 0 }],
        [{ value: 1 }, { value: 0 }, { value: 0 }]
    ],
    [
        [{ value: 0 }, { value: 1 }],
        [{ value: 1 }, { value: 0 }]
    ]
];

// Export the complete blocks with all properties
export const BLOCKS: Block[] = ALL_BLOCKS.map((matrix, index) => ({
    id: `block-${index}`,
    uniqueId: `block-${index}_${Date.now()}`,
    name: `Block ${index + 1}`,
    matrix,
    difficulty: 'medium',
    color: 'red'
}));
