import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import MenuButton from "./UI/MenuButton";
import ClickEffect from "./ClickEffect";
import { Booster, RewardStatus } from "@/types/components";
import { useUnlockAnimations } from "@/hooks/useUnlockAnimation";
import rewards from "./store/bonusItems";

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  currentDay: number;
  hasZenSubscription: boolean;
  onClaimReward: () => void;
  rewards: {
    classic: ReadonlyArray<DailyReward>;
    zen: ReadonlyArray<DailyReward>;
  };
}

export type DailyReward =
  | {
      type: "shard";
      amount: number;
      status?: RewardStatus;
    }
  | {
      type: "booster";
      amount: number;
      boosterType: Booster;
      status?: RewardStatus;
    };

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  currentDay,
  hasZenSubscription,
  onClaimReward,
  rewards,
}) => {
  if (!isOpen) return null;

  const { t } = useTranslation();
  const currentRewards = rewards.classic ?? [];
  console.log("Current rewards", rewards.classic);

  const unlockAnimations = useUnlockAnimations(currentRewards as DailyReward[]);

  const getStatusIcon = (reward: DailyReward) => {
    if (reward.status === "claimed") return "✅";
    if (reward.status === "skipped") return "❌";
    // if (reward.status === "locked") return "🔒";
    return "";
  };

  const renderImage = (src: string, size: "small" | "large") => (
    <img
      src={src}
      className={`${size === "large" ? "h-12 w-12" : "w-6 h-6"} `}
    ></img>
  );

  const renderRewardGrid = (
    rewards: ReadonlyArray<DailyReward>,
    isZen = false
  ) => (
    <div
      className={`flex items-stretch gap-2 h-full ${
        !hasZenSubscription && isZen ? "opacity-60" : ""
      }`}
    >
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
    const gradient = isZen ? "gold-gradient" : "settings-gradient";
    const hideStatusIcon = isZen && !hasZenSubscription;
    return (
      <ClickEffect
        className={`relative flex flex-col items-center justify-between rounded-lg flex-1 h-full scale-active backdrop-blur-2xl shadow-lg text-white font-figtree-mulish  ${
          reward.status === "available"
            ? `border-white/30 bg-white/10 shimmer-effect ${gradient}`
            : "border-white/10 bg-white/5"
        } ${
          reward.status === "claimed" || reward.status === "skipped"
            ? "black-gradient opacity-70"
            : ""
        } ${reward.status === "locked" ? `${gradient}` : ""}
       ${size === "small" ? "p-2 gap-1" : "p-4 "}`}
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
          {reward.type === "shard"
            ? renderImage("/crystal.svg", size)
            : reward.boosterType === "undo"
            ? renderImage("/boosters/back.png", size)
            : renderImage("/boosters/bomb.svg", size)}
        </div>
        {/* Amount */}
        <div
          className={`${
            size === "small" ? "text-sm" : "text-xl"
          } font-bold font-figtree-mulish`}
        >
          {reward.type === "shard" ? `+${reward.amount}` : reward.amount}
        </div>
        {/* Status */}
        {getStatusIcon(reward) && !hideStatusIcon && (
          <div
            className={`absolute bottom-1 right-1 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center ${
              size === "small" ? "w-5 h-5 text-xs" : "w-6 h-6 text-xl"
            }`}
          >
            {getStatusIcon(reward)}
          </div>
        )}

        {reward.status === "locked" && !hideStatusIcon && (
          <motion.div
            initial={animateUnlock ? { scale: 1, opacity: 1 } : false}
            animate={animateUnlock ? { scale: 1.8, opacity: 0 } : false}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`absolute bottom-1 right-1  ${
              size === "small" ? "text-xs" : "text-xl"
            }`}
          >
            🔒
          </motion.div>
        )}
      </ClickEffect>
    );
  };
  const ClaimButton = () => (
    <ClickEffect>
      <button
        onClick={onClaimReward}
        className={`mx-auto mt-4 mb-4 block rounded-xl py-2 w-[50%]  text-white text-lg font-bold
                     bg-gradient-to-br green-gradient scale-active font-figtree-mulish ${
                       claimAvailable ? "shimmer-effect" : ""
                     } drop-shadow-[0_0_20px_#40ae54]`}
      >
        {t("bonuses.claim")}
      </button>
    </ClickEffect>
  );
  const claimAvailable =
    rewards.classic[currentDay - 1]?.status === "available";
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
          {/* Надпись Неделя */}
          {/* <div className="justify-center flex text-center w-full mt-4 mb-3">
            <div className="inline-block relative">
              <h1 className="absolute text-2xl font-bold tracking-wider text-blue-600/30 font-figtree-mulish px-8 transform translate-x-1 translate-y-1">
                {t("bonuses.week", { week: currentWeek })}
              </h1>
              <h1 className="relative text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 font-figtree-mulish px-8">
                {t("bonuses.week", { week: currentWeek })}
              </h1>
            </div>
          </div> */}

          {hasZenSubscription ? (
            <>
              {/* ZEN-подписка активна — отображаем только ZEN-блок */}
              {renderRewardGrid(rewards.zen, true)}
              <ClaimButton></ClaimButton>
            </>
          ) : (
            <>
              {/* ZEN-подписка не активна — отображаем Classic + затемнённую ZEN */}
              {renderRewardGrid(rewards.classic)}
              {/* <ClickEffect>
                <button
                  onClick={onClaimReward}
                  className={`mx-auto mt-4 mb-4 block rounded-xl py-2 w-[50%]  text-white text-lg font-bold
                     bg-gradient-to-br green-gradient active:scale-[0.98] font-figtree-mulish ${
                       claimAvailable ? "shimmer-effect" : ""
                     } drop-shadow-[0_0_20px_#40ae54]`}
                >
                  {t("bonuses.claim")}
                </button>
              </ClickEffect> */}
              <ClaimButton></ClaimButton>
              {/* Реклама ZEN */}
              <div className="relative mt-4 pt-2 pb-4">
                {/* Градиентный фон на всю ширину модалки */}
                <div className="absolute inset-0 -mx-8  bg-gradient-to-br rounded-3xl from-[#ffe8b5]/10 via-[#ffd580]/10 to-[#f6c243]/10 backdrop-blur-md border-t border-b border-white/10 pointer-events-none" />

                {/* Контент поверх фона с внутренними отступами */}
                <div className="relative z-10 ">
                  <div className="text-center mb-1">
                    <div className=" flex flex-row items-center justify-center gap-2">
                      <h3 className="text-2xl font-bold text-yellow-300 drop-shadow-sm tracking-wide my-2 font-figtree-mulish">
                        ZEN
                      </h3>
                      <img src={"/crown.svg"} className="h-10 w-10"></img>
                    </div>
                    {/* <p className="text-md  text-yellow-100 font-figtree-mulish leading-relaxed">
                      Получай{" "}
                      <span className="text-white font-semibold">
                        в 2 раза больше
                      </span>{" "}
                      бонусов с подпиской{" "}
                      <span className="text-white font-semibold">ZEN</span>!
                    </p> */}
                  </div>

                  <div className="mb-6">
                    {renderRewardGrid(rewards.zen, true)}
                  </div>

                  <div className="text-center text-sm text-yellow-100 font-figtree-mulish mb-6 leading-relaxed">
                    {t("bonuses.zen_only_title") + " "}
                    <span className="text-white font-semibold">
                      Whirlwind
                    </span>,{" "}
                    <span className="text-white font-semibold">Bomb</span>{" "}
                    {t("common.and")}{" "}
                    <span className="text-white font-semibold">Undo</span>, +115{" "}
                    <img
                      src={"/crystal.svg"}
                      className="w-4 h-4 inline align-middle"
                    ></img>{" "}
                    {t("bonuses.a_month")}!
                    <br />
                    <span className="text-white font-semibold">
                      {t("bonuses.no_ads")}
                    </span>
                    , {t("bonuses.access_to")}{" "}
                    <span className="text-white font-semibold">
                      {t("bonuses.to_zen_mode")}
                    </span>
                  </div>

                  <div className="relative text-center scale-active  mt-6">
                    <ClickEffect>
                      <button
                        onClick={() => {}}
                        className="rounded-xl orange-gradient mx-auto w-[50%] font-figtree-mulish 
                      py-2 text-white font-bold text-lg relative z-10 drop-shadow-[0_0_30px_#f76d1f]   "
                      >
                        {t("bonuses.zen_subscribe")}
                      </button>
                      <img
                        src="/stars.svg"
                        alt="Stars"
                        className="absolute top-0  left-1/2 -translate-x-1/2 -translate-y-3/5 z-20 w-20 h-12"
                      />
                    </ClickEffect>
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
