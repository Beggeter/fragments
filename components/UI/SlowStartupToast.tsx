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
            className="pointer-events-auto w-[min(92%,340px)] rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-lg"
          >
            <div className="flex items-start gap-4">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <span className="absolute bottom-1 left-1 h-6 w-6 rounded-full border border-cyan-300/90 shadow-[0_0_14px_rgba(34,211,238,0.65)]" />
                <span className="absolute bottom-1 left-1 h-6 w-6 rounded-full bg-cyan-300/50 blur-sm animate-pulse" />
                <span className="absolute bottom-1 left-1 h-6 w-6 rounded-full border border-white/30" />
                <span className="sr-only">Загрузка</span>
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold tracking-wide">{title}</span>
                <p className="mt-2 text-xs leading-relaxed text-white/80">{description}</p>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="mt-3 text-xs text-cyan-200 transition hover:text-white"
                  >
                    Скрыть
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
