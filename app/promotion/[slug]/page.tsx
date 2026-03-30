'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Copy, Search, Send } from 'lucide-react';
import { MobileTopBar } from '@/components/MobileTopBar';
import { useAuthStore } from '@/lib/store';

type PromotionPayload = {
  inviteCode?: string;
  inviteLink?: string;
  promotionData?: {
    totalCommission?: number;
  };
  directStats?: {
    registerCount?: number;
    firstDepositCount?: number;
  };
  partnerRules?: PartnerRule[];
};

type PartnerRule = {
  id: string;
  stage: string;
  minAmount: number;
  maxAmount: number;
  minTurnover: number;
  bonusAmount: number;
  order: number;
};

type SubordinateSummary = {
  depositNumber: number;
  depositAmount: number;
  numberOfBettors: number;
  totalBet: number;
  firstDepositCount: number;
  firstDepositAmount: number;
};

type SubordinateRow = {
  userId: string;
  uid: string;
  level: number;
  depositAmount: number;
  commission: number;
  time: string;
};

type CommissionRecord = {
  id: string;
  amount: number;
  createdAt: string;
  sourceUid: string;
  sourceType: string;
};

type RulesResponse = {
  setting?: {
    promotionRulesText?: string | null;
  } | null;
  contentPage?: {
    content?: string | null;
  } | null;
};

type ServiceLink = {
  id: string;
  label: string;
  type: string;
  url: string;
};

type RebateRatioRow = {
  id: string;
  category: string;
  level: number;
  depth: number;
  ratio: number;
  order: number;
};

type RebateRatioResponse = {
  category: string;
  categories: string[];
  levels: Record<string, RebateRatioRow[]>;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function money(value: number) {
  return `Rs${Number(value || 0).toFixed(2)}`;
}

function compactMoney(value: number) {
  return `Rs${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ratioToPercent(value: number) {
  const percent = Number(value || 0) * 100;
  const fixed = percent.toFixed(6);
  return `${fixed.replace(/\.?0+$/, '')}%`;
}

const fallbackRuleCards = [
  'There are 6 subordinate levels in inviting friends. If A invites B, then B is level 1 subordinate of A. If B invites C, then C is level 1 subordinate of B and also level 2 subordinate of A.',
  'When inviting friends to register, you must send the invitation link provided or enter the invitation code manually so that your friends become your level 1 subordinates.',
  'The invitee registers via the inviter invitation code and completes the deposit, then the commission can be received.',
  "Yesterday's commission is calculated every morning at 01:00 and then rewarded to the wallet.",
  'Different levels have different commission rates. Higher level means higher percentage.',
  'Commission percentage also depends on game type and rebate ratio settings.',
  'TOP20 commission rankings may receive extra rewards.',
  'Final interpretation right belongs to the platform.'
];

const fallbackLevelRows = [
  { level: 'L0', teamNumber: 0, teamBetting: '0', teamDeposit: '0' },
  { level: 'L1', teamNumber: 10, teamBetting: '1.50M', teamDeposit: '300K' },
  { level: 'L2', teamNumber: 15, teamBetting: '2.50M', teamDeposit: '500K' },
  { level: 'L3', teamNumber: 30, teamBetting: '12.50M', teamDeposit: '2.50M' },
  { level: 'L4', teamNumber: 45, teamBetting: '25M', teamDeposit: '5M' },
  { level: 'L5', teamNumber: 50, teamBetting: '75M', teamDeposit: '15M' },
  { level: 'L6', teamNumber: 60, teamBetting: '150M', teamDeposit: '30M' }
];

export default function PromotionSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const normalized = String(slug || '').toLowerCase();

  if (normalized === 'partner-rewards') return <PartnerRewardsPage />;
  if (normalized === 'subordinate-data') return <SubordinateDataPage />;
  if (normalized === 'commission-detail' || normalized === 'commission-details') return <CommissionDetailsPage />;
  if (normalized === 'invitation-rules') return <InvitationRulesPage />;
  if (normalized === 'agent-support') return <AgentSupportPage />;
  if (normalized === 'rebate-ratio') return <RebateRatioPage />;

  return <PromotionFallbackPage />;
}

function PartnerRewardsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<PromotionPayload | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/promotion', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((payload) => setData(payload));
  }, [token]);

  const groupedRules = useMemo(() => {
    const rules = data?.partnerRules || [];
    const map = new Map<string, PartnerRule[]>();
    for (const row of rules) {
      const stage = row.stage || 'rules';
      const current = map.get(stage) || [];
      current.push(row);
      map.set(stage, current);
    }
    return Array.from(map.entries());
  }, [data?.partnerRules]);

  const inviteLink = data?.inviteLink
    ? data.inviteLink
    : data?.inviteCode
      ? typeof window === 'undefined'
        ? `#/register?code=${data.inviteCode}`
        : `${window.location.origin}/#/register?code=${data.inviteCode}`
      : '';

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Partner rewards" />
      <div className="px-3 pt-2">
        <div className="h-[95px] rounded-md overflow-hidden relative">
          <Image src="/banner 4.png" alt="Partner rewards" fill sizes="420px" className="object-cover" />
          <div className="absolute right-3 top-3 text-right">
            <p className="text-[14px] text-[#1f1f2b] font-semibold leading-none">Invite friends to get max rewards</p>
            <p className="text-[18px] text-[#ff9d31] mt-2">{compactMoney(Number(data?.promotionData?.totalCommission || 10000))}</p>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <StatLine label="Invitation count" value={String(data?.directStats?.registerCount || 0)} />
          <StatLine label="Effective Invitation count" value={String(data?.directStats?.firstDepositCount || 0)} valueClass="text-[#0fba63]" />
          <StatLine label="Invitation total bonus" value={compactMoney(Number(data?.promotionData?.totalCommission || 0))} valueClass="text-[#ff5a5a]" />
        </div>

        <Link href="/promotion/subordinate-data" className="h-8 mt-2 flex items-center justify-center text-[13px] text-[#0f1d49]">
          Invitation record <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>

        <div className="mt-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1 h-4 bg-[#e58aee]" />
            <h3 className="text-[15px] font-semibold text-[#101d47]">Invitation link</h3>
          </div>
          <div className="h-9 rounded-full bg-white border border-[#efeff5] flex items-center justify-between px-4">
            <p className="text-[13px] text-[#1b2b56] truncate pr-2">{inviteLink || '-'}</p>
            <button onClick={copyLink} className="w-8 h-8 rounded-full bg-gradient-to-r from-[#df84eb] to-[#d778e8] text-white flex items-center justify-center" aria-label="Copy invite link">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copied && <p className="text-[11px] text-[#6d7ba2] mt-1 pl-1">Copied</p>}
        </div>

        <div className="mt-3 rounded-md bg-white border border-[#efeff5] p-2">
          <h3 className="text-[15px] text-[#101d47] font-semibold mb-2">Invitation rules</h3>
          <p className="text-[12px] text-[#293968] mb-2">If you invite player A, within in 7 Day</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#e98fef] text-white">
                  <th className="py-1 px-2 text-left">Stage</th>
                  <th className="py-1 px-2 text-left">When Player A</th>
                  <th className="py-1 px-2 text-right">You get bonus</th>
                </tr>
              </thead>
              <tbody>
                {groupedRules.length ? (
                  groupedRules.map(([stage, rows]) =>
                    rows.map((row, idx) => (
                      <tr key={row.id} className="border-b border-[#f1f1f7] last:border-b-0">
                        {idx === 0 ? (
                          <td rowSpan={rows.length} className="px-2 py-1 text-[#101d47] align-middle">
                            {stage}
                          </td>
                        ) : null}
                        <td className="px-2 py-1 text-[#63739a]">
                          {`${money(row.minAmount)} ≤ Amount<${row.maxAmount >= 99999999 ? '∞' : money(row.maxAmount)} and Turnover ≥ ${money(row.minTurnover)}`}
                        </td>
                        <td className="px-2 py-1 text-right text-[#ff5a5a]">{money(row.bonusAmount)}</td>
                      </tr>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan={3} className="py-2 text-center text-[#97a3c2]">
                      No rules
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubordinateDataPage() {
  const { token } = useAuthStore();
  const [uid, setUid] = useState('');
  const [date, setDate] = useState(dateKey(new Date()));
  const [summary, setSummary] = useState<SubordinateSummary>({
    depositNumber: 0,
    depositAmount: 0,
    numberOfBettors: 0,
    totalBet: 0,
    firstDepositCount: 0,
    firstDepositAmount: 0
  });
  const [rows, setRows] = useState<SubordinateRow[]>([]);

  const load = useCallback(() => {
    if (!token) return;
    const qs = new URLSearchParams();
    if (uid.trim()) qs.set('uid', uid.trim());
    if (date) qs.set('date', date);
    fetch(`/api/promotion/subordinate-data?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((payload) => {
        setSummary(payload?.summary || {
          depositNumber: 0,
          depositAmount: 0,
          numberOfBettors: 0,
          totalBet: 0,
          firstDepositCount: 0,
          firstDepositAmount: 0
        });
        setRows(payload?.rows || []);
      });
  }, [date, token, uid]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Subordinate data" />
      <div className="px-3 pt-2">
        <div className="h-9 bg-white rounded-md border border-[#ececf3] flex items-center px-3">
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Search subordinate UID"
            className="flex-1 bg-transparent outline-none text-[13px] text-[#63739a]"
          />
          <button onClick={load} className="w-8 h-8 rounded-full bg-[#e58aee] text-white flex items-center justify-center" aria-label="Search">
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="h-8 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3">
            <span className="text-[12px] text-[#4f5f86]">All</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
          </div>
          <div className="h-8 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-[12px] text-[#4f5f86] outline-none"
            />
            <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
          </div>
        </div>

        <div className="rounded-md bg-[#db7de9] text-white mt-2 grid grid-cols-2">
          <PurpleCell value={String(summary.depositNumber)} label="Deposit number" />
          <PurpleCell value={money(summary.depositAmount)} label="Deposit amount" />
          <PurpleCell value={String(summary.numberOfBettors)} label="Number of bettors" />
          <PurpleCell value={money(summary.totalBet)} label="Total bet" />
          <PurpleCell value={String(summary.firstDepositCount)} label="Number of people making first deposit" />
          <PurpleCell value={money(summary.firstDepositAmount)} label="First deposit amount" />
        </div>

        <div className="space-y-2 mt-2">
          {rows.map((row) => (
            <div key={row.userId} className="bg-white rounded-md border border-[#efeff5] p-2">
              <div className="flex items-center justify-between border-b border-[#f2f2f7] pb-1">
                <span className="text-[17px] text-[#0f1d49]">UID:{row.uid}</span>
                <button onClick={() => navigator.clipboard.writeText(row.uid)} className="text-[#6a7aa1]" aria-label="Copy UID">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <MiniRow label="Level" value={String(row.level)} />
              <MiniRow label="Deposit amount" value={money(row.depositAmount)} valueClass="text-[#ff9f34]" />
              <MiniRow label="Commission" value={money(row.commission)} valueClass="text-[#ff9f34]" />
              <MiniRow label="Time" value={row.time} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommissionDetailsPage() {
  const { token } = useAuthStore();
  const [date, setDate] = useState(dateKey(new Date()));
  const [records, setRecords] = useState<CommissionRecord[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/promotion/commission-details?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((payload) => setRecords(payload?.records || []));
  }, [date, token]);

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Commission Details" />
      <div className="px-3 pt-2">
        <div className="h-9 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-[12px] text-[#4f5f86] outline-none"
          />
          <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
        </div>

        <div className="mt-2 space-y-2">
          {records.map((row) => (
            <div key={row.id} className="bg-white rounded-md border border-[#efeff5] p-2">
              <MiniRow label="Amount" value={money(row.amount)} valueClass="text-[#ff5a5a]" />
              <MiniRow label="Source UID" value={row.sourceUid || '-'} />
              <MiniRow label="Source type" value={row.sourceType || '-'} />
              <MiniRow label="Time" value={new Date(row.createdAt).toLocaleString()} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InvitationRulesPage() {
  const [payload, setPayload] = useState<RulesResponse | null>(null);

  useEffect(() => {
    fetch('/api/promotion/rules')
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setPayload(data));
  }, []);

  const cards = useMemo(() => {
    const source = String(payload?.setting?.promotionRulesText || payload?.contentPage?.content || '').trim();
    if (!source) return fallbackRuleCards;
    const parsed = source
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return parsed.length ? parsed : fallbackRuleCards;
  }, [payload]);

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Rules" />
      <div className="px-3 pt-2">
        <h2 className="text-center text-[18px] leading-none text-[#ea8df1] font-semibold">[Promotion partner] program</h2>
        <p className="text-center text-[12px] text-[#63739a] mt-2">This activity is valid for a long time</p>

        <div className="space-y-2 mt-3">
          {cards.map((text, idx) => (
            <div key={idx} className="bg-white rounded-md border border-[#efeff5] p-2">
              <div className="h-6 mx-auto w-[65%] rounded-l-md rounded-r-2xl bg-[#eb8cf1] text-white text-[11px] flex items-center justify-center font-semibold">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <p className="text-[12px] text-[#63739a] leading-[1.45] mt-2">{text}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] mt-2 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="h-8 bg-[#e98fef] text-white">
                <th className="text-left px-2">Rebate level</th>
                <th className="text-center px-2">Team Number</th>
                <th className="text-center px-2">Team Betting</th>
                <th className="text-center px-2">Team Deposit</th>
              </tr>
            </thead>
            <tbody>
              {fallbackLevelRows.map((row) => (
                <tr key={row.level} className="h-7 border-b border-[#f2f2f7] last:border-b-0">
                  <td className="px-2 text-[#ff9f34]">{row.level}</td>
                  <td className="text-center text-[#63739a]">{row.teamNumber}</td>
                  <td className="text-center text-[#63739a]">{row.teamBetting}</td>
                  <td className="text-center text-[#63739a]">{row.teamDeposit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Link href="/promotion/rebate-ratio" className="block mt-2 text-[12px] text-[#ff5a5a]">
          View rebate ratio &gt;&gt;
        </Link>
      </div>
    </div>
  );
}

function AgentSupportPage() {
  const [links, setLinks] = useState<ServiceLink[]>([]);

  useEffect(() => {
    fetch('/api/promotion/customer-service')
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setLinks(data?.links || []));
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Agent line customer service" />
      <div className="px-3 pt-2">
        <div className="h-[140px] rounded-md overflow-hidden relative bg-gradient-to-r from-[#6f8df8] to-[#df81ea]">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image src="/support-icon.webp" alt="Customer support" fill sizes="420px" className="object-cover opacity-90" />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {links.map((row) => (
            <a
              key={row.id}
              href={row.url}
              target="_blank"
              rel="noreferrer"
              className="h-11 rounded-md bg-white border border-[#efeff5] flex items-center justify-between px-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#2aa8e0] text-white flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 fill-current" />
                </span>
                <span className="text-[15px] text-[#101d47]">{row.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9aa8c2]" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function RebateRatioPage() {
  const [category, setCategory] = useState('LOTTERY');
  const [payload, setPayload] = useState<RebateRatioResponse | null>(null);

  useEffect(() => {
    fetch(`/api/promotion/rebate-ratio?category=${category}`)
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setPayload(data));
  }, [category]);

  const categoryTabs = payload?.categories || ['LOTTERY'];
  const levels = payload?.levels || {};
  const sortedLevelKeys = Object.keys(levels).sort((a, b) => Number(a.replace('L', '')) - Number(b.replace('L', '')));

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Rebate ratio" />
      <div className="px-3 pt-2">
        <div className="grid grid-cols-4 gap-1">
          {categoryTabs.slice(0, 4).map((tab) => (
            <button
              key={tab}
              onClick={() => setCategory(tab)}
              className={`h-10 rounded-md border text-[11px] ${
                tab === category
                  ? 'text-white border-transparent bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]'
                  : 'text-[#6d7ba2] border-[#ececf3] bg-white'
              }`}
            >
              {tab === 'LOTTERY' ? 'Lottery' : tab === 'CASINO' ? 'Casino' : tab === 'SPORTS' ? 'Sports' : tab}
            </button>
          ))}
        </div>

        <div className="space-y-2 mt-2">
          {sortedLevelKeys.map((level) => (
            <div key={level} className="bg-white rounded-md border border-[#efeff5] p-2">
              <h3 className="text-[15px] font-semibold text-[#101d47]">
                Rebate level <span className="text-[#e68cee] italic">{level}</span>
              </h3>
              <div className="mt-1 space-y-1">
                {levels[level].map((row) => (
                  <div key={row.id} className="h-6 flex items-center justify-between text-[12px]">
                    <span className="text-[#63739a]">{`${row.depth} level lower level commission rebate`}</span>
                    <span className="text-[#101d47]">{ratioToPercent(row.ratio)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PromotionFallbackPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <MobileTopBar title="Details" />
      <div className="p-3">
        <div className="bg-white rounded-md border border-[#efeff5] p-3 text-[12px] text-[#63739a]">
          Details will appear here.
        </div>
      </div>
    </div>
  );
}

function StatLine({
  label,
  value,
  valueClass = 'text-[#101d47]'
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="h-10 rounded-md bg-white border border-[#efeff5] px-3 flex items-center justify-between">
      <span className="text-[13px] text-[#63739a]">{label}</span>
      <span className={`text-[18px] ${valueClass}`}>{value}</span>
    </div>
  );
}

function PurpleCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="h-[88px] border border-white/20 flex flex-col items-center justify-center px-2 text-center">
      <p className="text-[18px] leading-none font-semibold">{value}</p>
      <p className="text-[12px] leading-[1.2] mt-1">{label}</p>
    </div>
  );
}

function MiniRow({
  label,
  value,
  valueClass = 'text-[#5b6a91]'
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="h-6 flex items-center justify-between text-[12px]">
      <span className="text-[#7e8cab]">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
