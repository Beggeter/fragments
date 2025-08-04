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
            className={`absolute -bottom-3 -right-3 -rotate-25 ${
              size === "small" ? "text-xl" : "text-3xl"
            }`}
          >
            🔒
          </motion.div>
        )}
      </ClickEffect>
    );
  };
  const claimAvailable =
    rewards.classic[currentDay - 1]?.status === "available";
  return (
    <ClickEffect
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden"
    >
      <div
        className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-md border border-white/20 overflow-hidden max-w-lg w-full fade-in-animation-fast flex flex-col max-h-[70dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* === ШАПКА МОДАЛКИ === */}
        <div className="flex justify-between items-center px-8 py-4 border-b bg-white/1 backdrop-blur-lg border-white/10 shrink-0">
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

        {/* === КОНТЕНТ === */}
        <div className="overflow-y-auto overflow-x-hidden px-8  grow">
          {/* Надпись Неделя */}
          <div className="justify-center flex text-center w-full mt-4 mb-3">
            <div className="inline-block relative">
              <h1 className="absolute text-2xl font-bold tracking-wider text-blue-600/30 font-figtree-mulish px-8 transform translate-x-1 translate-y-1">
              {t("bonuses.week", { week: currentWeek })}
              </h1>
              <h1 className="relative text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 font-figtree-mulish px-8">
              {t("bonuses.week", { week: currentWeek })}
              </h1>
            </div>
          </div>

          {hasZenSubscription ? (
            <>
              {/* ZEN-подписка активна — отображаем только ZEN-блок */}
              {renderRewardGrid(rewards.zen, true)}
              <MenuButton
                onClick={onClaimReward}
                gradientClass="green-gradient"
                text={t("bonuses.claim")}
                textClasses="text-3xl"
                disabled={!claimAvailable}
                className={`w-full mt-8 py-3 px-6 rounded-xl mb-8 ${
                  claimAvailable ? "shimmer-effect" : ""
                } `}
              />
            </>
          ) : (
            <>
              {/* ZEN-подписка не активна — отображаем Classic + затемнённую ZEN */}
              {renderRewardGrid(rewards.classic)}
              <MenuButton
                onClick={onClaimReward}
                gradientClass="green-gradient"
                text={t("bonuses.claim")}
                textClasses="text-3xl"
                disabled={!claimAvailable}
                className={`w-full mt-8 py-3 px-6 rounded-xl ${
                  claimAvailable ? "shimmer-effect animate-" : ""
                } `}
              />
              {/* Реклама ZEN */}
              <div className="relative mt-8 pt-6 pb-8">
                {/* Градиентный фон на всю ширину модалки */}
                <div className="absolute inset-0 -mx-8  bg-gradient-to-br rounded-3xl from-[#ffe8b5]/10 via-[#ffd580]/10 to-[#f6c243]/10 backdrop-blur-md border-t border-b border-white/10 pointer-events-none" />

                {/* Контент поверх фона с внутренними отступами */}
                <div className="relative z-10 ">
                  <div className="text-center mb-6">
                    <div className=" flex flex-row items-center justify-center">

                    <h3 className="text-2xl font-bold text-yellow-300 drop-shadow-sm tracking-wide mb-2 font-figtree-mulish">
                    ZEN
                    </h3>
                    
                    </div>
                    <p className="text-md  text-yellow-100 font-figtree-mulish leading-relaxed">
                      Получай{" "}
                      <span className="text-white font-semibold">
                        в 2 раза больше
                      </span>{" "}
                      бонусов с подпиской{" "}
                      <span className="text-white font-semibold">ZEN</span>!
                    </p>
                  </div>

                  <div className="mb-6">
                    {renderRewardGrid(rewards.zen, true)}
                  </div>

                  <div className="text-center text-sm text-yellow-100 font-figtree-mulish mb-6 leading-relaxed">
                    Только с подпиской:{" "}
                    <span className="text-white font-semibold">Вихрь</span>,{" "}
                    <span className="text-white font-semibold">Бомба</span> и{" "}
                    <span className="text-white font-semibold">
                      Отмена хода
                    </span>
                    , +115 💠 в месяц!
                    <br />
                    <span className="text-white font-semibold">
                      Без рекламы
                    </span>
                    , доступ к{" "}
                    <span className="text-white font-semibold">ZEN-режиму</span>
                  </div>

                  <MenuButton
                    onClick={() => {}}
                    text="🔓 Оформить подписку ZEN"
                    innerShadows={false}
                    textClasses="text-black text-lg"
                    gradientClass=" from-yellow-400 via-amber-400 to-yellow-500"
                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r font-bold   transition-all  "
                  ></MenuButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ClickEffect>
  );
};
