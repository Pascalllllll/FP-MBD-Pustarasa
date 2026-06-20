import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';

const DEMO = [
  { role: 'Administrator', u: 'admin', p: 'admin123' },
  { role: 'Pustakawan', u: 'pustakawan', p: 'staff123' },
  { role: 'Penjual', u: 'penjual', p: 'staff123' },
  { role: 'Pengunjung (lihat-saja)', u: 'pengunjung', p: 'lihat123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(username.trim(), password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const quickFill = (d) => {
    setUsername(d.u);
    setPassword(d.p);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — the hero: dual-world gradient with amber "rasa" */}
      <div className="relative hidden overflow-hidden bg-library-ink lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 120% at 0% 0%, #7C3AED 0%, #4C1D95 45%, #2E1065 100%)',
          }}
        />
        {/* warm canteen glow bleeding in from the bottom-right */}
        <div
          className="animate-blob absolute -bottom-32 -right-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
        />
        <div
          className="animate-blob absolute -left-20 top-1/3 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)', animationDelay: '-11s' }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <span className="font-display text-3xl font-extrabold tracking-tight">
            pusta<span className="text-canteen">rasa</span>.
          </span>
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight">
              Satu tempat untuk
              <br />
              <span className="text-canteen">membaca</span> dan{' '}
              <span className="text-white/90">menikmati rasa.</span>
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              Sistem terpadu pengelolaan perpustakaan dan kantin PustaRasa —
              sirkulasi buku, kunjungan, menu, dan transaksi kasir dalam satu dasbor.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <span>Perpustakaan</span>
            <span className="text-canteen">Kantin</span>
            <span>Ruang Baca</span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-3xl font-extrabold tracking-tight text-ink">
              pusta<span className="text-canteen">rasa</span>
              <span className="text-library">.</span>
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-ink">Masuk ke akun</h2>
          <p className="mt-1 text-sm text-muted">Gunakan kredensial petugas Anda.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <Alert type="error">{error}</Alert>}
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Kata Sandi</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-line bg-surface p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Akun demo (klik untuk isi)
            </p>
            <div className="space-y-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.u}
                  type="button"
                  onClick={() => quickFill(d)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-paper"
                >
                  <span className="font-medium">{d.role}</span>
                  <span className="font-mono text-xs text-muted">
                    {d.u} / {d.p}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
