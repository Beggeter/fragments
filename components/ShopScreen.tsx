import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import BoosterPurchaseModal from "./store/BoosterPurchaseModal";
import ZenPurchaseModal from "./store/ZenPurchaseModal";
import { safeLocalStorage } from "@/lib/utils/telegramSDK";
import InsufficientShardsModal from "./store/InsufficientShardsModal";
import { LoadingNumberAnimation } from "./LoadingNumberAnimation";
import { BOOSTERS, SHARD_PACKS, ZEN_SUBS } from "./store/storeItems";
import ShardPurchaseModal from "./store/ShardPurchaseModal";
import { ShardPack } from "@/types/shop";
import ClickEffect from "./ClickEffect";
import { useTranslation } from "react-i18next";
import {
  createShardsInvoice,
  showTelegramAlert,
  createZenInvoice,
} from "@/lib/utils/telegramStars";
import TgStarIcon from "./UI/TgStarIcon";

const TABS_KEYS = ["shards", "boosters", "zen"] as const;

// Создаем Map для быстрого поиска бустеров вместо find() в каждом рендере
const BOOSTERS_MAP = new Map(BOOSTERS.map(booster => [booster.name, booster]));

interface ShopScreenProps {
  onBack: () => void;
  initialTab?: (typeof TABS_KEYS)[number];
}

function ShardPackCard({ amount, price, label, labelType, icon, onBuy }: any) {
  const { t } = useTranslation();
  return (
    <ClickEffect
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-col scale-active
     items-center p-3 min-w-[100%] w-full min-h-[120px] mx-auto border border-white/20 hover:scale-[1.04] transition-transform hover:bg-white/15 hover:border-white/30"
      onClick={onBuy}
    >
      {/* Лейбл выгоды */}
      {label && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 z-2 px-2 py-1   w-fit text-nowrap rounded-full text-xs font-bold shadow-md font-figtree-mulish
            ${
              1
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                : "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white"
            }`}
        >
          {t(`shop.for_free`, { bonus: label })}
        </div>
      )}
      {/* Объединенный контейнер для иконки и количества */}
      <div className="flex flex-col justify-center items-center p-2 mb-2 w-full rounded-2xl backdrop-blur-sm bg-white/5 flex-1">
        <img src={icon} alt="shard" className="mb-1 w-12 h-12 drop-shadow-lg" />
        <div className="text-lg font-extrabold text-white font-figtree">
          {amount}
        </div>
      </div>
      <div className="flex gap-1 justify-center items-center mt-auto">
        <TgStarIcon className="w-5 h-5" />
        <span className="text-base font-bold text-white font-figtree">
          {price}
        </span>
      </div>
    </ClickEffect>
  );
}

function BoosterCard({ icon, name, id, price, price_stars, onBuy }: any) {
  const { t } = useTranslation();
  return (
    <ClickEffect
      onClick={onBuy}
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-row items-center justify-between
       px-0 py-0 min-h-[72px] w-full border border-white/20 hover:scale-[1.01] transition-transform
        hover:bg-white/15 hover:border-white/30 cursor-pointer mb-2 scale-active"
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
      <div className="flex flex-col  gap-4 justify-center items-center min-w-[80px] h-full px-4">
        <div className="flex gap-1 items-center">
          <TgStarIcon className="w-6 h-6" />
          <span className="text-xl font-bold text-white font-figtree">
            {price_stars}
          </span>
        </div>
        <span className="w-full h-[2px] bg-white/20"></span>
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
      className="relative bg-white/10 backdrop-blur-md font-figtree-mulish rounded-3xl shadow-xl flex flex-col items-center justify-between p-8 w-full max-w-lg border border-white/20 mb-8 hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer"
    >
      <img
        src="/stars.svg"
        alt="ZEN"
        className=" w-40 h-30 -my-6 -mt-6 drop-shadow-[0_0_20px_#FF48C2]"
      />
      <div className="mb-3 text-3xl font-extrabold text-white font-figtree-mulish text-shadow-md tracking-wide text-center">
        {t("shop.zen_subscription")}
      </div>
      <div className="flex flex-col gap-4 w-full mt-2">
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">✅</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">
              {t("shop.daily_bonuses_1")}{" "}
              <img
                src={"/crystal.svg"}
                className="w-5 h-5 inline align-middle"
              ></img>{" "}
              {t("shop.daily_bonuses_2")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">🎁</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">
              {t("shop.free_boosters")}: {t("shop.undo")}, {t("shop.bomb")},{" "}
              {t("shop.whirlwind")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">🚫</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">
              {t("shop.no_ads")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3">
          <span className="text-2xl">💎</span>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">
              {t("shop.purchase_bonus")}
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
  
  // Кэшируем парсинг бонусов, используя Map для O(1) поиска вместо O(n) find()
  const parsedBonuses = useMemo(() => {
    return bonuses.map((bonus: any) => {
      const boosterInfo = BOOSTERS_MAP.get(bonus.name);
      return {
        ...bonus,
        icon: boosterInfo ? boosterInfo.icon : "",
      };
    });
  }, [bonuses]);

  return (
    <ClickEffect
      onClick={onClick}
      className="relative bg-white/10 backdrop-blur-md rounded-3xl shadow-xl flex flex-row gap-4
     items-center justify-between p-10 py-7 w-full border border-white/20
      hover:scale-[1.02] scale-active transition-transform hover:bg-white/15 hover:border-white/30 mb-4 cursor-pointer"
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
          <TgStarIcon className="w-8 h-8" />
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
  const [tab, setTab] = useState<(typeof TABS_KEYS)[number]>(
    initialTab || "shards"
  );
  const [adminBalance, setAdminBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false); // Не блокируем UI при загрузке
  const [selectedBooster, setSelectedBooster] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [isZenModalOpen, setIsZenModalOpen] = useState(false);
  const { isAdmin } = useAdminAuth();

  // --- InsufficientShardsModal state ---
  const [isInsufficientShardsModalOpen, setIsInsufficientShardsModalOpen] =
    useState(false);
  const [insufficientModalData, setInsufficientModalData] = useState<{
    currentBalance: number;
    requiredBalance: number;
    totalCostStars: number;
    booster: any;
    quantity: number;
  } | null>(null);

  // Ref для контейнера с подписками
  const subscriptionsContainerRef = useRef<HTMLDivElement>(null);
  // Ref для скроллируемого контейнера
  const storeScrollRef = useRef<HTMLDivElement>(null);

  // BACKEND: Получить баланс игрока из стора/пропсов. Заглушка для currency (осколки).
  const { user, updateCurrency, checkUserSession, refreshBalance } = useUser();
  const balance = user?.currency ?? 0;

  const [selectedShardPack, setSelectedShardPack] = useState<ShardPack | null>(
    null
  );
  const [isShardModalOpen, setIsShardModalOpen] = useState(false);

  useEffect(() => {
    try {  } catch {}
  }, []);

  // Обработчик клика по пакету кристаллов
  const handleShardPackClick = async (pack: ShardPack) => {
    if (!user?.id) {
      showTelegramAlert("Пользователь не авторизован");
      return;
    }
    const result = await createShardsInvoice(user.id, pack.amount, pack.price);
    if (result.success) {
      showTelegramAlert("Оплата прошла успешно! Осколки начислены.");
      await handleBalanceUpdate();
    } else if (result.error === "Payment cancelled") {
      showTelegramAlert("Оплата отменена");
    } else {
      showTelegramAlert(
        "Ошибка создания инвойса: " + (result.error || "Неизвестная ошибка")
      );
    }
  };

  // Функция для обновления баланса после покупки
  const handleBalanceUpdate = useCallback(async () => {
    try {
      // Не блокируем UI при обновлении баланса
      if (isAdmin) {
        // Для админа получаем баланс отдельно
        const res = await fetch("/api/users/610936383/currency");
        const data = await res.json();
        setAdminBalance(typeof data.balance === "number" ? data.balance : 0);
      } else {
        // Для обычного пользователя получаем актуальный баланс с сервера
        await refreshBalance();
      }
    } catch (error) {
    }
  }, [refreshBalance, isAdmin]);

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
    // Сначала сразу показываем UI, потом загружаем баланс
    setIsBalanceLoading(false);
    
    if (isAdmin) {
      // Загружаем баланс асинхронно, не блокируя UI
      fetch("/api/users/610936383/currency")
        .then((res) => res.json())
        .then((data) => {
          setAdminBalance(typeof data.balance === "number" ? data.balance : 0);
        })
        .catch(() => {
          setAdminBalance(0);
        });
    } else {
      setAdminBalance(null);
    }
  }, [isAdmin]);

  // Обновляем баланс при возвращении в приложение (например, после оплаты в боте)
  useEffect(() => {
    // Добавляем небольшую задержку, чтобы не блокировать первоначальный рендер
    let isInitialMount = true;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && !isInitialMount) {
        // Откладываем обновление баланса, чтобы не блокировать UI
        setTimeout(() => handleBalanceUpdate(), 100);
      }
    };

    const handleFocus = () => {
      if (!isInitialMount) {
        // Откладываем обновление баланса, чтобы не блокировать UI
        setTimeout(() => handleBalanceUpdate(), 100);
      }
    };

    // Помечаем, что это больше не первоначальный маунт после небольшой задержки
    const timer = setTimeout(() => {
      isInitialMount = false;
    }, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [handleBalanceUpdate]);

  const handleBoosterClick = (booster: any) => {
    setSelectedBooster(booster);
    setIsModalOpen(true);
  };

  const handlePurchaseConfirm = async (quantity: number) => {
    if (!selectedBooster || !user?.telegramId) {
      return;
    }

    try {
      const sessionToken =
        typeof window !== "undefined"
          ? safeLocalStorage.getItem("sessionToken")
          : null;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }
      const response = await fetch(`/api/users/${user.telegramId}/boosters`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "purchase",
          boosterTypeId: selectedBooster.id,
          quantity: quantity,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Закрываем модалку
        setIsModalOpen(false);
        setSelectedBooster(null);

        // Обновляем баланс после покупки бустера
        await handleBalanceUpdate();

        // Показываем уведомление об успехе
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          const webApp = window.Telegram.WebApp as any;
          if (webApp.showAlert) {
            webApp.showAlert(`✅ ${result.message}`);
          }
        }
      } else {
        // Проверяем, если недостаточно средств
        if (result.error === "Insufficient currency") {
          // Предлагаем перейти к покупке кристаллов
          handleInsufficientFunds(quantity);
        } else {
          // Показываем общую ошибку
          if (typeof window !== "undefined" && window.Telegram?.WebApp) {
            const webApp = window.Telegram.WebApp as any;
            if (webApp.showAlert) {
              webApp.showAlert(`❌ Ошибка покупки: ${result.error}`);
            }
          }
        }
      }
    } catch (error) {

      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp as any;
        if (webApp.showAlert) {
          webApp.showAlert("❌ Ошибка покупки бустера");
        }
      }
    }
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

  const handleZenPurchaseConfirm = async (
    paymentMethod: "crystals" | "stars"
  ) => {
    if (!user?.id) {
      showTelegramAlert("Пользователь не авторизован");
      return;
    }

    if (!selectedSub) {
      showTelegramAlert("Подписка не выбрана");
      return;
    }

    if (paymentMethod === "crystals") {
      // Покупка за кристаллы - проверяем баланс
      if (balance < selectedSub.priceCrystals) {
        showTelegramAlert("Недостаточно кристаллов для покупки подписки");
        return;
      }

      // TODO: Реализовать покупку за кристаллы через API
      showTelegramAlert("Покупка за кристаллы пока не поддерживается");
      return;
    }

    // Покупка за Stars через Telegram
    try {
      const result = await createZenInvoice(
        user.id,
        selectedSub.period,
        selectedSub.priceStars
      );

      if (result.success) {
        showTelegramAlert("ZEN подписка успешно активирована!");
        setIsZenModalOpen(false);
        setSelectedSub(null);
        // Обновляем данные пользователя после успешной покупки
        await checkUserSession();
      } else if (result.error === "Payment cancelled") {
        showTelegramAlert("Оплата отменена");
      } else {
        showTelegramAlert(
          "Ошибка создания инвойса: " + (result.error || "Неизвестная ошибка")
        );
      }
    } catch (error) {
      showTelegramAlert("Ошибка при создании инвойса");
    }
  };

  const handleZenModalClose = () => {
    setIsZenModalOpen(false);
    setSelectedSub(null);
  };

  // Открыть модалку "Недостаточно осколков"
  const handleInsufficientFunds = (quantity: number) => {
    if (!selectedBooster) return;

    const playerBal = isAdmin ? adminBalance ?? 333 : balance;
    setInsufficientModalData({
      currentBalance: playerBal,
      requiredBalance: quantity * selectedBooster.price,
      totalCostStars: quantity * selectedBooster.price_stars,
      booster: selectedBooster,
      quantity: quantity,
    });
    setIsInsufficientShardsModalOpen(true);
    // Не закрываем BoosterPurchaseModal, чтобы она оставалась под InsufficientShardsModal
  };

  return (
    <div className="flex relative flex-col min-h-screen text-white menu-bg fade-in-animation-fast">
      {/* Верхняя панель */}
      <div
        className="flex justify-between items-center px-4 py-4"
        style={{
          paddingTop: "calc(var(--tg-content-safe-area-inset-top, 0px) + 16px)",
        }}
      >
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
          {/* Кнопка обновления баланса */}
          <ClickEffect>
            <button
              onClick={handleBalanceUpdate}
              className="ml-2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              disabled={isBalanceLoading}
              title="Обновить баланс"
            >
              <svg
                className={`w-4 h-4 text-white ${
                  isBalanceLoading ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </ClickEffect>
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
                  ? `bg-gradient-to-r ${
                      tab === "zen"
                        ? " from-purple-400 to-purple-500 "
                        : "from-orange-400 to-orange-500"
                    }  text-white shadow-lg`
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
                <div className="w-full max-h-[70dvh] overflow-y-auto store-scroll max-w-2xl py-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 auto-rows-[minmax(140px,auto)]">
                  {/* <ShardPackCardHorizontal key={0} {...sortedPacks[0]} /> */}
                  {sortedPacks.map((pack, i) => (
                    <ShardPackCard
                      key={i + 1}
                      {...pack}
                      onBuy={() => handleShardPackClick(pack)}
                    />
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
              className="w-full max-h-[75dvh] overflow-y-auto store-scroll py-4 "
              style={{ contentVisibility: 'auto', containIntrinsicSize: '1000px' }}
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
          onSuccess={handleBalanceUpdate}
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
      {
        selectedShardPack && null // Отключаем ShardPurchaseModal, чтобы не открывалось окно
      }
      {/* InsufficientShardsModal */}
      {isInsufficientShardsModalOpen && insufficientModalData && (
        <InsufficientShardsModal
          isOpen={isInsufficientShardsModalOpen}
          currentBalance={insufficientModalData.currentBalance}
          requiredBalance={insufficientModalData.requiredBalance}
          totalCostStars={insufficientModalData.totalCostStars}
          onClose={() => {
            setIsInsufficientShardsModalOpen(false);
            setInsufficientModalData(null);
            // BoosterPurchaseModal остаётся открытой
          }}
          onTopUp={() => {
            setIsInsufficientShardsModalOpen(false);
            setInsufficientModalData(null);
            setIsModalOpen(false); // Закрыть обе модалки и перейти к пополнению
            setTab("shards");
          }}
          onBuyWithStars={() => {
            setIsInsufficientShardsModalOpen(false);
            setInsufficientModalData(null);
            setIsModalOpen(true);
            setTimeout(() => {
              if (typeof window !== "undefined") {
                const evt = new CustomEvent("autoBuyWithStars");
                window.dispatchEvent(evt);
              }
            }, 100);
          }}
          onChangeAmount={() => {
            setIsInsufficientShardsModalOpen(false);
            setInsufficientModalData(null);
          }}
        />
      )}
    </div>
  );
};

export default ShopScreen;
