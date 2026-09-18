import React, { useState } from 'react';
import { 
  Grid, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  TrendingUp,
  Info 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

export const WorkloadHeatmap: React.FC = () => {
  const { employees, selectedRegion, optimizeAll } = useNexusStore();
  const [bandFilter, setBandFilter] = useState<'All' | 'Overloaded' | 'Optimal' | 'Underutilized'>('All');

  const filteredEmployees = employees.filter(e => {
    if (selectedRegion !== 'All' && e.region !== selectedRegion) return false;
    if (bandFilter === 'Overloaded' && e.utilization_pct <= 85) return false;
    if (bandFilter === 'Optimal' && (e.utilization_pct < 65 || e.utilization_pct > 85)) return false;
    if (bandFilter === 'Underutilized' && e.utilization_pct >= 65) return false;
    return true;
  });

  const overloadedCount = employees.filter(e => e.utilization_pct > 85).length;
  const optimalCount = employees.filter(e => e.utilization_pct >= 65 && e.utilization_pct <= 85).length;
  const underutilizedCount = employees.filter(e => e.utilization_pct < 65).length;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getHeatmapColor = (pct: number) => {
    if (pct > 92) return 'bg-[#FF453A] text-white';
    if (pct > 85) return 'bg-[#FF9F0A] text-black font-semibold';
    if (pct >= 65) return 'bg-[#30D158]/80 text-black font-semibold';
    return 'bg-[var(--accent)]/40 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Continuous Capacity & Burnout Radar
            </span>
            <Badge variant="neutral">{filteredEmployees.length} Staff Monitored</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Workload Heatmap & Enterprise Capacity Bands
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Maintains workforce health within the target 65%–85% optimal allocation envelope.
          </p>
        </div>

        <Button
          variant="filled"
          size="md"
          icon={<Zap size={14} />}
          onClick={() => optimizeAll()}
        >
          Auto-Rebalance Overloaded Pods
        </Button>
      </div>

      {/* Generated Recommendation Line */}
      <div className="p-3.5 rounded-[12px] bg-[rgba(10,132,255,0.08)] border border-[var(--accent)]/20 flex items-start gap-3">
        <Info size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-primary)] leading-relaxed">
          <strong>Autonomous Rebalancing Advisory:</strong> {employees.length === 0 ? (
            'No workforce members are currently registered in Supabase. Capacity telemetry and pod rebalancing advisories will generate live upon employee ingestion.'
          ) : (
            `${overloadedCount} engineers are currently operating beyond safe sustainable thresholds (>85% utilization), while ${underutilizedCount} engineers hold surge capacity headroom. Autonomous rebalancing can recover ${(overloadedCount * 4).toFixed(1)} hours of buffer capacity in critical pods.`
          )}
        </p>
      </div>

      {/* 3 Capacity Band Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setBandFilter(bandFilter === 'Overloaded' ? 'All' : 'Overloaded')}
          className={`p-4 rounded-[12px] border cursor-pointer transition-all ${
            bandFilter === 'Overloaded'
              ? 'bg-[#FF453A]/15 border-[#FF453A]'
              : 'bg-[var(--bg-elevated)] border-[var(--hairline)] hover:border-[#FF453A]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-[#FF453A] font-mono-data">
              Overloaded (&gt;85%)
            </span>
            <AlertTriangle size={15} className="text-[#FF453A]" />
          </div>
          <div className="text-2xl font-bold font-mono-data text-white">{overloadedCount} Engineers</div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">High burnout risk; vulnerable to SLA slippage</p>
        </div>

        <div 
          onClick={() => setBandFilter(bandFilter === 'Optimal' ? 'All' : 'Optimal')}
          className={`p-4 rounded-[12px] border cursor-pointer transition-all ${
            bandFilter === 'Optimal'
              ? 'bg-[#30D158]/15 border-[#30D158]'
              : 'bg-[var(--bg-elevated)] border-[var(--hairline)] hover:border-[#30D158]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-[#30D158] font-mono-data">
              Optimal Band (65%–85%)
            </span>
            <CheckCircle2 size={15} className="text-[#30D158]" />
          </div>
          <div className="text-2xl font-bold font-mono-data text-white">{optimalCount} Engineers</div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Target operational baseline; high throughput</p>
        </div>

        <div 
          onClick={() => setBandFilter(bandFilter === 'Underutilized' ? 'All' : 'Underutilized')}
          className={`p-4 rounded-[12px] border cursor-pointer transition-all ${
            bandFilter === 'Underutilized'
              ? 'bg-[var(--accent)]/15 border-[var(--accent)]'
              : 'bg-[var(--bg-elevated)] border-[var(--hairline)] hover:border-[var(--accent)]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-[var(--accent)] font-mono-data">
              Underutilized (&lt;65%)
            </span>
            <Zap size={15} className="text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-bold font-mono-data text-white">{underutilizedCount} Engineers</div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Available buffer headroom for surge assignments</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-[var(--hairline)] bg-[var(--bg-panel)] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
            Weekly 7-Day Shift Workload Projection
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono-data">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[var(--accent)]/40" /> &lt;65%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#30D158]/80" /> 65-85%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#FF9F0A]" /> 85-92%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#FF453A]" /> &gt;92%</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[var(--text-secondary)] font-mono-data bg-[var(--bg-panel)]/50">
                <th className="py-2.5 px-4 font-medium">Engineer</th>
                <th className="py-2.5 px-3 font-medium">Region</th>
                <th className="py-2.5 px-3 font-medium">Avg Util</th>
                {days.map(d => (
                  <th key={d} className="py-2.5 px-2 text-center font-medium">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[var(--text-tertiary)]">
                    <Grid size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-white/70">0 Engineers Monitored</p>
                    <p className="text-[11px] mt-0.5">Heatmap schedule is currently empty pending Supabase records.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.slice(0, 30).map((emp) => (
                <tr key={emp.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-white">{emp.name}</div>
                    <div className="text-[10px] font-mono-data text-[var(--text-tertiary)]">{emp.id}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono-data text-[var(--text-secondary)]">
                    {emp.region}
                  </td>
                  <td className="py-2.5 px-3 font-mono-data font-bold">
                    <span className={emp.utilization_pct > 85 ? 'text-[#FF453A]' : emp.utilization_pct < 65 ? 'text-[var(--accent)]' : 'text-[#30D158]'}>
                      {emp.utilization_pct}%
                    </span>
                  </td>
                  {days.map((d, i) => {
                    // Slight variation around base utilization
                    const variance = ((emp.id.charCodeAt(emp.id.length - 1) * (i + 1)) % 15) - 7;
                    const dayUtil = Math.min(100, Math.max(20, emp.utilization_pct + (i >= 5 ? -35 : variance)));
                    return (
                      <td key={d} className="py-2.5 px-2 text-center">
                        <span className={`inline-block w-8 py-1 rounded-[4px] text-[10px] font-mono-data ${getHeatmapColor(dayUtil)}`}>
                          {dayUtil}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
