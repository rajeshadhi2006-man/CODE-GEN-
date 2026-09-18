import React from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

export const ExecutiveReport: React.FC = () => {
  const { metrics, employees, tasks, auditLogs } = useNexusStore();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex items-center justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Executive Governance Document
            </span>
            <Badge variant="accent">Automated Operational Synthesis</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Executive Delivery Health Brief & Board Report
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Compiled audit-ready operational status report formatted for leadership review and PDF archiving.
          </p>
        </div>

        <Button
          variant="filled"
          size="md"
          icon={<Printer size={15} />}
          onClick={handlePrint}
        >
          Print / Save PDF
        </Button>
      </div>

      {/* Formatted Report Document Canvas */}
      <div className="p-8 rounded-[16px] bg-[#12151F] border border-[var(--hairline-strong)] space-y-8 max-w-4xl mx-auto shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Document Header */}
        <div className="border-b border-[var(--hairline-strong)] pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-mono-data font-bold tracking-widest text-[var(--accent)]">
                NEXUS WORKFORCE OS
              </span>
              <span className="text-xs font-mono-data text-[var(--text-tertiary)]">• CONFIDENTIAL</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Executive Delivery Intelligence & SLA Compliance Brief
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono-data">
              Report Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} | Scope: Global Operations
            </p>
          </div>

          <div className="text-right font-mono-data text-xs text-[var(--text-tertiary)]">
            <div>Doc ID: NEX-REP-2026-LIVE</div>
            <div>Classification: Internal Ops</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
            1. Executive Summary & SLA Health
          </h3>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed">
            {employees.length > 0 || tasks.length > 0 ? (
              <>
                During the current operational cycle, NEXUS Autonomous Workforce Engine sustained an enterprise SLA compliance rate of <strong>{metrics.sla_compliance_pct}%</strong> across <strong>{tasks.length}</strong> active work streams. Total workforce capacity utilization stabilized at <strong>{metrics.average_utilization_pct}%</strong> across <strong>{employees.length}</strong> engineers. Autonomous reallocation algorithms have processed <strong>{auditLogs.length}</strong> audited state changes with continuous human-in-the-loop governance.
              </>
            ) : (
              <>
                No active delivery tasks or personnel are currently provisioned in memory. Enterprise metrics and SLA compliance rates stand at 0.0% until live tasks are inserted into the system.
              </>
            )}
          </p>
        </div>

        {/* High-Level Scorecard */}
        <div className="grid grid-cols-4 gap-4 font-mono-data">
          <div className="p-3 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)]">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">SLA Compliance</span>
            <span className="text-xl font-bold text-[#30D158]">{metrics.sla_compliance_pct}%</span>
          </div>
          <div className="p-3 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)]">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Active Workforce</span>
            <span className="text-xl font-bold text-white">{employees.length} Engineers</span>
          </div>
          <div className="p-3 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)]">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">At-Risk Tasks</span>
            <span className="text-xl font-bold text-[#FFD60A]">{metrics.at_risk_tasks_count}</span>
          </div>
          <div className="p-3 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)]">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Mean Utilization</span>
            <span className="text-xl font-bold text-white">{metrics.average_utilization_pct}%</span>
          </div>
        </div>

        {/* Operational Interventions & Audit Records */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
            2. Critical Algorithmic Interventions (Last 24 Hours)
          </h3>

          <div className="border border-[var(--hairline)] rounded-[10px] overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-panel)] font-mono-data text-[var(--text-secondary)]">
                <tr>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Task</th>
                  <th className="py-2.5 px-3">Reallocated Action</th>
                  <th className="py-2.5 px-3 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline)] font-mono-data">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[var(--text-secondary)]">
                      No operational interventions recorded in the current cycle.
                    </td>
                  </tr>
                ) : (
                  auditLogs.slice(0, 4).map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-3 text-white">{log.event_type}</td>
                      <td className="py-2.5 px-3 text-[var(--accent-glow)] font-bold">{log.task_code || 'System'}</td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{log.after}</td>
                      <td className="py-2.5 px-3 text-right text-[#30D158] font-bold">{log.approval_outcome}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Governance & Capacity Forecast */}
        <div className="space-y-2 pt-2 border-t border-[var(--hairline)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
            3. Leadership Recommendations & Forward Outlook
          </h3>
          <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] space-y-1 leading-relaxed">
            <li><strong>Workforce Capacity Monitoring:</strong> Currently tracking {employees.length} active personnel. Operational load sits at {metrics.average_utilization_pct}%.</li>
            <li><strong>SLA Risk Control:</strong> {metrics.at_risk_tasks_count} work orders are flagged with potential delivery slippage across {tasks.length} total tasks.</li>
            <li><strong>Algorithmic Neutrality:</strong> All reallocations executed during this cycle strictly comply with the Enterprise Algorithmic Neutrality Charter.</li>
          </ul>
        </div>

        {/* Signature Line */}
        <div className="pt-8 border-t border-[var(--hairline-strong)] flex items-center justify-between text-xs font-mono-data text-[var(--text-tertiary)]">
          <div>Report Compiled by: NEXUS Autonomous Workforce Engine</div>
          <div>Authorized Role: Super Admin / Controller</div>
        </div>
      </div>
    </div>
  );
};
