import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Scale, Syringe, ScanLine } from 'lucide-react';
import BaseButton from '@/components/common/BaseButton';
import BaseTable from '@/components/common/BaseTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import DashboardChart from '@/components/dashboard/DashboardChart';
import { useDataStore } from '@/stores/dataStore';
import { ageFromBirthDate, formatDate, formatDateTime } from '@/utils/dateUtils';
import { kg } from '@/utils/formatters';
import { classifyHarvestReadiness, readinessTone } from '@/utils/harvestRules';

export default function PigDetails() {
  const { pigId } = useParams();
  const navigate = useNavigate();
  const s = useDataStore();

  const pig = s.pigs.find((p) => p.id === pigId);

  const weights = useMemo(
    () => s.weightRecords.filter((w) => w.pigId === pigId).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [s.weightRecords, pigId],
  );
  const treatments = s.treatmentRecords.filter((t) => t.pigId === pigId);
  const screenings = s.screenings.filter((x) => x.pigId === pigId);
  const latest = weights[weights.length - 1];
  const readiness = pig ? classifyHarvestReadiness(pig, latest, s.settings.harvest) : null;

  if (!pig) {
    return <EmptyState title="Pig not found" message={`No record exists for ${pigId}.`} action={<BaseButton onClick={() => navigate('/pigs')}>Back to list</BaseButton>} />;
  }

  const chart = {
    labels: weights.map((w) => formatDate(w.date)),
    datasets: [{
      label: 'Recorded weight (kg)',
      data: weights.map((w) => w.weightKg),
      borderColor: '#1b5e20', backgroundColor: 'rgba(47,143,67,.16)', fill: true, tension: .3,
    }],
  };

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <BaseButton variant="secondary" icon={ArrowLeft} onClick={() => navigate('/pigs')}>Back</BaseButton>
        <h2 style={{ fontSize: 18 }}>{pig.id}{pig.label ? ` · ${pig.label}` : ''}</h2>
        <StatusBadge status={pig.healthStatus} />
        {pig.archived && <StatusBadge status="Archived" />}
        <div className="spacer" />
        <BaseButton variant="secondary" icon={Pencil} onClick={() => navigate('/pigs')}>Edit in list</BaseButton>
      </div>

      <div className="grid g-3">
        <div className="card">
          <div className="card-head"><h3>Profile</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 8, fontSize: 13 }}>
            <Line label="Tag number" value={pig.tagNo} />
            <Line label="Breed" value={pig.breed} />
            <Line label="Sex" value={pig.sex} />
            <Line label="Birth date" value={formatDate(pig.birthDate)} />
            <Line label="Age" value={ageFromBirthDate(pig.birthDate).label} />
            <Line label="Growth stage" value={pig.stage} />
            <Line label="Pen" value={pig.penId} />
            <Line label="Reproductive status" value={<StatusBadge status={pig.reproductiveStatus} />} />
            <Line label="Date added" value={formatDate(pig.dateAdded)} />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><Scale size={15} color="var(--green-700)" /><h3>Latest measurements</h3></div>
          <div className="card-body" style={{ display: 'grid', gap: 8, fontSize: 13 }}>
            <Line label="Current weight on record" value={kg(pig.currentWeightKg)} />
            <Line label="Latest weighing" value={latest ? `${kg(latest.weightKg)} on ${formatDate(latest.date)}` : 'No record'} />
            <Line label="Weight records" value={weights.length} />
            <Line label="Harvest readiness" value={<StatusBadge status={readiness.status} tone={readinessTone(readiness.status)} />} />
            <div className="hint">{readiness.reason}</div>
            <div className="notice warn" style={{ marginTop: 6 }}>
              Classification uses farm-defined thresholds only. It does not determine an optimal
              slaughter date, market price, or meat quality.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Weight history</h3></div>
          <div className="card-body">
            {weights.length > 1
              ? <DashboardChart data={chart} height={215} />
              : <EmptyState title="Not enough records" message="At least two weight records are needed to chart growth." />}
          </div>
        </div>
      </div>

      <div className="grid g-2 mt-16">
        <div className="card">
          <div className="card-head"><Syringe size={15} color="var(--green-700)" /><h3>Treatment records</h3></div>
          <BaseTable
            rows={treatments}
            columns={[
              { key: 'administeredAt', header: 'Date', render: (r) => formatDateTime(r.administeredAt) },
              { key: 'medicine', header: 'Medication' },
              { key: 'dose', header: 'Dose', render: (r) => `${r.dose} ${r.unit}` },
              { key: 'recordedBy', header: 'Recorded by' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            empty={<EmptyState title="No treatments recorded" message="Treatment entries made by authorized users will appear here." />}
          />
        </div>

        <div className="card">
          <div className="card-head"><ScanLine size={15} color="var(--green-700)" /><h3>Image screening history</h3></div>
          <BaseTable
            rows={screenings}
            columns={[
              { key: 'at', header: 'Date', render: (r) => formatDateTime(r.at) },
              { key: 'label', header: 'Result (sample)' },
              { key: 'confidence', header: 'Confidence', render: (r) => `${Math.round(r.confidence * 100)}% (simulated)` },
              { key: 'review', header: 'Review', render: (r) => <StatusBadge status={r.review} /> },
            ]}
            empty={<EmptyState title="No screenings yet" message="Captured images and their simulated results will be listed here." />}
          />
        </div>
      </div>
    </>
  );
}

function Line({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--gray-500)' }}>{label}</span>
      <strong style={{ fontWeight: 600 }}>{value}</strong>
    </div>
  );
}
