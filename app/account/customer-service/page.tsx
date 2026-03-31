'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, CircleHelp, Home, Wallet, CreditCard, CircleDollarSign, UserRoundX, Headset, Coins } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { SUPPORT_ISSUE_OPTIONS } from '@/lib/support-center';

type ServiceLink = {
  id: string;
  label: string;
  type: string;
  url: string;
};

export default function CustomerServiceCenterPage() {
  const [agentUrl, setAgentUrl] = useState('https://t.me/92Glory0Support');

  useEffect(() => {
    fetch('/api/promotion/customer-service')
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        const links: ServiceLink[] = data?.links || [];
        const telegram = links.find((row) => String(row.type || '').toUpperCase() === 'TELEGRAM') || links[0];
        if (telegram?.url) setAgentUrl(telegram.url);
      });
  }, []);

  const issueRows = useMemo(
    () => SUPPORT_ISSUE_OPTIONS.map((item) => ({ key: item.key, slug: item.slug, label: item.label })),
    []
  );

  return (
    <div className="min-h-screen bg-[#f2f2f8] pb-6">
      <div className="h-16 bg-white flex items-center justify-between px-4">
        <Link href="/" className="w-10 h-10 flex items-center justify-center text-[#1d2758]" aria-label="Home">
          <Home className="w-6 h-6" />
        </Link>
        <h1 className="text-[20px] font-semibold text-[#1f1f2b]">Self Service Center</h1>
        <div className="flex items-center gap-1 text-[#1f1f2b]">
          <span className="w-7 h-7 rounded-full bg-[linear-gradient(180deg,#cb2d3e_0%,#cb2d3e_50%,#ffffff_50%,#ffffff_100%)] border border-[#d9d9df]" />
          <span className="text-[16px] leading-none">EN</span>
        </div>
      </div>

      <div className="h-[170px] relative bg-gradient-to-r from-[#a168f4] to-[#c083ff] overflow-hidden">
        <Image src="/support-icon.webp" alt="Self service banner" fill sizes="450px" className="object-cover opacity-95" priority />
        <div className="absolute left-4 top-5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
          <p className="text-[17px] leading-[1.15] font-semibold">Welcome to the self</p>
          <p className="text-[17px] leading-[1.15] font-semibold">Service customer</p>
          <p className="text-[17px] leading-[1.15] font-semibold">Service center</p>
          <div className="mt-2 inline-flex items-center bg-white/95 text-[#5e63d6] text-[15px] font-semibold px-2 py-0.5 rounded-sm">
            92GO
            <span className="text-[#4f66d5] ml-2">92go.win</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <h2 className="text-[20px] text-[#3b3b45] mb-3">Self Service</h2>

        <div className="rounded-sm bg-white border border-[#ececf2] px-3">
          <SupportRow href="/account/customer-service/faq" label="FAQ" icon={<CircleHelp className="w-6 h-6 text-[#95a2ff]" />} />
          {issueRows.map((row) => {
            if (row.key === 'RECHARGE_NOT_RECEIVE') {
              return <SupportRow key={row.key} href={`/account/customer-service/issue/${row.slug}`} label={row.label} icon={<Wallet className="w-6 h-6 text-white" />} iconBg="from-[#ea85ef] to-[#8a7bff]" />;
            }
            if (row.key === 'WITHDRAW_PROBLEM') {
              return <SupportRow key={row.key} href={`/account/customer-service/issue/${row.slug}`} label={row.label} icon={<CreditCard className="w-6 h-6 text-white" />} iconBg="from-[#dd83ef] to-[#8e84ff]" />;
            }
            if (row.key === 'DELETE_OLD_USDT_ADDRESS_AND_REBIND') {
              return <SupportRow key={row.key} href={`/account/customer-service/issue/${row.slug}`} label={row.label} icon={<CircleDollarSign className="w-6 h-6 text-white" />} iconSolid="#2dbf85" />;
            }
            if (row.key === 'DELETE_WITHDRAW_EWALLET_ACCOUNT') {
              return <SupportRow key={row.key} href={`/account/customer-service/issue/${row.slug}`} label={row.label} icon={<UserRoundX className="w-6 h-6 text-white" />} iconBg="from-[#de84ef] to-[#9a83ff]" />;
            }
            if (row.key === 'GAME_PROBLEM') {
              return <SupportRow key={row.key} href={`/account/customer-service/issue/${row.slug}`} label={row.label} icon={<Headset className="w-6 h-6 text-white" />} iconBg="from-[#de84ef] to-[#9c83ff]" />;
            }
            return <SupportRow key={row.key} href={`/account/customer-service/issue/${row.slug}`} label={row.label} icon={<Coins className="w-6 h-6 text-white" />} iconBg="from-[#dd83ef] to-[#9b83ff]" />;
          })}
          <SupportRow href={agentUrl} label="92Glory Agent Consultation" icon={<Image src="/92glory-logo.png" alt="92Glory" width={28} height={28} />} external noDivider />
        </div>

        <div className="mt-4">
          <h3 className="text-[20px] text-[#3c3c45]">Kind tips</h3>
          <p className="text-[14px] text-[#5f6575] leading-[1.35] mt-2">
            1.Please select the relevant query and submit it for review. After successful submission, the customer service specialist will handle it for you immediately.
          </p>
          <p className="text-[14px] text-[#5f6575] leading-[1.35] mt-2">
            2.After submitting for review, you can use [Question in progress] to view the review results of the work order you submitted.
          </p>
        </div>

        <Link
          href="/account/customer-service/progress-query"
          className="mt-6 h-14 rounded-full bg-gradient-to-r from-[#6f8df8] to-[#6b92ef] text-white text-[18px] flex items-center justify-center"
        >
          Progress Query
        </Link>
      </div>
    </div>
  );
}

function SupportRow({
  href,
  label,
  icon,
  iconBg = 'from-[#d98af2] to-[#9588ff]',
  iconSolid,
  external,
  noDivider
}: {
  href: string;
  label: string;
  icon: ReactNode;
  iconBg?: string;
  iconSolid?: string;
  external?: boolean;
  noDivider?: boolean;
}) {
  const content = (
    <div className={`h-[86px] ${noDivider ? '' : 'border-b border-[#ececf2]'} flex items-center justify-between px-2`}>
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${iconSolid ? '' : `bg-gradient-to-br ${iconBg}`}`}
          style={iconSolid ? { backgroundColor: iconSolid } : undefined}
        >
          {icon}
        </div>
        <span className="text-[16px] text-[#3a3a43] truncate">{label}</span>
      </div>
      <ChevronRight className="w-7 h-7 text-[#b0b0b7]" />
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}
