import React, { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import BoosterPurchaseModal from "./store/BoosterPurchaseModal";
import ZenPurchaseModal from "./store/ZenPurchaseModal";
import { LoadingNumberAnimation } from "./LoadingNumberAnimation";
import { BOOSTERS, SHARD_PACKS, ZEN_SUBS } from "./store/storeItems";
import ShardPurchaseModal from "./store/ShardPurchaseModal";
import { ShardPack } from "@/types/shop";

interface ShopScreenProps {
  onBack: () => void;
}

const TABS = ["Осколки", "Бустеры", "ZEN"];

function ShardPackCard({ amount, price, label, labelType, icon, onBuy }: any) {
  return (
    <div
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-col items-center justify-between p-5 min-w-[140px] max-w-[180px] w-full min-h-[120px] aspect-[3/4] mx-auto border border-white/20 hover:scale-[1.04] transition-transform hover:bg-white/15 hover:border-white/30"
      onClick={onBuy}
    >
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
        <img src={icon} alt="shard" className="mb-2 w-16 h-12 drop-shadow-lg" />
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

function ShardPackCardHorizontal({
  amount,
  price,
  label,
  labelType,
  icon,
  onBuy,
}: any) {
  return (
    <div
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl
     flex flex-row items-center justify-between px-8 py-6 min-h-[120px] w-full border border-white/20 hover:scale-[1.02] transition-transform hover:bg-white/15 hover:border-white/30 col-span-2 md:col-span-3"
      onClick={onBuy}
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
        <img src={icon} alt="shard" className="mr-4 w-16 h-16 drop-shadow-lg" />
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
    <div
      onClick={onBuy}
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-col items-center justify-between p-6 min-h-[160px] w-full border border-white/20 hover:scale-[1.03] transition-transform hover:bg-white/15 hover:border-white/30 cursor-pointer"
    >
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

function ZenDescriptionCard() {
  return (
    <div className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-col items-center justify-between p-8 w-full max-w-lg border border-white/20 mb-8">
      <img src="/stars.svg" alt="ZEN" className=" w-40 h-30  " />
      <div className="mb-3 text-3xl font-extrabold text-white font-mulish menu-shadow tracking-wide text-center">
        ZEN-подписка
      </div>
      <div className="flex flex-col gap-4 w-full mt-2">
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">❌</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">Без рекламы</span>
            <span className="text-white/80 text-sm">
              Ничего не отвлекает от удовольствия
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">💸</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">
              Скидка на бустеры
            </span>
            <span className="text-white/80 text-sm">
              Выгодные покупки в магазине
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">🧘</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">ZEN-режим</span>
            <span className="text-white/80 text-sm">
              Спокойный геймплей без ограничений
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">🏆</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">
              Розыгрыши призов
            </span>
            <span className="text-white/80 text-sm">
              Чем больше очков, тем выше шансы!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZenSubCard({
  period,
  priceCrystals,
  priceStars,
  percent,
  bonuses,
  onClick,
}: any) {
  const parsedBonuses = bonuses.map((bonus: any) => {
    const boosterInfo = BOOSTERS.find((b) => b.name === bonus.name);
    return {
      ...bonus,
      icon: boosterInfo ? boosterInfo.icon : "",
    };
  });

  return (
    <div
      onClick={onClick}
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-row gap-4
     items-center justify-between p-10 w-full border border-white/20
      hover:scale-[1.02] transition-transform hover:bg-white/15 hover:border-white/30 mb-4 cursor-pointer"
    >
      {percent && (
        <div
          className={`absolute top-0 right-8 -translate-y-1/2  py-2 px-3
             rounded-full text-md font-bold shadow-md font-fig
             bg-gradient-to-r from-emerald-400 to-emerald-500 text-white
           `}
        >
          {percent}
        </div>
      )}
      <div className="flex flex-col gap-2 items-center justify-center w-7/12">
        {/* <div className="rounded-2xl backdrop-blur-sm bg-white/10 justify-center items-center py-3 px-5"> */}
        <div className="text-3xl font-bold items-start text-white font-mulish menu-shadow  ">
          {period}
        </div>
        {/* </div> */}
        <span className="items-center justify-center font-fig text-3xl font-extrabold">
          +
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {parsedBonuses.map((bonus: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-br from-white/20 to-white/10 px-3 py-1.5 shadow-md"
            >
              <img
                src={bonus.icon}
                alt={bonus.name}
                className="w-7 h-7 drop-shadow-lg"
              />
              <span className="font-figtree text-lg font-bold text-white menu-shadow">
                x{bonus.count}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 items-center mb-2">
        <span className="flex items-center gap-2 text-2xl font-bold text-white">
          <img src="/crystal.svg" alt="crystal" className="w-8 h-8" />
          {priceCrystals}
        </span>
        <span className=" h-[2px] bg-white/20 backdrop-blur-md w-full "></span>
        <span className="flex items-center gap-2 text-2xl font-bold text-white">
          <img src="/tgstar.svg" alt="star" className="w-8 h-8" />
          {priceStars}
        </span>
      </div>
    </div>
  );
}

// BACKEND: Покупка осколков (shards)
// Вызвать эту функцию при покупке любого пакета осколков.
// Пример вызова:
//   handleShardPurchase({ userId: user?.id, amount: pack.amount, price: pack.price })
function handleShardPurchase({
  userId,
  amount,
  price,
}: {
  userId: number;
  amount: number;
  price: number;
}) {
  /**
   * BACKEND: Покупка осколков
   * userId: ID пользователя
   * amount: количество приобретаемых осколков
   * price: цена в звёздах (stars)
   *
   * После успешной покупки обновить баланс пользователя.
   */
  // TODO: реализовать покупку осколков через API
  // Пример:
  // await buyShards({ userId, amount, price })
}

const ShopScreen: React.FC<ShopScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState("Осколки");
  const [adminBalance, setAdminBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [selectedBooster, setSelectedBooster] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [isZenModalOpen, setIsZenModalOpen] = useState(false);
  const { isAdmin } = useAdminAuth();

  // BACKEND: Получить баланс игрока из стора/пропсов. Заглушка для currency (осколки).
  const { user } = useUser();
  const balance = user?.currency ?? 0;

  const [selectedShardPack, setSelectedShardPack] = useState<ShardPack | null>(
    null
  );
  const [isShardModalOpen, setIsShardModalOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setIsBalanceLoading(true);
      fetch("/api/users/610936383/currency")
        .then((res) => res.json())
        .then((data) => {
          setAdminBalance(typeof data.balance === "number" ? data.balance : 0);
          setIsBalanceLoading(false);
        })
        .catch(() => {
          setAdminBalance(0);
          setIsBalanceLoading(false);
        });
    } else {
      setAdminBalance(null);
      setIsBalanceLoading(false);
    }
  }, [isAdmin]);

  const handleBoosterClick = (booster: any) => {
    setSelectedBooster(booster);
    setIsModalOpen(true);
  };

  const handlePurchaseConfirm = (quantity: number) => {
    /**
     * BACKEND: Покупка бустера
     * Вызвать эндпоинт/функцию для покупки бустера:
     * boosterId: selectedBooster?.id
     * quantity: число
     * userId: user?.id
     *
     * После успешной покупки обновить баланс и инвентарь пользователя.
     */
    // TODO: реализовать покупку бустера через API
    // Пример:
    // await buyBooster({ userId: user?.id, boosterId: selectedBooster?.id, quantity })
    setIsModalOpen(false);
    setSelectedBooster(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBooster(null);
  };

  const handleZenSubClick = (sub: any) => {
    const parsedBonuses = sub.bonuses.map((bonus: any) => {
      const boosterInfo = BOOSTERS.find((b) => b.name === bonus.name);
      return {
        ...bonus,
        icon: boosterInfo ? boosterInfo.icon : "",
      };
    });
    setSelectedSub({ ...sub, bonuses: parsedBonuses });
    setIsZenModalOpen(true);
  };

  const handleZenPurchaseConfirm = (paymentMethod: "crystals" | "stars") => {
    /**
     * BACKEND: Покупка ZEN-подписки
     * Вызвать эндпоинт/функцию для покупки подписки:
     * period: selectedSub?.period
     * paymentMethod: "crystals" | "stars"
     * userId: user?.id
     *
     * После успешной покупки обновить баланс и статус подписки пользователя.
     */
    // TODO: реализовать покупку подписки через API
    // Пример:
    // await buyZenSubscription({ userId: user?.id, period: selectedSub?.period, paymentMethod })
    setIsZenModalOpen(false);
    setSelectedSub(null);
  };

  const handleZenModalClose = () => {
    setIsZenModalOpen(false);
    setSelectedSub(null);
  };

  return (
    <div className="flex relative flex-col min-h-screen text-white menu-bg fade-in-animation-fast">
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
          {isBalanceLoading ? (
            <span className="text-xl font-bold font-figtree">
              <LoadingNumberAnimation
                isLoading={true}
                minDigits={3}
                speed={50}
              />
            </span>
          ) : (
            <span>{isAdmin ? adminBalance ?? 333 : balance}</span>
          )}
        </div>
      </div>
      {/* Tab-панель */}
      <div className="flex gap-2 justify-center mt-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-full text-lg font-bold transition-all duration-300 border border-white/20  font-mulish ${
              tab === t
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg"
                : "bg-white/10 backdrop-blur-md text-white  "
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
              <ShardPackCardHorizontal
                key={0}
                {...SHARD_PACKS[0]}
                onBuy={() => {
                  setSelectedShardPack(SHARD_PACKS[0]);
                  setIsShardModalOpen(true);
                }}
              />
              {SHARD_PACKS.slice(1).map((pack, i) => (
                <ShardPackCard
                  key={i + 1}
                  {...pack}
                  onBuy={() => {
                    setSelectedShardPack(pack);
                    setIsShardModalOpen(true);
                  }}
                />
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
                  onBuy={() => handleBoosterClick(booster)}
                />
              ))}
            </div>
          </div>
        )}
        {tab === "ZEN" && (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-2xl max-h-[80dvh] overflow-y-auto store-scroll py-6 ">
              <div className="flex flex-col justify-center items-center w-full">
                <ZenDescriptionCard />
                <div className="w-full flex flex-col gap-4">
                  {ZEN_SUBS.map((sub, i) => (
                    <ZenSubCard
                      key={i}
                      {...sub}
                      onClick={() => handleZenSubClick(sub)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedBooster && (
        <BoosterPurchaseModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handlePurchaseConfirm}
          booster={selectedBooster}
          playerBalance={isAdmin ? adminBalance ?? 333 : balance}
        />
      )}
      {selectedSub && (
        <ZenPurchaseModal
          isOpen={isZenModalOpen}
          onClose={handleZenModalClose}
          onConfirm={handleZenPurchaseConfirm}
          subscription={selectedSub}
          playerBalanceCrystals={isAdmin ? adminBalance ?? 333 : balance}
        />
      )}
      {selectedShardPack && (
        <ShardPurchaseModal
          isOpen={isShardModalOpen}
          onClose={() => {
            setIsShardModalOpen(false);
            setSelectedShardPack(null);
          }}
          pack={selectedShardPack}
          userId={user?.id}
          onSuccess={() => {
            setIsShardModalOpen(false);
            setSelectedShardPack(null); /* обновить баланс, если нужно */
          }}
        />
      )}
    </div>
  );
};

export default ShopScreen;
