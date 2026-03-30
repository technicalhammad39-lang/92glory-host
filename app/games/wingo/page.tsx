import Script from 'next/script';
import { getWingoBodyHtml } from '@/lib/wingo-template';

export const dynamic = 'force-dynamic';

export default async function WingoPage() {
  const bodyHtml = await getWingoBodyHtml();

  return (
    <div className="wingo-original-page" style={{ fontSize: 12, fontFamily: "'Roboto', 'Inter', sans-serif" }}>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script type="module" src="/wingo/js/main.js?v=20260330d" strategy="afterInteractive" />
    </div>
  );
}
