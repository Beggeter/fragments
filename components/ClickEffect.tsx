import React from "react";
import { playClick, playSound } from "@/lib/utils/sound";
import { vibrate } from "@/utils/helpers";
import { useSettingsStore } from "@/lib/state/settings";

interface ClickEffectProps {
  children: React.ReactNode;
  onClick?: (e: any) => void;
  sound?: string;
  vibrateValue?: number | number[];
  className?: string;
  [key: string]: any;
}

const ClickEffect: React.FC<ClickEffectProps> = ({
  children,
  onClick,
  sound = '/audio/click.wav',
  vibrateValue,
  className = "",
  ...rest
}) => {
  const vibration = useSettingsStore((s) => s.vibrationValue);
  const handleClick = (e: any) => {
    vibrate(typeof vibrateValue !== "undefined" ? vibrateValue : vibration);
    playClick()
    onClick?.(e);
  };
  return (
    <div {...rest} className={className} onClick={handleClick} tabIndex={0} role="button" style={{cursor: 'pointer', ...rest.style}}>
      {children}
    </div>
  );
};

export default ClickEffect; 