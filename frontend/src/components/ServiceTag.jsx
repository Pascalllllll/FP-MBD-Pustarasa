// Small colored chip that brands every module by service. This persistent
// color-coding (violet = perpustakaan, marigold = kantin) is the signature
// device that ties the whole app to the PustaRasa dual-world concept.

const STYLES = {
  perpustakaan: 'bg-library-soft text-library-ink',
  kantin: 'bg-canteen-soft text-canteen-ink',
  kunjungan: 'bg-library-soft text-library-ink',
  manajemen: 'bg-ink/5 text-ink',
};

const LABELS = {
  perpustakaan: 'Perpustakaan',
  kantin: 'Kantin',
  kunjungan: 'Kunjungan',
  manajemen: 'Manajemen',
};

export default function ServiceTag({ service, children }) {
  return (
    <span className={`chip ${STYLES[service] || STYLES.manajemen}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children || LABELS[service] || service}
    </span>
  );
}
