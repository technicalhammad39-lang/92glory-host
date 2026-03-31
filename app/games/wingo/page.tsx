import { getWingoBodyHtml } from '@/lib/wingo-template';

export const dynamic = 'force-dynamic';

export default async function WingoPage() {
  const bodyHtml = await getWingoBodyHtml();

  return (
    <div className="wingo-original-page" style={{ fontSize: 12, fontFamily: "'Roboto', 'Inter', sans-serif" }}>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var w=Math.min(window.innerWidth||450,450);document.documentElement.style.fontSize=(w/10)+'px';})();`
        }}
      />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <script type="module" defer src="/wingo/js/main.js?v=20260331a" />
    </div>
  );
}
