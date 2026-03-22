import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className="relative flex items-center group w-fit"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-[100] px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white bg-slate-900/95 backdrop-blur-sm pointer-events-none whitespace-nowrap shadow-xl border border-white/10 ${getPositionClasses()}`}
          >
            {content}
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-slate-900/95 rotate-45 border-white/10 ${
              position === 'top' ? 'top-full -mt-1 left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'bottom-full -mb-1 left-1/2 -translate-x-1/2' :
              position === 'left' ? 'left-full -ml-1 top-1/2 -translate-y-1/2' :
              'right-full -mr-1 top-1/2 -translate-y-1/2'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
