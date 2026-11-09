import { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import BaseInput from './BaseInput';
import BaseSelect from './BaseSelect';
import BaseButton from './BaseButton';

/**
 * Config-driven form used by the module screens.
 * field: { name, label, type, options|fn, required, min, max, step, hint,
 *          default, full, disabled, hidden(values), validate(value, values) }
 */
const optionsOf = (f, values) => (typeof f.options === 'function' ? f.options(values) : f.options || []);

export function validateFields(fields, values) {
  const errors = {};
  fields.forEach((f) => {
    if (f.hidden?.(values) || f.disabled) return;
    const v = values[f.name];
    const empty = v === '' || v === null || v === undefined;
    if (f.required && empty) { errors[f.name] = `${f.label} is required.`; return; }
    if (empty) return;
    if (f.type === 'number') {
      const n = Number(v);
      if (Number.isNaN(n)) { errors[f.name] = `${f.label} must be a number.`; return; }
      if (f.min != null && n < f.min) { errors[f.name] = `${f.label} cannot be less than ${f.min}.`; return; }
      if (f.max != null && n > f.max) { errors[f.name] = `${f.label} cannot be greater than ${f.max}.`; return; }
    }
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      errors[f.name] = `${f.label} must be a valid email address.`; return;
    }
    const msg = f.validate?.(v, values);
    if (msg) errors[f.name] = msg;
  });
  return errors;
}

export function normalizeValues(fields, values) {
  const out = { ...values };
  fields.forEach((f) => {
    if (f.type === 'number' && out[f.name] !== '' && out[f.name] != null) out[f.name] = Number(out[f.name]);
    if (typeof out[f.name] === 'string' && f.type !== 'textarea') out[f.name] = out[f.name].trim();
  });
  return out;
}

export function buildValues(fields, initial) {
  const base = {};
  fields.forEach((f) => {
    base[f.name] = initial?.[f.name] ?? f.default ?? (f.type === 'checkbox' ? false : '');
  });
  return base;
}

export function FormFields({ fields, values, errors = {}, onChange, disabled }) {
  return (
    <div className="grid g-2">
      {fields.filter((f) => !f.hidden?.(values)).map((f) => {
        const off = disabled || f.disabled;
        const common = { label: f.label, required: f.required, hint: f.hint, error: errors[f.name], disabled: off };
        let control;
        if (f.type === 'select') {
          control = (
            <BaseSelect
              {...common} options={optionsOf(f, values)} placeholder={f.placeholder}
              value={values[f.name] ?? ''} onChange={(e) => onChange(f.name, e.target.value)}
            />
          );
        } else if (f.type === 'textarea') {
          control = (
            <div className="field">
              <label>{f.label}</label>
              <textarea
                className="control" rows={3} disabled={off} placeholder={f.placeholder}
                value={values[f.name] ?? ''} onChange={(e) => onChange(f.name, e.target.value)}
              />
              {f.hint && <div className="hint">{f.hint}</div>}
            </div>
          );
        } else if (f.type === 'checkbox') {
          control = (
            <div className="field">
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 0 }}>
                <input
                  type="checkbox" checked={!!values[f.name]} disabled={off}
                  onChange={(e) => onChange(f.name, e.target.checked)}
                />
                {f.label}
              </label>
              {f.hint && <div className="hint">{f.hint}</div>}
            </div>
          );
        } else {
          control = (
            <BaseInput
              {...common} type={f.type || 'text'} step={f.step} min={f.min} max={f.max}
              placeholder={f.placeholder} value={values[f.name] ?? ''}
              onChange={(e) => onChange(f.name, e.target.value)}
            />
          );
        }
        return (
          <div key={f.name} style={f.full || f.type === 'textarea' ? { gridColumn: '1 / -1' } : undefined}>
            {control}
          </div>
        );
      })}
    </div>
  );
}

export default function RecordForm({
  open, title, fields, initial, onSubmit, onClose, submitLabel = 'Save', width = 620, notice,
}) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setValues(buildValues(fields, initial));
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const change = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  };

  function submit(e) {
    e?.preventDefault();
    const errs = validateFields(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit(normalizeValues(fields, values));
    onClose();
  }

  return (
    <BaseModal
      open={open} title={title} width={width} onClose={onClose}
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose}>Cancel</BaseButton>
          <BaseButton onClick={submit}>{submitLabel}</BaseButton>
        </>
      )}
    >
      <form onSubmit={submit} noValidate>
        {notice && <div className="notice warn" style={{ marginBottom: 14 }}>{notice}</div>}
        <FormFields fields={fields} values={values} errors={errors} onChange={change} />
      </form>
    </BaseModal>
  );
}
