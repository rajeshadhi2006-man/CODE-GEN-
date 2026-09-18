import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: string;
    positive: boolean;
    period?: string;
  };
  sparklineData?: number[];
  variant?: 'default' | 'critical' | 'warning' | 'healthy' | 'accent';
  onClick?: () => void;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  delta,
  sparklineData,
  variant = 'default',
  onClick,
  subtitle,
  icon
}) => {
  const width = 100;
  const height = 32;
  const hasSparkline = sparklineData && sparklineData.length > 0;
  
  let points = '';
  let lastY = height / 2;

  if (hasSparkline) {
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;

    if (sparklineData.length === 1) {
      points = `0,${height / 2} ${width},${height / 2}`;
      lastY = height / 2;
    } else {
      points = sparklineData.map((d, i) => {
        const x = (i / (sparklineData.length - 1)) * width;
        const y = height - ((d - min) / range) * (height - 8) - 4;
        return `${x},${y}`;
      }).join(' ');
      const lastVal = sparklineData[sparklineData.length - 1];
      lastY = height - ((lastVal - min) / range) * (height - 8) - 4;
    }
  }

  const strokeColors: Record<string, { stroke: string; glow: string }> = {
    default: { stroke: '#723EC3', glow: 'rgba(114, 62, 195, 0.18)' },
    critical: { stroke: '#D9383A', glow: 'rgba(217, 56, 58, 0.20)' },
    warning: { stroke: '#E07810', glow: 'rgba(224, 120, 16, 0.20)' },
    healthy: { stroke: '#1E9E4A', glow: 'rgba(30, 158, 74, 0.20)' },
    accent: { stroke: '#D9822B', glow: 'rgba(255, 207, 149, 0.35)' }
  };

  const currentTheme = strokeColors[variant] || strokeColors.default;
  const stroke = currentTheme.stroke;
  const gradientId = `sparkline-grad-${title.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Build area polygon for 3D fill
  const areaPoints = points ? `0,${height} ${points} ${width},${height}` : '';

  return (
    <motion.div
      whileHover={onClick ? { y: -3.5, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={clsx(
        "relative p-4 rounded-[16px] card-3d flex flex-col justify-between overflow-hidden group select-none",
        onClick && "cursor-pointer"
      )}
    >
      {/* Top row: Section label & Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
          {title}
        </span>
        {icon && (
          <span className="text-[var(--text-tertiary)] group-hover:text-[var(--accent)] group-hover:scale-110 transition-all">
            {icon}
          </span>
        )}
      </div>

      {/* Middle row: Hero KPI Number & Sparkline */}
      <div className="flex items-end justify-between gap-3 my-1.5">
        <div className="text-[32px] font-extrabold tracking-tight text-[var(--text-primary)] font-mono-data leading-none drop-shadow-[0_1px_1px_rgba(51,61,109,0.08)]">
          {value}
        </div>

        {/* Real-time Dynamic Sparkline with 3D Depth Glow */}
        <div className="w-24 h-9 shrink-0 pb-1 flex items-center justify-end">
          {hasSparkline ? (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon
                points={areaPoints}
                fill={`url(#${gradientId})`}
              />
              <polyline
                fill="none"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              <circle
                cx={width}
                cy={lastY}
                r="3.5"
                fill={stroke}
                className="animate-pulse"
              />
            </svg>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-mono-data text-[var(--text-tertiary)] bg-[var(--bg-panel)] px-2.5 py-0.5 rounded-full border border-[var(--hairline)] badge-3d">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E9E4A] animate-pulse" />
              <span className="font-semibold text-[var(--text-secondary)]">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Delta & Subtitle */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--hairline)] text-[11px]">
        {delta ? (
          <div className="flex items-center gap-1 font-mono-data">
            <span className={clsx("flex items-center gap-0.5 font-semibold", delta.positive ? "text-[#1E9E4A]" : "text-[#D9383A]")}>
              {delta.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {delta.value}
            </span>
            <span className="text-[var(--text-tertiary)]">vs prior period</span>
          </div>
        ) : subtitle ? (
          <span className="text-[var(--text-tertiary)] truncate">{subtitle}</span>
        ) : (
          <span className="text-[var(--text-tertiary)]">Real-time telemetry</span>
        )}

        {onClick && (
          <span className="text-[10px] font-semibold text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
            View Scope →
          </span>
        )}
      </div>
    </motion.div>
  );
};
