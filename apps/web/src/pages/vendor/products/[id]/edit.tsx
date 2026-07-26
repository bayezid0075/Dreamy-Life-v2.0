import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getProductDetail, updateProduct } from '@/features/products/api';
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

interface VariantPrice {
  price: string;
}

interface VariantPrices {
  [key: string]: VariantPrice;
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const sizeInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    actualPrice: '',
    discountPrice: '',
    deliveryChargeInside: '',
    deliveryChargeOutside: '',
    stock: '',
    sku: '',
  });
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [variantPrices, setVariantPrices] = useState<VariantPrices>({});
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadCount: unreadNotifCount, setUnreadCount: setUnreadNotifCount } = useNotificationStore();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);

  const categories = [
    { value: 'home_decor', label: 'Home Decor' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'textiles', label: 'Textiles' },
  ];

  const subcategories: Record<string, { value: string; label: string }[]> = {
    home_decor: [
      { value: 'vases', label: 'Vases' },
      { value: 'wall_art', label: 'Wall Art' },
      { value: 'candles', label: 'Candles' },
      { value: 'clocks', label: 'Clocks' },
      { value: 'mirrors', label: 'Mirrors' },
      { value: 'planters', label: 'Planters' },
      { value: 'figurines', label: 'Figurines' },
      { value: 'other', label: 'Other' },
    ],
    furniture: [
      { value: 'tables', label: 'Tables' },
      { value: 'chairs', label: 'Chairs' },
      { value: 'shelves', label: 'Shelves' },
      { value: 'beds', label: 'Beds' },
      { value: 'sofas', label: 'Sofas' },
      { value: 'cabinets', label: 'Cabinets' },
      { value: 'other', label: 'Other' },
    ],
    lighting: [
      { value: 'table_lamp', label: 'Table Lamp' },
      { value: 'floor_lamp', label: 'Floor Lamp' },
      { value: 'pendant', label: 'Pendant' },
      { value: 'chandelier', label: 'Chandelier' },
      { value: 'wall_light', label: 'Wall Light' },
      { value: 'other', label: 'Other' },
    ],
    textiles: [
      { value: 'curtains', label: 'Curtains' },
      { value: 'pillows', label: 'Pillows' },
      { value: 'rugs', label: 'Rugs' },
      { value: 'blankets', label: 'Blankets' },
      { value: 'tablecloths', label: 'Tablecloths' },
      { value: 'other', label: 'Other' },
    ],
  };

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (id) loadProduct();
    Promise.all([
      getMyVendorProfile().then(d => {
        const profile = d.data || null;
        setVendorProfile(profile);
        if (profile?.status === 'banned') {
          router.replace('/vendor/banned');
        }
      }).catch(() => setVendorProfile(null)),
      api.get('/auth/profile').then(d => setUser(d.data?.data?.user)).catch(() => {}),
      api.get('/notifications/unread-count').then(d => { if (d.data?.count !== undefined) setUnreadNotifCount(d.data.count); }).catch(() => {}),
    ]);
  }, [isAuthenticated, id]);

  useEffect(() => {
    if (colors.length > 0 && sizes.length > 0) {
      const newVariantPrices: VariantPrices = {};
      colors.forEach(color => {
        sizes.forEach(size => {
          const key = `${color}-${size}`;
          if (variantPrices[key]) {
            newVariantPrices[key] = variantPrices[key];
          } else {
            newVariantPrices[key] = { price: form.actualPrice || '' };
          }
        });
      });
      setVariantPrices(newVariantPrices);
    }
  }, [colors, sizes]);

  const loadProduct = async () => {
    try {
      const res = await getProductDetail(id as string);
      const p = res.data;
      setForm({
        name: p.name || '',
        description: p.description || '',
        category: p.category || '',
        subcategory: p.subcategory || '',
        actualPrice: String(p.actualPrice || ''),
        discountPrice: p.discountPrice ? String(p.discountPrice) : '',
        deliveryChargeInside: p.deliveryChargeInside != null ? String(p.deliveryChargeInside) : '',
        deliveryChargeOutside: p.deliveryChargeOutside != null ? String(p.deliveryChargeOutside) : '',
        stock: String(p.stock || ''),
        sku: p.sku || '',
      });
      if (p.colors) setColors(p.colors);
      if (p.sizes) setSizes(p.sizes);
      if (p.variantPrices) {
        const vp: VariantPrices = {};
        Object.entries(p.variantPrices).forEach(([key, val]: [string, any]) => {
          vp[key] = { price: String(val.price || '') };
        });
        setVariantPrices(vp);
      }
      const existingImages: ImagePreview[] = (p.imageUrls || []).map((url: string) => ({
        url,
        uploaded: true,
      }));
      setImages(existingImages);
      setError('');
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to load product';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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

    const startIndex = images.length;
    setImages(prev => [...prev, ...newPreviews]);

    validFiles.forEach((file, i) => {
      const previewIndex = startIndex + i;
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
    if (e.dataTransfer.files.length > 0) addFiles(Array.from(e.dataTransfer.files));
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

  const addColor = () => {
    const trimmed = colorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors(prev => [...prev, trimmed]);
      setColorInput('');
    }
  };

  const removeColor = (color: string) => {
    setColors(prev => prev.filter(c => c !== color));
    setVariantPrices(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${color}-`)) delete updated[key];
      });
      return updated;
    });
  };

  const addSize = () => {
    const trimmed = sizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes(prev => [...prev, trimmed]);
      setSizeInput('');
    }
  };

  const removeSize = (size: string) => {
    setSizes(prev => prev.filter(s => s !== size));
    setVariantPrices(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.endsWith(`-${size}`)) delete updated[key];
      });
      return updated;
    });
  };

  const updateVariantPrice = (key: string, price: string) => {
    setVariantPrices(prev => ({
      ...prev,
      [key]: { price },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.some(img => img.uploading)) { setError('Please wait for all images to finish uploading'); return; }
    setSaving(true);
    setError('');
    try {
      const imageUrls = images.filter(img => img.uploaded || !img.file).map(img => img.url);

      const cleanedVariantPrices: Record<string, { price: number }> = {};
      Object.entries(variantPrices).forEach(([key, val]) => {
        const parsed = parseFloat(val.price);
        if (!isNaN(parsed) && parsed > 0) {
          cleanedVariantPrices[key] = { price: parsed };
        }
      });

      await updateProduct(id as string, {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        subcategory: form.subcategory || undefined,
        actualPrice: parseFloat(form.actualPrice),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : undefined,
        deliveryChargeInside: form.deliveryChargeInside ? parseFloat(form.deliveryChargeInside) : 0,
        deliveryChargeOutside: form.deliveryChargeOutside ? parseFloat(form.deliveryChargeOutside) : 0,
        colors: colors.length > 0 ? colors : undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
        variantPrices: Object.keys(cleanedVariantPrices).length > 0 ? cleanedVariantPrices : undefined,
        stock: parseInt(form.stock),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      router.push('/vendor/products');
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to update product';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { useAuthStore.getState().clearAuth(); router.replace('/login'); };
  const copyReferCode = () => { if (user?.ownRefercode) navigator.clipboard.writeText(user.ownRefercode); };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8ff] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Edit Product - Vendor Suite</title></Head>
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
          title="Edit Product"
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
          <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Edit Product</h1>
          <div className="w-10" />
        </header>

        <main className="pt-8 md:pt-32 pb-20 px-6 max-w-[900px] mx-auto w-full relative z-10">
          {error && !loading && (
            <div className="bg-[#ffdad6]/50 border border-[#ffdad6] rounded-xl p-4 text-sm text-[#93000a] flex items-center justify-between mb-6">
              <span>{error}</span>
              <button onClick={() => { setError(''); setLoading(true); loadProduct(); }} className="font-semibold underline ml-4 shrink-0">Retry</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
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
                        className="text-xs font-semibold text-[#2d666d] hover:underline">+ Add more</button>
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
                            <p className="text-xs text-[#45474b] truncate">{i === 0 ? 'Cover image' : `Image ${i + 1}`}</p>
                            <p className="text-[10px] text-[#45474b]/50">{img.uploaded ? 'Uploaded' : img.uploading ? 'Uploading...' : 'Ready'}</p>
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
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, subcategory: '' })} required
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] appearance-none focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all">
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Sub Category</label>
                    <select value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })}
                      disabled={!form.category}
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] appearance-none focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      <option value="">Select Sub Category</option>
                      {form.category && subcategories[form.category]?.map(sc => (
                        <option key={sc.value} value={sc.value}>{sc.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Actual Price (৳) *</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#45474b]">৳</span>
                      <input type="number" step="0.01" value={form.actualPrice} onChange={e => setForm({ ...form, actualPrice: e.target.value })} placeholder="0.00" required
                        className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full pl-10 pr-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Discount Price (৳)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#45474b]">৳</span>
                      <input type="number" step="0.01" value={form.discountPrice} onChange={e => setForm({ ...form, discountPrice: e.target.value })} placeholder="0.00"
                        className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full pl-10 pr-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Stock Quantity *</label>
                    <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">SKU (optional)</label>
                    <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                      className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Delivery Charge Inside Dhaka (৳)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#45474b]">৳</span>
                      <input type="number" step="0.01" value={form.deliveryChargeInside} onChange={e => setForm({ ...form, deliveryChargeInside: e.target.value })} placeholder="0.00"
                        className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full pl-10 pr-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#5d5e64] px-1">Delivery Charge Outside Dhaka (৳)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#45474b]">৳</span>
                      <input type="number" step="0.01" value={form.deliveryChargeOutside} onChange={e => setForm({ ...form, deliveryChargeOutside: e.target.value })} placeholder="0.00"
                        className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full pl-10 pr-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-12 flex flex-col gap-2 mt-2">
                <label className="text-sm font-semibold text-[#5d5e64] px-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5}
                  className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-2xl px-6 py-4 text-[#1c1b1b] placeholder:text-[#45474b]/50 resize-none focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
              </div>

              <div className="md:col-span-12">
                <div className="bg-white/50 backdrop-blur-[24px] rounded-2xl p-6 border border-white/50">
                  <h3 className="text-sm font-bold text-[#1c1b1b] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2d666d] text-lg">palette</span>
                    Colors & Sizes (Optional)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#5d5e64] px-1">Add Colors</label>
                      <div className="flex gap-2">
                        <input ref={colorInputRef} type="text" value={colorInput} onChange={e => setColorInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                          placeholder="e.g. Red, Blue"
                          className="flex-1 bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-3 text-sm text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                        <button type="button" onClick={addColor}
                          className="w-10 h-10 rounded-full bg-[#2d666d] text-white flex items-center justify-center hover:bg-[#1e4a50] transition-colors flex-shrink-0">
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      </div>
                      {colors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {colors.map(color => (
                            <span key={color} className="inline-flex items-center gap-1.5 bg-[#e9fdff] text-[#2d666d] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#98d0d7]/30">
                              {color}
                              <button type="button" onClick={() => removeColor(color)} className="hover:text-[#ba1a1a] transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#5d5e64] px-1">Add Sizes</label>
                      <div className="flex gap-2">
                        <input ref={sizeInputRef} type="text" value={sizeInput} onChange={e => setSizeInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
                          placeholder="e.g. S, M, L, XL"
                          className="flex-1 bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full px-6 py-3 text-sm text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-4 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                        <button type="button" onClick={addSize}
                          className="w-10 h-10 rounded-full bg-[#2d666d] text-white flex items-center justify-center hover:bg-[#1e4a50] transition-colors flex-shrink-0">
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      </div>
                      {sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sizes.map(size => (
                            <span key={size} className="inline-flex items-center gap-1.5 bg-[#fff4e6] text-[#b36b00] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#ffd699]/30">
                              {size}
                              <button type="button" onClick={() => removeSize(size)} className="hover:text-[#ba1a1a] transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {colors.length > 0 && sizes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#45474b] uppercase tracking-wider mb-3">Variant Prices (৳)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {colors.map(color =>
                          sizes.map(size => {
                            const key = `${color}-${size}`;
                            return (
                              <div key={key} className="flex items-center gap-2 bg-white/40 rounded-xl px-3 py-2 border border-white/30">
                                <span className="text-xs font-semibold text-[#5d5e64] min-w-0 truncate">{color} - {size}</span>
                                <div className="relative flex-1">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#45474b] text-xs">৳</span>
                                  <input type="number" step="0.01" value={variantPrices[key]?.price || ''}
                                    onChange={e => updateVariantPrice(key, e.target.value)} placeholder="0.00"
                                    className="w-full bg-white/50 backdrop-blur-[12px] border border-white/40 rounded-full pl-7 pr-2 py-1.5 text-xs text-[#1c1b1b] placeholder:text-[#45474b]/50 focus:bg-white/80 focus:border-[#98d0d7] focus:ring-2 focus:ring-[#98d0d7]/20 outline-none transition-all" />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && <div className="bg-[#ffdad6]/50 border border-[#ffdad6] rounded-xl p-4 text-sm text-[#93000a]">{error}</div>}

            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 mt-8 border-t border-white/20">
              <button type="button" onClick={() => router.back()}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/50 backdrop-blur-[24px] text-[#1c1b1b] text-sm font-semibold hover:bg-white/60 transition-all active:scale-95 border border-white/30">
                Cancel
              </button>
              <button type="submit" disabled={saving || images.some(img => img.uploading)}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-black/10 disabled:opacity-60">
                {saving ? 'Saving...' : images.some(img => img.uploading) ? 'Uploading...' : 'Update Product'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
