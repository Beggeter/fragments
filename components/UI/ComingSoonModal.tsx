import React, { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClickEffect from "../ClickEffect";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ComingSoonModal: FC<ComingSoonModalProps> = ({ isOpen, onClose }) => {
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
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-white/10"
          >
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <img
                  src="/stars.svg"
                  alt="Coming Soon"
                  className="w-10 h-10 opacity-90"
                />
              </div>
              
              {/* Title */}
              <h2 className="text-3xl font-bold text-white font-figtree">
                Coming Soon!
              </h2>
              
              {/* Description */}
              <p className="text-gray-300 text-lg font-figtree-mulish">
                Режим ZEN находится в разработке. Скоро будет доступен!
              </p>
              
              {/* Close Button */}
              <ClickEffect>
                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold py-4 rounded-2xl text-lg font-figtree-mulish transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Понятно
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