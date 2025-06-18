// src/pages/New.tsx
import Image from "next/image";
import { FC } from "react";
import logo from "@/public/logo-frame.svg";
import bullseye from "@/public/bullseye.svg";
import infinity from "@/public/infinity.svg";
import cart from "@/public/cart.svg";
import powers from "@/public/powerups.svg";
import settings from "@/public/settings.svg";
import stars from "@/public/stars.svg";
import MenuButton from "@/components/UI/MenuButton";
import BackgroundAnimation from "@/components/UI/BackgroundAnimation";

interface MainMenuProps {
  onStartClassic: () => void;
}
interface BottomButtonsProps {
  onStartClassic: () => void;
}
const MainMenu: FC<MainMenuProps> = ({ onStartClassic }) => {
  return (
    <>
      <div
        className="min-h-screen  menu-bg text-white
     flex flex-col  py-10 relative z-1 overflow-y-hidden"
      >
        <BackgroundAnimation className="absolute inset-0 -top-15 overflow-x-hidden px-4 " />
        <span className="absolute top-4 right-4 text-3xl menu-shadow">
          <Image src={settings} alt="settings" className="w-10 h-10  " />
        </span>
        <main className="flex flex-col gap-[15vh] items-center">
          <TopButtons />
          <Image
            src={logo}
            alt="FRAGMENTS"
            className="px-3 sm:px-10 max-w-[90vw] md:max-w-[30%]  z-100"
          />
          <BottomButtons onStartClassic={onStartClassic} />
        </main>
      </div>
    </>
  );
};

const TopButtons: FC = () => {
  return (
    <div className="flex flex-col gap-4 w-full z-100">
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
        className="w-[45vw] sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 max-w-2xs rounded-r-2xl"
        textClasses="font-bold leading-6 text-[1.7em]"
      />

      {/* Store  */}
      <MenuButton
        leftIcon={cart}
        rightIcon={powers}
        gradientClass="orange-gradient"
        className="w-[35vw] sm:w-1/2 md:w-1/3 max-w-3xs rounded-r-2xl"
      />
    </div>
  );
};

const BottomButtons: FC<BottomButtonsProps> = ({ onStartClassic }) => {
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
        gradientClass="red-gradient"
        className="rounded-3xl px-6 py-2 w-[45vw] sm:w-1/2 md:w-1/3 max-w-xs"
        textClasses="font-black italic text-[2.3rem] text-lg"
        imageClasses="h-[3rem] min-w-[3rem]"
      />
    </div>
  );
};

export default MainMenu;
