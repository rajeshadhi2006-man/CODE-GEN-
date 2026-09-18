import React, { useState } from 'react';
import { 
  FolderKanban, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight,
  ShieldCheck 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { CLIENTS_LIST } from '../../../data/seed';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

export const ProjectsDashboard: React.FC = () => {
  const { projects, tasks, setActiveTab } = useNexusStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projects.filter(p => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-[16px] card-3d flex items-center justify-between select-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Client Delivery Portfolio
            </span>
            <Badge variant="accent">{filteredProjects.length} Active Engagements</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Projects & Client Accounts Command View
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Engagement-level SLA compliance, risk posture, and resource commitment overview.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-3.5 rounded-[14px] bg-[var(--bg-panel)] border border-[var(--hairline)] shadow-[inset_0_1px_2px_rgba(51,61,109,0.04)]">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name..."
            className="w-full pl-9 pr-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 rounded-[16px] card-3d text-center space-y-3">
          <FolderKanban size={28} className="text-[var(--accent)] mx-auto" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">No Client Projects Found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            No projects are currently registered in Supabase. Projects will appear here when added to your database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.slice(0, 18).map((proj) => {
          const client = CLIENTS_LIST.find(c => c.id === proj.client_id) || CLIENTS_LIST[0];
          const projectTasks = tasks.filter(t => t.project_id === proj.id);
          const criticalCount = projectTasks.filter(t => t.priority === 'Critical').length;
          const atRiskCount = projectTasks.filter(t => t.status === 'AtRisk').length;

          return (
            <div
              key={proj.id}
              className="p-5 rounded-[16px] card-3d flex flex-col justify-between space-y-4 select-none"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-data text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                    {client.name}
                  </span>
                  <Badge 
                    variant={proj.health === 'Critical' ? 'critical' : proj.health === 'AtRisk' ? 'high' : 'healthy'}
                    size="sm"
                  >
                    {proj.health} Health
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)] mb-1 leading-snug">
                  {proj.name}
                </h3>
                <span className="text-xs text-[var(--text-tertiary)] font-mono-data">
                  Delivery Region: {proj.region}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono-data pt-3 border-t border-[var(--hairline)] text-xs">
                <div className="p-2 rounded-[8px] bg-[var(--bg-panel)] badge-3d">
                  <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold block">Tasks</span>
                  <span className="text-sm font-extrabold text-[var(--text-primary)]">{projectTasks.length}</span>
                </div>
                <div className="p-2 rounded-[8px] bg-[var(--bg-panel)] badge-3d">
                  <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold block">Target SLA</span>
                  <span className="text-sm font-extrabold text-[#1E9E4A]">{proj.sla_target_pct}%</span>
                </div>
                <div className="p-2 rounded-[8px] bg-[var(--bg-panel)] badge-3d">
                  <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold block">At-Risk</span>
                  <span className={`text-sm font-extrabold ${atRiskCount > 0 ? 'text-[#D9383A]' : 'text-[var(--text-secondary)]'}`}>
                    {atRiskCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] font-mono-data text-[var(--text-tertiary)]">
                  Tier: {client.tier}
                </span>
                <button
                  onClick={() => setActiveTab('live-allocation')}
                  className="flex items-center gap-1 text-[var(--accent)] hover:underline font-medium text-xs"
                >
                  <span>View Tasks</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
