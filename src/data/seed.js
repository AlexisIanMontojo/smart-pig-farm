import { READINESS } from '@/utils/harvestRules';

/** Deterministic pseudo-random so the demo dataset is stable between reloads. */
function lcg(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}
const rand = lcg(20261013);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const isoDate = (daysAgo) => iso(daysAgo).slice(0, 10);

const BREEDS = ['Landrace', 'Large White', 'Duroc', 'Pietrain', 'Landrace x Large White'];
const HEALTH = ['Healthy', 'Healthy', 'Healthy', 'Healthy', 'Under Treatment'];

export function buildSeed() {
  /* ---------------- Pens ---------------- */
  const pens = Array.from({ length: 12 }, (_, i) => ({
    id: `PEN-${String(i + 1).padStart(2, '0')}`,
    name: `Pen ${i + 1}`,
    capacity: i < 4 ? 12 : i < 8 ? 10 : 6,
    purpose: i < 4 ? 'Grower' : i < 8 ? 'Finisher' : 'Breeding / Farrowing',
    status: i === 11 ? 'Under Maintenance' : 'Active',
    sensorId: i < 6 ? `SEN-${String(i + 1).padStart(2, '0')}` : null,
  }));

  /* ---------------- Pigs ---------------- */
  const pigs = [];
  for (let i = 1; i <= 96; i += 1) {
    const isSow = i > 84;
    const ageDays = isSow ? 420 + Math.floor(rand() * 300) : 45 + Math.floor(rand() * 160);
    const pen = isSow ? pens[8 + (i % 4)] : pens[i % 8];
    pigs.push({
      id: `PG-${String(i).padStart(3, '0')}`,
      tagNo: `PG-${String(i).padStart(3, '0')}`,
      label: isSow ? `Sow ${i - 84}` : '',
      breed: pick(BREEDS),
      sex: isSow ? 'Female' : rand() > 0.5 ? 'Male' : 'Female',
      birthDate: isoDate(ageDays),
      penId: pen.id,
      currentWeightKg: isSow ? 150 + Math.round(rand() * 60) : Math.max(8, Math.round((ageDays / 205) * 95 + rand() * 7)),
      healthStatus: pick(HEALTH),
      reproductiveStatus: isSow ? pick(['Pregnant', 'Open', 'Lactating', 'Pregnant']) : 'Not Applicable',
      stage: isSow ? 'Breeding Sow' : ageDays < 60 ? 'Piglet' : ageDays < 130 ? 'Grower' : 'Finisher',
      dateAdded: isoDate(ageDays - 2 > 0 ? ageDays - 2 : 1),
      archived: false,
      notes: '',
    });
  }

  /* ---------------- Weight records ---------------- */
  const weightRecords = [];
  pigs.forEach((p) => {
    const points = 3;
    for (let k = points; k >= 1; k -= 1) {
      const daysAgo = k * 14 - Math.floor(rand() * 3);
      const w = Math.max(5, p.currentWeightKg - (k - 1) * (4 + rand() * 4));
      weightRecords.push({
        id: `WR-${p.id}-${k}`,
        pigId: p.id,
        date: isoDate(daysAgo),
        weightKg: Number(w.toFixed(1)),
        recordedBy: 'Maria Santos',
        notes: 'Sample data',
        reviewed: false,
      });
    }
  });

  /* ---------------- Feeding ---------------- */
  const feedTypes = ['Starter Feed', 'Grower Feed', 'Finisher Feed', 'Gestating Sow Feed'];
  const feedingSchedules = pens.slice(0, 8).flatMap((pen, i) => ([
    {
      id: `FS-${String(i * 2 + 1).padStart(3, '0')}`,
      penId: pen.id,
      feedType: feedTypes[i % 4],
      amountKg: 4 + (i % 3),
      time: '07:00',
      recurrence: 'Daily',
      startDate: isoDate(60),
      endDate: '',
      enabled: true,
      status: 'Scheduled',
      deviceId: `FD-${String((i % 4) + 1).padStart(2, '0')}`,
    },
    {
      id: `FS-${String(i * 2 + 2).padStart(3, '0')}`,
      penId: pen.id,
      feedType: feedTypes[i % 4],
      amountKg: 4 + (i % 3),
      time: '17:00',
      recurrence: 'Daily',
      startDate: isoDate(60),
      endDate: '',
      enabled: i !== 6,
      status: i !== 6 ? 'Scheduled' : 'Disabled',
      deviceId: `FD-${String((i % 4) + 1).padStart(2, '0')}`,
    },
  ]));

  const feedingLogs = Array.from({ length: 24 }, (_, i) => {
    const sched = feedingSchedules[i % feedingSchedules.length];
    const confirmed = rand() > 0.18;
    return {
      id: `FL-${String(i + 1).padStart(3, '0')}`,
      scheduleId: sched.id,
      penId: sched.penId,
      feedType: sched.feedType,
      configuredKg: sched.amountKg,
      deviceId: sched.deviceId,
      timestamp: iso(Math.floor(i / 4) + rand()),
      state: confirmed ? 'Dispensing Confirmed' : i % 7 === 0 ? 'Command Sent' : 'Failed',
      reportedKg: confirmed ? sched.amountKg : null,
      simulated: true,
    };
  });

  const feederDevices = Array.from({ length: 4 }, (_, i) => ({
    id: `FD-${String(i + 1).padStart(2, '0')}`,
    name: `ESP32 Feeder ${i + 1}`,
    penId: pens[i].id,
    status: i === 3 ? 'Device Offline' : 'Online',
    lastSeen: iso(i === 3 ? 1.4 : 0.01),
    lastCommand: i === 3 ? 'Dispense 5 kg (unacknowledged)' : 'Dispense 5 kg',
    firmware: 'v0.4.0-mock',
    simulated: true,
  }));

  /* ---------------- Medication ---------------- */
  const medicationSchedules = [
    { id: 'M-001', pigId: 'PG-003', medicine: 'Antibiotic (vet-prescribed)', dose: 5, unit: 'ml', scheduledAt: iso(-2), frequency: 'Once daily', status: 'Pending', notes: 'Per veterinary instruction sheet.' },
    { id: 'M-002', pigId: 'PG-007', medicine: 'Vitamin supplement', dose: 3, unit: 'ml', scheduledAt: iso(0), frequency: 'Weekly', status: 'Scheduled', notes: '' },
    { id: 'M-003', pigId: 'PG-010', medicine: 'Dewormer', dose: 3, unit: 'ml', scheduledAt: iso(1), frequency: 'Quarterly', status: 'Completed', notes: '' },
    { id: 'M-004', pigId: 'PG-022', medicine: 'Iron supplement', dose: 2, unit: 'ml', scheduledAt: iso(-1), frequency: 'Once', status: 'Pending', notes: '' },
  ];
  const treatmentRecords = [
    { id: 'TR-001', pigId: 'PG-010', medicine: 'Dewormer', dose: 3, unit: 'ml', administeredAt: iso(1), recordedBy: 'Maria Santos', notes: 'No adverse reaction observed.', status: 'Completed' },
    { id: 'TR-002', pigId: 'PG-003', medicine: 'Antibiotic (vet-prescribed)', dose: 5, unit: 'ml', administeredAt: iso(2), recordedBy: 'Pedro Reyes', notes: 'Day 1 of course.', status: 'Completed' },
  ];

  /* ---------------- Environment ---------------- */
  const sensorReadings = [];
  for (let h = 47; h >= 0; h -= 1) {
    ['SEN-01', 'SEN-02', 'SEN-03'].forEach((sid, idx) => {
      sensorReadings.push({
        id: `SR-${h}-${idx}`,
        sensorId: sid,
        penId: pens[idx].id,
        timestamp: new Date(Date.now() - h * 3600000).toISOString(),
        temperatureC: Number((26 + Math.sin(h / 3.6) * 2.6 + idx * 0.4 + rand() * 0.6).toFixed(1)),
        humidityPct: Math.round(62 + Math.cos(h / 4.2) * 7 + rand() * 3),
        simulated: true,
      });
    });
  }

  /* ---------------- Reproduction ---------------- */
  const sows = pigs.filter((p) => p.stage === 'Breeding Sow');
  const breedingRecords = sows.slice(0, 8).map((s, i) => ({
    id: `BR-${String(i + 1).padStart(3, '0')}`,
    sowId: s.id,
    boarRef: i % 3 === 0 ? 'AI semen batch SB-2026-04' : `Boar PG-0${80 + (i % 4)}`,
    breedingDate: isoDate(20 + i * 9),
    method: i % 3 === 0 ? 'Artificial Insemination' : 'Natural Service',
    recordedBy: 'Juan Dela Cruz',
    status: i < 5 ? 'Confirmed Pregnant' : 'Awaiting Confirmation',
    notes: '',
  }));
  const pregnancies = breedingRecords.filter((b) => b.status === 'Confirmed Pregnant').map((b, i) => ({
    id: `PR-${String(i + 1).padStart(3, '0')}`,
    sowId: b.sowId,
    breedingRecordId: b.id,
    breedingDate: b.breedingDate,
    status: 'Pregnant',
    lastCheckDate: isoDate(5 + i),
    notes: '',
  }));
  const farrowingRecords = [
    { id: 'FR-001', sowId: sows[8]?.id || 'PG-093', farrowingDate: isoDate(26), totalBorn: 12, liveBorn: 11, stillborn: 1, notes: 'Sample record.', followUp: 'Completed' },
    { id: 'FR-002', sowId: sows[9]?.id || 'PG-094', farrowingDate: isoDate(9), totalBorn: 10, liveBorn: 10, stillborn: 0, notes: 'Sample record.', followUp: 'Monitoring' },
  ];

  /* ---------------- Inventory ---------------- */
  const inventory = [
    { id: 'INV-001', name: 'Grower Feed', category: 'Feed', quantity: 250, unit: 'kg', minLevel: 150, updatedAt: iso(0.2) },
    { id: 'INV-002', name: 'Starter Feed', category: 'Feed', quantity: 120, unit: 'kg', minLevel: 100, updatedAt: iso(1) },
    { id: 'INV-003', name: 'Finisher Feed', category: 'Feed', quantity: 80, unit: 'kg', minLevel: 120, updatedAt: iso(0.5) },
    { id: 'INV-004', name: 'Vitamin Supplement', category: 'Medicine', quantity: 20, unit: 'pcs', minLevel: 25, updatedAt: iso(3) },
    { id: 'INV-005', name: 'Antibiotic (vet-prescribed)', category: 'Medicine', quantity: 15, unit: 'pcs', minLevel: 10, updatedAt: iso(4) },
    { id: 'INV-006', name: 'Disinfectant', category: 'Supplies', quantity: 10, unit: 'L', minLevel: 5, updatedAt: iso(6) },
  ];
  const stockMovements = [
    { id: 'SM-001', itemId: 'INV-001', type: 'Stock In', quantity: 300, at: iso(7), by: 'Juan Dela Cruz', note: 'Supplier delivery' },
    { id: 'SM-002', itemId: 'INV-001', type: 'Stock Out', quantity: 50, at: iso(2), by: 'Pedro Reyes', note: 'Pen 1-4 feeding' },
  ];

  /* ---------------- Finance ---------------- */
  const transactions = [
    { id: 'TX-001', type: 'Expense', date: isoDate(25), category: 'Feed', description: 'Grower feed 300 kg', amount: 10500, method: 'Cash', recordedBy: 'Juan Dela Cruz', notes: 'Sample data' },
    { id: 'TX-002', type: 'Expense', date: isoDate(18), category: 'Medication', description: 'Vet supplies', amount: 3200, method: 'GCash', recordedBy: 'Maria Santos', notes: 'Sample data' },
    { id: 'TX-003', type: 'Income', date: isoDate(12), category: 'Livestock Sale', description: '4 finisher pigs', amount: 46000, method: 'Bank Transfer', recordedBy: 'Juan Dela Cruz', notes: 'Sample data' },
    { id: 'TX-004', type: 'Expense', date: isoDate(6), category: 'Utilities', description: 'Electricity', amount: 2800, method: 'Cash', recordedBy: 'Juan Dela Cruz', notes: 'Sample data' },
    { id: 'TX-005', type: 'Income', date: isoDate(3), category: 'Livestock Sale', description: '2 finisher pigs', amount: 23500, method: 'Cash', recordedBy: 'Maria Santos', notes: 'Sample data' },
  ];

  /* ---------------- Users ---------------- */
  const users = [
    { id: 1, name: 'Juan Dela Cruz', username: 'juan123', email: 'juan@erwinspiggery.ph', role: 'Administrator', status: 'Active', lastActivity: iso(0.05) },
    { id: 2, name: 'Maria Santos', username: 'maria01', email: 'maria@erwinspiggery.ph', role: 'Farm Manager', status: 'Active', lastActivity: iso(0.3) },
    { id: 3, name: 'Pedro Reyes', username: 'pedro02', email: 'pedro@erwinspiggery.ph', role: 'Farm Manager', status: 'Active', lastActivity: iso(1.1) },
    { id: 4, name: 'Ana Lopez', username: 'ana03', email: 'ana@erwinspiggery.ph', role: 'Farm Worker', status: 'Inactive', lastActivity: iso(22) },
  ];

  /* ---------------- Alerts & activity ---------------- */
  const alerts = [
    { id: 'AL-001', category: 'Low Inventory', title: 'Finisher Feed below minimum level', description: '80 kg remaining against a 120 kg minimum.', severity: 'High', at: iso(0.3), link: '/inventory', ref: 'INV-003', read: false, acknowledged: false },
    { id: 'AL-002', category: 'Feeder Device Offline', title: 'ESP32 Feeder 4 has not reported', description: 'No device message received for over 33 hours.', severity: 'High', at: iso(1.4), link: '/feeding', ref: 'FD-04', read: false, acknowledged: false },
    { id: 'AL-003', category: 'Medication Task Due', title: 'Antibiotic dose pending for PG-003', description: 'Scheduled task has not been marked completed.', severity: 'Medium', at: iso(0.8), link: '/medication', ref: 'M-001', read: false, acknowledged: false },
    { id: 'AL-004', category: 'Environmental Threshold', title: 'Pen 2 temperature above warning threshold', description: 'Simulated reading of 30.4 °C exceeded the 30 °C warning threshold.', severity: 'Medium', at: iso(2.1), link: '/environment', ref: 'SEN-02', read: true, acknowledged: false },
    { id: 'AL-005', category: 'Expected Farrowing', title: 'Farrowing window approaching', description: 'An estimated farrowing date falls within the next 10 days.', severity: 'Low', at: iso(3), link: '/reproduction', ref: 'PR-001', read: true, acknowledged: true },
  ];

  const activities = [
    { id: 'AC-001', at: iso(0.1), type: 'Feeding', detail: 'Pen 1 — 5 kg Grower Feed', status: 'Completed', by: 'System (simulated)' },
    { id: 'AC-002', at: iso(0.4), type: 'Medication', detail: 'PG-010 — Dewormer 3 ml', status: 'Completed', by: 'Maria Santos' },
    { id: 'AC-003', at: iso(0.6), type: 'Inventory', detail: 'Finisher Feed stock out 20 kg', status: 'Completed', by: 'Pedro Reyes' },
    { id: 'AC-004', at: iso(1.2), type: 'Alert', detail: 'Low feed stock detected', status: 'Pending', by: 'System' },
    { id: 'AC-005', at: iso(1.9), type: 'Reproduction', detail: 'Pregnancy check recorded for a sow', status: 'Completed', by: 'Juan Dela Cruz' },
  ];

  const screenings = [
    { id: 'SC-001', pigId: 'PG-003', at: iso(1.1), label: 'Possible skin lesion', confidence: 0.78, simulated: true, review: 'Needs Review', imageName: 'sample-capture-01.jpg' },
    { id: 'SC-002', pigId: 'PG-014', at: iso(4.2), label: 'No visible abnormality', confidence: 0.91, simulated: true, review: 'Reviewed', imageName: 'sample-capture-02.jpg' },
  ];

  const settings = {
    farm: { name: "Erwin's Piggery", owner: 'Erwin', location: 'Philippines', contact: '' },
    thresholds: { tempMin: 18, tempMax: 30, humidityMin: 50, humidityMax: 80 },
    harvest: { targetWeightKg: 90, nearReadyMarginKg: 12, minAgeDays: 150, staleRecordDays: 21 },
    display: { weightUnit: 'kg', currency: 'PHP', pageSize: 10 },
    notifications: { inApp: true, email: false, sms: false },
    demoMode: true,
  };

  return {
    pens, pigs, weightRecords, feedingSchedules, feedingLogs, feederDevices,
    medicationSchedules, treatmentRecords, sensorReadings,
    breedingRecords, pregnancies, farrowingRecords,
    inventory, stockMovements, transactions, users, alerts, activities, screenings, settings,
  };
}

export const READINESS_ORDER = [READINESS.READY, READINESS.NEAR, READINESS.NOT_YET, READINESS.NO_DATA];
