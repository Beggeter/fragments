import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ExplosionFlashProps {
  isActive: boolean;
  centerX?: number;
  centerY?: number;
  onComplete?: () => void;
}

const ExplosionFlash: React.FC<ExplosionFlashProps> = ({
  isActive,
  centerX,
  centerY,
  onComplete,
}) => {
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowFlash(true);
      const timer = setTimeout(() => {
        setShowFlash(false);
        if (onComplete) onComplete();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!showFlash) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: [0, 0.8, 0.4, 0],
      }}
      transition={{ 
        duration: 0.15, 
        ease: "easeOut",
        times: [0, 0.02, 0.3, 1]
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: centerX !== undefined && centerY !== undefined 
          ? `radial-gradient(circle at ${centerX}px ${centerY}px, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 30%, rgba(255, 255, 255, 0.3) 60%, transparent 100%)`
          : "radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 30%, rgba(255, 255, 255, 0.3) 60%, transparent 100%)",
        pointerEvents: "none",
        zIndex: 1000,
        mixBlendMode: "screen",
      }}
    />
  );
};

export default ExplosionFlash; 