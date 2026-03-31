import { getWingoBodyHtml } from '@/lib/wingo-template';

export const dynamic = 'force-dynamic';

export default async function WingoPage() {
  const bodyHtml = await getWingoBodyHtml();

  return (
    <div className="wingo-original-page" style={{ fontSize: 12, fontFamily: "'Roboto', 'Inter', sans-serif" }}>
      <style
        dangerouslySetInnerHTML={{
          __html:
            '.wingo-original-page{width:100%;min-height:100vh;display:flex;justify-content:center;align-items:flex-start;background:#9195a3;overflow-x:hidden}.wingo-original-page>div{width:100%;display:flex;justify-content:center}.wingo-original-page #app{width:min(100%,10rem);margin-inline:auto;min-height:100vh}'
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var k='wingo_open_reload_once';if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,'1');window.location.replace(window.location.pathname+window.location.search+window.location.hash);return;}}catch(e){}var w=Math.min(window.innerWidth||450,450);document.documentElement.style.fontSize=(w/10)+'px';})();`
        }}
      />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <script type="module" defer src="/wingo/js/main.js?v=20260331b" />
    </div>
  );
}
