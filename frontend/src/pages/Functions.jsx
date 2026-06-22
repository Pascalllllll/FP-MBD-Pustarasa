import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import Alert from '../components/Alert.jsx';

export default function Functions() {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [values, setValues] = useState({});
  const [results, setResults] = useState({});

  useEffect(() => {
    api
      .get('/function')
      .then(setFunctions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setParam = (fnName, paramName, val) =>
    setValues((v) => ({ ...v, [fnName]: { ...v[fnName], [paramName]: val } }));

  const run = async (fn) => {
    setResults((r) => ({ ...r, [fn.name]: { busy: true } }));
    try {
      const value = await api.get(`/function/${fn.name}`, values[fn.name] || {});
      setResults((r) => ({ ...r, [fn.name]: { busy: false, value } }));
    } catch (e) {
      setResults((r) => ({ ...r, [fn.name]: { busy: false, error: e.message } }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Uji Function"
        service="manajemen"
        description=""
      />

      {error && (
        <div className="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center text-muted">Memuat daftar function…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {functions.map((fn) => {
            const res = results[fn.name];
            return (
              <div key={fn.name} className="card p-4">
                <p className="font-mono text-sm font-semibold text-library-ink">{fn.name}</p>
                <p className="mb-3 text-sm text-muted">{fn.label}</p>

                <div className="space-y-2">
                  {fn.params.map((p) => (
                    <div key={p.name}>
                      <label className="label">{p.label}</label>
                      <input
                        className="input"
                        placeholder={p.placeholder}
                        value={values[fn.name]?.[p.name] ?? ''}
                        onChange={(e) => setParam(fn.name, p.name, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary mt-3 w-full"
                  onClick={() => run(fn)}
                  disabled={res?.busy}
                >
                  {res?.busy ? 'Menjalankan…' : 'Jalankan'}
                </button>

                {res && !res.busy && (
                  <div className="mt-3 rounded-lg border border-line bg-paper/60 p-3 text-sm">
                    {res.error ? (
                      <span className="text-danger">{res.error}</span>
                    ) : (
                      <>
                        <span className="text-muted">Hasil: </span>
                        <span className="font-semibold">
                          {res.value === null || res.value === '' ? '—' : String(res.value)}
                        </span>
                      </>
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
