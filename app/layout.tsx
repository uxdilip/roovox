import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { Toaster } from '@/components/ui/toaster';
import { ChatToastNotification } from '@/components/ui/chat-toast-notification';
import { ChatProvider } from '@/contexts/ChatContext';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sniket - Professional Device Repair Services',
  description: 'Expert device repair services for phones, laptops, and tablets. Same-day service, doorstep pickup, and genuine parts with warranty.',
  keywords: 'device repair, phone repair, laptop repair, screen replacement, battery replacement, mobile repair, computer repair, electronics repair',
  authors: [{ name: 'Sniket Team' }],
  creator: 'Sniket',
  publisher: 'Sniket',
  robots: 'index, follow',
  themeColor: '#667eea',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Sniket - Professional Device Repair Services',
    description: 'Expert device repair services for phones, laptops, and tablets. Same-day service, doorstep pickup, and genuine parts with warranty.',
    url: 'https://sniket.com',
    siteName: 'Sniket',
    images: [
      {
        url: '/apple-touch-icon.png',
        width: 180,
        height: 180,
        alt: 'Sniket Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sniket - Professional Device Repair Services',
    description: 'Expert device repair services for phones, laptops, and tablets. Same-day service, doorstep pickup, and genuine parts with warranty.',
    images: ['/apple-touch-icon.png'],
  },
  alternates: {
    canonical: 'https://sniket.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sniket" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
                <LocationProvider>
          <AuthProvider>
            <ChatProvider>
              <ServiceWorkerRegistration />
              {children}
              <Toaster />
              {/* Chat notifications only - bottom-right */}
              <ChatToastNotification position="bottom-right" duration={4000} soundEnabled={true} />
            </ChatProvider>
          </AuthProvider>
        </LocationProvider>
      </body>
    </html>
  );
}