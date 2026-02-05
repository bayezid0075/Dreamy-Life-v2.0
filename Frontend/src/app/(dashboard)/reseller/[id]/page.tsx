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
import { Badge } from '@/components/ui/badge';
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
      <div className="px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
        <Skeleton className="h-8 w-20 mb-4" />
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm py-16 text-center">
          <h3 className="text-lg font-semibold mb-2">Product Not Found</h3>
          <p className="text-sm text-muted-foreground">
            This product may have been removed or doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const hasDiscount =
    product.discount_price && product.discount_price !== product.price;

  return (
    <div className="px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Link href="/reseller/cart">
          <Button variant="outline" size="sm" className="gap-1.5 relative">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Images */}
        <div>
          <div className="rounded-2xl overflow-hidden shadow-sm bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <div className="relative aspect-square">
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
                <Badge className="absolute top-3 left-3 bg-rose-500 text-white border-0">
                  -{product.discount_percentage}% OFF
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedImage
                      ? 'border-violet-500 shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
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
          {/* Title & Vendor */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {product.title}
            </h1>
            {product.vendor_name && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {product.vendor_name}
                </span>
              </div>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {product.category_name && (
                <Badge variant="secondary" className="text-xs">
                  {product.category_name}
                </Badge>
              )}
              {product.brand_name && (
                <Badge variant="secondary" className="text-xs">
                  {product.brand_name}
                </Badge>
              )}
              {product.sku && (
                <Badge variant="outline" className="text-xs font-mono">
                  SKU: {product.sku}
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl p-4 shadow-sm bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20 mb-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-400">
                ৳{effectivePrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ৳{parseFloat(product.price).toLocaleString()}
                </span>
              )}
            </div>
            {product.reseller_mrp_price && (
              <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg px-3 py-2 mt-3">
                <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Reseller MRP: ৳
                  {parseFloat(product.reseller_mrp_price).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Delivery Info */}
          {(product.delivery_charge_inside_dhaka ||
            product.delivery_charge_outside_dhaka) && (
            <div className="flex gap-3 text-sm mb-4">
              {product.delivery_charge_inside_dhaka && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>
                    Dhaka: ৳
                    {parseFloat(
                      product.delivery_charge_inside_dhaka
                    ).toLocaleString()}
                  </span>
                </div>
              )}
              {product.delivery_charge_outside_dhaka && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>
                    Outside: ৳
                    {parseFloat(
                      product.delivery_charge_outside_dhaka
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <Separator className="mb-4" />

          {/* Add to Cart Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 mb-4">
            <h3 className="text-base font-semibold mb-3">
              Set Your Reseller Price
            </h3>

            {/* Custom Price Input */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Your selling price (৳)
              </label>
              <Input
                type="number"
                placeholder={`${product.reseller_mrp_price || effectivePrice}`}
                value={resellerPrice}
                onChange={(e) => setResellerPrice(e.target.value)}
                className="text-lg font-semibold"
                min={0}
                step="0.01"
              />
            </div>

            {/* Profit Display */}
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-3 ${
                profitPerItem >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-rose-100 dark:bg-rose-900/30'
              }`}
            >
              <TrendingUp
                className={`h-4 w-4 ${
                  profitPerItem >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400 rotate-180'
                }`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    profitPerItem >= 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {profitPerItem >= 0 ? 'Profit' : 'Loss'}: ৳
                  {Math.abs(profitPerItem).toLocaleString()} per item
                </p>
                {quantity > 1 && (
                  <p
                    className={`text-xs ${
                      profitPerItem >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    Total: ৳{Math.abs(totalProfit).toLocaleString()} for{' '}
                    {quantity} items
                  </p>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-violet-500/25"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart — ৳
              {(currentResellerPrice * quantity).toLocaleString()}
            </Button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {product.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
