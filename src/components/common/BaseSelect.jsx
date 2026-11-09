export default function BaseSelect({ label, error, hint, required, options = [], placeholder, id, ...rest }) {
  const selectId = id || `s-${label?.replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).slice(2)}`;
  return (
    <div className="field">
      {label && <label htmlFor={selectId}>{label} {required && <span className="req">*</span>}</label>}
      <select id={selectId} className={`control ${error ? 'invalid' : ''}`} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const value = typeof o === 'object' ? o.value : o;
          const text = typeof o === 'object' ? o.label : o;
          return <option key={value} value={value}>{text}</option>;
        })}
      </select>
      {error ? <div className="err">{error}</div> : hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}
