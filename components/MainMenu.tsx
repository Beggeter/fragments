// src/pages/New.tsx
import Image from "next/image";
import { FC, useEffect, useState } from "react";
import logo from "@/public/logo-frame.svg";
import bullseye from "@/public/bullseye.svg";
import infinity from "@/public/infinity.svg";
import cart from "@/public/cart.svg";
import powers from "@/public/powerups.svg";
import settings from "@/public/settings.svg";
import stars from "@/public/stars.svg";
import record from "@/public/record.png";
import MenuButton from "@/components/UI/MenuButton";
import BackgroundAnimation from "@/components/UI/BackgroundAnimation";
import ComingSoonModal from "@/components/UI/ComingSoonModal";

interface MainMenuProps {
  onStartClassic: () => void;
  onOpenShop: () => void;
  onOpenLeaderboard?: () => void;
}
interface BottomButtonsProps {
  onStartClassic: () => void;
  onShowComingSoon: () => void;
}
const MainMenu: FC<MainMenuProps> = ({ onStartClassic, onOpenShop, onOpenLeaderboard }) => {
  const [fadeIn, setFadeIn] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <>
      <div
        className={`min-h-screen menu-bg text-white fade-in-animation-fast
           flex flex-col py-10 relative z-1 overflow-y-hidden
            fade-in-menu${fadeIn ? "fade-in-menu--visible" : ""}`}
      >
        <BackgroundAnimation className="overflow-x-hidden absolute inset-0 px-4 -top-15" />
        


        <main className="flex flex-col gap-[15vh] items-center">
          <TopButtons onOpenShop={onOpenShop} onOpenLeaderboard={onOpenLeaderboard} />
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
            onShowComingSoon={() => setShowComingSoon(true)}
          />
        </main>
      </div>
      
      {/* Coming Soon Modal */}
      <ComingSoonModal 
        isOpen={showComingSoon} 
        onClose={() => setShowComingSoon(false)} 
      />
    </>
  );
};

const TopButtons: FC<{ onOpenShop: () => void; onOpenLeaderboard?: () => void }> = ({ onOpenShop, onOpenLeaderboard }) => {
  return (
    <div className="flex flex-row justify-between items-start w-full z-100" style={{ paddingTop: 'var(--tg-content-safe-area-inset-top, 0px)' }}>
      {/* Left side - Daily Missions and Store stacked vertically */}
      <div className="flex flex-col gap-4">
        {/* Daily Missions */}
        <MenuButton
          leftIcon={bullseye}
          text={
            <>
              <span>Daily</span>
              <span>Missions</span>
            </>
          }
          gradientClass="orange-gradient"
          notificationCount={2}
          className="w-[35vw] sm:w-1/2 md:w-1/3 max-w-3xs rounded-r-2xl menu-button-static"
          textClasses="font-bold leading-6 text-[1.7em]"
        />
        
        {/* Store */}
        <MenuButton
          leftIcon={cart}
          rightIcon={powers}
          gradientClass="orange-gradient"
          className="w-[35vw] sm:w-1/2 md:w-1/3 max-w-3xs rounded-r-2xl menu-button-static"
          onClick={onOpenShop}
        />
      </div>

      {/* Right side - Leaderboard */}
      {onOpenLeaderboard ? (
        <MenuButton
          leftIcon={record}
          gradientClass="orange-gradient"
          className="w-[30vw] sm:w-2/5 md:w-1/4 max-w-2xs rounded-l-2xl menu-button-static"
          onClick={onOpenLeaderboard}
        />
      ) : (
        <div className="w-[30vw] sm:w-2/5 md:w-1/4 max-w-2xs" />
      )}
    </div>
  );
};

const BottomButtons: FC<BottomButtonsProps> = ({ onStartClassic, onShowComingSoon }) => {
  return (
    <div className="flex flex-col gap-4 items-center w-full z-100">
      <MenuButton
        text="Classic"
        rightIcon={infinity}
        gradientClass="green-gradient"
        className="rounded-3xl px-6 py-10 max-w-md w-[55vw] sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3"
        textClasses="font-black italic text-[2.3rem] text-lg"
        imageClasses="h-[2rem] min-w-[3rem] menu-shadow"
        onClick={onStartClassic}
      />
      <MenuButton
        text="Zen"
        rightIcon={stars}
        gradientClass="gray-gradient-disabled"
        className="rounded-3xl px-6 py-10 max-w-md w-[55vw] sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 opacity-70"
        textClasses="font-black italic text-[2.3rem] text-lg opacity-70"
        imageClasses="h-[3rem] min-w-[3rem] opacity-70"
        onClick={onShowComingSoon}
      />
    </div>
  );
};

export default MainMenu;
