import { formatMoney } from './gameConfig.js';

export function setWalletBalance(elements, balance) {
  if (!elements?.walletBalance) return;
  elements.walletBalance.textContent = formatMoney(Number(balance) || 0);
}

