export type SupportIssueKey =
  | 'RECHARGE_NOT_RECEIVE'
  | 'WITHDRAW_PROBLEM'
  | 'DELETE_OLD_USDT_ADDRESS_AND_REBIND'
  | 'DELETE_WITHDRAW_EWALLET_ACCOUNT'
  | 'GAME_PROBLEM'
  | 'LOSS_BONUS'
  | 'WINNING_STREAK_BONUS';

export const SUPPORT_ISSUE_OPTIONS: Array<{ key: SupportIssueKey; slug: string; label: string }> = [
  { key: 'RECHARGE_NOT_RECEIVE', slug: 'recharge-not-receive', label: 'Recharge Not Receive' },
  { key: 'WITHDRAW_PROBLEM', slug: 'withdraw-problem', label: 'Withdraw Problem' },
  { key: 'DELETE_OLD_USDT_ADDRESS_AND_REBIND', slug: 'delete-old-usdt-address-and-rebind', label: 'Delete Old USDT Address and Rebind' },
  { key: 'DELETE_WITHDRAW_EWALLET_ACCOUNT', slug: 'delete-withdraw-ewallet-account', label: 'Delete Withdraw E-wallet Account' },
  { key: 'GAME_PROBLEM', slug: 'game-problem', label: 'Game Problem' },
  { key: 'LOSS_BONUS', slug: 'loss-bonus', label: 'Loss Bonus' },
  { key: 'WINNING_STREAK_BONUS', slug: 'winning-streak-bonus', label: 'Winning Streak Bonus' }
];

export function isSupportIssueKey(value: string): value is SupportIssueKey {
  return SUPPORT_ISSUE_OPTIONS.some((item) => item.key === value);
}

export function getSupportIssueLabel(key: string) {
  return SUPPORT_ISSUE_OPTIONS.find((item) => item.key === key)?.label || key;
}

export function getSupportIssueBySlug(slug: string) {
  return SUPPORT_ISSUE_OPTIONS.find((item) => item.slug === slug);
}

export const SUPPORT_TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const;
