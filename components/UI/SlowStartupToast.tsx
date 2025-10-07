"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

interface SlowStartupToastProps {
  active: boolean;
  title: string;
  description: string;
  onDismiss?: () => void;
}

export const SlowStartupToast: React.FC<SlowStartupToastProps> = ({
  active,
  title,
  description,
  onDismiss,
}) => {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[4000] flex justify-center pt-6">
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="pointer-events-auto w-[min(90%,320px)] rounded-xl bg-black/85 px-5 py-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />
              <span className="text-sm font-semibold">{title}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/80">{description}</p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="mt-3 text-xs text-white/70 transition hover:text-white"
              >
                Скрыть
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
