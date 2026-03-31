'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { MobileTopBar } from '@/components/MobileTopBar';
import { getSupportIssueBySlug } from '@/lib/support-center';

async function uploadOne(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/uploads/support-attachment', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to upload screenshot.');
  }

  return String(payload?.url || '');
}

export default function SupportIssueFormPage() {
  const { issue } = useParams<{ issue: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const issueMeta = useMemo(() => getSupportIssueBySlug(String(issue || '')), [issue]);

  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  if (!issueMeta) {
    return (
      <div className="min-h-screen bg-[#f2f2f8]">
        <MobileTopBar title="Support" />
        <div className="p-4 text-[14px] text-[#6a7284]">Issue type not found.</div>
      </div>
    );
  }

  const submit = async () => {
    if (!token) {
      router.push('/login');
      return;
    }

    const text = details.trim();
    if (!text) {
      setError('Please enter details.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const url = await uploadOne(file, token);
        if (url) uploaded.push(url);
      }

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: issueMeta.key,
          subject: issueMeta.label,
          details: text,
          attachments: uploaded
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to submit ticket.');
      }

      router.push('/account/customer-service/progress-query?submitted=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit ticket.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f8] pb-8">
      <MobileTopBar title={issueMeta.label} />
      <div className="px-4 pt-3">
        <div className="bg-white border border-[#ececf2] rounded-md p-3">
          <p className="text-[13px] text-[#5d6578] mb-2">Please describe your issue details</p>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Enter issue details"
            rows={6}
            className="w-full resize-none rounded-md border border-[#e7e8f1] bg-[#fafbff] px-3 py-2 text-[14px] text-[#2f3342] outline-none"
          />

          <div className="mt-3">
            <label className="h-10 px-3 rounded-md border border-[#d7d9e4] bg-[#f8f8fc] inline-flex items-center gap-2 text-[13px] text-[#4d5470] cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload screenshots
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const next = Array.from(e.target.files || []);
                  if (!next.length) return;
                  setFiles((prev) => [...prev, ...next]);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            <p className="text-[11px] text-[#8a90a3] mt-1">You can attach multiple screenshots.</p>
          </div>

          {!!files.length && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {previews.map((preview, idx) => (
                <div key={`${preview.file.name}-${idx}`} className="relative aspect-square rounded-md overflow-hidden border border-[#e4e6ef] bg-[#f7f8fc]">
                  <Image src={preview.url} alt={preview.file.name} fill sizes="140px" className="object-cover" />
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label="Remove screenshot"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-[12px] text-[#ef4e4e] mt-3">{error}</p>}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#6f8df8] to-[#db7de9] text-white text-[16px] mt-4 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
