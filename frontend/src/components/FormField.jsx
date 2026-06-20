// Single labelled control. Supports text/number/date/select/textarea.
export default function FormField({ field, value, onChange, error, disabled }) {
  const { name, label, type = 'text', options, placeholder, help, required } = field;
  const common = {
    id: name,
    value: value ?? '',
    disabled,
    onChange: (e) => onChange(name, e.target.value),
    className: `input ${error ? 'border-danger focus:border-danger' : ''}`,
    placeholder,
  };

  return (
    <div className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {type === 'select' ? (
        <select {...common}>
          <option value="">— Pilih —</option>
          {(options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea {...common} rows={3} />
      ) : (
        <input {...common} type={type} />
      )}
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : help ? (
        <p className="mt-1 text-xs text-muted">{help}</p>
      ) : null}
    </div>
  );
}
