import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Globe, 
  Sparkles, 
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Plus
} from 'lucide-react';
import { useNexusStore, MetricHistoryPoint } from '../../../store/useNexusStore';
import { MetricCard } from '../../ui/MetricCard';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { realtimeBus, BusEvent } from '../../../store/realtimeBus';
import { calculateSLARisk } from '../../../engine/sla';

export const CommandCenter: React.FC = () => {
  const { 
    metrics, 
    metricHistory,
    employees, 
    tasks, 
    selectedRegion, 
    setSelectedRegion, 
    triggerDisruption, 
    optimizeAll, 
    setActiveTab,
    openExplainModal,
    recommendations,
    currentTimestamp,
    toggleCreateTaskModal,
    toggleCreateEmployeeModal
  } = useNexusStore();

  const [liveEvents, setLiveEvents] = useState<BusEvent[]>([]);

  useEffect(() => {
    const unsub = realtimeBus.subscribeAll((event) => {
      setLiveEvents(prev => [event, ...prev].slice(0, 10));
    });
    return unsub;
  }, []);

  const filteredEmployees = selectedRegion === 'All' 
    ? employees 
    : employees.filter(e => e.region === selectedRegion);

  const filteredTasks = selectedRegion === 'All'
    ? tasks
    : tasks.filter(t => {
        const emp = employees.find(e => e.id === t.assigned_employee_id);
        return emp?.region === selectedRegion;
      });

  // Critical tasks needing attention evaluated with live timestamp
  const urgentTasks = filteredTasks.filter(t => {
    if (t.priority === 'Critical' || t.status === 'AtRisk') return true;
    const emp = employees.find(e => e.id === t.assigned_employee_id);
    const risk = calculateSLARisk(t, emp, currentTimestamp);
    return risk.risk_tier === 'Critical' || risk.risk_tier === 'Breached';
  }).slice(0, 5);

  // Candidate for disruption test
  const disruptCandidate = employees.find(e => e.status === 'Available') || employees[0];

  // 100% Real-time dynamic regional breakdown calculated directly from live state
  const standardRegions = ['Americas', 'EMEA', 'APAC', 'South Asia', 'LATAM'] as const;
  const activeRegionNames = Array.from(new Set([...standardRegions, ...employees.map(e => e.region)]));

  const regionBreakdown = activeRegionNames.map(reg => {
    const regEmps = employees.filter(e => e.region === reg);
    const regTasks = tasks.filter(t => {
      const emp = employees.find(e => e.id === t.assigned_employee_id);
      return emp?.region === reg;
    });

    const regUtil = regEmps.length > 0 
      ? Math.round(regEmps.reduce((acc, e) => acc + e.utilization_pct, 0) / regEmps.length) 
      : 0;

    const atRisk = regTasks.filter(t => {
      const emp = employees.find(e => e.id === t.assigned_employee_id);
      const risk = calculateSLARisk(t, emp, currentTimestamp);
      return risk.risk_tier === 'Critical' || risk.risk_tier === 'High' || t.status === 'AtRisk';
    }).length;

    const status: 'critical' | 'high' | 'healthy' = 
      atRisk >= 3 || regUtil > 90 ? 'critical' : 
      atRisk > 0 || regUtil > 85 ? 'high' : 
      'healthy';

    return {
      region: reg,
      count: regEmps.length,
      util: regUtil,
      atRisk,
      status
    };
  });

  // 100% Real-time dynamic delta calculator derived from live store history ticks
  const calculateDelta = (key: keyof MetricHistoryPoint, suffix: string) => {
    if (!metricHistory || metricHistory.length < 2) return undefined;
    const latest = metricHistory[metricHistory.length - 1][key];
    const prev = metricHistory[0][key];
    const diff = Number((latest - prev).toFixed(1));
    if (diff === 0) return { value: "±0.0 (Sync)", positive: true };
    const positive = (key === 'atRisk' || key === 'critical') ? diff < 0 : diff > 0;
    const sign = diff > 0 ? `+${diff}` : `${diff}`;
    return {
      value: `${sign}${suffix === '%' ? '%' : ` ${suffix}`}`,
      positive
    };
  };

  const activeRegionsCount = regionBreakdown.filter(r => r.count > 0).length || 1;

  const formatBuffer = (mins: number) => {
    if (mins < 0) {
      const abs = Math.abs(mins);
      if (abs >= 60) return `-${Math.floor(abs / 60)}h ${abs % 60}m`;
      return `-${abs}m`;
    }
    if (mins >= 60) return `+${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `+${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-time Operational Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[16px] card-3d select-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Global Operations Grid
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-healthy)] animate-pulse" />
            <span className="text-xs text-[var(--status-healthy)] font-mono-data">
              Live Synchronized • {new Date(currentTimestamp).toLocaleTimeString()}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Autonomous Workforce Allocation & SLA Command Center
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {filteredEmployees.length > 0 
              ? `Continuously balancing ${filteredEmployees.length} personnel across ${activeRegionsCount} delivery regions with zero-downtime SLA protection.`
              : 'Autonomous telemetry active. No active personnel currently provisioned in operational scope.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="tinted"
            size="sm"
            icon={<Sparkles size={14} className="text-[var(--accent-glow)]" />}
            onClick={() => optimizeAll()}
            disabled={tasks.length === 0}
          >
            Optimize All Tasks
          </Button>

          <Button
            variant="destructive"
            size="sm"
            icon={<AlertTriangle size={14} />}
            disabled={!disruptCandidate}
            onClick={() => disruptCandidate && triggerDisruption(disruptCandidate.id)}
            title={disruptCandidate ? `Simulate sudden outage for ${disruptCandidate.name}` : 'No personnel to disrupt'}
          >
            {disruptCandidate ? `Simulate Outage (${disruptCandidate.id})` : 'Simulate Outage'}
          </Button>
        </div>
      </div>

      {/* Hero KPI Grid (8 Cards derived purely from live state and rolling history) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Workforce"
          value={filteredEmployees.length}
          subtitle={filteredEmployees.length > 0 ? `${filteredEmployees.filter(e => e.status === 'Available').length} active available` : 'Zero personnel'}
          delta={calculateDelta('workforce', 'staff')}
          sparklineData={metricHistory?.map(h => h.workforce)}
          icon={<Users size={16} />}
          onClick={() => setActiveTab('workforce')}
        />

        <MetricCard
          title="Average Utilization"
          value={`${metrics.average_utilization_pct}%`}
          subtitle={filteredEmployees.length > 0 ? `Target threshold: 65%–82%` : 'No load active'}
          delta={calculateDelta('utilization', '%')}
          sparklineData={metricHistory?.map(h => h.utilization)}
          icon={<Activity size={16} />}
          onClick={() => setActiveTab('heatmap')}
        />

        <MetricCard
          title="SLA Compliance Rate"
          value={`${metrics.sla_compliance_pct}%`}
          subtitle={filteredTasks.length > 0 ? `Across ${filteredTasks.length} live tasks` : 'No active tasks'}
          delta={calculateDelta('sla', '%')}
          variant={filteredTasks.length === 0 ? "default" : metrics.sla_compliance_pct < 95 ? "warning" : "healthy"}
          sparklineData={metricHistory?.map(h => h.sla)}
          icon={<CheckCircle2 size={16} />}
          onClick={() => setActiveTab('sla-risk')}
        />

        <MetricCard
          title="At-Risk Tasks"
          value={metrics.at_risk_tasks_count}
          subtitle="Buffer margin < 45m"
          delta={calculateDelta('atRisk', 'tasks')}
          variant={metrics.at_risk_tasks_count > 0 ? (metrics.at_risk_tasks_count > 7 ? "critical" : "warning") : "healthy"}
          sparklineData={metricHistory?.map(h => h.atRisk)}
          icon={<AlertTriangle size={16} />}
          onClick={() => setActiveTab('sla-risk')}
        />

        <MetricCard
          title="Critical Tasks"
          value={metrics.critical_tasks_count}
          subtitle="Tier-1 critical work orders"
          delta={calculateDelta('critical', 'tasks')}
          sparklineData={metricHistory?.map(h => h.critical)}
          variant={metrics.critical_tasks_count > 0 ? "critical" : "default"}
          icon={<ShieldAlert size={16} />}
          onClick={() => setActiveTab('tasks')}
        />

        <MetricCard
          title="Unassigned Tasks"
          value={metrics.unassigned_count}
          subtitle="Awaiting automated assignment"
          delta={calculateDelta('unassigned', 'tasks')}
          sparklineData={metricHistory?.map(h => h.unassigned)}
          variant={metrics.unassigned_count > 0 ? "accent" : "default"}
          icon={<Clock size={16} />}
          onClick={() => setActiveTab('live-allocation')}
        />

        <MetricCard
          title="Capacity Headroom"
          value={filteredEmployees.length > 0 ? `${(100 - metrics.average_utilization_pct).toFixed(1)}%` : '0%'}
          subtitle={filteredEmployees.length > 0 ? "Available surge capacity" : "Zero active workforce"}
          delta={calculateDelta('headroom', '%')}
          sparklineData={metricHistory?.map(h => h.headroom)}
          icon={<Zap size={16} />}
          onClick={() => setActiveTab('analytics')}
        />

        <MetricCard
          title="AI Reallocation Queue"
          value={recommendations.length}
          subtitle="Pending human-in-the-loop review"
          delta={calculateDelta('recommendations', 'items')}
          sparklineData={metricHistory?.map(h => h.recommendations)}
          variant={recommendations.length > 0 ? "accent" : "default"}
          icon={<Sparkles size={16} />}
          onClick={() => setActiveTab('approvals')}
        />
      </div>

      {/* Empty State Banner if workspace has zero tasks & employees */}
      {filteredEmployees.length === 0 && filteredTasks.length === 0 && (
        <div className="p-8 rounded-[16px] card-3d border-dashed text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Operational Telemetry Standby</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1">
              Zero active entities in memory. Data will stream live from Supabase in real time when work orders or personnel are added.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="filled" size="sm" onClick={() => toggleCreateTaskModal(true)} icon={<Plus size={14} />}>
              + Add Real Task
            </Button>
            <Button variant="tinted" size="sm" onClick={() => toggleCreateEmployeeModal(true)} icon={<Users size={14} />}>
              + Add Person
            </Button>
          </div>
        </div>
      )}

      {/* Middle Split: Regional Distribution & Urgent SLA Triage Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Urgent Task Triage */}
        <div className="lg:col-span-2 p-5 rounded-[16px] card-3d flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Live SLA Protection & Critical Task Queue
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Tasks requiring immediate autonomous reallocation or review
                </p>
              </div>

              <Button
                variant="bordered"
                size="sm"
                onClick={() => setActiveTab('live-allocation')}
                iconRight={<ArrowUpRight size={14} />}
              >
                Open Allocation Engine
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--hairline)] text-[var(--text-secondary)] font-mono-data">
                    <th className="pb-2 font-medium">Task</th>
                    <th className="pb-2 font-medium">Priority</th>
                    <th className="pb-2 font-medium">Current Resource</th>
                    <th className="pb-2 font-medium">Safety Buffer</th>
                    <th className="pb-2 font-medium">SLA Risk</th>
                    <th className="pb-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  {urgentTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                        <CheckCircle2 size={20} className="text-[#1E9E4A] mx-auto mb-2" />
                        <span className="font-semibold text-[var(--text-primary)] block mb-0.5">SLA Perimeter Healthy</span>
                        <span>No critical tasks or pending breaches in active view.</span>
                      </td>
                    </tr>
                  ) : (
                    urgentTasks.map((t) => {
                      const emp = employees.find(e => e.id === t.assigned_employee_id);
                      const risk = calculateSLARisk(t, emp, currentTimestamp);
                      const rec = recommendations.find(r => r.task_id === t.id);

                      return (
                        <tr key={t.id} className="hover:bg-black/[0.02] transition-colors">
                          <td className="py-2.5 pr-2">
                            <div className="font-mono-data font-semibold text-[var(--text-primary)]">{t.code}</div>
                            <div className="text-[11px] text-[var(--text-secondary)] truncate max-w-[200px]">{t.name}</div>
                          </td>
                          <td className="py-2.5 pr-2">
                            <Badge 
                              variant={t.priority === 'Critical' ? 'critical' : t.priority === 'High' ? 'high' : 'medium'}
                              size="sm"
                            >
                              {t.priority}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-2">
                            {emp ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono-data font-medium text-[var(--text-primary)]">{emp.name}</span>
                                <span className="text-[10px] text-[var(--text-tertiary)] font-mono-data">({emp.id})</span>
                              </div>
                            ) : (
                              <span className="text-[#FF9F0A] font-mono-data">Unassigned</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-2 font-mono-data">
                            <span className={risk.safety_buffer_min < 0 ? 'text-[#FF453A] font-bold' : risk.safety_buffer_min < 30 ? 'text-[#FF9F0A]' : 'text-[#30D158]'}>
                              {formatBuffer(risk.safety_buffer_min)}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2">
                            <Badge 
                              variant={risk.risk_score >= 80 ? 'critical' : risk.risk_score >= 50 ? 'high' : 'healthy'}
                              size="sm"
                              pulse={risk.risk_score >= 80}
                            >
                              {risk.risk_score}% {risk.risk_tier}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-right">
                            <Button
                              variant="tinted"
                              size="sm"
                              onClick={() => openExplainModal(t.id, rec?.id)}
                              className="text-xs"
                            >
                              {rec ? 'Review AI' : 'Explain'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Regional Distribution Cards - 100% Dynamic */}
        <div className="p-5 rounded-[16px] card-3d flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Regional Delivery Pods
              </h3>
              <Globe size={16} className="text-[var(--text-tertiary)]" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Click any region to filter company-wide allocation scope
            </p>

            <div className="space-y-2">
              {regionBreakdown.map((r) => {
                const isSelected = selectedRegion === r.region;
                return (
                  <button
                    key={r.region}
                    onClick={() => setSelectedRegion(isSelected ? 'All' : r.region)}
                    className={`w-full p-2.5 rounded-[10px] border text-xs flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'bg-[#723EC3]/15 border-[#723EC3] text-[#723EC3] shadow-sm font-semibold'
                        : 'bg-[var(--bg-panel)] border-[var(--hairline)] text-[var(--text-secondary)] hover:border-[#723EC3]/50 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{r.region}</span>
                      <span className="text-[11px] font-mono-data text-[var(--text-tertiary)]">({r.count} staff)</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono-data">
                      <span>Util: <strong className="text-[var(--text-primary)] font-bold">{r.util}%</strong></span>
                      <Badge variant={r.status} size="sm">{r.atRisk} risk</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            variant="bordered"
            size="sm"
            onClick={() => setActiveTab('world-map')}
            className="w-full text-xs"
          >
            Open Interactive Workforce Map
          </Button>
        </div>
      </div>

      {/* Real-time Bus Event Stream */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[var(--accent)]" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Real-time Telemetry & State Transition Bus
            </h4>
          </div>
          <span className="text-[11px] font-mono-data text-[var(--text-tertiary)]">
            Pub-Sub Event Bus Live Feed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {liveEvents.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-[var(--text-tertiary)] font-mono-data">
              System standing by. Waiting for telemetry events...
            </div>
          ) : (
            liveEvents.slice(0, 3).map((ev, i) => (
              <div 
                key={i} 
                className="p-2.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex items-start justify-between text-xs"
              >
                <div>
                  <span className="text-[10px] font-mono-data text-[var(--accent)] font-semibold uppercase block">
                    {ev.type}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-[220px] block">
                    {ev.payload?.taskCode || ev.payload?.employeeName || 'System event triggered'}
                  </span>
                </div>
                <span className="text-[10px] font-mono-data text-[var(--text-tertiary)]">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
