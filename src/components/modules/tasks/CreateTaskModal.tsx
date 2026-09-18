import React, { useState } from 'react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { SKILLS_LIST } from '../../../data/seed';
import { TaskPriority } from '../../../data/types';
import { findBestExpert, ExpertMatchCandidate } from '../../../services/pythonApiService';
import { findBestSkillMatch } from '../../../engine/scoring';
import { Sparkles, Mail, CheckCircle2, UserCheck, ShieldAlert, Cpu } from 'lucide-react';

export const CreateTaskModal: React.FC = () => {
  const { isCreateTaskModalOpen, toggleCreateTaskModal, addTask, employees, projects } = useNexusStore();

  const [name, setName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [effortMin, setEffortMin] = useState(120);
  const [slaHours, setSlaHours] = useState(4);
  const [selectedSkillId, setSelectedSkillId] = useState('sk-python');
  const [assignedEmpId, setAssignedEmpId] = useState('auto');
  
  // Real-time talent matching & submission state
  const [isMatching, setIsMatching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [topMatch, setTopMatch] = useState<ExpertMatchCandidate | null>(null);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);

  // Compute live autonomous AI skill match
  const liveSkillMatch = React.useMemo(() => {
    return findBestSkillMatch(
      {
        required_skills: [{ skill_id: selectedSkillId, min_proficiency: 70 }]
      } as any,
      employees
    );
  }, [selectedSkillId, employees]);

  if (!isCreateTaskModalOpen) return null;

  const handleAutoMatch = async () => {
    setIsMatching(true);
    setMatchMessage(null);
    try {
      const resp = await findBestExpert(selectedSkillId, employees, 60.0);
      if (resp && resp.top_match) {
        setTopMatch(resp.top_match);
        setAssignedEmpId(resp.top_match.employee.id);
        setMatchMessage(resp.message);
      } else {
        setTopMatch(null);
        setMatchMessage(`No active specialist found with >=60% proficiency for this skill.`);
      }
    } catch {
      setMatchMessage('Talent matching engine error.');
    } finally {
      setIsMatching(false);
    }
  };

  const effectiveEmpId = assignedEmpId === 'auto' 
    ? (liveSkillMatch?.employee.id || '') 
    : assignedEmpId;

  const selectedEmployee = employees.find(e => e.id === effectiveEmpId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const validProjId = selectedProjectId || (projects[0]?.id || 'proj-nexus-core');

    try {
      await addTask({
        name: name.trim(),
        project_id: validProjId,
        priority,
        estimated_effort_min: effortMin,
        remaining_effort_min: effortMin,
        sla_deadline: new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString(),
        required_skills: [{ skill_id: selectedSkillId, min_proficiency: 75 }],
        assigned_employee_id: effectiveEmpId || null,
        business_impact_score: priority === 'Critical' ? 95 : priority === 'High' ? 80 : 60
      });

      setName('');
      setTopMatch(null);
      setMatchMessage(null);
      toggleCreateTaskModal(false);
    } catch (err: any) {
      console.error('Task creation failed:', err);
      setSubmitError(err.message || 'Failed to create work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateTaskModalOpen}
      onClose={() => toggleCreateTaskModal(false)}
      title="Create Work Order & Real-Time Allocation"
      subtitle="Register an actual task into the live autonomous SLA delivery pipeline with automated SMTP notification"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              Project Initiative
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white focus:outline-none focus:border-[var(--accent)]"
            >
              {projects.length > 0 ? (
                projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              ) : (
                <option value="proj-nexus-core">Nexus Workforce Enterprise OS</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              Priority Tier
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white focus:outline-none focus:border-[var(--accent)] font-mono-data"
            >
              <option value="Critical">Critical (Immediate SLA)</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
            Task Name / Work Order Summary *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production Python High-Throughput Ingestion Pipeline"
            className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
            Required Capability
          </label>
          <select
            value={selectedSkillId}
            onChange={(e) => {
              setSelectedSkillId(e.target.value);
              setTopMatch(null);
              setMatchMessage(null);
            }}
            className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white focus:outline-none focus:border-[var(--accent)]"
          >
            {SKILLS_LIST.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 font-mono-data">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              Effort (Minutes)
            </label>
            <input
              type="number"
              min="15"
              max="1440"
              value={effortMin}
              onChange={(e) => setEffortMin(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              SLA Window (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="72"
              value={slaHours}
              onChange={(e) => setSlaHours(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Real-Time Expert Matching Trigger */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-[rgba(14,165,233,0.1)] to-[rgba(99,102,241,0.1)] border border-[rgba(56,189,248,0.25)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--accent)] animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">
                Real-Time Expert Talent Matcher
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoMatch}
              disabled={isMatching}
              className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[var(--accent)] hover:bg-[#0284c7] text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isMatching ? 'Matching Specialist...' : 'Auto-Match Best Expert'}
            </button>
          </div>

          {topMatch && (
            <div className="p-2.5 rounded bg-[var(--bg-panel)]/80 border border-[var(--accent)]/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Top Match: {topMatch.employee.name}</span>
                  <span className="text-[10px] text-slate-400">({topMatch.employee.title})</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {topMatch.overall_match_score}% MATCH
                </span>
              </div>
              <div className="flex flex-wrap gap-1 text-[10px] text-slate-300">
                {topMatch.match_reasons.map((r, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matchMessage && !topMatch && (
            <p className="text-[11px] text-amber-300 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> {matchMessage}
            </p>
          )}
        </div>

        {/* Assigned Engineer Selector with Autonomous AI Default */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
            Assignment Strategy & Engineer
          </label>
          <select
            value={assignedEmpId}
            onChange={(e) => {
              setAssignedEmpId(e.target.value);
              setTopMatch(null);
            }}
            className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--accent)]/40 text-xs text-white focus:outline-none focus:border-[var(--accent)] font-medium"
          >
            <option value="auto" className="bg-slate-900 text-sky-300 font-bold">
              🤖 Autonomous AI Skill Match (Recommended: {liveSkillMatch ? `${liveSkillMatch.employee.name} — ${liveSkillMatch.proficiency}% ${liveSkillMatch.matchedSkill}` : 'Auto-match'})
            </option>
            <option value="" className="bg-slate-900 text-amber-300">
              Leave Unassigned (Queue for backlog)
            </option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id} className="bg-slate-900 text-slate-200">
                Manual Override: {emp.name} ({emp.title}) • {emp.email || 'internal'} • {emp.region}
              </option>
            ))}
          </select>
        </div>

        {/* Autonomous AI Skill Match Preview Badge */}
        {assignedEmpId === 'auto' && liveSkillMatch && (
          <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/40 text-[11px] flex items-center justify-between text-sky-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
              <div>
                <span className="font-bold text-white">AI Skill Match:</span> Assigned to <strong className="text-sky-300">{liveSkillMatch.employee.name}</strong>
                <span className="text-[10px] text-slate-300 block">{liveSkillMatch.reason}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-500/20 text-sky-200 border border-sky-500/40 shrink-0">
              {liveSkillMatch.score}% MATCH
            </span>
          </div>
        )}

        {/* Confidential Single-Recipient Dispatch Notice */}
        {selectedEmployee && (
          <div className="p-2.5 rounded-lg bg-[rgba(15,23,42,0.8)] border border-[rgba(56,189,248,0.2)] text-[11px] flex items-start gap-2 text-slate-300">
            <Mail className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white">Automated SMTP Email Dispatch Configured:</span>
              <p className="text-slate-400 mt-0.5 text-[10px] leading-relaxed">
                Direct assignment alert will be sent <strong className="text-sky-300">strictly to {selectedEmployee.name}</strong> (&lt;{selectedEmployee.email || `${selectedEmployee.name.toLowerCase().replace(/\s+/g, '.')}@nexusworkforce.internal`}&gt;). Broadcast to other staff is strictly disabled.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[var(--hairline)] flex items-center justify-end gap-2">
          <Button variant="bordered" size="sm" type="button" onClick={() => toggleCreateTaskModal(false)}>
            Cancel
          </Button>
          <Button variant="filled" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Work Order...' : 'Create Real Task & Dispatch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

