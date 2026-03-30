'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { CalendarDays, ChevronDown, Copy, Eye, EyeOff, Gift, Trash2, Tv } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { MobileTopBar } from '@/components/MobileTopBar';

type BetRow = {
  id: string;
  gameType: string;
  detailType: string;
  period: string;
  orderNumber: string;
  selected: string;
  totalBet: number;
  resultNumber: number | null;
  resultColor: string | null;
  resultSize: string | null;
  actualAmount: number;
  winnings: number;
  handlingFee: number;
  profitLoss: number;
  status: 'WIN' | 'LOSE' | 'PENDING';
  createdAt: string;
};

type WalletRecord = {
  id: string;
  detail: string;
  mode: 'IN' | 'OUT';
  amount: number;
  createdAt: string;
};

type NotificationItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type GameStatsResponse = {
  period: string;
  totalBet: number;
  categories: Record<string, { totalBet: number; betCount: number; winningAmount: number }>;
};

type ContentPage = { title: string; content: string } | null;

function dayText(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function AccountDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const [content, setContent] = useState<ContentPage>(null);

  useEffect(() => {
    if (slug !== 'gifts') return;
    router.replace('/activity/gift');
  }, [router, slug]);

  useEffect(() => {
    if (['game-history', 'transaction', 'notification', 'game-statistics', 'gifts'].includes(slug)) return;
    fetch('/api/content-pages')
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        const page = (data?.pages || []).find((p: any) => p.slug === slug);
        if (page) setContent({ title: page.title, content: page.content });
      });
  }, [slug]);

  if (slug === 'game-history') return <BetHistoryPage token={token} />;
  if (slug === 'transaction') return <TransactionHistoryPage token={token} />;
  if (slug === 'notification') return <NotificationPage token={token} />;
  if (slug === 'game-statistics') return <GameStatisticsPage token={token} />;

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <MobileTopBar title={content?.title || 'Details'} />
      <div className="p-3">
        <div className="bg-white rounded-md border border-[#ececf3] p-4 text-[12px] text-[#5c6b90] whitespace-pre-wrap">
          {content?.content || 'Details will appear here.'}
        </div>
      </div>
    </div>
  );
}

function BetHistoryPage({ token }: { token: string | null }) {
  const [items, setItems] = useState<BetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'LOTTERY' | 'CASINO' | 'FISHING' | 'RUMMY'>('LOTTERY');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    fetch(`/api/history/bets?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setItems(data?.bets || []))
      .finally(() => setLoading(false));
  }, [date, token]);

  const visible = useMemo(() => {
    if (tab !== 'LOTTERY') return [];
    return items;
  }, [items, tab]);

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <MobileTopBar title="Bet history" />
      <div className="px-3 pt-2">
        <div className="grid grid-cols-4 gap-1">
          {[
            ['LOTTERY', 'Lottery'],
            ['CASINO', 'Casino'],
            ['FISHING', 'Fishing'],
            ['RUMMY', 'Rummy']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={`h-11 rounded-md border text-[11px] font-medium ${
                tab === id
                  ? 'text-white border-transparent bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]'
                  : 'text-[#6d7ba2] border-[#ececf3] bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="h-9 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3 text-[12px] text-[#4f5f86]">
            <span>Win Go</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
          </div>
          <div className="h-9 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3 text-[12px] text-[#4f5f86]">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
            <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 pb-6">
        {loading && <div className="text-[12px] text-[#7a88ab]">Loading...</div>}

        {!loading && !visible.length && (
          <div className="pt-10 flex flex-col items-center">
            <div className="w-[190px] h-[120px] relative opacity-70">
              <Image src="/wingo/assets/png/missningBg-c1f02bcd.png" alt="No data" fill sizes="190px" className="object-contain" />
            </div>
            <p className="text-[12px] text-[#a7b1cc] mt-1">No data</p>
          </div>
        )}

        {visible.map((row) => (
          <div key={row.id} className="bg-white rounded-md border border-[#efeff5] p-3 mb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[25px] leading-none text-[#101d47] font-semibold">Win Go</h3>
              <span className={`text-[12px] font-semibold ${row.status === 'WIN' ? 'text-[#0fba63]' : row.status === 'LOSE' ? 'text-[#f39d2c]' : 'text-[#7c8db2]'}`}>
                {row.status === 'WIN' ? 'Win' : row.status === 'LOSE' ? 'Lose' : 'Pending'}
              </span>
            </div>
            <div className="text-[10px] text-[#7f8dad] mt-1">{new Date(row.createdAt).toLocaleString()}</div>

            <div className="mt-2 space-y-1 text-[11px]">
              <InfoRow label="Type" value={row.detailType} />
              <InfoRow label="Period" value={row.period} />
              <InfoRow label="Order number" value={row.orderNumber} />
              <InfoRow label="Select" value={String(row.selected)} />
              <InfoRow label="Total bet" value={`Rs${row.totalBet.toFixed(2)}`} />
            </div>

            <div className="h-px bg-[#f2f2f7] my-3" />
            <div className="text-[12px] font-semibold text-[#0f1e49] mb-2">Lottery results</div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#66d38d] text-white flex items-center justify-center text-[12px] font-semibold">
                {row.resultNumber ?? '-'}
              </span>
              <span className="h-6 px-2 rounded-md bg-[#6fa0f1] text-white text-[11px] flex items-center">{row.resultSize || '-'}</span>
              <span className="h-6 px-2 rounded-md bg-[#3ac178] text-white text-[11px] flex items-center">{row.resultColor || '-'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatBox title="Actual amount" value={`Rs${row.actualAmount.toFixed(2)}`} />
              <StatBox title="Winnings" value={`Rs${row.winnings.toFixed(2)}`} />
              <StatBox title="Handling fee" value={`Rs${row.handlingFee.toFixed(2)}`} />
              <StatBox
                title="Profit/loss"
                value={`${row.profitLoss >= 0 ? '' : '-'}Rs${Math.abs(row.profitLoss).toFixed(2)}`}
                valueClass={row.profitLoss >= 0 ? 'text-[#0fba63]' : 'text-[#ff5050]'}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionHistoryPage({ token }: { token: string | null }) {
  const [items, setItems] = useState<WalletRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (date) params.set('date', date);
    fetch(`/api/history/wallet?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setItems(data?.records || []))
      .finally(() => setLoading(false));
  }, [date, mode, token]);

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <MobileTopBar title="Transaction history" />
      <div className="px-3 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3">
            <select
              className="w-full bg-transparent text-[12px] text-[#4f5f86] outline-none"
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="ALL">All</option>
              <option value="IN">Game moved in</option>
              <option value="OUT">Game moved out</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
          </div>

          <div className="h-9 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-[12px] text-[#4f5f86] outline-none"
            />
            <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 pb-6">
        {loading && <div className="text-[12px] text-[#7a88ab]">Loading...</div>}
        {!loading && !items.length && (
          <div className="pt-10 flex flex-col items-center">
            <div className="w-[190px] h-[120px] relative opacity-70">
              <Image src="/wingo/assets/png/missningBg-c1f02bcd.png" alt="No data" fill sizes="190px" className="object-contain" />
            </div>
            <p className="text-[12px] text-[#a7b1cc] mt-1">No data</p>
          </div>
        )}

        {items.map((row) => (
          <div key={row.id} className="bg-white rounded-md border border-[#efeff5] mb-3 overflow-hidden">
            <div className="h-9 px-3 text-white text-[16px] font-semibold flex items-center bg-gradient-to-r from-[#6f8ef8] to-[#dd7de9]">
              {row.detail}
            </div>
            <div className="p-2 space-y-1 text-[11px]">
              <SimpleCell label="Detail" value={row.detail} />
              <SimpleCell label="Time" value={new Date(row.createdAt).toLocaleString()} />
              <SimpleCell
                label="Balance"
                value={`Rs${Number(row.amount || 0).toFixed(2)}`}
                valueClass={row.mode === 'OUT' ? 'text-[#12b35f]' : 'text-[#ff4f4f]'}
              />
            </div>
            <div className="h-12 mx-2 mb-2 rounded-md border border-[#f0f0f6]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationPage({ token }: { token: string | null }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setItems(data?.notifications || []))
      .finally(() => setLoading(false));
  }, [token]);

  const removeOne = async (id: string) => {
    if (!token) return;
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setItems((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <MobileTopBar title="Notification" />
      <div className="px-3 pt-3 pb-6">
        {loading && <div className="text-[12px] text-[#7a88ab]">Loading...</div>}
        {!loading && !items.length && (
          <div className="pt-10 flex flex-col items-center">
            <div className="w-[190px] h-[120px] relative opacity-70">
              <Image src="/wingo/assets/png/missningBg-c1f02bcd.png" alt="No data" fill sizes="190px" className="object-contain" />
            </div>
            <p className="text-[12px] text-[#a7b1cc] mt-1">No data</p>
          </div>
        )}

        {items.map((row) => (
          <div key={row.id} className="bg-white rounded-sm border border-[#efeff5] px-3 py-2 mb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1">
                <Gift className="w-3 h-3 text-[#e98dee]" />
                <p className="text-[14px] font-semibold text-[#111d4a] uppercase">{row.title}</p>
              </div>
              <button onClick={() => removeOne(row.id)} className="text-[#e78cec]">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-[#8c98b8] mt-1">{new Date(row.createdAt).toLocaleString()}</p>
            <p className="text-[12px] text-[#5f6f93] mt-1">{row.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameStatisticsPage({ token }: { token: string | null }) {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [stats, setStats] = useState<GameStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideAmounts, setHideAmounts] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/account/game-statistics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, [period, token]);

  const cards = [
    { key: 'lottery', label: 'lottery', icon: '/lotterycat.png' },
    { key: 'video', label: 'video', icon: null },
    { key: 'slot', label: 'Slot', icon: null },
    { key: 'fish', label: 'Fish', icon: null }
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <MobileTopBar title="Game statistics" />
      <div className="px-3 pt-2">
        <div className="flex gap-1">
          {[
            ['today', 'Today'],
            ['yesterday', 'Yesterday'],
            ['week', 'This week'],
            ['month', 'This month']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setPeriod(id as typeof period)}
              className={`h-7 px-4 rounded-full text-[11px] ${
                period === id ? 'text-white bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]' : 'text-[#5f6f93] bg-white border border-[#ececf3]'
              }`}
            >
              {label}
            </button>
          ))}
          <button onClick={() => setHideAmounts((v) => !v)} className="ml-auto text-[#8e9bbc] px-2">
            {hideAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] mt-3 p-4 text-center">
          <p className="text-[35px] font-semibold text-[#f19d36]">Rs{hideAmounts ? '****' : Number(stats?.totalBet || 0).toFixed(2)}</p>
          <p className="text-[14px] text-[#5f6f93] mt-1">Total bet</p>
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] mt-2 p-3">
          {loading && <div className="text-[12px] text-[#7a88ab]">Loading...</div>}
          {!loading &&
            cards.map((card, idx) => {
              const row = stats?.categories?.[card.key] || { totalBet: 0, betCount: 0, winningAmount: 0 };
              return (
                <div key={card.key} className={idx === cards.length - 1 ? '' : 'mb-4'}>
                  <div className="flex items-center gap-2 mb-1">
                    {card.icon ? (
                      <Image src={card.icon} alt={card.label} width={16} height={16} />
                    ) : card.key === 'video' ? (
                      <Tv className="w-4 h-4 text-[#b05bf4]" />
                    ) : card.key === 'slot' ? (
                      <Gift className="w-4 h-4 text-[#b05bf4]" />
                    ) : (
                      <CalendarDays className="w-4 h-4 text-[#62bee2]" />
                    )}
                    <span className="text-[15px] font-semibold text-[#0f1d49]">{card.label}</span>
                  </div>

                  <SimpleCell label="Total bet" value={`Rs${hideAmounts ? '****' : Number(row.totalBet || 0).toFixed(2)}`} />
                  <SimpleCell label="Number of bets" value={`${row.betCount || 0}`} />
                  <SimpleCell label="Winning amount" value={`Rs${hideAmounts ? '****' : Number(row.winningAmount || 0).toFixed(2)}`} valueClass="text-[#db7de9]" />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-5 flex items-center justify-between">
      <span className="text-[#7e8cab]">{label}</span>
      <span className="text-[#293968]">{value}</span>
    </div>
  );
}

function StatBox({
  title,
  value,
  valueClass = 'text-[#5c6b90]'
}: {
  title: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="h-[52px] rounded-md bg-[#f7f7fb] border border-[#f1f1f7] flex flex-col justify-center items-center">
      <p className={`text-[16px] ${valueClass}`}>{value}</p>
      <p className="text-[11px] text-[#7e8cab]">{title}</p>
    </div>
  );
}

function SimpleCell({
  label,
  value,
  valueClass = 'text-[#5b6a91]'
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="h-7 text-[12px] flex items-center justify-between border-b border-[#f3f3f7] last:border-b-0">
      <span className="text-[#7e8cab]">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
