import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface TrafficLightProps {
  isAIOptimizing: boolean;
  className?: string;
}

export const TrafficLight: React.FC<TrafficLightProps> = ({ isAIOptimizing, className }) => {
  return (
    <div className={clsx("flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--bg-void)]/60 border border-[var(--hairline)]", className)}>
      {/* 3-dot cluster callback */}
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#FF5F56] opacity-60" />
        <span className="w-2 h-2 rounded-full bg-[#FFBD2E] opacity-60" />
        <span 
          className={clsx(
            "w-2.5 h-2.5 rounded-full transition-all duration-300",
            isAIOptimizing ? "bg-[var(--accent-glow)] animate-ping" : "bg-[var(--status-healthy)] shadow-[0_0_8px_rgba(48,209,88,0.6)]"
          )} 
        />
      </div>

      {/* Repurposed Status Label */}
      <div className="flex items-center gap-1.5 text-xs font-mono-data tracking-wide uppercase">
        <span className={clsx(isAIOptimizing ? "text-[var(--accent-glow)]" : "text-[var(--status-healthy)]")}>
          {isAIOptimizing ? 'AI OPTIMIZING' : 'ONLINE'}
        </span>
        {isAIOptimizing && (
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent-glow)] inline-block"
          />
        )}
      </div>
    </div>
  );
};
