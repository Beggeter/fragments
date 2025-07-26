import { ShardPack } from "@/types/shop";

export const SHARD_PACKS: ShardPack[] = [
  {
    amount: 5500,
    price: 890,
    labelType: "discount",
    icon: "/9crystals.svg",
  },
  {
    amount: 2600,
    price: 440,
    label: "+200",
    labelType: "discount",
    icon: "/4crystals.svg",
  },
  {
    amount: 1200,
    price: 220,
    icon: "/3crystals.svg",
  },
  {
    amount: 500,
    price: 100,
    icon: "/2crystals.svg",
    label: "+50",
    labelType: "discount",
  },
  { amount: 220, price: 45, icon: "/crystal.svg" },
  { amount: 100, price: 22, icon: "/crystal.svg" },
  { amount: 40, price: 10, icon: "/crystal.svg" },
];

export const BOOSTERS = [
  {
    id: "undo",
    name: "Undo",
    icon: "/boosters/back.png",
    price: 20,
    price_stars: 7
    // Описание брать через t('shop.booster_undo_desc')
  },
  {
    id: "bomb",
    name: "Bomb",
    icon: "/boosters/bomb.svg",
    price: 50,
    price_stars: 12
    // Описание брать через t('shop.booster_bomb_desc')
  },
  {
    id: "whirlwind",
    name: "Whirlwind",
    icon: "/boosters/whirlwind.svg",
    price: 100,
    price_stars: 20
    // Описание брать через t('shop.booster_whirlwind_desc')
  },
];
// Тестовый бустер с очень высокой ценой для проверки InsufficientShardsModal
BOOSTERS.push({
  id: "test_expensive",
  name: "Test Expensive",
  icon: "/boosters/bomb.svg",
  price: 999999,
  price_stars: 999999,
  // Описание брать через t('shop.booster_test_expensive_desc')
});

export const ZEN_SUBS = [
  {
    period: "1m",
    priceCrystals: 320,
    priceStars: 120,
    percent: null,
    bonuses: [{ count: 2, name: "Undo" }],
    // Период брать через t('shop.zen_period_1m')
  },
  {
    period: "3m",
    priceCrystals: 850,
    priceStars: 320,
    percent: "-11%",
    bonuses: [{ count: 2, name: "Bomb" }],
    // Период брать через t('shop.zen_period_3m')
  },
  {
    period: "6m",
    priceCrystals: 1550,
    priceStars: 580,
    percent: "-19%",
    bonuses: [
      { count: 2, name: "Bomb" },
      { count: 1, name: "Undo" },
    ],
    // Период брать через t('shop.zen_period_6m')
  },
  {
    period: "12m",
    priceCrystals: 2880,
    priceStars: 1090,
    percent: "-25%",
    bonuses: [
      { count: 2, name: "Whirlwind" },
      { count: 1, name: "Bomb" },
    ],
    // Период брать через t('shop.zen_period_12m')
  },
];
