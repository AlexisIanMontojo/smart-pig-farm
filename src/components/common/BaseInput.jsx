import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function BaseInput({
  label, error, hint, required, type = 'text', id, className = '', ...rest
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputId = id || `f-${label?.replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).slice(2)}`;

  return (
    <div className="field">
      {label && (
        <label htmlFor={inputId}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      <div className="input-affix">
        <input
          id={inputId}
          type={isPassword && show ? 'text' : type}
          className={`control ${error ? 'invalid' : ''} ${className}`}
          aria-invalid={!!error}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="affix-btn"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? <div className="err">{error}</div> : hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}
