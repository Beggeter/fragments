import React, { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClickEffect from "../ClickEffect";
import { useTranslation } from "react-i18next";

interface ComingSoonModalProps {
  isOpen?: boolean;
  onClose: () => void;
  feature?: string;
}

const ComingSoonModal: FC<ComingSoonModalProps> = ({ isOpen = true, onClose, feature = "ZEN режим" }) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative fade-in-animation-fast bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4"
          >
                          {/* Close Button */}
              <ClickEffect>
                <button
                  className="absolute top-4 right-6 text-5xl z-2 text-white hover:text-gray-300"
                  onClick={onClose}
                  aria-label={t("coming_soon.close")}
                >
                  ×
                </button>
              </ClickEffect>

              <div className="text-center space-y-6">
                {/* Icon */}
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-400/20 to-orange-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-orange-400/30">
                  <img
                    src="/stars.svg"
                    alt="Coming Soon"
                    className="w-12 h-12 opacity-90 drop-shadow-lg"
                  />
                </div>
                
                {/* Title */}
                <h2 className="text-4xl font-bold text-white font-figtree-mulish menu-shadow">
                  Coming Soon!
                </h2>
                
                {/* Description */}
                <p className="text-white/80 text-lg font-figtree-mulish leading-relaxed">
                  {feature} {t("coming_soon.description")}
                </p>
                
                {/* Close Button */}
                <ClickEffect>
                  <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-4 rounded-2xl text-xl font-figtree-mulish transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:from-orange-500 hover:to-orange-600"
                  >
                    {t("coming_soon.understood")}
                  </button>
                </ClickEffect>
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComingSoonModal; 