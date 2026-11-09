import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Check, SkipForward, Syringe, AlarmClock, ClipboardCheck, Clock } from 'lucide-react';
import BaseTable from '@/components/common/BaseTable';
import BaseButton from '@/components/common/BaseButton';
import BaseSelect from '@/components/common/BaseSelect';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import RecordForm from '@/components/common/RecordForm';
import Tabs from '@/components/common/Tabs';
import StatCard from '@/components/dashboard/StatCard';
import usePagination from '@/hooks/usePagination';
import useRole from '@/hooks/useRole';
import { useDataStore } from '@/stores/dataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDateTime } from '@/utils/dateUtils';
import { toInputDateTime, fromInputDateTime } from '@/utils/dateInput';
import { num } from '@/utils/formatters';

const UNITS = ['ml', 'mg', 'g', 'tablet', 'pcs'];
const FREQUENCIES = ['Once', 'Once daily', 'Twice daily', 'Weekly', 'Monthly', 'Quarterly'];
const OPEN = ['Pending', 'Scheduled'];

export default function Medication() {
  const { medicationSchedules, treatmentRecords, pigs, addItem, updateItem, removeItem, logActivity } = useDataStore();
  const { canManage, actor } = useRole();
  const push = useNotificationStore((s) => s.push);

  const [tab, setTab] = useState('schedules');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ open: false, editing: null });
  const [txOpen, setTxOpen] = useState(false);
  const [toDone, setToDone] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const now = Date.now();
  const isOverdue = (s) => OPEN.includes(s.status) && new Date(s.scheduledAt).getTime() < now;

  const pigOptions = pigs.filter((p) => !p.archived)
    .map((p) => ({ value: p.id, label: `${p.id}${p.label ? ` · ${p.label}` : ''} — ${p.breed}` }));

  const rows = useMemo(() => medicationSchedules
    .filter((s) => {
      if (!statusFilter) return true;
      if (statusFilter === 'Overdue') return OPEN.includes(s.status) && new Date(s.scheduledAt).getTime() < Date.now();
      return s.status === statusFilter;
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)), [medicationSchedules, statusFilter]);
  const treatments = useMemo(
    () => [...treatmentRecords].sort((a, b) => new Date(b.administeredAt) - new Date(a.administeredAt)),
    [treatmentRecords],
  );
  const schedPager = usePagination(rows, 10);
  const txPager = usePagination(treatments, 10);

  const stats = {
    open: medicationSchedules.filter((s) => OPEN.includes(s.status)).length,
    overdue: medicationSchedules.filter(isOverdue).length,
    done: treatmentRecords.length,
    skipped: medicationSchedules.filter((s) => s.status === 'Skipped').length,
  };

  const common = [
    { name: 'pigId', label: 'Pig', type: 'select', required: true, placeholder: 'Select pig', options: pigOptions },
    { name: 'medicine', label: 'Medication', required: true, hint: 'Use the product named on the veterinary instruction.' },
    { name: 'dose', label: 'Dose', type: 'number', step: '0.1', min: 0.1, max: 1000, required: true },
    { name: 'unit', label: 'Unit', type: 'select', options: UNITS, required: true, default: 'ml' },
  ];
  const scheduleFields = [
    ...common,
    { name: 'frequency', label: 'Frequency', type: 'select', options: FREQUENCIES, required: true, default: 'Once' },
    { name: 'scheduledAt', label: 'Scheduled for', type: 'datetime-local', required: true, default: toInputDateTime() },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'e.g. per veterinary instruction sheet' },
  ];
  const treatmentFields = [
    ...common,
    {
      name: 'administeredAt', label: 'Administered at', type: 'datetime-local', required: true, default: toInputDateTime(),
      validate: (v) => (new Date(v) > new Date() ? 'Administration time cannot be in the future.' : ''),
    },
    { name: 'notes', label: 'Observations', type: 'textarea', placeholder: 'Reaction, remarks' },
  ];

  const editing = form.editing;
  const editInitial = useMemo(() => (editing ? { ...editing, scheduledAt: toInputDateTime(editing.scheduledAt) } : null), [editing]);

  function saveSchedule(v) {
    const payload = { ...v, scheduledAt: fromInputDateTime(v.scheduledAt) };
    if (editing) {
      updateItem('medicationSchedules', editing.id, payload);
      logActivity('Medication', `Updated schedule ${editing.id}`, 'Completed', actor);
      push('Medication schedule updated.');
    } else {
      const rec = addItem('medicationSchedules', { ...payload, status: 'Scheduled' }, 'M');
      logActivity('Medication', `Scheduled ${v.medicine} for ${v.pigId}`, 'Pending', actor);
      push(`Medication task ${rec.id} scheduled.`);
    }
  }

  function saveTreatment(v) {
    addItem('treatmentRecords', { ...v, administeredAt: fromInputDateTime(v.administeredAt), recordedBy: actor, status: 'Completed' }, 'TR');
    logActivity('Medication', `${v.pigId} — ${v.medicine} ${v.dose} ${v.unit}`, 'Completed', actor);
    push('Treatment recorded.');
  }

  function markDone() {
    const s = toDone;
    addItem('treatmentRecords', {
      pigId: s.pigId, medicine: s.medicine, dose: s.dose, unit: s.unit,
      administeredAt: new Date().toISOString(), recordedBy: actor, notes: s.notes || '', status: 'Completed',
    }, 'TR');
    updateItem('medicationSchedules', s.id, { status: 'Completed' });
    logActivity('Medication', `${s.pigId} — ${s.medicine} ${s.dose} ${s.unit}`, 'Completed', actor);
    push('Task completed and treatment record created.');
    setToDone(null);
  }

  function skip(s) {
    updateItem('medicationSchedules', s.id, { status: 'Skipped' });
    logActivity('Medication', `Skipped task ${s.id}`, 'Completed', actor);
  }

  function confirmDelete() {
    removeItem('medicationSchedules', toDelete.id);
    push('Medication task deleted.');
    setToDelete(null);
  }

  return (
    <>
      <div className="notice" style={{ marginBottom: 14 }}>
        <Syringe size={15} />
        <span>
          Doses on this screen are entered by authorized staff from veterinary instructions. The system does not
          recommend medicines or doses.
        </span>
      </div>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <StatCard icon={Clock} label="Open tasks" value={num(stats.open)} sub="Pending or scheduled" tone="info" />
        <StatCard icon={AlarmClock} label="Overdue" value={num(stats.overdue)} tone={stats.overdue ? 'danger' : 'green'} />
        <StatCard icon={ClipboardCheck} label="Treatments recorded" value={num(stats.done)} />
        <StatCard icon={SkipForward} label="Skipped" value={num(stats.skipped)} tone="warn" />
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'schedules', label: 'Medication schedules' }, { key: 'records', label: 'Treatment records' }]} />

      {tab === 'schedules' ? (
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h3>Medication schedules</h3><div className="spacer" />
            <div style={{ minWidth: 160 }}><BaseSelect placeholder="All statuses" options={['Pending', 'Scheduled', 'Overdue', 'Completed', 'Skipped']} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} /></div>
            {canManage && <BaseButton icon={Plus} onClick={() => setForm({ open: true, editing: null })}>Add schedule</BaseButton>}
          </div>
          <BaseTable
            rows={schedPager.pageItems} pagination={schedPager}
            columns={[
              { key: 'id', header: 'ID', width: 80 },
              { key: 'pigId', header: 'Pig', width: 90 },
              { key: 'medicine', header: 'Medication' },
              { key: 'dose', header: 'Dose', render: (r) => `${r.dose} ${r.unit}`, width: 90 },
              { key: 'frequency', header: 'Frequency', width: 110 },
              {
                key: 'scheduledAt', header: 'Scheduled', width: 220,
                render: (r) => (
                  <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    {formatDateTime(r.scheduledAt)}
                    {isOverdue(r) && <span className="badge danger">Overdue</span>}
                  </span>
                ),
              },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />, width: 110 },
              {
                key: 'actions', header: 'Actions', width: 150,
                render: (r) => (OPEN.includes(r.status) || canManage) && (
                  <div className="row" style={{ gap: 2, flexWrap: 'nowrap' }}>
                    {OPEN.includes(r.status) && <button className="btn btn-ghost btn-sm" title="Mark as given" onClick={() => setToDone(r)}><Check size={14} /></button>}
                    {OPEN.includes(r.status) && canManage && <button className="btn btn-ghost btn-sm" title="Skip" onClick={() => skip(r)}><SkipForward size={14} /></button>}
                    {canManage && <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setForm({ open: true, editing: r })}><Pencil size={14} /></button>}
                    {canManage && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Delete" onClick={() => setToDelete(r)}><Trash2 size={14} /></button>}
                  </div>
                ),
              },
            ]}
          />
        </div>
      ) : (
        <div className="card">
          <div className="card-head">
            <h3>Treatment records</h3><div className="spacer" />
            <BaseButton icon={Plus} onClick={() => setTxOpen(true)}>Record treatment</BaseButton>
          </div>
          <BaseTable
            rows={txPager.pageItems} pagination={txPager}
            columns={[
              { key: 'administeredAt', header: 'Date & time', render: (r) => formatDateTime(r.administeredAt), width: 175 },
              { key: 'pigId', header: 'Pig', width: 90 },
              { key: 'medicine', header: 'Medication' },
              { key: 'dose', header: 'Dose', render: (r) => `${r.dose} ${r.unit}`, width: 90 },
              { key: 'recordedBy', header: 'Recorded by', width: 140 },
              { key: 'notes', header: 'Observations' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />, width: 110 },
            ]}
          />
        </div>
      )}

      <RecordForm
        open={form.open} title={editing ? `Edit task ${editing.id}` : 'Add medication schedule'}
        fields={scheduleFields} initial={editInitial} onSubmit={saveSchedule}
        onClose={() => setForm({ open: false, editing: null })} submitLabel={editing ? 'Save changes' : 'Create task'}
      />
      <RecordForm
        open={txOpen} title="Record treatment" fields={treatmentFields} initial={null}
        onSubmit={saveTreatment} onClose={() => setTxOpen(false)} submitLabel="Save record"
      />
      <ConfirmDialog
        open={Boolean(toDone)} tone="primary" title="Mark this dose as given?"
        message={`${toDone?.medicine} ${toDone?.dose} ${toDone?.unit} for ${toDone?.pigId} will be recorded as administered now by ${actor}.`}
        confirmLabel="Mark as given" onConfirm={markDone} onCancel={() => setToDone(null)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)} title="Delete this task?" message={`Task ${toDelete?.id} will be removed. Treatment records are kept.`}
        confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setToDelete(null)}
      />
    </>
  );
}
