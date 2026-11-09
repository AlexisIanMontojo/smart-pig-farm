import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import BaseInput from '@/components/common/BaseInput';
import BaseButton from '@/components/common/BaseButton';
import { validate, required, isEmail } from '@/utils/validators';
import { requestPasswordReset } from './authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    const { errors, valid } = validate({ email }, { email: [required('Email'), isEmail()] });
    setError(errors.email || '');
    if (!valid) return;
    setBusy(true);
    setResult(await requestPasswordReset(email));
    setBusy(false);
  }

  return (
    <div className="auth-card">
      <h2 style={{ fontSize: 20 }}>Reset your password</h2>
      <p style={{ color: 'var(--gray-500)', marginTop: 4, marginBottom: 18 }}>
        Enter the email linked to your account.
      </p>

      {result ? (
        <div className="notice" style={{ marginBottom: 16 }}>
          <MailCheck size={17} /> <span>{result.message}</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <BaseInput
            label="Email address" type="email" required value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            error={error} placeholder="you@erwinspiggery.ph"
          />
          <BaseButton type="submit" block loading={busy}>Send reset instructions</BaseButton>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <Link to="/login" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Back to login</Link>
      </div>
    </div>
  );
}
