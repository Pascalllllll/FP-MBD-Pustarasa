import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';

export default function Procedures() {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [values, setValues] = useState({});
  const [results, setResults] = useState({});

  useEffect(() => {
    api
      .get('/procedure')
      .then(setProcedures)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setParam = (procName, paramName, val) =>
    setValues((v) => ({ ...v, [procName]: { ...v[procName], [paramName]: val } }));

  const run = async (proc) => {
    setResults((r) => ({ ...r, [proc.name]: { busy: true } }));
    try {
      const value = await api.post(`/procedure/${proc.name}`, values[proc.name] || {});
      setResults((r) => ({ ...r, [proc.name]: { busy: false, value } }));
    } catch (e) {
      setResults((r) => ({ ...r, [proc.name]: { busy: false, error: e.message } }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Uji Procedure"
        service="manajemen"
        description=""
      />

      {error && (
        <div className="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center text-muted">Memuat daftar procedure…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {procedures.map((proc) => {
            const res = results[proc.name];
            return (
              <div key={proc.name} className="card p-4">
                <p className="font-mono text-sm font-semibold text-library-ink">{proc.name}</p>
                <p className="mb-3 text-sm text-muted">{proc.label}</p>

                <div className="space-y-2">
                  {proc.params.map((p) => (
                    <FormField
                      key={p.name}
                      field={p}
                      value={values[proc.name]?.[p.name] ?? ''}
                      onChange={(n, v) => setParam(proc.name, n, v)}
                    />
                  ))}
                </div>

                <button className="btn-primary mt-3 w-full" onClick={() => run(proc)} disabled={res?.busy}>
                  {res?.busy ? 'Menjalankan…' : 'Jalankan'}
                </button>

                {res && !res.busy && (
                  <div className="mt-3 rounded-lg border border-line bg-paper/60 p-3 text-sm">
                    {res.error ? (
                      <span className="text-danger">{res.error}</span>
                    ) : (
                      <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(res.value, null, 2)}</pre>
                    )}
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
