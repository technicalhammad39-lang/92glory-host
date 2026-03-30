import fs from 'node:fs/promises';
import path from 'node:path';

let cachedBodyHtml: string | null = null;

function rewriteAssetPaths(html: string) {
  return html
    .replace(/(src|href|data-origin)=["']\.\/assets\//g, '$1="/wingo/assets/')
    .replace(/(src|href|data-origin)=["']\.\.\/assets\//g, '$1="/wingo/assets/')
    .replace(/(src|href)=["']\.\/css\//g, '$1="/wingo/css/')
    .replace(/(src|href)=["']js\//g, '$1="/wingo/js/');
}

function stripInlineScripts(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

export async function getWingoBodyHtml() {
  if (cachedBodyHtml && process.env.NODE_ENV === 'production') {
    return cachedBodyHtml;
  }

  const filePath = path.join(process.cwd(), 'public', 'wingo', 'index.html');
  const html = await fs.readFile(filePath, 'utf8');

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch?.[1]) {
    throw new Error('Unable to load Wingo body template.');
  }

  const htmlBody = stripInlineScripts(rewriteAssetPaths(bodyMatch[1]));
  if (process.env.NODE_ENV === 'production') {
    cachedBodyHtml = htmlBody;
  }
  return htmlBody;
}
