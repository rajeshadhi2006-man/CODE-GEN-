import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  Clock, 
  Award, 
  CheckCircle2, 
  Briefcase, 
  Sparkles, 
  TrendingUp,
  Activity
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { SKILLS_LIST } from '../../../data/seed';

export const Workforce360: React.FC = () => {
  const { 
    employees, 
    tasks, 
    selectedRegion, 
    openExplainModal,
    toggleCreateEmployeeModal
  } = useNexusStore();
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(e => {
    if (selectedRegion !== 'All' && e.region !== selectedRegion) return false;
    if (searchTerm && !e.name.toLowerCase().includes(searchTerm.toLowerCase()) && !e.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const selectedEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];
  const currentAssignedTasks = tasks.filter(t => t.assigned_employee_id === selectedEmployee?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-[16px] card-3d flex items-center justify-between select-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Workforce 360 Intelligence
            </span>
            <Badge variant="neutral">{filteredEmployees.length} Engineers</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Engineer Profile, Skill Verification & Workload Dynamics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Holistic operational telemetry on capability, current task commitments, and on-time performance.
          </p>
        </div>

        <Button
          variant="filled"
          size="md"
          onClick={() => toggleCreateEmployeeModal(true)}
        >
          + Add Real Engineer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Searchable Directory */}
        <div className="lg:col-span-1 rounded-[16px] card-3d overflow-hidden flex flex-col h-[700px]">
          <div className="p-3 border-b border-[var(--hairline)] bg-[var(--bg-panel)]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name or ID (E-017)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--hairline)] custom-scroll">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] mx-auto">
                  <Users size={18} />
                </div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)]">No Personnel Registered</h4>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Add real engineers or load a live delivery pod.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="filled" size="sm" onClick={() => toggleCreateEmployeeModal(true)}>
                    + Add Real Engineer
                  </Button>
                </div>
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={`p-3.5 cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-[var(--accent)]/12 border-l-3 border-l-[var(--accent)] font-semibold' 
                        : 'hover:bg-[var(--bg-panel)]/50'
                    }`}
                  >
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-9 h-9 rounded-full object-cover border border-[var(--hairline-strong)] shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-xs text-[var(--text-primary)] truncate">{emp.name}</span>
                        <span className="font-mono-data text-[10px] text-[var(--text-tertiary)]">{emp.id}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">{emp.title}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono-data mt-1 text-[var(--text-tertiary)]">
                        <span>{emp.region}</span>
                        <span className={emp.utilization_pct > 88 ? 'text-[#D9383A] font-bold' : 'text-[#1E9E4A] font-semibold'}>
                          {emp.utilization_pct}% util
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Employee 360 Detail or Empty State */}
        {filteredEmployees.length === 0 ? (
          <div className="lg:col-span-2 p-12 rounded-[16px] card-3d text-center flex flex-col items-center justify-center space-y-3">
            <Users size={32} className="text-[var(--accent)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Workforce Registry is Clean</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm">
              No engineers are registered in this view. Use the "+ Add Real Engineer" button above to add team members with verified skill proficiencies.
            </p>
          </div>
        ) : selectedEmployee ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Profile Card */}
            <div className="p-6 rounded-[16px] card-3d space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    className="w-16 h-16 rounded-[14px] object-cover border-2 border-[var(--hairline-strong)] shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedEmployee.name}</h3>
                      <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[var(--bg-panel)] text-[var(--text-secondary)] border border-[var(--hairline)]">
                        {selectedEmployee.id}
                      </span>
                      <Badge 
                        variant={selectedEmployee.status === 'Available' ? 'healthy' : 'critical'}
                        size="sm"
                      >
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{selectedEmployee.title}</p>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)] mt-2 font-mono-data">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {selectedEmployee.location} ({selectedEmployee.region})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Shift: {selectedEmployee.shift.start} - {selectedEmployee.shift.end} ({selectedEmployee.timezone})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance & Capacity Gauges */}
              <div className="grid grid-cols-3 gap-3 font-mono-data pt-4 border-t border-[var(--hairline)]">
                <div className="p-3.5 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--hairline)] badge-3d">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">Current Utilization</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-[var(--text-primary)]">{selectedEmployee.utilization_pct}%</span>
                    <span className="text-xs text-[var(--text-tertiary)]">/ 40h cap</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--hairline)] badge-3d">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">On-Time Delivery SLA</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-[#1E9E4A]">{selectedEmployee.performance.on_time}%</span>
                    <span className="text-xs text-[var(--text-tertiary)]">historical</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--hairline)] badge-3d">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">Quality Audit Rating</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-[#723EC3]">{selectedEmployee.performance.quality}%</span>
                    <span className="text-xs text-[var(--text-tertiary)]">score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Skills Matrix */}
            <div className="p-6 rounded-[16px] card-3d space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Verified Enterprise Skills & Proficiency
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedEmployee.skills.map((s) => {
                  const skillMeta = SKILLS_LIST.find(k => k.id === s.skill_id);
                  return (
                    <div key={s.skill_id} className="p-3.5 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--hairline)] space-y-2 badge-3d">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">{skillMeta?.name || s.skill_id}</span>
                        <span className="font-mono-data text-[var(--accent)] font-bold">{s.proficiency_pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/40 border border-[var(--hairline)] overflow-hidden shadow-inner">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-glow)] shadow-sm"
                          style={{ width: `${s.proficiency_pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Active Task Queue */}
            <div className="p-6 rounded-[16px] card-3d space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Current Committed Tasks ({currentAssignedTasks.length})
                </h4>
              </div>

              {currentAssignedTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-tertiary)]">
                  No active tasks committed. Engineer has 100% immediate scheduling availability.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentAssignedTasks.map(task => (
                    <div 
                      key={task.id}
                      className="p-3.5 rounded-[12px] bg-[var(--bg-panel)] border border-[var(--hairline)] flex items-center justify-between text-xs badge-3d"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono-data font-bold text-[var(--text-primary)]">{task.code}</span>
                          <Badge variant={task.priority === 'Critical' ? 'critical' : 'high'} size="sm">
                            {task.priority}
                          </Badge>
                        </div>
                        <span className="text-[var(--text-secondary)]">{task.name}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openExplainModal(task.id)}
                        className="text-xs"
                      >
                        Explain
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
