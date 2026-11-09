import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import BaseModal from '@/components/common/BaseModal';
import BaseInput from '@/components/common/BaseInput';
import BaseSelect from '@/components/common/BaseSelect';
import BaseButton from '@/components/common/BaseButton';
import { validate, required, isNumber, inRange, notFuture } from '@/utils/validators';
import { BREEDS, HEALTH_STATUSES, STAGES, REPRO_STATUSES, nextPigId } from './pigService';
import { useDataStore } from '@/stores/dataStore';
import { todayISO } from '@/utils/dateUtils';

const blank = {
  id: '', tagNo: '', label: '', breed: '', sex: 'Female', birthDate: '',
  penId: '', currentWeightKg: '', healthStatus: 'Healthy',
  reproductiveStatus: 'Not Applicable', stage: 'Piglet', notes: '',
};

export default function PigForm({ open, pig, onClose, onSaved }) {
  const { pigs, pens, addItem, updateItem, logActivity } = useDataStore();
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [capacityWarning, setCapacityWarning] = useState('');
  const editing = Boolean(pig);

  useEffect(() => {
    if (!open) return;
    setErrors({}); setCapacityWarning('');
    setValues(pig ? { ...blank, ...pig } : { ...blank, id: nextPigId(pigs), tagNo: nextPigId(pigs), birthDate: todayISO() });
  }, [open, pig, pigs]);

  const set = (field) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((v) => ({ ...v, [field]: '' }));
    if (field === 'penId') checkCapacity(value);
  };

  function checkCapacity(penId) {
    const pen = pens.find((p) => p.id === penId);
    if (!pen) return setCapacityWarning('');
    const occupants = pigs.filter((p) => p.penId === penId && !p.archived && p.id !== values.id).length;
    setCapacityWarning(
      occupants + 1 > pen.capacity
        ? `${pen.name} is at capacity (${occupants}/${pen.capacity}). Saving will exceed the configured limit.`
        : '',
    );
  }

  function onSubmit(e) {
    e.preventDefault();
    const { errors: errs, valid } = validate(values, {
      tagNo: [required('Tag number')],
      breed: [required('Breed')],
      sex: [required('Sex')],
      birthDate: [required('Birth date'), notFuture('Birth date')],
      penId: [required('Pen assignment')],
      currentWeightKg: [required('Current weight'), isNumber('Current weight'), inRange('Current weight', 0.5, 500)],
      stage: [required('Growth stage')],
    });
    setErrors(errs);
    if (!valid) return;

    const payload = { ...values, currentWeightKg: Number(values.currentWeightKg), archived: false };

    if (editing) {
      updateItem('pigs', pig.id, payload);
      logActivity('Pig Record', `Updated pig ${payload.id}`, 'Completed');
    } else {
      addItem('pigs', { ...payload, dateAdded: todayISO() }, 'PG');
      logActivity('Pig Record', `Registered new pig ${payload.id} in ${payload.penId}`, 'Completed');
    }
    onSaved?.(editing ? 'Pig record updated.' : 'New pig registered.');
    onClose();
  }

  return (
    <BaseModal
      open={open}
      width={660}
      title={editing ? `Edit pig ${pig.id}` : 'Add new pig'}
      onClose={onClose}
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose}>Cancel</BaseButton>
          <BaseButton onClick={onSubmit}>{editing ? 'Save changes' : 'Add pig'}</BaseButton>
        </>
      )}
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="grid g-2">
          <BaseInput label="Pig ID" value={values.id} disabled hint="Generated automatically." />
          <BaseInput label="Tag number" required value={values.tagNo} onChange={set('tagNo')} error={errors.tagNo} />
          <BaseInput label="Name or label" value={values.label} onChange={set('label')} placeholder="Optional" />
          <BaseSelect label="Breed" required options={BREEDS} placeholder="Select breed" value={values.breed} onChange={set('breed')} error={errors.breed} />
          <BaseSelect label="Sex" required options={['Female', 'Male']} value={values.sex} onChange={set('sex')} error={errors.sex} />
          <BaseInput label="Birth date" type="date" required max={todayISO()} value={values.birthDate} onChange={set('birthDate')} error={errors.birthDate} />
          <BaseSelect
            label="Pen assignment" required placeholder="Select pen" value={values.penId} onChange={set('penId')} error={errors.penId}
            options={pens.map((p) => ({ value: p.id, label: `${p.name} — ${p.purpose} (cap. ${p.capacity})` }))}
          />
          <BaseInput label="Current weight (kg)" required type="number" step="0.1" min="0.5" value={values.currentWeightKg} onChange={set('currentWeightKg')} error={errors.currentWeightKg} />
          <BaseSelect label="Growth stage" required options={STAGES} value={values.stage} onChange={set('stage')} error={errors.stage} />
          <BaseSelect label="Health record status" options={HEALTH_STATUSES} value={values.healthStatus} onChange={set('healthStatus')} />
          <BaseSelect label="Reproductive status" options={REPRO_STATUSES} value={values.reproductiveStatus} onChange={set('reproductiveStatus')}
                      hint="Applies to breeding animals only." />
        </div>

        {capacityWarning && (
          <div className="notice warn" style={{ marginBottom: 12 }}>
            <AlertTriangle size={16} /> <span>{capacityWarning}</span>
          </div>
        )}

        <div className="field">
          <label>Notes</label>
          <textarea className="control" rows={3} value={values.notes} onChange={set('notes')} placeholder="Optional observations" />
        </div>
      </form>
    </BaseModal>
  );
}
