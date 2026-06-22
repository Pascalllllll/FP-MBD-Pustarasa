import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';

export default function Triggers() {
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [values, setValues] = useState({});
  const [results, setResults] = useState({});

  useEffect(() => {
    api
      .get('/trigger')
      .then(setTriggers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setParam = (trgName, paramName, val) =>
    setValues((v) => ({ ...v, [trgName]: { ...v[trgName], [paramName]: val } }));

  const run = async (trg) => {
    setResults((r) => ({ ...r, [trg.name]: { busy: true } }));
    try {
      const value = await api.post(`/trigger/${trg.name}`, values[trg.name] || {});
      setResults((r) => ({ ...r, [trg.name]: { busy: false, value } }));
    } catch (e) {
      setResults((r) => ({ ...r, [trg.name]: { busy: false, error: e.message } }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Uji Trigger"
        service="manajemen"
        description=""
      />

      {error && (
        <div className="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center text-muted">Memuat daftar trigger…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {triggers.map((trg) => {
            const res = results[trg.name];
            return (
              <div key={trg.name} className="card p-4">
                <p className="font-mono text-sm font-semibold text-library-ink">{trg.name}</p>
                <p className="text-sm text-muted">{trg.label}</p>
                <p className="mb-3 text-xs text-muted">{trg.operation} · {trg.table}</p>

                <div className="space-y-2">
                  {trg.params.map((p) => (
                    <FormField
                      key={p.name}
                      field={p}
                      value={values[trg.name]?.[p.name] ?? ''}
                      onChange={(n, v) => setParam(trg.name, n, v)}
                    />
                  ))}
                </div>

                <button className="btn-primary mt-3 w-full" onClick={() => run(trg)} disabled={res?.busy}>
                  {res?.busy ? 'Menjalankan…' : 'Jalankan (auto-rollback)'}
                </button>

                {res && !res.busy && res.error && (
                  <div className="mt-3 rounded-lg border border-line bg-paper/60 p-3 text-sm text-danger">{res.error}</div>
                )}
                {res && !res.busy && res.value && (
                  <div
                    className={`mt-3 rounded-lg border p-3 text-sm ${
                      res.value.accepted
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-danger/30 bg-danger/10 text-danger'
                    }`}
                  >
                    {res.value.accepted ? '✓ ' : '✕ '}
                    {res.value.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
