const rewards = {
  classic: [
    // Неделя 1
    [
      { type: "shard", amount: 1, status: "available" },
      { type: "shard", amount: 2, status: "skipped" },
      { type: "shard", amount: 2, status: "claimed" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "booster", boosterType: "undo", amount: 1, status: "locked" }
    ],
    // Неделя 2
    [
      { type: "shard", amount: 1, status: "available" },
      { type: "shard", amount: 2, status: "locked" },
      { type: "shard", amount: 2, status: "locked" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "shard", amount: 5, status: "locked" }
    ],
    // Неделя 3
    [
      { type: "shard", amount: 1, status: "available" },
      { type: "shard", amount: 2, status: "locked" },
      { type: "shard", amount: 2, status: "locked" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "shard", amount: 5, status: "locked" }
    ],
    // Неделя 4
    [
      { type: "shard", amount: 1, status: "available" },
      { type: "shard", amount: 2, status: "locked" },
      { type: "shard", amount: 2, status: "locked" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "booster", boosterType: "undo", amount: 1, status: "locked" }
    ]
  ],
  zen: [
    // Неделя 1
    [
      { type: "booster", boosterType: "undo", amount: 1, status: "available" },
      { type: "shard", amount: 3, status: "locked" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "shard", amount: 5, status: "locked" },
      { type: "booster", boosterType: "bomb", amount: 1, status: "locked" }
    ],
    // Неделя 2
    [
      { type: "shard", amount: 4, status: "available" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "shard", amount: 5, status: "locked" },
      { type: "shard", amount: 5, status: "locked" },
      { type: "shard", amount: 6, status: "locked" },
      { type: "shard", amount: 6, status: "locked" },
      { type: "booster", boosterType: "bomb", amount: 1, status: "locked" }
    ],
    // Неделя 3
    [
      { type: "shard", amount: 4, status: "available" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "shard", amount: 5, status: "locked" },
      { type: "shard", amount: 6, status: "locked" },
      { type: "shard", amount: 6, status: "locked" },
      { type: "booster", boosterType: "undo", amount: 1, status: "locked" },
      { type: "booster", boosterType: "whirlwind", amount: 1, status: "locked" }
    ],
    // Неделя 4
    [
      { type: "shard", amount: 4, status: "available" },
      { type: "shard", amount: 4, status: "locked" },
      { type: "shard", amount: 5, status: "locked" },
      { type: "shard", amount: 5, status: "locked" },
      { type: "shard", amount: 6, status: "locked" },
      { type: "shard", amount: 6, status: "locked" },
      { type: "shard", amount: 10, status: "locked" }
    ]
  ]
} as const;

export default rewards