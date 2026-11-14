import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Footer from './Footer';

/** Shell for the public website: navbar, page, footer. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
