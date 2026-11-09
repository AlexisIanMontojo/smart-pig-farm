import { useMemo, useState } from 'react';
import { Thermometer, Droplets, Settings2, FlaskConical } from 'lucide-react';
import BaseTable from '@/components/common/BaseTable';
import BaseButton from '@/components/common/BaseButton';
import BaseSelect from '@/components/common/BaseSelect';
import StatusBadge from '@/components/common/StatusBadge';
import RecordForm from '@/components/common/RecordForm';
import DashboardChart from '@/components/dashboard/DashboardChart';
import useRole from '@/hooks/useRole';
import { useDataStore } from '@/stores/dataStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { readingState } from '@/utils/envRules';
import { formatDateTime, relativeTime } from '@/utils/dateUtils';

export default function Environment() {
  const { pens, sensorReadings, settings, addItem, updateSettings, logActivity } = useDataStore();
  const { canManage, actor } = useRole();
  const push = useNotificationStore((s) => s.push);
  const t = settings.thresholds;

  const sensors = pens.filter((p) => p.sensorId);
  const [sensorId, setSensorId] = useState(sensors[0]?.sensorId || '');
  const [hours, setHours] = useState('24');
  const [editOpen, setEditOpen] = useState(false);

  const latest = useMemo(() => {
    const m = {};
    sensorReadings.forEach((r) => {
      if (!m[r.sensorId] || new Date(r.timestamp) > new Date(m[r.sensorId].timestamp)) m[r.sensorId] = r;
    });
    return m;
  }, [sensorReadings]);

  const series = useMemo(() => {
    const since = Date.now() - Number(hours) * 3600000;
    return sensorReadings
      .filter((r) => r.sensorId === sensorId && new Date(r.timestamp).getTime() >= since)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [sensorReadings, sensorId, hours]);

  const breaches = useMemo(() => {
    const since = Date.now() - 48 * 3600000;
    return sensorReadings
      .filter((r) => new Date(r.timestamp).getTime() >= since && readingState(r, t).label !== 'Normal')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  }, [sensorReadings, t]);

  const chartData = {
    labels: series.map((r) => new Date(r.timestamp).toLocaleString('en-PH', { month: 'short', day: '2-digit', hour: '2-digit' })),
    datasets: [
      { label: 'Temperature (°C)', data: series.map((r) => r.temperatureC), borderColor: '#1b5e20', backgroundColor: 'rgba(47,143,67,.14)', fill: true, tension: 0.35, pointRadius: 0, yAxisID: 'y' },
      { label: 'Humidity (%)', data: series.map((r) => r.humidityPct), borderColor: '#1d5f8a', fill: false, tension: 0.35, pointRadius: 0, yAxisID: 'y1' },
      { label: `Max temp ${t.tempMax} °C`, data: series.map(() => t.tempMax), borderColor: '#a32020', borderDash: [6, 4], pointRadius: 0, fill: false, yAxisID: 'y' },
    ],
  };

  const thresholdFields = [
    { name: 'tempMin', label: 'Minimum temperature (°C)', type: 'number', step: '0.5', min: -10, max: 60, required: true },
    {
      name: 'tempMax', label: 'Maximum temperature (°C)', type: 'number', step: '0.5', min: -10, max: 60, required: true,
      validate: (v, vals) => (Number(v) <= Number(vals.tempMin) ? 'Maximum must be higher than the minimum.' : ''),
    },
    { name: 'humidityMin', label: 'Minimum humidity (%)', type: 'number', min: 0, max: 100, required: true },
    {
      name: 'humidityMax', label: 'Maximum humidity (%)', type: 'number', min: 0, max: 100, required: true,
      validate: (v, vals) => (Number(v) <= Number(vals.humidityMin) ? 'Maximum must be higher than the minimum.' : ''),
    },
  ];

  function saveThresholds(v) {
    updateSettings({ thresholds: v });
    logActivity('Environment', 'Updated environmental thresholds', 'Completed', actor);
    push('Thresholds saved.');
  }

  function simulate() {
    const pen = sensors.find((p) => p.sensorId === sensorId);
    if (!pen) return;
    const rec = addItem('sensorReadings', {
      sensorId, penId: pen.id, timestamp: new Date().toISOString(),
      temperatureC: Number((24 + Math.random() * 9).toFixed(1)), humidityPct: Math.round(52 + Math.random() * 32), simulated: true,
    }, 'SR');
    const st = readingState(rec, t);
    if (st.label === 'Normal') { push('Simulated reading recorded.'); return; }
    addItem('alerts', {
      category: 'Environmental Threshold', title: `${pen.name}: ${st.label}`,
      description: `Simulated reading ${rec.temperatureC} °C / ${rec.humidityPct}% is outside the configured thresholds.`,
      severity: 'Medium', at: rec.timestamp, link: '/environment', ref: sensorId, read: false, acknowledged: false,
    }, 'AL');
    push(`${st.label} — an alert was created.`, 'warn');
  }

  return (
    <>
      <div className="notice" style={{ marginBottom: 14 }}>
        <Thermometer size={15} />
        <span>
          Readings are simulated. The planned setup uses DHT22 sensors on an ESP32 for temperature and humidity only;
          no air-quality sensor is included.
        </span>
      </div>

      <div className="grid g-3">
        {sensors.map((pen) => {
          const r = latest[pen.sensorId];
          const st = r ? readingState(r, t) : null;
          return (
            <div className="card" key={pen.sensorId}>
              <div className="card-head">
                <h3>{pen.name}</h3><span className="badge muted">{pen.sensorId}</span><div className="spacer" />
                {st ? <StatusBadge status={st.label} tone={st.tone} /> : <StatusBadge status="No data" tone="muted" />}
              </div>
              <div className="card-body">
                {r ? (
                  <div className="row" style={{ gap: 22 }}>
                    <div><div className="lbl"><Thermometer size={13} /> Temperature</div><div className="val" style={{ fontSize: 22, fontWeight: 700 }}>{r.temperatureC} °C</div></div>
                    <div><div className="lbl"><Droplets size={13} /> Humidity</div><div className="val" style={{ fontSize: 22, fontWeight: 700 }}>{r.humidityPct} %</div></div>
                  </div>
                ) : <div className="hint">No readings received from this sensor yet.</div>}
                {r && <div className="hint" style={{ marginTop: 8 }}>Updated {relativeTime(r.timestamp)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid g-2 mt-16" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap' }}>
            <h3>Reading history</h3><div className="spacer" />
            <div style={{ minWidth: 150 }}><BaseSelect options={sensors.map((p) => ({ value: p.sensorId, label: `${p.name} (${p.sensorId})` }))} value={sensorId} onChange={(e) => setSensorId(e.target.value)} /></div>
            <div style={{ minWidth: 120 }}><BaseSelect options={[{ value: '24', label: 'Last 24 h' }, { value: '48', label: 'Last 48 h' }, { value: '168', label: 'Last 7 days' }]} value={hours} onChange={(e) => setHours(e.target.value)} /></div>
          </div>
          <div className="card-body">
            {series.length ? (
              <DashboardChart
                type="line" height={260} data={chartData}
                options={{ scales: { y: { position: 'left', grid: { color: '#eef2ef' } }, y1: { position: 'right', grid: { display: false } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } } } }}
              />
            ) : <div className="empty">No readings in this period for the selected sensor.</div>}
            <div className="row" style={{ marginTop: 12 }}>
              <BaseButton variant="secondary" size="sm" icon={FlaskConical} onClick={simulate}>Simulate a reading</BaseButton>
              <span className="hint">Adds one sample reading to the selected sensor. Out-of-range values raise an alert.</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Thresholds</h3><div className="spacer" />
            {canManage && <BaseButton variant="secondary" size="sm" icon={Settings2} onClick={() => setEditOpen(true)}>Edit</BaseButton>}
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 10, fontSize: 13 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}><span style={{ color: 'var(--gray-500)' }}>Temperature</span><strong>{t.tempMin} – {t.tempMax} °C</strong></div>
            <div className="row" style={{ justifyContent: 'space-between' }}><span style={{ color: 'var(--gray-500)' }}>Humidity</span><strong>{t.humidityMin} – {t.humidityMax} %</strong></div>
            <div className="hint">Thresholds are farm-defined and apply to every pen sensor.</div>
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-head"><h3>Recent threshold breaches (48 h)</h3><div className="spacer" /><span className="badge muted">{breaches.length}</span></div>
        <BaseTable
          rows={breaches}
          empty={<div className="empty">No readings outside the configured thresholds in the last 48 hours.</div>}
          columns={[
            { key: 'timestamp', header: 'Date & time', render: (r) => formatDateTime(r.timestamp), width: 180 },
            { key: 'sensorId', header: 'Sensor', width: 100 },
            { key: 'penId', header: 'Pen', width: 90 },
            { key: 'temperatureC', header: 'Temp', render: (r) => `${r.temperatureC} °C`, width: 90 },
            { key: 'humidityPct', header: 'Humidity', render: (r) => `${r.humidityPct} %`, width: 90 },
            { key: 'state', header: 'Finding', render: (r) => { const s = readingState(r, t); return <StatusBadge status={s.label} tone={s.tone} />; } },
          ]}
        />
      </div>

      <RecordForm
        open={editOpen} title="Edit thresholds" fields={thresholdFields} initial={t}
        onSubmit={saveThresholds} onClose={() => setEditOpen(false)} submitLabel="Save thresholds"
      />
    </>
  );
}
