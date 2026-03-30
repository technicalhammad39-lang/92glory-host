'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MobileTopBar } from '@/components/MobileTopBar';

type BannerDetail = {
  id: string;
  title: string;
  image: string;
  description: string | null;
  rulesText: string | null;
  link: string | null;
};

export default function BannerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [banner, setBanner] = useState<BannerDetail | null>(null);

  useEffect(() => {
    fetch(`/api/banners/${id}`)
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setBanner(data?.banner || null));
  }, [id]);

  const rules = useMemo(
    () =>
      String(banner?.rulesText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [banner?.rulesText]
  );

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title={banner?.title || 'Details'} />
      <div className="px-3 pt-2">
        <div className="relative h-[165px] rounded-md overflow-hidden bg-white border border-[#efeff5]">
          {banner?.image ? (
            <Image src={banner.image} alt={banner.title || 'Banner'} fill sizes="420px" className="object-cover" />
          ) : (
            <div className="w-full h-full bg-[#f0f2f8]" />
          )}
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] p-3 mt-2">
          <h2 className="text-[18px] text-[#101d47] font-semibold">{banner?.title || 'Banner details'}</h2>
          <p className="text-[12px] text-[#63739a] mt-2 whitespace-pre-wrap">
            {banner?.description || 'No description available.'}
          </p>
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] p-3 mt-2">
          <h3 className="text-[15px] text-[#101d47] font-semibold">Rules</h3>
          {rules.length ? (
            <div className="mt-2 space-y-1">
              {rules.map((rule, idx) => (
                <p key={idx} className="text-[12px] text-[#63739a] leading-[1.35]">
                  {idx + 1}. {rule}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#97a3c2] mt-2">No rules</p>
          )}
        </div>

        {banner?.link ? (
          /^https?:\/\//i.test(banner.link) ? (
            <a
              href={banner.link}
              target="_blank"
              rel="noreferrer"
              className="h-9 mt-2 rounded-full bg-gradient-to-r from-[#6d8cf6] to-[#e280eb] text-white text-[14px] flex items-center justify-center"
            >
              Enter now
            </a>
          ) : (
            <Link
              href={banner.link}
              className="h-9 mt-2 rounded-full bg-gradient-to-r from-[#6d8cf6] to-[#e280eb] text-white text-[14px] flex items-center justify-center"
            >
              Enter now
            </Link>
          )
        ) : null}
      </div>
    </div>
  );
}
