import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiggyBank, Grid2x2, UtensilsCrossed, Wheat, Syringe, HeartPulse, CalendarClock,
  Scale, BellRing, Thermometer, Droplets, Wifi, WifiOff, Plus, Camera, Activity, FlaskConical,
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import DashboardChart from '@/components/dashboard/DashboardChart';
import ActivityTable from '@/components/dashboard/ActivityTable';
import StatusBadge from '@/components/common/StatusBadge';
import BaseButton from '@/components/common/BaseButton';
import { useDataStore } from '@/stores/dataStore';
import { classifyHarvestReadiness, READINESS } from '@/utils/harvestRules';
import { formatDateTime, formatTime, relativeTime, todayISO, addDays } from '@/utils/dateUtils';
import { num, kg } from '@/utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const s = useDataStore();

  const m = useMemo(() => {
    const pigs = s.pigs.filter((p) => !p.archived);
    const activePens = s.pens.filter((p) => p.status === 'Active');
    const today = todayISO();

    const feedingToday = s.feedingLogs.filter((l) => l.timestamp.slice(0, 10) === today);
    const feedStock = s.inventory.filter((i) => i.category === 'Feed').reduce((a, i) => a + i.quantity, 0);
    const pendingMeds = s.medicationSchedules.filter((x) => x.status === 'Pending' || x.status === 'Scheduled');
    const pregnant = s.pregnancies.filter((p) => p.status === 'Pregnant');

    // Estimated farrowing = breeding date + 114 days (configurable rule, an estimate only)
    const expected = pregnant
      .map((p) => ({ ...p, estimate: addDays(p.breedingDate, 114) }))
      .filter((p) => p.estimate && p.estimate > new Date())
      .sort((a, b) => a.estimate - b.estimate);

    // Latest weight per pig -> readiness
    const latestWeight = {};
    s.weightRecords.forEach((w) => {
      if (!latestWeight[w.pigId] || new Date(w.date) > new Date(latestWeight[w.pigId].date)) latestWeight[w.pigId] = w;
    });
    const readiness = { [READINESS.READY]: 0, [READINESS.NEAR]: 0, [READINESS.NOT_YET]: 0, [READINESS.NO_DATA]: 0 };
    pigs.filter((p) => p.stage !== 'Breeding Sow').forEach((p) => {
      readiness[classifyHarvestReadiness(p, latestWeight[p.id], s.settings.harvest).status] += 1;
    });

    const byStage = pigs.reduce((acc, p) => { acc[p.stage] = (acc[p.stage] || 0) + 1; return acc; }, {});
    const byHealth = pigs.reduce((acc, p) => { acc[p.healthStatus] = (acc[p.healthStatus] || 0) + 1; return acc; }, {});
    const occupancy = s.pens.map((pen) => ({
      pen, count: pigs.filter((p) => p.penId === pen.id).length,
    }));

    const latestReading = [...s.sensorReadings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    const onlineDevices = s.feederDevices.filter((d) => d.status !== 'Device Offline').length;

    const nextSchedule = [...s.feedingSchedules]
      .filter((f) => f.enabled)
      .sort((a, b) => a.time.localeCompare(b.time))
      .find((f) => f.time > new Date().toTimeString().slice(0, 5)) || s.feedingSchedules.find((f) => f.enabled);

    const lastFeeding = [...s.feedingLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const avgWeight = pigs.length
      ? pigs.reduce((a, p) => a + (p.currentWeightKg || 0), 0) / pigs.length : 0;

    return {
      pigs, activePens, feedingToday, feedStock, pendingMeds, pregnant, expected,
      readiness, byStage, byHealth, occupancy, latestReading, onlineDevices,
      nextSchedule, lastFeeding, avgWeight,
      activeAlerts: s.alerts.filter((a) => !a.acknowledged).length,
    };
  }, [s]);

  /* ---- charts from the same mock records ---- */
  const popChart = {
    labels: Object.keys(m.byStage),
    datasets: [{
      data: Object.values(m.byStage),
      backgroundColor: ['#2f8f43', '#6aa84f', '#d9b26a', '#9a6b4f', '#1b5e20'],
      borderWidth: 0,
    }],
  };

  const tempSeries = useMemo(() => {
    const rows = s.sensorReadings
      .filter((r) => r.sensorId === 'SEN-01')
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-24);
    return {
      labels: rows.map((r) => new Date(r.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit' })),
      datasets: [
        { label: 'Temperature (°C)', data: rows.map((r) => r.temperatureC), borderColor: '#1b5e20', backgroundColor: 'rgba(47,143,67,.14)', fill: true, tension: .35, pointRadius: 0, yAxisID: 'y' },
        { label: 'Humidity (%)', data: rows.map((r) => r.humidityPct), borderColor: '#1d5f8a', backgroundColor: 'rgba(29,95,138,.1)', fill: false, tension: .35, pointRadius: 0, yAxisID: 'y1' },
      ],
    };
  }, [s.sensorReadings]);

  const quickActions = [
    { label: 'Add Pig', icon: Plus, to: '/pigs' },
    { label: 'Add Feeding Schedule', icon: UtensilsCrossed, to: '/feeding' },
    { label: 'Capture Pig Image', icon: Camera, to: '/ai-screening' },
    { label: 'Add Medication', icon: Syringe, to: '/medication' },
    { label: 'Record Breeding', icon: HeartPulse, to: '/reproduction' },
    { label: 'Record Weight', icon: Scale, to: '/growth-harvest' },
    { label: 'Add Inventory Item', icon: Wheat, to: '/inventory' },
    { label: 'Record Expense', icon: FlaskConical, to: '/finance' },
    { label: 'View Alerts', icon: BellRing, to: '/alerts' },
  ];

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 18 }}>Farm overview</h2>
        <span className="demo-flag"><Activity size={13} /> Demo Mode — all figures are sample data</span>
      </div>

      <div className="grid g-4">
        <StatCard icon={PiggyBank} label="Total Pigs" value={num(m.pigs.length)} sub={`${Object.keys(m.byStage).length} growth stages`} onClick={() => navigate('/pigs')} />
        <StatCard icon={Grid2x2} label="Active Pens" value={`${m.activePens.length} / ${s.pens.length}`} sub="Active of total pens" tone="info" />
        <StatCard icon={UtensilsCrossed} label="Feeding Events Today" value={num(m.feedingToday.length)} sub={`${m.feedingToday.filter((f) => f.state === 'Dispensing Confirmed').length} confirmed`} />
        <StatCard icon={Wheat} label="Feed Stock Remaining" value={kg(m.feedStock)} sub="All feed categories" tone={m.feedStock < 300 ? 'warn' : 'green'} />
        <StatCard icon={Syringe} label="Pending Medication Tasks" value={num(m.pendingMeds.length)} sub="Pending or scheduled" tone="warn" />
        <StatCard icon={HeartPulse} label="Pregnant Sows" value={num(m.pregnant.length)} sub="Confirmed records" tone="info" />
        <StatCard icon={CalendarClock} label="Expected Farrowings" value={num(m.expected.length)} sub="Estimated dates only" tone="info" />
        <StatCard icon={Scale} label="Pigs Near Harvest Readiness" value={num(m.readiness[READINESS.READY] + m.readiness[READINESS.NEAR])} sub={`${m.readiness[READINESS.READY]} ready · ${m.readiness[READINESS.NEAR]} near`} />
        <StatCard icon={BellRing} label="Active Alerts" value={num(m.activeAlerts)} sub="Unacknowledged" tone="danger" onClick={() => navigate('/alerts')} />
      </div>

      <div className="grid g-2 mt-16">
        <div className="card">
          <div className="card-head"><h3>Population Overview</h3><div className="spacer" /><span className="badge muted">{m.pigs.length} pigs</span></div>
          <div className="card-body">
            <DashboardChart type="doughnut" data={popChart} height={210} />
            <div className="grid g-2" style={{ marginTop: 14, gap: 8 }}>
              {Object.entries(m.byHealth).map(([k, v]) => (
                <div key={k} className="row" style={{ justifyContent: 'space-between', fontSize: 12.5 }}>
                  <StatusBadge status={k} /><strong>{v}</strong>
                </div>
              ))}
            </div>
            <div className="hint" style={{ marginTop: 10 }}>
              Pen occupancy: {m.occupancy.filter((o) => o.count > 0).length} of {s.pens.length} pens hold animals.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Environmental Status</h3><div className="spacer" />
            <span className="demo-flag">Simulated sensor data</span>
          </div>
          <div className="card-body">
            <div className="grid g-2">
              <StatCard icon={Thermometer} label="Temperature" value={`${m.latestReading?.temperatureC ?? '—'} °C`} sub={`Threshold ${s.settings.thresholds.tempMin}–${s.settings.thresholds.tempMax} °C`} tone={m.latestReading?.temperatureC > s.settings.thresholds.tempMax ? 'danger' : 'green'} />
              <StatCard icon={Droplets} label="Relative Humidity" value={`${m.latestReading?.humidityPct ?? '—'} %`} sub={`Threshold ${s.settings.thresholds.humidityMin}–${s.settings.thresholds.humidityMax} %`} tone="info" />
            </div>
            <div className="notice mt-16">
              <Wifi size={15} />
              <span>
                Last update {relativeTime(m.latestReading?.timestamp)} from {m.latestReading?.sensorId}.
                Air quality is not shown because no air-quality sensor is part of the planned DHT22 setup.
              </span>
            </div>
            <DashboardChart
              type="line" height={190} data={tempSeries}
              options={{ scales: { y: { position: 'left', grid: { color: '#eef2ef' } }, y1: { position: 'right', grid: { display: false } }, x: { grid: { display: false } } } }}
            />
          </div>
        </div>
      </div>

      <div className="grid g-3 mt-16">
        <div className="card">
          <div className="card-head"><h3>Feeding Status</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 10, fontSize: 13 }}>
            <Row label="Next scheduled feeding" value={m.nextSchedule ? `${formatTime(m.nextSchedule.time)} · ${m.nextSchedule.penId}` : 'None scheduled'} />
            <Row label="Last feeding event" value={m.lastFeeding ? formatDateTime(m.lastFeeding.timestamp) : '—'} />
            <Row label="Last event result" value={<StatusBadge status={m.lastFeeding?.state} />} />
            <Row label="Feeder devices online" value={`${m.onlineDevices} of ${s.feederDevices.length}`} />
            <Row label="Today's feeding events" value={num(m.feedingToday.length)} />
            {m.onlineDevices < s.feederDevices.length && (
              <div className="notice warn"><WifiOff size={15} /> <span>One or more simulated feeders have not reported recently.</span></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Reproduction Overview</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 10, fontSize: 13 }}>
            <Row label="Pregnant sows" value={num(m.pregnant.length)} />
            <Row label="Awaiting confirmation" value={num(s.breedingRecords.filter((b) => b.status === 'Awaiting Confirmation').length)} />
            <div>
              <div className="lbl" style={{ marginBottom: 6 }}>Next estimated farrowings</div>
              {m.expected.slice(0, 3).map((e) => (
                <div key={e.id} className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--gray-100)', padding: '5px 0' }}>
                  <span>{e.sowId}</span>
                  <span style={{ color: 'var(--gray-500)' }}>{e.estimate.toLocaleDateString('en-PH', { month: 'short', day: '2-digit' })}</span>
                </div>
              ))}
              <div className="hint">Dates are estimates calculated from the breeding date using a configurable 114-day rule.</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Growth &amp; Harvest Overview</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 10, fontSize: 13 }}>
            {[READINESS.READY, READINESS.NEAR, READINESS.NOT_YET, READINESS.NO_DATA].map((k) => (
              <div key={k} className="row" style={{ justifyContent: 'space-between' }}>
                <StatusBadge status={k} /><strong>{m.readiness[k]}</strong>
              </div>
            ))}
            <Row label="Average recorded weight" value={kg(m.avgWeight)} />
            <div className="hint">Weights are sample records entered manually; no weighing sensor is connected.</div>
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-head"><h3>Quick Actions</h3></div>
        <div className="card-body row">
          {quickActions.map(({ label, icon, to }) => (
            <BaseButton key={label} variant="secondary" icon={icon} onClick={() => navigate(to)}>{label}</BaseButton>
          ))}
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-head"><h3>Recent Activities</h3><div className="spacer" /><span className="badge muted">{s.activities.length} entries</span></div>
        <ActivityTable rows={s.activities.slice(0, 8)} />
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--gray-500)' }}>{label}</span>
      <strong style={{ fontWeight: 600 }}>{value}</strong>
    </div>
  );
}
