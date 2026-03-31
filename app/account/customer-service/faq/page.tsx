'use client';

import { MobileTopBar } from '@/components/MobileTopBar';

const FAQ_ITEMS = [
  {
    q: 'How long does recharge verification take?',
    a: 'Recharge records are usually reviewed quickly. If your recharge is not received, submit a ticket with screenshot proof.'
  },
  {
    q: 'Why is withdrawal delayed?',
    a: 'Withdrawals may be delayed due to account verification, payment channel queue, or safety review.'
  },
  {
    q: 'Can I update my USDT address?',
    a: 'Yes. Use Delete Old USDT Address and Rebind in the Self Service Center and submit your request.'
  },
  {
    q: 'Where can I check ticket status?',
    a: 'Use Progress Query to track status, admin response, and timestamps.'
  }
];

export default function SupportFaqPage() {
  return (
    <div className="min-h-screen bg-[#f2f2f8] pb-6">
      <MobileTopBar title="FAQ" />
      <div className="px-4 pt-3 space-y-2">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="bg-white border border-[#ececf2] rounded-md p-3">
            <h3 className="text-[15px] text-[#30323a] font-semibold">{item.q}</h3>
            <p className="text-[13px] text-[#6c7282] leading-[1.4] mt-2">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
