import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { createProduct } from '@/features/products/api';
import { getMyVendorProfile, VendorProfile } from '@/features/vendor/api';
import { uploadMedia } from '@/features/media/upload';
import api from '@dreamy-life/api-client';
import DesktopHeader from '@/shared/components/DesktopHeader';
import SideDrawer from '@/shared/components/SideDrawer';

interface ImagePreview {
  file?: File;
  url: string;
  uploading?: boolean;
  uploaded?: boolean;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', description: '', category: '', price: '', stock: '', sku: '' });
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    Promise.all([
      getMyVendorProfile().then(d => { setVendorProfile(d.data || null); }).catch(() => setVendorProfile(null)),
      api.get('/auth/profile').then(d => setUser(d.data?.data?.user)).catch(() => {}),
      api.get('/notifications/unread-count').then(d => { if (d.data?.count !== undefined) setUnreadNotifCount(d.data.count); }).catch(() => {}),
    ]);
  }, [isAuthenticated]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = (files: File[]) => {
    const validFiles = files.filter(f => {
      if (!f.type.startsWith('image/')) { setError('Only image files are allowed'); return false; }
      if (f.size > 5 * 1024 * 1024) { setError('Each image must be less than 5MB'); return false; }
      return true;
    });
    if (validFiles.length === 0) return;
    setError('');

    const newPreviews: ImagePreview[] = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      uploading: true,
      uploaded: false,
    }));

    setImages(prev => [...prev, ...newPreviews]);

    validFiles.forEach((file, i) => {
      const previewIndex = images.length + i;
      uploadMedia(file)
        .then(result => {
          setImages(prev => prev.map((img, idx) =>
            idx === previewIndex ? { ...img, url: result.url, uploading: false, uploaded: true } : img
          ));
        })
        .catch(() => {
          setImages(prev => prev.map((img, idx) =>
            idx === previewIndex ? { ...img, uploading: false } : img
          ));
          setError('Failed to upload one or more images');
        });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const removed = prev[index];
      if (removed?.file) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.some(img => img.uploading)) {
      setError('Please wait for all images to finish uploading');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const imageUrls = images.filter(img => img.uploaded || !img.file).map(img => img.url);
      await createProduct({
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        sku: form.sku || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      router.push('/vendor/products');
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to create product';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { useAuthStore.getState().clearAuth(); router.replace('/login'); };
  const copyReferCode = () => { if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode); };

  return (
    <>
      <Head><title>Add Product - Vendor Suite</title></Head>
      <div
        className="min-h-screen overflow-x-hidden pb-32 selection:bg-[#ffd1dc] selection:text-[#1c1b1b]"
        style={{
          background: `radial-gradient(circle at 10% 20%, rgba(255, 217, 226, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 90% 80%, rgba(179, 236, 243, 0.4) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, rgba(248, 248, 255, 1) 0%, transparent 100%)`,
          backgroundColor: '#f8f8ff',
          color: '#1c1b1b',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        <DesktopHeader
          title="Add New Product"
          onMenuClick={() => setDrawerOpen(true)}
          avatarUrl={user?.info?.avatarUrl || ''}
          unreadNotifCount={unreadNotifCount}
        />

        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          vendorProfile={vendorProfile}
          handleLogout={handleLogout}
          copyReferCode={copyReferCode}
        />

        <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Add Product</h1>
          <div className="w-10" />
        </header>

        <main className="pt-8 md:pt-32 pb-20 px-6 max-w-[900px] mx-auto w-full relative z-10">
          <form onSubmit={handleSubmit} className="space-y-8 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-6 cursor-pointer hover:bg-white/60 transition-all border-2 border-dashed border-white/50 hover:border-[#98d0d7]"
                >
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-16 h-16 rounded-full bg-[#e9fdff] flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-[#2d666d] text-3xl">cloud_upload</span>
                    </div>
                    <p className="text-sm font-semibold text-[#5d5e64] text-center">Tap to upload images</p>
                    <p className="text-xs text-[#45474b] mt-1 text-center opacity-60">or drag and drop</p>
                    <p className="text-xs text-[#45474b] mt-2 text-center opacity-40">JPG, PNG, WebP · Max 5MB each</p>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#45474b] uppercase tracking-wider">{images.length} image{images.length !== 1 ? 's' : ''}</p>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-[#2d666d] hover:underline">
                        + Add more
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {images.map((img, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/40 rounded-xl p-2 border border-white/30">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0 relative">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                            {img.uploading && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#45474b] truncate">
                              {img.file?.name || 'Image'}
                            </p>
                            <p className="text-[10px] text-[#45474b]/50">
                              {img.uploaded ? 'Uploaded' : img.uploading ? 'Uploading...' : 'Ready'}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0}
                              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors disabled:opacity-20">
                              <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                            </button>
                            <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === images.length - 1}
                              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors disabled:opacity-20">
                              <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                            </button>
                            <button type="button" onClick={() => removeImage(i)}
                              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors">
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-7 space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#5d5e64] px-1">Product Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Minimalist Ceramic Vase" required
                    className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] appearance-none focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all">
                      <option value="">Select Category</option>
                      <option value="home_decor">Home Decor</option>
                      <option value="furniture">Furniture</option>
                      <option value="lighting">Lighting</option>
                      <option value="textiles">Textiles</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Price ($) *</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#45474b]">$</span>
                      <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" required
                        className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full pl-10 pr-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Stock Quantity *</label>
                    <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Available units" required
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">SKU (optional)</label>
                    <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated if empty"
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-12 flex flex-col gap-2 mt-2">
                <label className="text-sm font-semibold text-[#5d5e64] px-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the product details, materials, and care instructions..." rows={5}
                  className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-2xl px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 resize-none focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
              </div>
            </div>

            {error && <div className="bg-[#ffdad6]/50 border border-[#ffdad6] rounded-xl p-4 text-sm text-[#93000a]">{error}</div>}

            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 mt-8 border-t border-white/20">
              <button type="button" onClick={() => router.back()}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/50 backdrop-blur-[24px] text-[#1c1b1b] text-sm font-semibold hover:bg-white/60 transition-all active:scale-95 border border-white/30">
                Cancel
              </button>
              <button type="submit" disabled={loading || images.some(img => img.uploading)}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/10 disabled:opacity-60">
                {loading ? 'Saving...' : images.some(img => img.uploading) ? 'Uploading...' : 'Save Product'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
