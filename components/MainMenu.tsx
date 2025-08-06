// src/pages/New.tsx
import Image from "next/image";
import { FC, useEffect, useState } from "react";
import logo from "@/public/logo-frame.svg";
import infinity from "@/public/infinity.svg";
import cart from "@/public/cart.svg";
import powers from "@/public/powerups.svg";
import stars from "@/public/stars.svg";
import gift from "@/public/gift.svg";
import CrownIcon from "@/components/UI/CrownIcon";
import record from "@/public/record.png";
import MenuButton from "@/components/UI/MenuButton";
import BackgroundAnimation from "@/components/UI/BackgroundAnimation";
import ComingSoonModal from "@/components/UI/ComingSoonModal";
import { ZenAccessModal } from "@/components/UI/ZenAccessModal";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { DailyBonusModal } from "./DailyBonusModal";

interface MainMenuProps {
  onStartClassic: () => void;
  onStartZen?: () => void;
  onOpenShop: (initialTab?: string) => void;
  onOpenLeaderboard?: () => void;
}
interface BottomButtonsProps {
  onStartClassic: () => void;
  onStartZen?: () => void;
  onShowComingSoon: () => void;
  onShowZenAccessModal: () => void;
  onOpenShop: (initialTab?: string) => void;
  canAccessZen: boolean;
}

const MainMenu: FC<MainMenuProps> = ({
  onStartClassic,
  onStartZen,
  onOpenShop,
  onOpenLeaderboard,
}) => {
  const [fadeIn, setFadeIn] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showZenAccessModal, setShowZenAccessModal] = useState(false);
  const { user } = useUser();
  const { isAdmin } = useAdminAuth();
  const [showBonusModal, setShowBonusModal] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  // Проверяем доступ к Zen режиму
  const canAccessZen =
    isAdmin ||
    user?.role === "tester" ||
    user?.role === "admin" ||
    user?.role === "premium" ||
    !!user?.hasZenSubscription;

  return (
    <>
      <div
        className={`min-h-screen text-white fade-in-animation-fast
           flex flex-col py-10 relative z-1 overflow-y-hidden
            fade-in-menu ${fadeIn ? "fade-in-menu--visible" : ""}`}
        style={{
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        <BackgroundAnimation className="overflow-x-hidden absolute inset-0 px-4 -top-15" />
        <main 
          className="flex flex-col gap-[15vh] items-center"
          style={{
            WebkitTransform: "translateZ(0)",
            transform: "translateZ(0)",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          <TopButtons
            onOpenShop={onOpenShop}
            onOpenLeaderboard={onOpenLeaderboard}
            onOpenBonusModal={() => setShowBonusModal(true)}
          />
          <img
            src={logo.src}
            alt="FRAGMENTS"
            className="px-3 sm:px-10 max-w-[90vw] md:max-w-[30%] z-100"
            style={{
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
          />

          <BottomButtons
            onStartClassic={onStartClassic}
            onStartZen={onStartZen}
            onShowComingSoon={() => setShowComingSoon(true)}
            onShowZenAccessModal={() => setShowZenAccessModal(true)}
            onOpenShop={onOpenShop}
            canAccessZen={canAccessZen}
          />
        </main>
      </div>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
      />
      {/* ZEN Access Modal */}
      <ZenAccessModal
        isOpen={showZenAccessModal}
        onClose={() => setShowZenAccessModal(false)}
        onOpenShop={() => onOpenShop("zen")}
      />
      <DailyBonusModal
        isOpen={showBonusModal}
        onClose={() => setShowBonusModal(false)}
        onOpenShop={onOpenShop}
      />
    </>
  );
};

const TopButtons: FC<{
  onOpenShop: () => void;
  onOpenLeaderboard?: () => void;
  onOpenBonusModal?: () => void;
}> = ({ onOpenShop, onOpenLeaderboard, onOpenBonusModal }) => {
  return (
    <div
      className="flex flex-row justify-between items-start w-full z-100"
      style={{ paddingTop: "var(--tg-content-safe-area-inset-top, 0px)" }}
    >
      {/* Left side - Store */}
      <div className="flex flex-col  gap-6">
        {/* Store */}
        <MenuButton
          text={
            <>
              <span>Daily</span>
              <span>Bonus</span>
            </>
          }
          textClasses="font-bold leading-6 text-[1.7em] flex-1"
          gradientClass="orange-gradient"
          className="min-w-[36vw]   rounded-r-2xl menu-button-static shimmer-effect"
          onClick={onOpenBonusModal}
          leftIcon={gift}
          // notificationCount={1}
        />
        <MenuButton
          leftIcon={cart}
          rightIcon={powers}
          gradientClass="orange-gradient"
          className="min-w-[36vw]   rounded-r-2xl menu-button-static"
          onClick={onOpenShop}
        />
      </div>

      {/* Right side */}
      {onOpenLeaderboard && (
        <MenuButton
          leftIcon={record}
          gradientClass="orange-gradient"
          className="w-[25vw]  rounded-l-2xl menu-button-static"
          onClick={onOpenLeaderboard}
        />
      )}
    </div>
  );
};

const BottomButtons: FC<BottomButtonsProps> = ({
  onStartClassic,
  onStartZen,
  onShowComingSoon,
  onShowZenAccessModal,
  onOpenShop,
  canAccessZen,
}) => {
  return (
    <div className="flex flex-col gap-4 items-center w-full z-100">
      {canAccessZen ? (
        <MenuButton
          text="Zen"
          rightIcon={<CrownIcon className="h-[3rem] min-w-[3rem] drop-shadow-md" />}
          gradientClass="pink-gradient"
          className="rounded-3xl px-6 py-10 max-w-md w-[55vw] sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3"
          textClasses="font-black italic text-[2.3rem] text-lg"
          imageClasses="h-[3rem] min-w-[3rem] drop-shadow-md"
          onClick={onStartZen}
        />
      ) : (
        <MenuButton
          text="Zen"
          rightIcon={<CrownIcon className="h-[3rem] min-w-[3rem] drop-shadow-md" />}
          gradientClass="pink-gradient"
          className="rounded-3xl px-6 py-10 max-w-md w-[55vw] sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3"
          textClasses="font-black italic text-[2.3rem] text-lg"
          imageClasses="h-[3rem] min-w-[3rem] drop-shadow-md"
          onClick={onShowZenAccessModal}
        />
      )}
      <MenuButton
        text="Classic"
        rightIcon={infinity}
        gradientClass="green-gradient"
        className="rounded-3xl px-6 py-10 max-w-md w-[55vw] sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3"
        textClasses="font-black italic text-[2.3rem] text-lg"
        imageClasses="h-[2rem] min-w-[3rem] drop-shadow-md"
        onClick={onStartClassic}
      />
    </div>
  );
};

export default MainMenu;
