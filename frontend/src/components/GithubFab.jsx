import { Link } from 'react-router-dom';
import { IconGithub } from './icons.jsx';

export default function GithubFab() {
  return (
    <Link
      to="/kreator"
      title="Tim Kreator"
      aria-label="Tim Kreator"
      className="fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-ink text-paper shadow-pop transition-transform hover:scale-105 hover:bg-ink/90"
    >
      <IconGithub className="h-5 w-5" />
    </Link>
  );
}
