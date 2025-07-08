import React, { FC, ReactNode } from "react";
import Image, { StaticImageData } from "next/image";
import { vibrate } from "@/utils/helpers";
import { useSettingsStore } from "@/lib/state/settings";

interface SettingsButtonProps {
  text?: string | ReactNode;
  leftIcon?: StaticImageData | string;
  gradientClass?: string;
  className?: string;
  onClick?: () => void;
  textClasses?: string;
  imageClasses?: string;
}

const SettingsButton: FC<SettingsButtonProps> = ({
  text,
  leftIcon,
  gradientClass = "settings-gradient",
  className = "",
  onClick,
  textClasses = "",
  imageClasses = "",
}) => {
  // Функция для определения, является ли иконка SVG
  const isSvg = (icon: StaticImageData | string) => {
    if (typeof icon === "string") {
      return icon.includes(".svg");
    }
    return icon.src.includes(".svg");
  };
  
  const vibration = useSettingsStore((state) => state.vibrationValue);
  const handleClick = () => {
    vibrate(vibration)
    onClick?.()
  }

  // Компонент для отображения изображения с поддержкой iOS
  const ImageComponent = ({
    icon,
    alt,
    className,
  }: {
    icon: StaticImageData | string;
    alt: string;
    className?: string;
  }) => {
    if (isSvg(icon)) {
      // Для SVG используем обычный img тег на iOS
      const src = typeof icon === "string" ? icon : icon.src;
      return (
        <img
          src={src}
          alt={alt}
          className={className || "w-auto h-full object-contain max-h-[6vh]"}
          style={{
            WebkitTransform: "translateZ(0)",
            transform: "translateZ(0)",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        />
      );
    }

    // Для других форматов используем Next.js Image
    return (
      <Image
        src={icon}
        alt={alt}
        width={48}
        height={48}
        className={className || "w-auto h-full object-contain max-h-[6vh]"}
        unoptimized={true}
        priority={true}
      />
    );
  };

  return (
    <button
      className={`menu-button ${gradientClass} ${className} `}
      onClick={handleClick}
    >
      <span className="flex flex-row items-center gap-2 w-full justify-start">
        {/* Левая иконка */}
        {leftIcon && (
          <span className="menu-shadow flex items-center justify-center h-[2rem] min-w-[3rem]">
            <ImageComponent icon={leftIcon} alt="left icon" />
          </span>
        )}

        {/* Текст или содержимое */}
        {text && (
          <span
            className={`${textClasses} flex flex-col text-[1.4rem] items-start justify-center text-white font-figtree-mulish menu-shadow min-h-[44px]`}
          >
            {text}
          </span>
        )}
      </span>
    </button>
  );
};

export default SettingsButton; 