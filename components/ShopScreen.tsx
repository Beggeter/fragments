import React, { useEffect, useState, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import BoosterPurchaseModal from "./store/BoosterPurchaseModal";
import ZenPurchaseModal from "./store/ZenPurchaseModal";
import { LoadingNumberAnimation } from "./LoadingNumberAnimation";
import { BOOSTERS, SHARD_PACKS, ZEN_SUBS } from "./store/storeItems";
import ShardPurchaseModal from "./store/ShardPurchaseModal";
import { ShardPack } from "@/types/shop";
import ClickEffect from "./ClickEffect";
import { useTranslation } from "react-i18next";

const TABS_KEYS = ['shards', 'boosters', 'zen'] as const;

interface ShopScreenProps {
  onBack: () => void;
  initialTab?: typeof TABS_KEYS[number];
}


function ShardPackCard({ amount, price, label, labelType, icon, onBuy }: any) {
  const { t } = useTranslation();
  return (
    <ClickEffect
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-col
     items-center justify-between p-3 min-w-[100%] max-w-[140px] w-full min-h-[80px]  mx-auto border border-white/20 hover:scale-[1.04] transition-transform hover:bg-white/15 hover:border-white/30"
      onClick={onBuy}
    >
      {/* Лейбл выгоды */}
      {label && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-xs font-bold shadow-md font-figtree-mulish
            ${
              labelType === "bonus"
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                : "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white"
            }`}
        >
          {t(label)}
        </div>
      )}
      {/* Объединенный контейнер для иконки и количества */}
      <div className="flex flex-col justify-center items-center p-2 mb-4 w-full rounded-2xl backdrop-blur-sm bg-white/5">
        <img src={icon} alt="shard" className="mb-1 w-12 h-12 drop-shadow-lg" />
        <div className="text-lg font-extrabold text-white font-figtree">
          {amount}
        </div>
      </div>
      <div className="flex gap-1 justify-center items-center">
        <img src="/tgstar.svg" alt="star" className="w-5 h-5" />
        <span className="text-base font-bold text-white font-figtree">
          {price}
        </span>
      </div>
    </ClickEffect>
  );
}

function BoosterCard({ icon, name, id, price, onBuy }: any) {
  const { t } = useTranslation();
  return (
    <ClickEffect
      onClick={onBuy}
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-row items-center justify-between px-0 py-0 min-h-[72px] w-full border border-white/20 hover:scale-[1.01] transition-transform hover:bg-white/15 hover:border-white/30 cursor-pointer mb-2"
    >
      {/* Левая и центральная части: контейнер с backdrop-blur-sm bg-white/5 */}
      <div className="flex flex-row flex-1 h-full py-3 px-4 rounded-l-3xl rounded-r-3xl backdrop-blur-sm bg-white/5">
        {/* Левая часть: иконка и название */}
        <div className="flex flex-col items-center justify-center min-w-[90px] mr-4">
          <img
            src={icon}
            alt={name}
            className="w-14 h-14 mb-1 drop-shadow-lg"
          />
          <div className="text-base font-extrabold text-white font-figtree-mulish tracking-wide menu-shadow text-center">
            {name}
          </div>
        </div>
        {/* Центральная часть: описание */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-black/10 rounded-2xl px-3 py-2 shadow-xs  backdrop-blur-sm text-sm text-white text-center font-semibold font-figtree-mulish leading-snug max-w-[320px]">
            {t(`shop.booster_${id}_desc`)}
          </div>
        </div>
      </div>
      {/* Правая часть: цена */}
      <div className="flex flex-col justify-center items-center min-w-[80px] h-full px-4">
        <div className="flex gap-1 items-center">
          <img src="/crystal.svg" alt="shard" className="w-6 h-6" />
          <span className="text-xl font-bold text-white font-figtree">
            {price}
          </span>
        </div>
      </div>
    </ClickEffect>
  );
}

function ZenDescriptionCard({
  onScrollToSubscriptions,
}: {
  onScrollToSubscriptions: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ClickEffect
      onClick={onScrollToSubscriptions}
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-col items-center justify-between p-8 w-full max-w-lg border border-white/20 mb-8 hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer"
    >
      <img src="/stars.svg" alt="ZEN" className=" w-40 h-30  " />
      <div className="mb-3 text-3xl font-extrabold text-white font-figtree-mulish menu-shadow tracking-wide text-center">
        {t('shop.zen_subscription')}
      </div>
      <div className="flex flex-col gap-4 w-full mt-2">
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">❌</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">{t('shop.no_ads')}</span>
            <span className="text-white/80 text-sm">
              {t('shop.no_ads_desc')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">💸</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">
              {t('shop.booster_discount')}
            </span>
            <span className="text-white/80 text-sm">
              {t('shop.booster_discount_desc')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">🧘</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">{t('shop.zen_mode')}</span>
            <span className="text-white/80 text-sm">
              {t('shop.zen_mode_desc')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">🏆</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">
              {t('shop.prize_draws')}
            </span>
            <span className="text-white/80 text-sm">
              {t('shop.prize_draws_desc')}
            </span>
          </div>
        </div>
      </div>
    </ClickEffect>
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
  const { t } = useTranslation();
  const parsedBonuses = bonuses.map((bonus: any) => {
    const boosterInfo = BOOSTERS.find((b) => b.name === bonus.name);
    return {
      ...bonus,
      icon: boosterInfo ? boosterInfo.icon : "",
    };
  });

  return (
    <ClickEffect
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
        <div className="text-3xl font-bold items-start text-white font-figtree-mulish menu-shadow  ">
          {t(`shop.zen_period_${period}`)}
        </div>
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
    </ClickEffect>
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

const ShopScreen: React.FC<ShopScreenProps> = ({ onBack, initialTab }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<typeof TABS_KEYS[number]>(initialTab || 'shards');
  const [adminBalance, setAdminBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [selectedBooster, setSelectedBooster] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [isZenModalOpen, setIsZenModalOpen] = useState(false);
  const { isAdmin } = useAdminAuth();

  // Ref для контейнера с подписками
  const subscriptionsContainerRef = useRef<HTMLDivElement>(null);
  // Ref для скроллируемого контейнера
  const storeScrollRef = useRef<HTMLDivElement>(null);

  // BACKEND: Получить баланс игрока из стора/пропсов. Заглушка для currency (осколки).
  const { user } = useUser();
  const balance = user?.currency ?? 0;

  const [selectedShardPack, setSelectedShardPack] = useState<ShardPack | null>(
    null
  );
  const [isShardModalOpen, setIsShardModalOpen] = useState(false);

  // Обработчик клика по пакету кристаллов
  const handleShardPackClick = (pack: ShardPack) => {
    setSelectedShardPack(pack);
    setIsShardModalOpen(true);
  };

  // Функция для скролла к подпискам только внутри store-scroll
  const scrollToSubscriptions = () => {
    if (storeScrollRef.current && subscriptionsContainerRef.current) {
      const scrollContainer = storeScrollRef.current;
      const target = subscriptionsContainerRef.current;
      // позиция блока относительно контейнера
      const offsetTop = target.offsetTop - scrollContainer.offsetTop;
      scrollContainer.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

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

  const handleInsufficientFunds = () => {
    setIsModalOpen(false);
    setSelectedBooster(null);
    setTab("shards");
  };

  return (
    <div className="flex relative flex-col min-h-screen text-white menu-bg fade-in-animation-fast">
      {/* Верхняя панель */}
      <div className="flex justify-between items-center px-4 py-4">
        <ClickEffect>
          <img
            src="/back.svg"
            onClick={onBack}
            className="clickable flex justify-center items-center w-10 h-10 drop-shadow-xl  "
          ></img>
        </ClickEffect>
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
        {TABS_KEYS.map((key) => (
          <ClickEffect key={key}>
            <button
              onClick={() => setTab(key)}
              className={`px-6 py-2 rounded-full text-lg font-extrabold transition-colors duration-300 border border-white/20  font-figtree-mulish ${
                tab === key
                  ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg"
                  : "bg-white/10 backdrop-blur-md text-white  "
              }`}
            >
              {t(`shop.${key}`)}
            </button>
          </ClickEffect>
        ))}
      </div>
      {/* Содержимое вкладок */}
      <div className="flex flex-col flex-1 justify-start items-center px-4 py-2 ">
        {tab === "shards" && (
          <div className="flex flex-col items-center w-full slide-in-animation">
            {/* Сортируем пакеты по возрастанию цены */}
            {(() => {
              const sortedPacks = [...SHARD_PACKS].sort(
                (a, b) => a.price - b.price
              );
              return (
                <div className="w-full max-w-2xl py-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 auto-rows-[minmax(140px,auto)]">
                  {/* <ShardPackCardHorizontal key={0} {...sortedPacks[0]} /> */}
                  {sortedPacks.map((pack, i) => (
                    <ShardPackCard key={i + 1} {...pack} onBuy={() => handleShardPackClick(pack)} />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        {tab === "boosters" && (
          <div className="flex flex-col items-center w-full slide-in-animation">
            <div className="w-full max-w-2xl py-4 grid grid-cols-1 gap-y-2">
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
        {tab === "zen" && (
          <div className="flex flex-col items-center w-full slide-in-animation">
            <div
              ref={storeScrollRef}
              className="w-full max-h-[80dvh] overflow-y-auto store-scroll py-4 "
            >
              <div className="flex flex-col justify-center items-center w-full">
                <ZenDescriptionCard
                  onScrollToSubscriptions={scrollToSubscriptions}
                />
                <div
                  ref={subscriptionsContainerRef}
                  className="w-full flex flex-col gap-4"
                >
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
          onInsufficientFunds={handleInsufficientFunds}
          userId={user?.id}
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
