import { ArrowLeft } from 'lucide-react';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <Logo />
      <p className="mt-14 font-display text-[120px] leading-none text-mauve italic">404</p>
      <h1 className="mt-4 text-[36px] font-medium">This path isn&rsquo;t on the map.</h1>
      <p className="mt-3 max-w-sm text-muted">The page you were looking for doesn&rsquo;t exist or may have moved.</p>
      <Button to="/" variant="secondary" leftIcon={ArrowLeft} className="mt-10">
        Return home
      </Button>
    </div>
  );
}
