import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant = 'filled' | 'tinted' | 'bordered' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'filled',
  size = 'md',
  children,
  icon,
  iconRight,
  loading = false,
  className,
  disabled,
  ...props
}, ref) => {
  const baseStyles = 
    "relative inline-flex items-center justify-center font-medium select-none transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-void)] " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-[13px] rounded-[8px] gap-1.5",
    md: "h-9 px-4 text-[14px] rounded-[10px] gap-2 button-inner-highlight",
    lg: "h-11 px-5 text-[15px] rounded-[12px] gap-2.5 button-inner-highlight",
    icon: "h-9 w-9 p-0 rounded-[10px] items-center justify-center"
  };

  const variantStyles: Record<ButtonVariant, string> = {
    // Primary: 3D tactile button with top highlight and bottom bevel
    filled: 
      "btn-3d-primary",
    // Tinted: 3D secondary tactile button with Golden Peach tint
    tinted: 
      "btn-3d-secondary",
    // Bordered/Plain: 1px Slate Navy border, Dark Blue background, 3D hover lift
    bordered: 
      "border border-[#1D2D4A] bg-[#111C35] text-[#F8FAFC] shadow-[0_2px_6px_rgba(0,0,0,0.3)] hover:bg-[#162340] hover:border-[#38BDF8] hover:-translate-y-0.5 active:translate-y-0.5 transition-all",
    // Destructive: 3D tactile Crimson Red
    destructive: 
      "bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white border-t border-white/30 shadow-[0_3.5px_0_#991B1B,0_8px_16px_-2px_rgba(220,38,38,0.4)] hover:brightness-105 hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_0.5px_0_#991B1B] transition-all",
    // Ghost: Subtle Slate hover
    ghost: 
      "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 active:bg-white/15 transition-colors"
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      
      <span>{children}</span>

      {!loading && iconRight && (
        <span className="shrink-0 ml-1">{iconRight}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';
