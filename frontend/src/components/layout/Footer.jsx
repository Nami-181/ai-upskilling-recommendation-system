import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Login', to: '/login' },
      { label: 'Create account', to: '/signup' },
      { label: 'Forgot password', to: '/forgot-password' },
    ],
  },
  {
    title: 'LUMORA',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact', to: '/about#contact' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-linen/60">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-5 font-display text-xl text-ink italic">Learn with purpose. Grow with direction.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            An AI-powered upskilling recommendation and automation system for university students.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-4">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-ink/80 transition-colors hover:text-plum">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} LUMORA. A university major project.</p>
          <p>Designed with care for students finding their direction.</p>
        </div>
      </div>
    </footer>
  );
}
