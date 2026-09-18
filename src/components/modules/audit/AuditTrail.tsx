import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Badge } from '../../ui/Badge';

export const AuditTrail: React.FC = () => {
  const { auditLogs } = useNexusStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');

  const filteredLogs = auditLogs.filter(log => {
    if (selectedType !== 'All' && log.event_type !== selectedType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q) ||
        log.before.toLowerCase().includes(q) ||
        log.after.toLowerCase().includes(q) ||
        (log.task_code && log.task_code.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Immutable Enterprise Ledger
            </span>
            <Badge variant="healthy">{auditLogs.length} Events Recorded</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Autonomous System Audit Trail & Compliance Journal
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Cryptographically chronological records of all algorithmic decisions, overrides, and SLA protections.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--hairline)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor, reason, task (T-104)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)] text-xs text-white placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'REALLOCATION', 'DISRUPTION', 'MANUAL_OVERRIDE', 'POLICY_CHANGE'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 rounded-full text-xs font-mono-data transition-colors shrink-0 ${
                selectedType === type
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white/5 text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--bg-panel)] border-b border-[var(--hairline)] text-[var(--text-secondary)] font-mono-data">
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-3 font-medium">Event Type</th>
                <th className="py-3 px-3 font-medium">Actor</th>
                <th className="py-3 px-3 font-medium">Prior State</th>
                <th className="py-3 px-3 font-medium">New Reallocated State</th>
                <th className="py-3 px-4 font-medium">Score / Reason</th>
                <th className="py-3 px-3 text-right font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)] font-mono-data">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-tertiary)] font-sans">
                    <History size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-white/70">0 Audit Events Recorded</p>
                    <p className="text-[11px] mt-0.5">Audit log ledger will record autonomous events once tasks and reallocations execute.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                  {/* Timestamp */}
                  <td className="py-3 px-4 text-[var(--text-tertiary)] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString([], { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                    })}
                  </td>

                  {/* Event Type */}
                  <td className="py-3 px-3">
                    <Badge 
                      variant={
                        log.event_type === 'DISRUPTION' ? 'critical' : 
                        log.event_type === 'REALLOCATION' ? 'accent' : 
                        log.event_type === 'POLICY_CHANGE' ? 'high' : 'neutral'
                      }
                      size="sm"
                    >
                      {log.event_type}
                    </Badge>
                  </td>

                  {/* Actor */}
                  <td className="py-3 px-3 font-sans text-xs font-semibold text-white whitespace-nowrap">
                    {log.actor}
                  </td>

                  {/* Before */}
                  <td className="py-3 px-3 text-[var(--text-tertiary)] text-[11px] max-w-[160px] truncate">
                    {log.before}
                  </td>

                  {/* After */}
                  <td className="py-3 px-3 text-[var(--accent-glow)] font-semibold text-[11px] max-w-[160px] truncate">
                    {log.after}
                  </td>

                  {/* Reason */}
                  <td className="py-3 px-4 font-sans text-xs text-[var(--text-secondary)] max-w-[240px]">
                    <div className="flex items-center gap-1.5 font-mono-data mb-0.5">
                      {log.task_code && <span className="text-white font-bold">{log.task_code}</span>}
                      {log.score !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[var(--accent-glow)]">
                          Score: {log.score}/100
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2">{log.reason}</p>
                  </td>

                  {/* Outcome */}
                  <td className="py-3 px-3 text-right">
                    <Badge 
                      variant={log.approval_outcome === 'REJECTED' ? 'critical' : 'healthy'}
                      size="sm"
                    >
                      {log.approval_outcome.replace('_', ' ')}
                    </Badge>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
