"use client";

import React, { forwardRef } from "react";

type KitButtonVariant = "primary" | "success" | "zen" | "outline" | "ghost";
type KitButtonSize = "sm" | "md" | "lg";

export interface KitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: KitButtonVariant;
  size?: KitButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClassMap: Record<KitButtonVariant, string> = {
  primary: "kit-button--primary",
  success: "kit-button--success",
  zen: "kit-button--zen",
  outline: "kit-button--outline",
  ghost: "kit-button--ghost",
};

const sizeClassMap: Record<KitButtonSize, string> = {
  sm: "kit-button--sm",
  md: "kit-button--md",
  lg: "kit-button--lg",
};

const iconSizeClassMap: Record<KitButtonSize, string> = {
  sm: "kit-button__icon kit-button__icon--sm",
  md: "kit-button__icon",
  lg: "kit-button__icon kit-button__icon--lg",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const KitButton = forwardRef<HTMLButtonElement, KitButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      className,
      leadingIcon,
      trailingIcon,
      loading = false,
      disabled,
      fullWidth = false,
      type = "button",
      ...rest
    },
    ref
  ) => {
    const classes = cx(
      "kit-button",
      variantClassMap[variant],
      sizeClassMap[size],
      fullWidth && "kit-button--full",
      loading && "kit-button--loading",
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading && <span className="kit-button__spinner" aria-hidden="true" />}

        {leadingIcon && (
          <span className={iconSizeClassMap[size]} aria-hidden="true">
            {leadingIcon}
          </span>
        )}

        <span className="kit-button__label">{children}</span>

        {trailingIcon && (
          <span className={iconSizeClassMap[size]} aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </button>
    );
  }
);

KitButton.displayName = "KitButton";

export default KitButton;
