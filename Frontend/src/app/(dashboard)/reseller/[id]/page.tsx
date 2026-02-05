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
import { Separator } from '@/components/ui/separator';

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

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#f5f0e8] dark:bg-[#1a1714] font-serif px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
        <Skeleton className="h-8 w-20 mb-4 rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="aspect-square rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
            <Skeleton className="h-4 w-1/3 rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
            <Skeleton className="h-10 w-1/2 rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
            <Skeleton className="h-24 w-full rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
            <Skeleton className="h-12 w-full rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-full bg-[#f5f0e8] dark:bg-[#1a1714] font-serif px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 mb-4 font-serif"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/30 py-16 text-center">
          <h3 className="font-serif text-lg font-normal text-stone-800 dark:text-stone-200 mb-2">Product Not Found</h3>
          <p className="text-sm font-mono text-stone-500 dark:text-stone-400">
            This product may have been removed or doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const hasDiscount =
    product.discount_price && product.discount_price !== product.price;

  return (
    <div className="min-h-full bg-[#f5f0e8] dark:bg-[#1a1714] font-serif px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-serif"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Link href="/reseller/cart">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 relative border-stone-400 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 font-serif"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-sm bg-stone-800 dark:bg-amber-800 text-[#f5f0e8] text-[10px] font-bold flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Images */}
        <div>
          <div className="border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-50 dark:bg-stone-900/50">
            <div className="relative aspect-square">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]?.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff className="h-16 w-16 text-stone-300 dark:text-stone-600" />
                </div>
              )}
              {hasDiscount && product.discount_percentage && (
                <span className="absolute top-3 left-3 bg-stone-800 dark:bg-amber-900 text-[#f5f0e8] text-xs font-mono px-2 py-1">
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
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 transition-colors ${
                    idx === selectedImage
                      ? 'border-stone-800 dark:border-amber-600'
                      : 'border-stone-200 dark:border-stone-700 opacity-70 hover:opacity-100'
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

        {/* Product Info */}
        <div>
          <div className="mb-4 border-b border-stone-200 dark:border-stone-800 pb-4">
            <h1 className="text-xl sm:text-2xl font-serif font-normal tracking-tight text-stone-800 dark:text-stone-100 uppercase">
              {product.title}
            </h1>
            {product.vendor_name && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Store className="h-3.5 w-3.5 text-stone-400" />
                <span className="text-sm font-mono text-stone-500 dark:text-stone-400">
                  {product.vendor_name}
                </span>
              </div>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {product.category_name && (
                <span className="text-xs font-mono border border-stone-300 dark:border-stone-600 px-2 py-0.5 text-stone-600 dark:text-stone-400">
                  {product.category_name}
                </span>
              )}
              {product.brand_name && (
                <span className="text-xs font-mono border border-stone-300 dark:border-stone-600 px-2 py-0.5 text-stone-600 dark:text-stone-400">
                  {product.brand_name}
                </span>
              )}
              {product.sku && (
                <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                  SKU: {product.sku}
                </span>
              )}
            </div>
          </div>

          <div className="border border-stone-200 dark:border-stone-800 p-4 mb-4 bg-white/50 dark:bg-stone-900/30">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-serif font-semibold text-stone-800 dark:text-amber-100">
                ৳{effectivePrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm font-mono text-stone-400 line-through">
                  ৳{parseFloat(product.price).toLocaleString()}
                </span>
              )}
            </div>
            {product.reseller_mrp_price && (
              <div className="flex items-center gap-2 border border-amber-200 dark:border-amber-800/50 px-3 py-2 mt-3 bg-amber-50/50 dark:bg-amber-900/10">
                <Tag className="h-4 w-4 text-amber-800 dark:text-amber-400" />
                <span className="text-sm font-mono text-amber-800 dark:text-amber-200">
                  Reseller MRP: ৳
                  {parseFloat(product.reseller_mrp_price).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {(product.delivery_charge_inside_dhaka ||
            product.delivery_charge_outside_dhaka) && (
            <div className="flex gap-3 text-sm font-mono text-stone-500 dark:text-stone-400 mb-4">
              {product.delivery_charge_inside_dhaka && (
                <div className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4" />
                  <span>Dhaka: ৳{parseFloat(product.delivery_charge_inside_dhaka).toLocaleString()}</span>
                </div>
              )}
              {product.delivery_charge_outside_dhaka && (
                <div className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4" />
                  <span>Outside: ৳{parseFloat(product.delivery_charge_outside_dhaka).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <Separator className="mb-4 bg-stone-200 dark:bg-stone-700" />

          <div className="border border-stone-200 dark:border-stone-800 p-4 mb-4 bg-white dark:bg-stone-900/30">
            <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 mb-3 uppercase text-sm">
              Set Your Reseller Price
            </h3>

            <div className="mb-3">
              <label className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1.5 block">
                Your selling price (৳)
              </label>
              <Input
                type="number"
                placeholder={`${product.reseller_mrp_price || effectivePrice}`}
                value={resellerPrice}
                onChange={(e) => setResellerPrice(e.target.value)}
                className="text-lg font-mono border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-none"
                min={0}
                step="0.01"
              />
            </div>

            <div
              className={`flex items-center gap-2 border px-3 py-2 mb-3 font-mono text-sm ${
                profitPerItem >= 0
                  ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200'
                  : 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 text-red-800 dark:text-red-200'
              }`}
            >
              <TrendingUp className={`h-4 w-4 ${profitPerItem < 0 ? 'rotate-180' : ''}`} />
              <div className="flex-1">
                <p>
                  {profitPerItem >= 0 ? 'Profit' : 'Loss'}: ৳{Math.abs(profitPerItem).toLocaleString()} per item
                </p>
                {quantity > 1 && (
                  <p className="text-xs opacity-90">
                    Total: ৳{Math.abs(totalProfit).toLocaleString()} for {quantity} items
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1.5 block">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-none border-stone-400 dark:border-stone-600"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-mono w-8 text-center text-stone-800 dark:text-stone-200">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-none border-stone-400 dark:border-stone-600"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              className="w-full h-11 text-sm font-mono rounded-none border border-stone-800 dark:border-amber-800 bg-stone-800 dark:bg-amber-900/40 text-[#f5f0e8] hover:bg-stone-700 dark:hover:bg-amber-800/60"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart — ৳{(currentResellerPrice * quantity).toLocaleString()}
            </Button>
          </div>

          {product.description && (
            <div className="mb-4">
              <h3 className="font-serif text-sm text-stone-800 dark:text-stone-200 mb-2 uppercase">Description</h3>
              <p className="text-sm font-mono text-stone-500 dark:text-stone-400 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {product.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs font-mono border border-stone-300 dark:border-stone-600 px-2 py-0.5 text-stone-600 dark:text-stone-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
