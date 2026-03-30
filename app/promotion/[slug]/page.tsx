'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useParams } from 'next/navigation';

export default function PromotionDetailPage() {
  const params = useParams<{ slug: string }>();
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const res = await fetch('/api/content-pages');
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data || ignore) return;
        const page = (data.pages || []).find((p: any) => p.slug === params.slug);
        if (page) setContent({ title: page.title, content: page.content });
      } catch {
        // Keep fallback state on transient/API errors.
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [params.slug]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack title={content?.title || 'Details'} />
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-sm text-gray-600 leading-relaxed">
          {content?.content || 'Details will appear here.'}
        </div>
      </div>
    </div>
  );
}
