import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import ClosedTodayBanner from '@/components/ClosedTodayBanner';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <ClosedTodayBanner />
      <Header />
      <main className="flex-1 pt-[108px] md:pt-[116px]">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Layout;
