import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import MenuButton from "./UI/MenuButton";
import ClickEffect from "./ClickEffect";
import { Booster, RewardStatus } from "@/types/components";
import { ScrollBounceContainer } from "./UI/ScrollBounceContainer";
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
    if (reward.status === "locked") return "🔒";
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
              day={`День ${index + 1}`}
              size="small"
              animateUnlock={unlockAnimations[index]}
            />
          ))}
        </div>
        {/* Second row */}
        <div className="flex gap-2 h-1/2">
          {rewards.slice(3, 6).map((reward, index) => (
            <RewardItem
              key={index + 3}
              reward={reward}
              day={`День ${index + 4}`}
              size="small"
              animateUnlock={unlockAnimations[index + 3]}
            />
          ))}
        </div>
      </div>

      {/* Right side - single big item */}
      {rewards[6] && (
        <div className="flex-1">
          <RewardItem
            reward={rewards[6]}
            day={`День 7`}
            size="large"
            animateUnlock={unlockAnimations[6]}
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
    animateUnlock = false
  }: {
    reward: DailyReward;
    day: string;
    size: "small" | "large";
    animateUnlock?: boolean;
  }) => (
    <ClickEffect
      className={`relative flex flex-col items-center justify-between rounded-lg flex-1 h-full scale-active backdrop-blur-2xl shadow-lg text-white font-figtree-mulish  ${
        reward.status === "available"
          ? "border-white/30 bg-white/10 shimmer-effect settings-gradient"
          : "border-white/10 bg-white/5"
      } ${
        reward.status === "claimed" || reward.status === "skipped"
          ? "black-gradient opacity-70"
          : ""
      } ${reward.status === "locked" ? "settings-gradient" : ""}
       ${size === "small" ? "p-2 gap-1" : "p-4 "}`}
    >
      {/* Day */}
      <div
        className={`${
          size === "small" ? "text-xs" : "text-sm"
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
        {`${reward.amount}`}
      </div>
      {/* Status */}
      {getStatusIcon(reward) && (
        <div
          className={`absolute -bottom-3 -right-3 ${
            reward.status === "locked" ? "-rotate-25" : ""
          } ${size === "small" ? " text-xl  " : "text-3xl"}`}
        >
          {getStatusIcon(reward)}
        </div>
      )}
      {reward.status === "locked" && (
  <motion.div
    initial={animateUnlock ? { scale: 1, opacity: 1 } : false}
    animate={animateUnlock ? { scale: 1.8, opacity: 0 } : false}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className={`absolute -bottom-3 -right-3 ${
      size === "small" ? "text-xl" : "text-3xl"
    }`}
  >
    🔒
  </motion.div>
)}
    </ClickEffect>
  );

  return (
    <ClickEffect
      onClick={onClose}
      className="fixed inset-0 z-[9999]  flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden"
    >
      <div
        className="relative fade-in-animation-fast max-h-[70dvh] overflow-y-auto  leaderboard-scroll scroll-container bg-white/10 shadow-md backdrop-blur-md rounded-3xl border border-white/20 p-8 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold text-white font-figtree-mulish">
            {t("bonuses.title", "Ежедневные бонусы")}
          </div>
          <ClickEffect>
            <button
              className="text-4xl text-white hover:text-gray-300"
              onClick={onClose}
              aria-label={t("common.close", "Закрыть")}
            >
              ×
            </button>
          </ClickEffect>
        </div>
        {/* Неделя */}
        <span className="justify-center flex  text-center w-full mb-2">
          <div className=" inline-block relative">
            {/* Тень под текстом */}
            <h1 className="absolute text-2xl font-semibold tracking-wider text-blue-600/30 font-figtree-mulish px-8  transform translate-x-1 translate-y-1">
              Неделя {currentWeek}
            </h1>
            {/* Основной заголовок */}
            <h1 className="relative text-2xl font-semibold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 font-figtree-mulish px-8 ">
              Неделя {currentWeek}
            </h1>

          </div>
        </span>
        {/* Classic награды */}
        {renderRewardGrid(rewards.classic)}
        {
          <MenuButton
            onClick={onClaimReward}
            gradientClass="green-gradient"
            text="Забрать"
            textClasses="text-3xl "
            disabled={rewards.classic[currentDay - 1]?.status !== "available"}
            className="w-full mt-8 py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:from-green-600 hover:to-green-700 transition-colors"
          ></MenuButton>
        }
        {/* ZEN награды */}
        {!hasZenSubscription && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white mb-2">
                🌟 ZEN Бонусы
              </h3>
              <p className="text-gray-400 text-sm mb-4 font-figtree-mulish">
                Получай в 2 раза больше бонусов с подпиской ZEN!
              </p>
            </div>
            {renderRewardGrid(rewards.zen, true)}
            <div className="text-center text-sm text-gray-400 mb-4 font-figtree-mulish">
              Только с подпиской: Вихрь, Бомба и Отмена хода, +115 💠 в месяц!
              <br />
              Без рекламы, Доступ к ZEN-режиму
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-figtree-mulish font-bold hover:from-orange-600 hover:to-orange-700 transition-colors"
            >
              Оформить подписку ZEN
            </button>
          </div>
        )}
      </div>
    </ClickEffect>
  );
};
