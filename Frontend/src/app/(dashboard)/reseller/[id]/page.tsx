'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ShoppingCart,
  Store,
  Truck,
  ImageOff,
  Minus,
  Plus,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { shopApi } from '@/lib/api';
import { useCartStore } from '@/store';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = parseInt(params.id as string);
  const { addItem } = useCartStore();
  const cartCount = useCartStore((s) =>
    s.items.reduce((c, i) => c + i.quantity, 0)
  );

  const [quantity, setQuantity] = useState(1);
  const [resellerPrice, setResellerPrice] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['shop-product', productId],
    queryFn: () => shopApi.getProduct(productId),
    enabled: !!productId,
  });

  const effectivePrice = product
    ? parseFloat(
        product.effective_price || product.discount_price || product.price
      )
    : 0;

  const currentResellerPrice = resellerPrice
    ? parseFloat(resellerPrice)
    : product?.reseller_mrp_price
      ? parseFloat(product.reseller_mrp_price)
      : effectivePrice;

  const profitPerItem = currentResellerPrice - effectivePrice;
  const totalProfit = profitPerItem * quantity;

  const handleAddToCart = () => {
    if (!product) return;
    const price =
      resellerPrice ||
      product.reseller_mrp_price ||
      product.discount_price ||
      product.price;
    addItem(product, quantity, price);
    toast.success(`${product.title} added to cart`);
  };

  const panelClass =
    "rounded-lg border border-[#eaecef] dark:border-[#2b3139] bg-[#fafafa] dark:bg-[#1e2329]";
  const cardClass =
    "rounded-lg border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139]";

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Skeleton className="h-6 w-20 rounded-md mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-10 w-1/2 rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="rounded-md gap-1.5 h-9 mb-6 border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div
          className={`rounded-lg border border-dashed border-[#eaecef] dark:border-[#474d57] py-16 text-center ${cardClass}`}
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Product Not Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This product may have been removed or doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const hasDiscount =
    product.discount_price && product.discount_price !== product.price;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="rounded-md gap-1.5 h-9 border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] hover:bg-slate-50 dark:hover:bg-[#333b45]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Link href="/reseller/cart">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md gap-1.5 h-9 relative border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] hover:bg-slate-50 dark:hover:bg-[#333b45]"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-md bg-[#f0b90b] text-[#1e2329] text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      <div className={`${panelClass} overflow-hidden p-4 sm:p-6`}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className={`${cardClass} overflow-hidden`}>
              <div className="relative aspect-square bg-slate-100 dark:bg-[#1e2329]">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage]?.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
                {hasDiscount && product.discount_percentage && (
                  <span className="absolute top-3 left-3 rounded px-2 py-1 bg-[#1e2329] text-[#f0b90b] text-xs font-medium">
                    -{product.discount_percentage}% OFF
                  </span>
                )}
              </div>
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-md border-2 transition-colors ${
                      idx === selectedImage
                        ? "border-[#f0b90b] dark:border-[#f0b90b]"
                        : "border-[#eaecef] dark:border-[#474d57] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.image}
                      alt={`${product.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="border-b border-[#eaecef] dark:border-[#2b3139] pb-4 mb-4">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {product.title}
              </h1>
              {product.vendor_name && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Store className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {product.vendor_name}
                  </span>
                </div>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {product.category_name && (
                  <span className="text-xs rounded px-2 py-0.5 border border-[#eaecef] dark:border-[#474d57] text-slate-600 dark:text-slate-400">
                    {product.category_name}
                  </span>
                )}
                {product.brand_name && (
                  <span className="text-xs rounded px-2 py-0.5 border border-[#eaecef] dark:border-[#474d57] text-slate-600 dark:text-slate-400">
                    {product.brand_name}
                  </span>
                )}
                {product.sku && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
            </div>

            <div className={`${cardClass} p-4 mb-4`}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-[#f0b90b] dark:text-[#f0b90b]">
                  ৳{effectivePrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    ৳{parseFloat(product.price).toLocaleString()}
                  </span>
                )}
              </div>
              {product.reseller_mrp_price && (
                <div className="flex items-center gap-2 rounded-md border border-[#f0b90b]/40 px-3 py-2 mt-3 bg-[#f0b90b]/10 dark:bg-[#f0b90b]/5">
                  <Tag className="h-4 w-4 text-[#f0b90b]" />
                  <span className="text-sm text-[#f0b90b] dark:text-[#f0b90b]">
                    Reseller MRP: ৳
                    {parseFloat(product.reseller_mrp_price).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {(product.delivery_charge_inside_dhaka ||
              product.delivery_charge_outside_dhaka) && (
              <div className="flex gap-3 text-sm text-slate-500 dark:text-slate-400 mb-4">
                {product.delivery_charge_inside_dhaka && (
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    <span>
                      Dhaka: ৳
                      {parseFloat(product.delivery_charge_inside_dhaka).toLocaleString()}
                    </span>
                  </div>
                )}
                {product.delivery_charge_outside_dhaka && (
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    <span>
                      Outside: ৳
                      {parseFloat(product.delivery_charge_outside_dhaka).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className={`${cardClass} p-4 mb-4`}>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">
                Set Your Reseller Price
              </h3>

              <div className="mb-3">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Your selling price (৳)
                </label>
                <Input
                  type="number"
                  placeholder={`${product.reseller_mrp_price || effectivePrice}`}
                  value={resellerPrice}
                  onChange={(e) => setResellerPrice(e.target.value)}
                  className="rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] text-lg h-10"
                  min={0}
                  step="0.01"
                />
              </div>

              <div
                className={`flex items-center gap-2 rounded-md border px-3 py-2 mb-3 text-sm ${
                  profitPerItem >= 0
                    ? "border-[#f0b90b]/40 bg-[#f0b90b]/10 text-[#f0b90b]"
                    : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                <TrendingUp className={`h-4 w-4 ${profitPerItem < 0 ? "rotate-180" : ""}`} />
                <div className="flex-1">
                  <p>
                    {profitPerItem >= 0 ? "Profit" : "Loss"}: ৳
                    {Math.abs(profitPerItem).toLocaleString()} per item
                  </p>
                  {quantity > 1 && (
                    <p className="text-xs opacity-90">
                      Total: ৳{Math.abs(totalProfit).toLocaleString()} for {quantity} items
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-md border-[#eaecef] dark:border-[#474d57]"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg w-8 text-center text-slate-800 dark:text-slate-200 font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-md border-[#eaecef] dark:border-[#474d57]"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full h-10 rounded-md bg-[#f0b90b] hover:bg-[#d9a60a] text-[#1e2329] font-medium border border-[#e5a708]"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart — ৳{(currentResellerPrice * quantity).toLocaleString()}
              </Button>
            </div>

            {product.description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Description
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs rounded px-2 py-0.5 border border-[#eaecef] dark:border-[#474d57] text-slate-600 dark:text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
