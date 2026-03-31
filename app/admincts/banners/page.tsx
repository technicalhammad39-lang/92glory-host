'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';

type BannerForm = {
  title: string;
  image: string;
  link: string;
  description: string;
  rulesText: string;
  order: number;
  placement: string;
  isActive: boolean;
};

const defaultForm: BannerForm = {
  title: '',
  image: '',
  link: '',
  description: '',
  rulesText: '',
  order: 0,
  placement: 'home',
  isActive: true
};

export default function AdminBanners() {
  const { token } = useAuthStore();
  const [banners, setBanners] = useState<any[]>([]);
  const [form, setForm] = useState<BannerForm>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    fetch('/api/banners')
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setBanners(data?.banners || []));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.image.trim()) {
      setMessage('Banner image is required.');
      return;
    }
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/banners/${editingId}` : '/api/banners';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data?.error || 'Unable to save banner.');
      return;
    }
    setMessage(editingId ? 'Banner updated successfully.' : 'Banner added successfully.');
    setEditingId(null);
    setForm(defaultForm);
    load();
  };

  const uploadBannerImage = async (file: File | null) => {
    if (!file || !token) return;

    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/uploads/banner', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Unable to upload image.');
      }
      setForm((prev) => ({ ...prev, image: String(data.url) }));
      setMessage('Banner image uploaded.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner: any) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || '',
      image: banner.image || '',
      link: banner.link || '',
      description: banner.description || '',
      rulesText: banner.rulesText || '',
      order: Number(banner.order || 0),
      placement: banner.placement || 'home',
      isActive: Boolean(banner.isActive)
    });
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data?.error || 'Unable to delete banner.');
      return;
    }
    setMessage('Banner deleted successfully.');
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Banner Details</h1>
        <p className="text-gray-400 text-sm">Manage banner image and detail page content.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Image path (auto-filled after upload)"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Detail action link (optional)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Order"
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm md:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <textarea
            rows={4}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm md:col-span-2"
            placeholder="Rules (one per line)"
            value={form.rulesText}
            onChange={(e) => setForm({ ...form, rulesText: e.target.value })}
          />
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={form.placement}
            onChange={(e) => setForm({ ...form, placement: e.target.value })}
          >
            <option value="home">home</option>
            <option value="activity">activity</option>
          </select>
          <label className="md:col-span-2 border border-dashed border-purple-200 rounded-xl px-3 py-4 text-sm text-purple-700 bg-purple-50 cursor-pointer">
            <span className="font-semibold">{uploading ? 'Uploading image...' : 'Upload banner image'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadBannerImage(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </label>
        </div>
        {message && <p className="text-xs font-semibold text-accent-purple">{message}</p>}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Active</label>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        </div>
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          {editingId ? 'Update Banner' : 'Add Banner'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative aspect-[21/9]">
              <Image src={banner.image} alt={banner.title || 'banner'} fill sizes="(max-width: 1024px) 100vw, 420px" className="object-cover" />
            </div>
            <div className="p-4 space-y-1">
              <p className="text-sm font-bold text-gray-800">{banner.title || '(no title)'}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{banner.description || 'No description'}</p>
              <p className="text-xs text-gray-400">Order {banner.order}</p>
              <p className="text-xs text-gray-400">Placement: {banner.placement}</p>
            </div>
            <div className="px-4 pb-4 flex gap-3">
              <button onClick={() => handleEdit(banner)} className="text-xs font-bold text-accent-purple">Edit</button>
              <button onClick={() => handleDelete(banner.id)} className="text-xs font-bold text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
