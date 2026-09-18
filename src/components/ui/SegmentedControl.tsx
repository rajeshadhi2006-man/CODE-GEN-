import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className
}: SegmentedControlProps<T>) {
  const sizeClasses = size === 'sm' ? 'p-0.5 text-xs' : 'p-1 text-[13px]';
  const itemClasses = size === 'sm' ? 'px-2.5 py-1' : 'px-3.5 py-1.5';

  return (
    <div 
      className={twMerge(
        clsx(
          "inline-flex items-center bg-[var(--bg-panel)] border border-[var(--hairline)] rounded-full select-none relative shadow-[inset_0_1.5px_3px_rgba(51,61,109,0.06)]",
          sizeClasses,
          className
        )
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              "relative z-10 font-semibold rounded-full transition-all flex items-center gap-1.5 focus:outline-none",
              itemClasses,
              isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="segmented-thumb"
                className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] to-[#FFFDF9] border border-[var(--hairline-strong)] rounded-full shadow-[0_2px_6px_rgba(51,61,109,0.12),inset_0_1px_0_rgba(255,255,255,1)] z-[-1]"
                transition={{ type: "spring", stiffness: 480, damping: 32 }}
              />
            )}
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span className={clsx(
                "ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono-data font-bold badge-3d",
                isSelected ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              )}>
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
