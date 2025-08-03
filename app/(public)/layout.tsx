import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { Footer } from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
} 