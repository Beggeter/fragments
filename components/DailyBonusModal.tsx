import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import ClickEffect from "./ClickEffect";
import { RewardStatus } from "@/types/components";
import { useUnlockAnimations } from "@/hooks/useUnlockAnimation";
import { useDailyBonus } from "@/hooks/useDailyBonus";

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShop?: (initialTab?: string) => void;
}

export type DailyReward =
  | {
      type: "currency";
      amount: number;
      status?: RewardStatus;
    }
  | {
      type: "booster";
      amount: number;
      boosterType: string;
      status?: RewardStatus;
    };

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  onOpenShop,
}) => {
  if (!isOpen) return null;

  const { t } = useTranslation();

  const {
    bonusData,
    isLoading,
    error,
    claimBonus,
    hasZenSubscription,
    currentWeek,
    currentDay,
    canClaimToday,
  } = useDailyBonus();

  // Преобразуем данные из API в формат для компонента
  const transformRewards = (weekData: any): DailyReward[] => {
    const totalWeeks = bonusData?.weeks?.length ?? 4;
    const daysInWeek = weekData?.days?.length ?? 7;
    const periodLength = Math.max(1, totalWeeks) * Math.max(1, daysInWeek);

    const posTodayAbs = (currentWeek - 1) * daysInWeek + (currentDay - 1);

    const lastClaimISO = (bonusData as any)?.lastClaimDate as string | null;
    const today = new Date(); today.setHours(0,0,0,0);
    let daysDiff = 0;
    if (lastClaimISO) {
      const last = new Date(lastClaimISO);
      last.setHours(0,0,0,0);
      daysDiff = Math.floor((today.getTime() - last.getTime()) / (1000*60*60*24));
    }

    let posLastClaimAbs: number | null = null;
    if (lastClaimISO) {
      if (daysDiff === 0) {
        posLastClaimAbs = (((posTodayAbs - 1) % periodLength) + periodLength) % periodLength;
      } else if (daysDiff > 0) {
        posLastClaimAbs = (((posTodayAbs - daysDiff) % periodLength) + periodLength) % periodLength;
      }
    }

    return weekData.days.map((day: any, index: number) => {
      const absIndex = (currentWeek - 1) * daysInWeek + index;
      let status: RewardStatus = "locked";

      const isToday = index === currentDay - 1;
      const isFutureInWeek = index > (currentDay - 1);
      const isPastInWeek = index < (currentDay - 1);

      if (isToday && canClaimToday) {
        status = "available";
      } else if (isFutureInWeek) {
        status = "locked";
      } else if (isPastInWeek) {
        if (posLastClaimAbs !== null) {
          // Внутри текущей недели до today: если строго после последнего полученного и до today → skipped, иначе claimed
          if (daysDiff >= 1 && absIndex > posLastClaimAbs && absIndex < posTodayAbs) {
            status = "skipped";
          } else {
            status = "claimed";
          }
        } else {
          // Нет информации о последнем получении — считаем прошлые дни полученными
          status = "claimed";
        }
      }

      return {
        type: day.regular.type,
        amount: day.regular.amount || 0,
        boosterType: day.regular.name,
        status,
      };
    });
  };

  const transformZenRewards = (weekData: any): DailyReward[] => {
    const totalWeeks = bonusData?.weeks?.length ?? 4;
    const daysInWeek = weekData?.days?.length ?? 7;
    const periodLength = Math.max(1, totalWeeks) * Math.max(1, daysInWeek);

    const posTodayAbs = (currentWeek - 1) * daysInWeek + (currentDay - 1);
    const lastClaimISO = (bonusData as any)?.lastClaimDate as string | null;
    const today = new Date(); today.setHours(0,0,0,0);
    let daysDiff = 0;
    if (lastClaimISO) {
      const last = new Date(lastClaimISO); last.setHours(0,0,0,0);
      daysDiff = Math.floor((today.getTime() - last.getTime()) / (1000*60*60*24));
    }
    let posLastClaimAbs: number | null = null;
    if (lastClaimISO) {
      if (daysDiff === 0) {
        posLastClaimAbs = (((posTodayAbs - 1) % periodLength) + periodLength) % periodLength;
      } else if (daysDiff > 0) {
        posLastClaimAbs = (((posTodayAbs - daysDiff) % periodLength) + periodLength) % periodLength;
      }
    }

    return weekData.days.map((day: any, index: number) => {
      const absIndex = (currentWeek - 1) * daysInWeek + index;
      let status: RewardStatus = "locked";

      const isToday = index === currentDay - 1;
      const isFutureInWeek = index > (currentDay - 1);
      const isPastInWeek = index < (currentDay - 1);

      if (isToday && canClaimToday) {
        status = "available";
      } else if (isFutureInWeek) {
        status = "locked";
      } else if (isPastInWeek) {
        if (posLastClaimAbs !== null) {
          if (daysDiff >= 1 && absIndex > posLastClaimAbs && absIndex < posTodayAbs) {
            status = "skipped";
          } else {
            status = "claimed";
          }
        } else {
          status = "claimed";
        }
      }

      return {
        type: day.premium.type,
        amount: day.premium.amount || 0,
        boosterType: day.premium.name,
        status,
      };
    });
  };

  // ВСЕ useMemo хуки должны быть здесь, до любых условных return
  const currentWeekData = useMemo(
    () => bonusData?.weeks.find((w) => w.week === (currentWeek ?? 1)),
    [bonusData?.weeks, currentWeek]
  );

  const classicRewards = useMemo(
    () => (currentWeekData ? transformRewards(currentWeekData) : []),
    [currentWeekData, currentDay, canClaimToday]
  );

  const zenRewards = useMemo(
    () => (currentWeekData ? transformZenRewards(currentWeekData) : []),
    [currentWeekData, currentDay, canClaimToday]
  );

  const unlockAnimations = useUnlockAnimations(classicRewards);

  // Skeleton for reward grid to prevent layout shift while loading
  const renderRewardGridSkeleton = (isZen = false) => (
    <div className={`flex items-stretch gap-2 h-full`}>
      <div className="flex flex-col gap-2 w-[60%]">
        <div className="flex gap-2 h-1/2">
          {[0,1,2].map((i) => (
            <div key={i} className={`relative flex flex-col items-center justify-between rounded-lg flex-1 h-full backdrop-blur-2xl shadow-lg border-white/10 ${isZen ? 'gold-gradient' : 'settings-gradient'} opacity-40 animate-pulse`}>
              <div className="text-xs text-transparent">00</div>
              <div className="w-6 h-6 bg-white/30 rounded" />
              <div className="text-sm text-transparent">00</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 h-1/2">
          {[0,1,2].map((i) => (
            <div key={i} className={`relative flex flex-col items-center justify-between rounded-lg flex-1 h-full backdrop-blur-2xl shadow-lg border-white/10 ${isZen ? 'gold-gradient' : 'settings-gradient'} opacity-40 animate-pulse`}>
              <div className="text-xs text-transparent">00</div>
              <div className="w-6 h-6 bg-white/30 rounded" />
              <div className="text-sm text-transparent">00</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className={`relative flex flex-col items-center justify-between rounded-lg h-full backdrop-blur-2xl shadow-lg border-white/10 ${isZen ? 'gold-gradient' : 'settings-gradient'} opacity-40 animate-pulse`}>
          <div className="text-xl text-transparent">00</div>
          <div className="w-12 h-12 bg-white/30 rounded" />
          <div className="text-xl text-transparent">00</div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (!isOpen) return;
    const assets = [
      "/stars.svg",
      "/boosters/bomb.svg",
      "/boosters/whirlwind.svg",
      "/boosters/back.png",
      "/crystal.svg",
    ];
    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [isOpen]);

  const getStatusIcon = (reward: DailyReward) => {
    if (reward.status === "claimed") return "/tick.svg";
    if (reward.status === "skipped") return "/cross.svg";
    // if (reward.status === "locked") return "🔒";
    return "";
  };

  const renderImage = (reward: DailyReward, size: "small" | "large") => {
    if (reward.type === "currency") {
      return (
        <img
          src="/crystal.svg"
          className={`${size === "large" ? "h-12 w-12" : "w-6 h-6"}`}
          alt="Currency"
        />
      );
    } else if (reward.type === "booster") {
      const boosterSrc =
        reward.boosterType === "undo"
          ? "/boosters/back.png"
          : reward.boosterType === "bomb"
          ? "/boosters/bomb.svg"
          : reward.boosterType === "whirlwind"
          ? "/boosters/whirlwind.svg"
          : "/boosters/bomb.svg"; // fallback

      return (
        <img
          src={boosterSrc}
          className={`${size === "large" ? "h-12 w-12" : "w-6 h-6"}`}
          alt={reward.boosterType}
        />
      );
    }
    return null;
  };

  const renderRewardGrid = (
    rewards: ReadonlyArray<DailyReward>,
    isZen = false
  ) => (
    <div className={`flex items-stretch gap-2 h-full`}>
      {/* Left side - 2 rows of 3 items */}
      <div className="flex flex-col gap-2 w-[60%]">
        {/* First row */}
        <div className="flex gap-2 h-1/2">
          {rewards.slice(0, 3).map((reward, index) => (
            <RewardItem
              key={index}
              reward={reward}
              day={t("bonuses.day", { number: index + 1 })}
              size="small"
              animateUnlock={unlockAnimations[index]}
              isZen={isZen}
            />
          ))}
        </div>
        {/* Second row */}
        <div className="flex gap-2 h-1/2">
          {rewards.slice(3, 6).map((reward, index) => (
            <RewardItem
              key={index + 3}
              reward={reward}
              day={t("bonuses.day", { number: index + 4 })}
              size="small"
              animateUnlock={unlockAnimations[index + 3]}
              isZen={isZen}
            />
          ))}
        </div>
      </div>

      {/* Right side - single big item */}
      {rewards[6] && (
        <div className="flex-1">
          <RewardItem
            reward={rewards[6]}
            day={t("bonuses.day", { number: 7 })}
            size="large"
            animateUnlock={unlockAnimations[6]}
            isZen={isZen}
          />
        </div>
      )}
    </div>
  );

  // Helper component for reward items
  const RewardItem = ({
    reward,
    day,
    size,
    animateUnlock = false,
    isZen,
  }: {
    reward: DailyReward;
    day: string;
    size: "small" | "large";
    animateUnlock?: boolean;
    isZen: boolean;
  }) => {
    const isZenAd = isZen && !hasZenSubscription ? true : false;
    const baseGradient = isZen ? "gold-gradient" : "settings-gradient";

    const handleClick = () => {
      if (reward.status !== "available") return;
      if (isZen) {
        if (hasZenSubscription) {
          void claimBonus();
        } else {
          onClose();
          setTimeout(() => onOpenShop?.("zen"), 0);
        }
        return;
      }
      void claimBonus();
    };

    return (
      <ClickEffect
        onClick={handleClick}
        className={`relative flex flex-col items-center justify-between rounded-lg flex-1 h-full scale-active backdrop-blur-2xl shadow-lg text-white font-figtree-mulish  
         ${
           !isZenAd
             ? `${
                 reward.status === "available"
                   ? `border-white/30 shimmer-effect ${baseGradient} cursor-pointer`
                   : "border-white/10 "
               } ${
                 reward.status === "claimed"
                   ? "black-gradient opacity-80 cursor-not-allowed"
                   : reward.status === "skipped"
                   ? "black-gradient opacity-80 grayscale cursor-not-allowed"
                   : ""
               } ${reward.status === "locked" ? `${baseGradient} ` : ""}
       `
             : `${baseGradient}`
         } ${size === "small" ? "p-2 gap-1" : "p-4 "} `}
      >
        {/* Day */}
        <div
          className={`${
            size === "small" ? "text-xs" : "text-xl"
          } text-white font-figtree-mulish font-bold text-nowrap `}
        >
          {day}
        </div>
        {/* Icon */}
        <div className={`${size === "small" ? "text-2xl" : "text-4xl"} `}>
          {renderImage(reward, size)}
        </div>
        {/* Amount */}
        <div
          className={`${
            size === "small" ? "text-sm" : "text-xl"
          } font-bold font-figtree-mulish`}
        >
          {reward.type === "currency" ? `+${reward.amount}` : reward.amount}
        </div>
        {/* Status */}
        {getStatusIcon(reward) && !isZenAd && (
          <img
            className={`absolute bottom-1 right-1   ${
              size === "small" ? "w-[12px] h-[12px] text-xs" : "w-6 h-6 text-xl"
            }`}
            src={getStatusIcon(reward)}
          ></img>
        )}

        {reward.status === "locked" && !isZenAd && (
          <motion.img
            initial={animateUnlock ? { scale: 1, opacity: 1 } : false}
            animate={animateUnlock ? { scale: 1.8, opacity: 0 } : false}
            transition={{ duration: 0.6, ease: "easeOut" }}
            src={"/lock.svg"}
            className={`absolute bottom-1 right-1   ${
              size === "small"
                ? "text-xs w-[12px] h-[12px]"
                : "text-xl w-[20px] h-[20px]"
            }`}
          ></motion.img>
        )}
      </ClickEffect>
    );
  };
  const ClaimButton = () => {
    const handleClaim = async () => {
      await claimBonus();
    };

    return (
      <ClickEffect>
        <button
          onClick={handleClaim}
          disabled={!canClaimToday || isLoading}
          className={`mx-auto mt-1 mb-4 block rounded-xl py-2 w-[50%] text-white text-lg font-bold
                       bg-gradient-to-br green-gradient scale-active font-figtree-mulish ${
                         canClaimToday && !isLoading
                           ? "shimmer-effect"
                           : "opacity-50"
                       }`}
        >
          {isLoading ? "Claiming..." : t("bonuses.claim")}
        </button>
      </ClickEffect>
    );
  };
  return (
    <ClickEffect
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden"
    >
      <div
        className="bg-white/10 backdrop-blur-xl rounded-3xl  shadow-md border border-white/20 overflow-hidden
         max-w-lg w-full fade-in-animation-fast flex flex-col max-h-[90dvh] min-h-fit "
        onClick={(e) => e.stopPropagation()}
      >
        {/* === ШАПКА МОДАЛКИ === */}
        <div className="flex justify-between items-center px-8 pt-4    ">
          <div className="flex flex-row gap-0 items-center justify-between  ">
            <img
              src={"/gift.svg"}
              className="w-8 h-8 items-center mb-1.5 -mr-4 drop-shadow-2xl"
            ></img>
            <div className="inline-block relative">
              <h1 className="absolute text-2xl font-bold tracking-wider text-blue-600/30 font-figtree-mulish px-8 transform translate-x-1 translate-y-1">
                {t("bonuses.week", { week: currentWeek })}
              </h1>
              <h1 className="relative text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 font-figtree-mulish px-8">
                {t("bonuses.week", { week: currentWeek })}
              </h1>
            </div>
          </div>
          <ClickEffect>
            <button
              className="text-5xl text-white hover:text-gray-300"
              onClick={onClose}
              aria-label={t("common.close", "Закрыть")}
            >
              ×
            </button>
          </ClickEffect>
        </div>

        {/* === КОНТЕНТ === */}
        <div className=" overflow-x-hidden px-8 pt-4   justify-center ">
          {hasZenSubscription ? (
            <>
              {/* ZEN-подписка активна — отображаем только ZEN-блок */}
              <div className="min-h-[160px] sm:min-h-[200px]">
                {bonusData && currentWeekData ? renderRewardGrid(zenRewards, true) : renderRewardGridSkeleton(true)}
              </div>
              <ClaimButton />
            </>
          ) : (
            <>
              {/* ZEN-подписка не активна — отображаем Classic + затемнённую ZEN */}
              <div className="min-h-[160px] sm:min-h-[200px]">
                {bonusData && currentWeekData ? renderRewardGrid(classicRewards) : renderRewardGridSkeleton(false)}
              </div>
              <ClaimButton />
              {/* Реклама ZEN */}
              <div className="relative mt-4 pt-2 pb-4">
                {/* Градиентный фон на всю ширину модалки */}
                <div className="absolute inset-0 -mx-8  bg-gradient-to-br rounded-3xl from-[#ffe8b5]/10 via-[#ffd580]/10 to-[#f6c243]/10 backdrop-blur-md border-t border-b border-white/10 pointer-events-none" />

                {/* Контент поверх фона с внутренними отступами */}
                <div className="relative z-10 ">
                  <div className="text-center mb-1">
                    <div className=" flex flex-row items-center justify-center gap-2">
                      <h3 className="text-lg font-bold text-yellow-100 drop-shadow-sm tracking-wide my-2 font-figtree-mulish">
                        {t("bonuses.zen_only_title")}
                      </h3>
                    </div>
                  </div>
                  <div className="mb-6 min-h-[200px] sm:min-h-[240px]">
                    {bonusData && currentWeekData ? renderRewardGrid(zenRewards, true) : renderRewardGridSkeleton(true)}
                  </div>

                  <div className="text-center text-sm text-yellow-100 font-figtree-mulish mb-6 leading-relaxed">
                    {"+115 "}
                    <img
                      src={"/crystal.svg"}
                      className="w-4 h-4 inline align-middle"
                    ></img>{" "}
                    {t("common.and")} {t("bonuses.zen_description")}
                    <br />
                    {t("bonuses.no_ads")}
                  </div>

                  <div
                    className="relative text-center scale-active  mt-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      setTimeout(() => onOpenShop?.("zen"), 0);
                    }}
                  >
                    {/* <ClickEffect sound=""> */}
                    <button
                      className="rounded-xl orange-gradient mx-auto w-[50%] font-figtree-mulish 
                      py-2 text-white font-bold text-lg relative z-10    "
                    >
                      {t("bonuses.zen_subscribe")}
                    </button>
                    <img
                      src="/stars.svg"
                      alt="Stars"
                      className="absolute top-0  left-1/2 -translate-x-1/2 -translate-y-3/5 z-20 w-20 h-12"
                    />
                    {/* </ClickEffect> */}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ClickEffect>
  );
};
