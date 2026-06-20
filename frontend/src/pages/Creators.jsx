import { Link } from 'react-router-dom';
import { useState } from 'react';

const CREATORS = [
  { name: 'Lyonel Oliver D.', nrp: '5025241145', photo: '/creators/1.jpg' },
  { name: 'Alfianz Risqia I. L. K.', nrp: '5025241164', photo: '/creators/2.jpg' },
  { name: 'Hosea Felix Sanjaya', nrp: '5025241177', photo: '/creators/3.jpg' },
  { name: 'Justin Valentino', nrp: '5025241234', photo: '/creators/4.jpg' },
];

function Avatar({ photo, name }) {
  const [broken, setBroken] = useState(false);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-full border-4 border-surface bg-library text-3xl font-bold text-white shadow-card sm:h-36 sm:w-36">
      {!broken ? (
        <img src={photo} alt={name} className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default function Creators() {
  return (
    <div className="min-h-screen bg-paper px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="text-sm font-medium text-muted hover:text-ink">
          ← Kembali
        </Link>

        <div className="mt-6 text-center">
          <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
            pusta<span className="text-canteen">rasa</span>
            <span className="text-library">.</span>
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Meet Our Team</h1>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-10 sm:gap-x-12">
          {CREATORS.map((c) => (
            <div key={c.nrp + c.name} className="flex w-32 flex-col items-center text-center sm:w-36">
              <Avatar photo={c.photo} name={c.name} />
              <p className="mt-3 font-display text-sm font-bold text-ink">{c.name}</p>
              <p className="mt-0.5 font-mono text-xs text-muted">{c.nrp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
