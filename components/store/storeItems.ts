import { ShardPack } from "@/types/shop";

export const SHARD_PACKS: ShardPack[] = [
  {
    amount: 2500,
    price: 800,
    label: "-20%",
    labelType: "discount",
    icon: "/9crystals.svg",
  },
  {
    amount: 1000,
    price: 330,
    label: "-17%",
    labelType: "discount",
    icon: "/4crystals.svg",
  },
  {
    amount: 400,
    price: 140,
    icon: "/3crystals.svg",
  },
  {
    amount: 150,
    price: 60,
    icon: "/2crystals.svg",
  },
  { amount: 60, price: 25, icon: "/crystal.svg" },
  { amount: 20, price: 10, icon: "/crystal.svg" },
];

export const BOOSTERS = [
  {
    id: "undo",
    name: "Undo",
    icon: "/boosters/back.png",
    price: 20,
    description:
      "Отмените последний ход и исправьте ошибку! Идеально для стратегических решений.",
  },
  {
    id: "bomb",
    name: "Bomb",
    icon: "/boosters/bomb.svg",
    price: 60,
    description:
      "Мощный взрыв! Уничтожает все блоки в зоне 3×3, открывая новые комбинации.",
  },
  {
    id: "whirlwind",
    name: "Whirlwind",
    icon: "/boosters/whirlwind.svg",
    price: 120,
    description:
      "Полный хаос! Очищает всё поле и даёт +300 очков за круговорот удачи!",
  },
];

export const ZEN_SUBS = [
  {
    period: "1 месяц",
    priceCrystals: 320,
    priceStars: 120,
    percent: null,
    bonuses: [{ count: 2, name: "Undo" }],
  },
  {
    period: "3 месяца",
    priceCrystals: 850,
    priceStars: 320,
    percent: "-11%",
    bonuses: [{ count: 2, name: "Bomb" }],
  },
  {
    period: "6 месяцев",
    priceCrystals: 1550,
    priceStars: 580,
    percent: "-19%",
    bonuses: [
      { count: 2, name: "Bomb" },
      { count: 1, name: "Undo" },
    ],
  },
  {
    period: "12 месяцев",
    priceCrystals: 2880,
    priceStars: 1090,
    percent: "-25%",
    bonuses: [
      { count: 2, name: "Whirlwind" },
      { count: 1, name: "Bomb" },
    ],
  },
];
