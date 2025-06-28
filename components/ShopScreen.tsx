import React, { useEffect, useState } from "react";
import MenuButton from "@/components/UI/MenuButton";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface ShopScreenProps {
  onBack: () => void;
}

const TABS = ["Осколки", "Бустеры", "ZEN"];

const SHARD_PACKS = [
  { amount: 2500, price: 800, label: "-20%", labelType: "discount", icon: "/crystal.svg" },
  { amount: 1000, price: 330, label: "-17%", labelType: "discount", icon: "/4crystals.svg" },
  { amount: 400, price: 140, label: null, icon: "/3crystals.svg" },
  { amount: 150, price: 60, label: null, icon: "/2crystals.svg" },
  { amount: 60, price: 25, label: null, icon: "/crystal.svg" },
  { amount: 20, price: 10, label: null, icon: "/crystal.svg"},
];

const BOOSTERS = [
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
    icon: "/boosters/spinner.png",
    price: 120,
    description:
      "Полный хаос! Очищает всё поле и даёт +300 очков за круговорот удачи!",
  },
];

function ShardPackCard({ amount, price, label, labelType, icon }: any) {
  return (
    <div className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-col items-center justify-between p-5 min-w-[140px] max-w-[180px] w-full min-h-[120px] aspect-[3/4] mx-auto border border-white/20 hover:scale-[1.04] transition-transform hover:bg-white/15 hover:border-white/30">
      {/* Лейбл выгоды */}
      {label && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-md font-mulish
            ${
              labelType === "bonus"
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                : "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white"
            }`}
        >
          {label}
        </div>
      )}
      {/* Объединенный контейнер для иконки и количества */}
      <div className="flex flex-col justify-center items-center p-4 mb-2 w-full rounded-2xl backdrop-blur-sm bg-white/5">
        <img
          src={icon}
          alt="shard"
          className="mb-2 w-16 h-12 drop-shadow-lg"
        />
        <div className="text-2xl font-extrabold text-white font-figtree">
          {amount}
        </div>
      </div>
      <div className="flex gap-1.5 justify-center items-center">
        <img src="/tgstar.svg" alt="star" className="w-7 h-7" />
        <span className="text-xl font-bold text-white font-figtree">
          {price}
        </span>
      </div>
    </div>
  );
}

function ShardPackCardHorizontal({ amount, price, label, labelType, icon }: any) {
  return (
    <div
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl
     flex flex-row items-center justify-between px-8 py-6 min-h-[120px] w-full border border-white/20 hover:scale-[1.02] transition-transform hover:bg-white/15 hover:border-white/30 col-span-2 md:col-span-3"
    >
      {/* Лейбл выгоды */}
      {label && (
        <div
          className={`absolute top-0 right-8 -translate-y-1/2 px-5 py-2 rounded-full text-base font-extrabold shadow-md tracking-wide font-mulish
            ${
              labelType === "bonus"
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                : "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white"
            }`}
        >
          {label}
        </div>
      )}
      {/* Объединенный контейнер для иконки и количества */}
      <div className="flex flex-row justify-center items-center p-4 mr-6 rounded-2xl backdrop-blur-sm bg-white/10">
        <img
          src={icon}
          alt="shard"
          className="mr-4 w-16 h-16 drop-shadow-lg"
        />
        <div className="text-4xl font-extrabold text-white font-figtree menu-shadow">
          {amount}
        </div>
      </div>
      <div className="flex flex-col justify-center items-end">
        <div className="flex gap-3 items-center">
          <img src="/tgstar.svg" alt="star" className="w-10 h-10" />
          <span className="text-3xl font-bold text-white font-figtree menu-shadow">
            {price}
          </span>
        </div>
      </div>
    </div>
  );
}

function BoosterCard({ icon, name, description, price, onBuy }: any) {
  return (
    <div className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-col items-center justify-between p-6 min-h-[160px] w-full border border-white/20 hover:scale-[1.03] transition-transform hover:bg-white/15 hover:border-white/30">
      <img src={icon} alt={name} className="mb-2 w-16 h-16 drop-shadow-lg" />
      <div className="mb-1 text-2xl font-extrabold text-white font-mulish menu-shadow">
        {name}
      </div>
      <div className="text-base text-white/90 text-center mb-4 font-semibold min-h-[48px] font-mulish">
        {description}
      </div>
      <div className="flex gap-2 items-center mt-auto">
        <img src="/crystal.svg" alt="shard" className="w-8 h-8" />
        <span className="text-3xl font-bold text-white font-figtree">
          {price}
        </span>
      </div>
    </div>
  );
}

const ShopScreen: React.FC<ShopScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState("Осколки");
  const [adminBalance, setAdminBalance] = useState<number | null>(null);
  const { isAdmin } = useAdminAuth();

  // TODO: получить баланс игрока из стора/пропсов
  const { user } = useUser();
  const balance = user?.currency ?? 0;

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users/610936383/currency")
        .then((res) => res.json())
        .then((data) =>
          setAdminBalance(typeof data.balance === "number" ? data.balance : 0)
        )
        .catch(() => setAdminBalance(0));
    } else {
      setAdminBalance(null);
    }
  }, [isAdmin]);

  return (
    <div className="flex relative flex-col min-h-screen text-white menu-bg">
      {/* Верхняя панель */}
      <div className="flex justify-between items-center px-4 py-4">
        <button
          onClick={onBack}
          className="flex justify-center items-center w-10 h-10 text-2xl font-black rounded-full border shadow-md backdrop-blur-md transition-all bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 font-mulish"
        >
          ←
        </button>
        <div className="flex gap-2 items-center text-xl font-bold font-figtree">
          <img src="/crystal.svg" alt="shard" className="w-7 h-7" />
          <span>{isAdmin ? adminBalance ?? 333 : balance}</span>
        </div>
      </div>
      {/* Tab-панель */}
      <div className="flex gap-2 justify-center mt-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-full text-lg font-bold transition-all duration-300  font-mulish ${
              tab === t
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg"
                : "bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {/* Содержимое вкладок */}
      <div className="flex flex-col flex-1 justify-start items-center px-4 py-2">
        {tab === "Осколки" && (
          <div className="flex flex-col items-center w-full">
            <div
              className="w-full max-w-2xl py-6 max-h-[80dvh] overflow-y-auto store-scroll grid
             grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6 auto-rows-[minmax(140px,auto)]"
            >
              <ShardPackCardHorizontal key={0} {...SHARD_PACKS[0]} />
              {SHARD_PACKS.slice(1).map((pack, i) => (
                <ShardPackCard key={i + 1} {...pack} />
              ))}
            </div>
          </div>
        )}
        {tab === "Бустеры" && (
          <div className="flex flex-col items-center w-full">
            <div
              className="w-full max-w-2xl max-h-[80dvh] min-h-hit overflow-y-auto store-scroll  grid grid-cols-1
             sm:grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6 py-6 auto-rows-[minmax(140px,auto)]"
            >
              {BOOSTERS.map((booster) => (
                <BoosterCard
                  key={booster.id}
                  {...booster}
                  onBuy={() => alert(`Покупка бустера: ${booster.name}`)}
                />
              ))}
            </div>
          </div>
        )}
        {tab === "ZEN" && (
          <div className="flex flex-col justify-center items-center w-full h-full">
            <div className="flex flex-col items-center px-8 py-4 w-full max-w-lg rounded-3xl border shadow-2xl backdrop-blur-md bg-white/10 border-white/20">
              <img
                src="/stars.svg"
                alt="ZEN"
                className="mb-2 w-40 drop-shadow-lg h-30"
              />
              <div className="mb-2 text-3xl font-extrabold text-white font-mulish menu-shadow">
                ZEN-подписка
              </div>
              <ul className="flex flex-col gap-2 mx-auto mb-6 w-full max-w-xs text-lg font-semibold text-left text-white/90 font-mulish">
                <li>
                  ❌ <b>Без рекламы</b> — ничего не отвлекает от удовольствия
                </li>
                <li>
                  💸 <b>Скидка на бустеры</b> в магазине
                </li>
                <li>
                  🧘 <b>Доступ к ZEN-режиму</b> — спокойный геймплей без
                  ограничений
                </li>
                <li>
                  🏆 <b>Ежемесячные розыгрыши призов</b> — чем больше очков, тем
                  выше шансы!
                </li>
              </ul>
              <MenuButton
                text="Оформить"
                gradientClass="orange-gradient"
                className="px-8 py-3 mt-2 w-full font-bold rounded-2xl"
                textClasses="font-black italic text-xl"
                onClick={() => alert("Оформление ZEN-подписки (заглушка)")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopScreen;
