import { getResultMeta } from './gameConfig.js';

function createColorDots(colors) {
  const hasRed = colors.includes('RED');
  const hasGreen = colors.includes('GREEN');
  const hasViolet = colors.includes('VIOLET');

  return `
    ${hasRed ? '<div data-v-481307ec="" class="GameRecord__C-origin-I red"></div>' : ''}
    ${hasGreen ? '<div data-v-481307ec="" class="GameRecord__C-origin-I green"></div>' : ''}
    ${hasViolet ? '<div data-v-481307ec="" class="GameRecord__C-origin-I violet"></div>' : ''}
  `;
}

function createRow(round) {
  const meta = getResultMeta(round.resultNumber, round.resultColor, round.resultSize);
  return `
    <div data-v-481307ec="" class="van-row">
      <div data-v-481307ec="" class="van-col van-col--9">${round.issueNumber}</div>
      <div data-v-481307ec="" class="van-col van-col--5 numcenter">
        <div data-v-481307ec="" class="GameRecord__C-body-num ${meta.numberClass}">
          ${meta.number}
        </div>
      </div>
      <div data-v-481307ec="" class="van-col van-col--5">
        <span data-v-481307ec="">${meta.size}</span>
      </div>
      <div data-v-481307ec="" class="van-col van-col--5">
        <div data-v-481307ec="" class="GameRecord__C-origin">
          ${createColorDots(meta.colors)}
        </div>
      </div>
    </div>
  `;
}

export function renderHistoryRows(container, rounds) {
  if (!container) return;
  const rows = Array.isArray(rounds) ? rounds : [];
  container.innerHTML = rows.map((round) => createRow(round)).join('');
}

function toSelectionLabel(bet) {
  const betType = String(bet?.betType || '').toUpperCase();
  const selection = String(bet?.selection || '').toUpperCase();

  if (betType === 'NUMBER') return `Number ${selection}`;
  if (betType === 'SIZE') return selection === 'BIG' ? 'Big' : 'Small';
  if (betType === 'COLOR') {
    if (selection === 'GREEN') return 'Green';
    if (selection === 'RED') return 'Red';
    if (selection === 'VIOLET') return 'Violet';
  }
  return selection || '-';
}

function toResultText(bet) {
  const status = String(bet?.status || '').toUpperCase();
  if (status === 'PENDING') return '<span data-v-481307ec="" style="color:#f59e0b;font-weight:700;">Pending</span>';
  if (status === 'WON') {
    const amount = Number(bet?.winAmount || 0).toFixed(2);
    return `<span data-v-481307ec="" style="color:#16a34a;font-weight:700;">Win Rs ${amount}</span>`;
  }
  if (status === 'LOST') return '<span data-v-481307ec="" style="color:#ef4444;font-weight:700;">Loss</span>';
  return `<span data-v-481307ec="" style="color:#6b7280;font-weight:700;">${status || '-'}</span>`;
}

function createMyBetRow(bet) {
  const amount = Number(bet?.amount || 0).toFixed(2);
  return `
    <div data-v-481307ec="" class="van-row">
      <div data-v-481307ec="" class="van-col van-col--9">${bet.issueNumber || '-'}</div>
      <div data-v-481307ec="" class="van-col van-col--5">
        <span data-v-481307ec="">${toSelectionLabel(bet)}</span>
      </div>
      <div data-v-481307ec="" class="van-col van-col--5">
        <span data-v-481307ec="">Rs ${amount}</span>
      </div>
      <div data-v-481307ec="" class="van-col van-col--5">
        ${toResultText(bet)}
      </div>
    </div>
  `;
}

export function renderMyBetRows(container, bets) {
  if (!container) return;
  const rows = Array.isArray(bets) ? bets : [];
  if (!rows.length) {
    container.innerHTML = `
      <div data-v-481307ec="" class="van-row">
        <div data-v-481307ec="" class="van-col van-col--24" style="padding:16px 0;text-align:center;color:#9ca3af;">
          No bets found.
        </div>
      </div>
    `;
    return;
  }
  container.innerHTML = rows.map((bet) => createMyBetRow(bet)).join('');
}

export function renderRecordHead(head, tab) {
  if (!head) return;

  if (tab === 'my') {
    head.innerHTML = `
      <div data-v-481307ec="" class="van-col van-col--9">Period</div>
      <div data-v-481307ec="" class="van-col van-col--5">Bet</div>
      <div data-v-481307ec="" class="van-col van-col--5">Amount</div>
      <div data-v-481307ec="" class="van-col van-col--5">Result</div>
    `;
    return;
  }

  if (tab === 'chart') {
    head.innerHTML = `
      <div data-v-481307ec="" class="van-col van-col--9">Period</div>
      <div data-v-481307ec="" class="van-col van-col--5">Number</div>
      <div data-v-481307ec="" class="van-col van-col--5">Big Small</div>
      <div data-v-481307ec="" class="van-col van-col--5">Color</div>
    `;
    return;
  }

  head.innerHTML = `
    <div data-v-481307ec="" class="van-col van-col--9">Period</div>
    <div data-v-481307ec="" class="van-col van-col--5">Number</div>
    <div data-v-481307ec="" class="van-col van-col--5">Big Small</div>
    <div data-v-481307ec="" class="van-col van-col--5">Color</div>
  `;
}
