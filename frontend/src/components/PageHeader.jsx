import ServiceTag from './ServiceTag.jsx';

export default function PageHeader({ title, description, service, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          {service && <ServiceTag service={service} />}
        </div>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
