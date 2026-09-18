import React from 'react';
import { 
  Globe2, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

import { calculateSLARisk } from '../../../engine/sla';

export const GlobalWorkforceMap: React.FC = () => {
  const { employees, tasks, selectedRegion, setSelectedRegion, setActiveTab, currentTimestamp } = useNexusStore();

  const regionConfigs: { id: string; name: string; latLng: string; timezone: string }[] = [
    {
      id: 'Americas',
      name: 'North America Delivery Hub (New York / Austin)',
      latLng: '40.7128° N, 74.0060° W',
      timezone: 'UTC-5'
    },
    {
      id: 'EMEA',
      name: 'EMEA Technology Center (London / Frankfurt)',
      latLng: '51.5074° N, 0.1278° W',
      timezone: 'UTC+0'
    },
    {
      id: 'APAC',
      name: 'Asia-Pacific Core Operations (Singapore / Sydney)',
      latLng: '1.3521° N, 103.8198° E',
      timezone: 'UTC+8'
    },
    {
      id: 'South Asia',
      name: 'South Asia Cloud Engineering Pod (Bengaluru)',
      latLng: '12.9716° N, 77.5946° E',
      timezone: 'UTC+5:30'
    },
    {
      id: 'LATAM',
      name: 'LATAM Cloud Center of Excellence (São Paulo)',
      latLng: '23.5505° S, 46.6333° W',
      timezone: 'UTC-3'
    }
  ];

  const regions = regionConfigs.map(cfg => {
    const regEmps = employees.filter(e => e.region === cfg.id);
    const regTasks = tasks.filter(t => {
      const emp = employees.find(e => e.id === t.assigned_employee_id);
      return emp?.region === cfg.id;
    });

    const utilization = regEmps.length > 0 
      ? Math.round(regEmps.reduce((acc, e) => acc + e.utilization_pct, 0) / regEmps.length) 
      : 0;

    const atRisk = regTasks.filter(t => {
      const emp = employees.find(e => e.id === t.assigned_employee_id);
      const risk = calculateSLARisk(t, emp, currentTimestamp);
      return risk.risk_tier === 'Critical' || risk.risk_tier === 'High' || t.status === 'AtRisk';
    }).length;

    return {
      ...cfg,
      headcount: regEmps.length,
      utilization,
      activeTasks: regTasks.length,
      atRisk
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Global Operations Map
            </span>
            <Badge variant="accent">5 Continental NOC Pods</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Distributed Regional Workforce Telemetry & Geographic Scope
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Click any regional pod to isolate global workforce view or trigger cross-region load handover.
          </p>
        </div>

        {selectedRegion !== 'All' && (
          <Button variant="bordered" size="sm" onClick={() => setSelectedRegion('All')}>
            Reset Global Scope (All)
          </Button>
        )}
      </div>

      {/* Regional Pod Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {regions.map((r) => {
          const isSelected = selectedRegion === r.id;

          return (
            <div
              key={r.id}
              onClick={() => setSelectedRegion(isSelected ? 'All' : r.id)}
              className={`p-5 rounded-[14px] border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-[rgba(10,132,255,0.14)] border-[var(--accent)] shadow-xl'
                  : 'bg-[var(--bg-elevated)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-data text-xs text-[var(--text-tertiary)]">{r.timezone}</span>
                  <Badge 
                    variant={r.atRisk > 2 ? 'critical' : r.atRisk > 0 ? 'high' : r.headcount > 0 ? 'healthy' : 'neutral'}
                    size="sm"
                  >
                    {r.atRisk > 0 ? `${r.atRisk} At-Risk` : r.headcount > 0 ? 'All Green' : '0 Active'}
                  </Badge>
                </div>

                <h3 className="text-base font-semibold text-white mb-1">
                  {r.id}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                  {r.name}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono-data pt-3 border-t border-[var(--hairline)]">
                <div className="p-2 rounded-[8px] bg-[var(--bg-panel)]">
                  <span className="text-[9px] text-[var(--text-tertiary)] uppercase block">Headcount</span>
                  <span className="text-sm font-bold text-white">{r.headcount}</span>
                </div>
                <div className="p-2 rounded-[8px] bg-[var(--bg-panel)]">
                  <span className="text-[9px] text-[var(--text-tertiary)] uppercase block">Utilization</span>
                  <span className={`text-sm font-bold ${r.utilization > 85 ? 'text-[#FF9F0A]' : 'text-[#30D158]'}`}>
                    {r.utilization}%
                  </span>
                </div>
                <div className="p-2 rounded-[8px] bg-[var(--bg-panel)]">
                  <span className="text-[9px] text-[var(--text-tertiary)] uppercase block">Tasks</span>
                  <span className="text-sm font-bold text-white">{r.activeTasks}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] font-mono-data">
                <span>{r.latLng}</span>
                <span className="text-[var(--accent)] font-medium">
                  {isSelected ? 'Filtering App' : 'Click to Focus'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
