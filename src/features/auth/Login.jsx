import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Info, AlertCircle } from 'lucide-react';
import BaseInput from '@/components/common/BaseInput';
import BaseButton from '@/components/common/BaseButton';
import { validate, required, minLength } from '@/utils/validators';
import { login, DEMO_ACCOUNTS, isRealAuthConfigured } from './authService';
import { useAuthStore } from './authStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((s) => s.login);

  const [values, setValues] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((v) => ({ ...v, [field]: '' }));
    setFormError('');
  };

  const fillDemo = (acct) => {
    setValues({ username: acct.username, password: acct.password });
    setErrors({}); setFormError('');
  };

  async function onSubmit(e) {
    e.preventDefault();
    const { errors: errs, valid } = validate(values, {
      username: [required('Username or email')],
      password: [required('Password'), minLength('Password', 6)],
    });
    setErrors(errs);
    if (!valid) return;

    setBusy(true);
    try {
      const { user } = await login(values);
      setUser(user);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h2 style={{ fontSize: 21 }}>Welcome back</h2>
      <p style={{ color: 'var(--gray-500)', marginTop: 4, marginBottom: 20 }}>
        Please sign in to your account.
      </p>

      {formError && (
        <div className="notice warn" style={{ marginBottom: 14 }}>
          <AlertCircle size={16} /> <span>{formError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <BaseInput
          label="Username or email" required autoComplete="username"
          value={values.username} onChange={onChange('username')}
          error={errors.username} placeholder="admin"
        />
        <BaseInput
          label="Password" type="password" required autoComplete="current-password"
          value={values.password} onChange={onChange('password')}
          error={errors.password} placeholder="••••••••"
        />
        <BaseButton type="submit" block loading={busy} icon={LogIn}>
          {busy ? 'Signing in…' : 'Login'}
        </BaseButton>
      </form>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <Link to="/forgot-password" className="btn btn-ghost btn-sm">Forgot password?</Link>
      </div>

      <div className="card mt-16">
        <div className="card-body" style={{ padding: 14 }}>
          <div className="row" style={{ marginBottom: 9 }}>
            <Info size={15} color="var(--info)" />
            <strong style={{ fontSize: 12.5 }}>Demo accounts (password: demo1234)</strong>
          </div>
          <div className="pill-roles">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.username} type="button" className="pill" onClick={() => fillDemo(a)}>
                {a.role}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 10 }}>
            {isRealAuthConfigured()
              ? 'A backend URL is configured, but this screen still uses the local demo check until the real endpoint is wired in.'
              : 'Authentication is simulated in the browser. It is not secure and must be replaced with a server-side login before real use.'}
          </p>
        </div>
      </div>
    </div>
  );
}
