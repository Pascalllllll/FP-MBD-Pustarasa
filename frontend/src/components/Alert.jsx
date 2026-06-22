// Inline status banner; error messages explain what went wrong (often a DB-trigger rule).
const STYLES = {
  error: 'bg-danger/10 text-danger border-danger/20',
  success: 'bg-success/10 text-success border-success/20',
  info: 'bg-library-soft text-library-ink border-library/20',
};
export default function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${STYLES[type]}`}>{children}</div>
  );
}
