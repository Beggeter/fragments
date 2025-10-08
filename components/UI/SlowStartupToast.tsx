"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

interface SlowStartupToastProps {
  active: boolean;
}

export const SlowStartupToast: React.FC<SlowStartupToastProps> = ({ active }) => {
  return (
    <div
      className="pointer-events-none fixed left-0 bottom-0 z-[4000] flex justify-start pl-5 pb-5"
      style={{
        paddingBottom: `calc(var(--tg-content-safe-area-inset-bottom, 0px) + 20px)`,
        paddingLeft: `calc(var(--tg-content-safe-area-inset-left, 0px) + 20px)`,
      }}
    >
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="pointer-events-auto relative flex h-[56px] w-[56px] items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <div className="relative h-9 w-9">
              <span className="absolute bottom-1 left-1 h-5 w-5 rounded-full border border-cyan-300/80 shadow-[0_0_12px_rgba(34,211,238,0.65)]" />
              <span className="absolute bottom-1 left-1 h-5 w-5 rounded-full border border-cyan-200/40 animate-ping" />
              <span className="absolute bottom-1 left-1 h-5 w-5 rounded-full bg-cyan-300/30 blur-[4px]" />
              <span className="sr-only">Загрузка</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
