import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Power, Send, CalendarClock, Activity, CheckCircle2, Wifi } from 'lucide-react';
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
import { sendTestCommand, DISPENSE_STATE } from '@/services/iotService';
import { formatDateTime, formatTime, formatDate, relativeTime, todayISO } from '@/utils/dateUtils';
import { num } from '@/utils/formatters';

const FEED_TYPES = ['Starter Feed', 'Grower Feed', 'Finisher Feed', 'Gestating Sow Feed', 'Lactating Sow Feed'];
const RECURRENCE = ['Daily', 'Weekdays', 'Weekly', 'Once'];

export default function Feeding() {
  const { feedingSchedules, feedingLogs, feederDevices, pens, addItem, updateItem, removeItem, logActivity } = useDataStore();
  const { canManage, actor } = useRole();
  const push = useNotificationStore((s) => s.push);

  const [tab, setTab] = useState('schedules');
  const [form, setForm] = useState({ open: false, editing: null });
  const [toDelete, setToDelete] = useState(null);
  const [testing, setTesting] = useState('');
  const [logFilter, setLogFilter] = useState({ pen: '', state: '' });

  const penName = (id) => pens.find((p) => p.id === id)?.name || id;
  const today = todayISO();

  const stats = useMemo(() => {
    const confirmed = feedingLogs.filter((l) => l.state === DISPENSE_STATE.CONFIRMED).length;
    return {
      active: feedingSchedules.filter((f) => f.enabled).length,
      today: feedingLogs.filter((l) => l.timestamp.slice(0, 10) === today).length,
      rate: feedingLogs.length ? Math.round((confirmed / feedingLogs.length) * 100) : 0,
      online: feederDevices.filter((d) => d.status !== 'Device Offline').length,
    };
  }, [feedingSchedules, feedingLogs, feederDevices, today]);

  const schedules = useMemo(
    () => [...feedingSchedules].sort((a, b) => a.penId.localeCompare(b.penId) || a.time.localeCompare(b.time)),
    [feedingSchedules],
  );
  const logs = useMemo(
    () => feedingLogs
      .filter((l) => (!logFilter.pen || l.penId === logFilter.pen) && (!logFilter.state || l.state === logFilter.state))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [feedingLogs, logFilter],
  );
  const schedPager = usePagination(schedules, 10);
  const logPager = usePagination(logs, 10);

  const editing = form.editing;
  const fields = [
    { name: 'penId', label: 'Pen', type: 'select', required: true, placeholder: 'Select pen', options: pens.map((p) => ({ value: p.id, label: `${p.name} — ${p.purpose}` })) },
    { name: 'feedType', label: 'Feed type', type: 'select', required: true, placeholder: 'Select feed', options: FEED_TYPES },
    { name: 'amountKg', label: 'Amount per feeding (kg)', type: 'number', step: '0.5', min: 0.5, max: 100, required: true },
    {
      name: 'time', label: 'Feeding time', type: 'time', required: true,
      validate: (v, vals) => (feedingSchedules.some((s) => s.id !== editing?.id && s.penId === vals.penId && s.time === v)
        ? 'This pen already has a feeding scheduled at this time.' : ''),
    },
    { name: 'recurrence', label: 'Recurrence', type: 'select', options: RECURRENCE, required: true, default: 'Daily' },
    { name: 'deviceId', label: 'Feeder device', type: 'select', placeholder: 'No device (manual feeding)', options: feederDevices.map((d) => ({ value: d.id, label: `${d.name} (${d.penId})` })) },
    { name: 'startDate', label: 'Start date', type: 'date', required: true, default: todayISO() },
    {
      name: 'endDate', label: 'End date (optional)', type: 'date',
      validate: (v, vals) => (vals.startDate && v < vals.startDate ? 'End date cannot be before the start date.' : ''),
    },
  ];

  function saveSchedule(v) {
    if (editing) {
      updateItem('feedingSchedules', editing.id, v);
      logActivity('Feeding', `Updated schedule ${editing.id} (${v.penId})`, 'Completed', actor);
      push('Feeding schedule updated.');
    } else {
      const rec = addItem('feedingSchedules', { ...v, enabled: true, status: 'Scheduled' }, 'FS');
      logActivity('Feeding', `Created schedule ${rec.id} for ${v.penId}`, 'Completed', actor);
      push('Feeding schedule created.');
    }
  }

  function toggle(s) {
    updateItem('feedingSchedules', s.id, { enabled: !s.enabled, status: s.enabled ? 'Disabled' : 'Scheduled' });
    logActivity('Feeding', `${s.enabled ? 'Disabled' : 'Enabled'} schedule ${s.id}`, 'Completed', actor);
  }

  function confirmDelete() {
    removeItem('feedingSchedules', toDelete.id);
    logActivity('Feeding', `Deleted schedule ${toDelete.id}`, 'Completed', actor);
    push('Schedule deleted.');
    setToDelete(null);
  }

  async function testDevice(d) {
    if (d.status === 'Device Offline') {
      push(`${d.name} is offline. The command was not sent.`, 'warn');
      return;
    }
    setTesting(d.id);
    try {
      const res = await sendTestCommand(d.id, { amountKg: 1 });
      const ok = res.state === DISPENSE_STATE.CONFIRMED;
      addItem('feedingLogs', {
        scheduleId: null, penId: d.penId, feedType: 'Test dispense', configuredKg: 1, deviceId: d.id,
        timestamp: res.at, state: res.state, reportedKg: ok ? 1 : null, simulated: res.simulated !== false,
      }, 'FL');
      if (ok) updateItem('feederDevices', d.id, { lastSeen: res.at, lastCommand: 'Test dispense 1 kg' });
      logActivity('Feeding', `Test command to ${d.name}: ${res.state}`, ok ? 'Completed' : 'Pending', actor);
      push(res.message, ok ? 'ok' : 'warn');
    } catch (e) {
      push(e.message || 'The command could not be sent.', 'warn');
    } finally {
      setTesting('');
    }
  }

  const scheduleCols = [
    { key: 'id', header: 'ID', width: 80 },
    { key: 'penId', header: 'Pen', render: (r) => penName(r.penId), width: 100 },
    { key: 'feedType', header: 'Feed type' },
    { key: 'amountKg', header: 'Amount', align: 'right', render: (r) => `${r.amountKg} kg`, width: 90 },
    { key: 'time', header: 'Time', render: (r) => formatTime(r.time), width: 90 },
    { key: 'recurrence', header: 'Recurrence', width: 100 },
    { key: 'deviceId', header: 'Device', render: (r) => r.deviceId || 'Manual', width: 80 },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.enabled ? 'Scheduled' : 'Disabled'} />, width: 110 },
    ...(canManage ? [{
      key: 'actions', header: 'Actions', width: 130,
      render: (r) => (
        <div className="row" style={{ gap: 2, flexWrap: 'nowrap' }}>
          <button className="btn btn-ghost btn-sm" title={r.enabled ? 'Disable' : 'Enable'} onClick={() => toggle(r)}><Power size={14} /></button>
          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setForm({ open: true, editing: r })}><Pencil size={14} /></button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Delete" onClick={() => setToDelete(r)}><Trash2 size={14} /></button>
        </div>
      ),
    }] : []),
  ];

  return (
    <>
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <StatCard icon={CalendarClock} label="Active schedules" value={num(stats.active)} sub={`${feedingSchedules.length} total`} />
        <StatCard icon={Activity} label="Feeding events today" value={num(stats.today)} tone="info" />
        <StatCard icon={CheckCircle2} label="Confirmation rate" value={`${stats.rate}%`} sub="Of logged commands" tone={stats.rate < 80 ? 'warn' : 'green'} />
        <StatCard icon={Wifi} label="Feeders online" value={`${stats.online} / ${feederDevices.length}`} tone={stats.online < feederDevices.length ? 'danger' : 'green'} />
      </div>

      <Tabs
        value={tab} onChange={setTab}
        tabs={[{ key: 'schedules', label: 'Feeding schedules' }, { key: 'logs', label: 'Feeding logs' }, { key: 'devices', label: 'Feeder devices' }]}
      />

      {tab === 'schedules' && (
        <div className="card">
          <div className="card-head">
            <h3>Feeding schedules</h3><div className="spacer" />
            {canManage && <BaseButton icon={Plus} onClick={() => setForm({ open: true, editing: null })}>Add schedule</BaseButton>}
          </div>
          <BaseTable columns={scheduleCols} rows={schedPager.pageItems} pagination={schedPager} />
        </div>
      )}

      {tab === 'logs' && (
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h3>Feeding logs</h3><span className="badge muted">{logs.length} entries</span><div className="spacer" />
            <div style={{ minWidth: 150 }}><BaseSelect placeholder="All pens" options={pens.map((p) => ({ value: p.id, label: p.name }))} value={logFilter.pen} onChange={(e) => setLogFilter((f) => ({ ...f, pen: e.target.value }))} /></div>
            <div style={{ minWidth: 190 }}><BaseSelect placeholder="All results" options={Object.values(DISPENSE_STATE)} value={logFilter.state} onChange={(e) => setLogFilter((f) => ({ ...f, state: e.target.value }))} /></div>
          </div>
          <BaseTable
            rows={logPager.pageItems} pagination={logPager}
            columns={[
              { key: 'timestamp', header: 'Date & time', render: (r) => formatDateTime(r.timestamp), width: 175 },
              { key: 'penId', header: 'Pen', render: (r) => penName(r.penId), width: 100 },
              { key: 'feedType', header: 'Feed type' },
              { key: 'configuredKg', header: 'Configured', align: 'right', render: (r) => `${r.configuredKg} kg`, width: 100 },
              { key: 'reportedKg', header: 'Reported', align: 'right', render: (r) => (r.reportedKg != null ? `${r.reportedKg} kg` : '—'), width: 90 },
              { key: 'deviceId', header: 'Device', width: 80 },
              { key: 'state', header: 'Result', render: (r) => <StatusBadge status={r.state} />, width: 170 },
              { key: 'simulated', header: 'Source', render: (r) => (r.simulated ? <span className="badge muted">Simulated</span> : <span className="badge ok">Device</span>), width: 100 },
            ]}
          />
        </div>
      )}

      {tab === 'devices' && (
        <>
          <div className="notice" style={{ marginBottom: 14 }}>
            <Wifi size={15} />
            <span>
              Feeder devices are simulated in this prototype. A test command only exercises the interface;
              no physical hardware is actuated until the backend and ESP32 firmware are connected.
            </span>
          </div>
          <div className="card">
            <BaseTable
              rows={feederDevices}
              columns={[
                { key: 'name', header: 'Device' },
                { key: 'penId', header: 'Pen', render: (r) => penName(r.penId), width: 100 },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />, width: 130 },
                { key: 'lastSeen', header: 'Last seen', render: (r) => relativeTime(r.lastSeen), width: 110 },
                { key: 'lastCommand', header: 'Last command' },
                { key: 'firmware', header: 'Firmware', width: 120 },
                {
                  key: 'actions', header: 'Test', width: 150,
                  render: (r) => (
                    <BaseButton size="sm" variant="secondary" icon={Send} loading={testing === r.id} onClick={() => testDevice(r)}>
                      Test 1 kg
                    </BaseButton>
                  ),
                },
              ]}
            />
          </div>
          <div className="hint" style={{ marginTop: 8 }}>Latest data refresh: {formatDate(new Date())}</div>
        </>
      )}

      <RecordForm
        open={form.open} title={editing ? `Edit schedule ${editing.id}` : 'Add feeding schedule'}
        fields={fields} initial={editing} onSubmit={saveSchedule} onClose={() => setForm({ open: false, editing: null })}
        submitLabel={editing ? 'Save changes' : 'Create schedule'}
      />
      <ConfirmDialog
        open={Boolean(toDelete)} title="Delete this schedule?"
        message={`Schedule ${toDelete?.id} will be removed. Existing feeding logs are kept.`}
        confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setToDelete(null)}
      />
    </>
  );
}
