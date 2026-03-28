import type {Metadata} from 'next';
import { Nunito_Sans } from 'next/font/google';
import './globals.css';
import { AuthBootstrap } from '@/components/AuthBootstrap';
import { SupportWidget } from '@/components/SupportWidget';

const nunitoSans = Nunito_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: '92 Glory0 - Gaming Platform',
  description: '92 Glory0 Gaming Platform Frontend',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png'
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.className} bg-gray-100 min-h-screen flex justify-center`} suppressHydrationWarning>
        <div className="w-full max-w-[450px] bg-white min-h-screen shadow-xl relative flex flex-col overflow-x-hidden">
          <AuthBootstrap />
          {children}
          <SupportWidget />
        </div>
      </body>
    </html>
  );
}
