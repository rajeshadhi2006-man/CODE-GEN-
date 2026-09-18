import React, { useState } from 'react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { SKILLS_LIST } from '../../../data/seed';

export const CreateEmployeeModal: React.FC = () => {
  const { isCreateEmployeeModalOpen, toggleCreateEmployeeModal, addEmployee } = useNexusStore();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('Senior Cloud Engineer');
  const [region, setRegion] = useState<'Americas' | 'EMEA' | 'APAC' | 'South Asia' | 'LATAM'>('APAC');
  const [selectedSkillId, setSelectedSkillId] = useState('sk-k8s');
  const [proficiency, setProficiency] = useState(88);
  const [utilization, setUtilization] = useState(60);

  if (!isCreateEmployeeModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addEmployee({
      name: name.trim(),
      title,
      region,
      location: `${region} Delivery Pod`,
      utilization_pct: utilization,
      capacity_hours: 40,
      skills: [
        { skill_id: selectedSkillId, proficiency_pct: proficiency },
        { skill_id: 'sk-aws', proficiency_pct: Math.max(50, proficiency - 10) }
      ],
      performance: { quality: 92, on_time: 95, tasks_completed_30d: 8 }
    });

    setName('');
    toggleCreateEmployeeModal(false);
  };

  return (
    <Modal
      isOpen={isCreateEmployeeModalOpen}
      onClose={() => toggleCreateEmployeeModal(false)}
      title="Add Real Workforce Member"
      subtitle="Register a real engineer into the live workforce allocation database"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Henderson"
            className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              Region Pod
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as any)}
              className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="APAC">APAC (Singapore)</option>
              <option value="EMEA">EMEA (London)</option>
              <option value="Americas">Americas (New York)</option>
              <option value="South Asia">South Asia (Bengaluru)</option>
              <option value="LATAM">LATAM (São Paulo)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              Primary Skill
            </label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-panel)] border border-[var(--hairline)] text-xs text-white focus:outline-none focus:border-[var(--accent)]"
            >
              {SKILLS_LIST.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1 font-mono-data">
              Skill Proficiency ({proficiency}%)
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={proficiency}
              onChange={(e) => setProficiency(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer mt-2"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1 font-mono-data">
            Current Workload Utilization ({utilization}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={utilization}
            onChange={(e) => setUtilization(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        <div className="pt-4 border-t border-[var(--hairline)] flex items-center justify-end gap-2">
          <Button variant="bordered" size="sm" type="button" onClick={() => toggleCreateEmployeeModal(false)}>
            Cancel
          </Button>
          <Button variant="filled" size="sm" type="submit">
            Add Real Engineer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
