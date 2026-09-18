import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 
  | 'critical' 
  | 'high' 
  | 'medium' 
  | 'healthy' 
  | 'neutral' 
  | 'accent' 
  | 'subtle';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className,
  dot = false
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    critical: {
      bg: 'bg-[#D9383A]/12',
      text: 'text-[#C62828]',
      border: 'border-[#D9383A]/30',
      dotColor: 'bg-[#D9383A]'
    },
    high: {
      bg: 'bg-[#E07810]/12',
      text: 'text-[#C65D00]',
      border: 'border-[#E07810]/30',
      dotColor: 'bg-[#E07810]'
    },
    medium: {
      bg: 'bg-[#FFCF95]/40',
      text: 'text-[#9C5D10]',
      border: 'border-[#FFCF95]',
      dotColor: 'bg-[#D9822B]'
    },
    healthy: {
      bg: 'bg-[#1E9E4A]/12',
      text: 'text-[#167838]',
      border: 'border-[#1E9E4A]/30',
      dotColor: 'bg-[#1E9E4A]'
    },
    neutral: {
      bg: 'bg-[#F7E7CC]',
      text: 'text-[#333D6D]',
      border: 'border-[#EBD3BA]',
      dotColor: 'bg-[#333D6D]'
    },
    accent: {
      bg: 'bg-[#723EC3]/12',
      text: 'text-[#723EC3]',
      border: 'border-[#723EC3]/30',
      dotColor: 'bg-[#723EC3]'
    },
    subtle: {
      bg: 'bg-[#FFF0D9]',
      text: 'text-[#48537D]',
      border: 'border-[#EBD3BA]',
      dotColor: 'bg-[#7580AA]'
    }
  };

  const style = variantStyles[variant];
  const sizeStyle = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1.5 rounded-full font-mono-data font-semibold border select-none transition-all badge-3d",
          style.bg,
          style.text,
          style.border,
          sizeStyle,
          className
        )
      )}
    >
      {(dot || pulse) && (
        <span 
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            style.dotColor,
            pulse && "animate-pulse"
          )} 
        />
      )}
      <span>{children}</span>
    </span>
  );
};
