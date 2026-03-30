import type {Metadata} from 'next';
import './globals.css';
import { AuthBootstrap } from '@/components/AuthBootstrap';
import { ChunkRecovery } from '@/components/ChunkRecovery';
import { SupportWidget } from '@/components/SupportWidget';

export const metadata: Metadata = {
  title: '92 Glory0 - Gaming Platform',
  description: '92 Glory0 Gaming Platform Frontend',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon1.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/icon1.png'
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-100 min-h-screen flex justify-center" suppressHydrationWarning>
        <div className="w-full max-w-[450px] bg-white min-h-screen shadow-xl relative flex flex-col overflow-x-hidden">
          <ChunkRecovery />
          <AuthBootstrap />
          {children}
          <SupportWidget />
        </div>
      </body>
    </html>
  );
}
