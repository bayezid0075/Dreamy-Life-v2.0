'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  TrendingUp,
  ImageOff,
  Store,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { useCartStore } from '@/store';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, updateResellerPrice, clearCart } =
    useCartStore();

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(
      item.resellerPrice || item.product.discount_price || item.product.price
    );
    return sum + price * item.quantity;
  }, 0);

  const totalCost = items.reduce((sum, item) => {
    const cost = parseFloat(item.product.discount_price || item.product.price);
    return sum + cost * item.quantity;
  }, 0);

  const totalProfit = subtotal - totalCost;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-full bg-[#f5f0e8] dark:bg-[#1a1714] font-serif px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
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
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 font-mono text-sm"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="mb-6 border-b border-stone-300 dark:border-stone-700 pb-4">
        <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-stone-800 dark:text-stone-100 uppercase">
          Shopping Cart
        </h1>
        <p className="text-sm font-mono text-stone-500 dark:text-stone-400 mt-1">
          {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
        </p>
      </div>

      {items.length === 0 ? (
        <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/30 py-16 text-center">
          <div className="w-12 h-12 mx-auto border border-stone-300 dark:border-stone-700 flex items-center justify-center mb-4">
            <ShoppingCart className="h-6 w-6 text-stone-400" />
          </div>
          <h3 className="font-serif text-lg font-normal text-stone-800 dark:text-stone-200 mb-1">Your Cart is Empty</h3>
          <p className="text-sm font-mono text-stone-500 dark:text-stone-400 max-w-xs mx-auto px-4 mb-4">
            Browse products and add them to your cart to get started.
          </p>
          <Link href="/reseller">
            <Button className="rounded-none border border-stone-800 dark:border-amber-800 bg-stone-800 dark:bg-amber-900/40 text-[#f5f0e8] hover:bg-stone-700 dark:hover:bg-amber-800/60 font-mono">
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const costPrice = parseFloat(
                item.product.discount_price || item.product.price
              );
              const sellingPrice = parseFloat(
                item.resellerPrice || String(costPrice)
              );
              const itemProfit = (sellingPrice - costPrice) * item.quantity;

              return (
                <div
                  key={item.product.id}
                  className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 p-3 sm:p-4"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <Link
                      href={`/reseller/${item.product.id}`}
                      className="flex-shrink-0"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                        {item.product.images &&
                        item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].image}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-6 w-6 text-stone-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/reseller/${item.product.id}`}>
                            <h3 className="font-serif font-normal text-sm line-clamp-2 text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-500 transition-colors">
                              {item.product.title}
                            </h3>
                          </Link>
                          {item.product.vendor_name && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Store className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] sm:text-xs font-mono text-stone-500 dark:text-stone-400">
                                {item.product.vendor_name}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex-shrink-0"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Cost Price */}
                      <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
                        Cost: ৳{costPrice.toLocaleString()}
                      </p>

                      {/* Reseller Price + Quantity */}
                      <div className="flex items-end gap-3 flex-wrap">
                        {/* Reseller Price */}
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[10px] font-mono text-stone-500 dark:text-stone-400 block mb-1">
                            Your price (৳)
                          </label>
                          <Input
                            type="number"
                            value={item.resellerPrice}
                            onChange={(e) =>
                              updateResellerPrice(
                                item.product.id,
                                e.target.value
                              )
                            }
                            className="h-8 text-sm font-mono border-stone-300 dark:border-stone-700 rounded-none"
                            min={0}
                            step="0.01"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-semibold w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Item Profit */}
                      <div
                        className={`flex items-center gap-1 text-xs font-mono ${
                          itemProfit >= 0
                            ? 'text-amber-800 dark:text-amber-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        <TrendingUp
                          className={`h-3 w-3 ${
                            itemProfit < 0 ? 'rotate-180' : ''
                          }`}
                        />
                        {itemProfit >= 0 ? 'Profit' : 'Loss'}: ৳
                        {Math.abs(itemProfit).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-4 lg:sticky lg:top-6">
              <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 mb-3 uppercase text-sm">
                Order Summary
              </h3>

              <div className="space-y-2.5 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Items ({totalItems})</span>
                  <span className="text-stone-800 dark:text-stone-200">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Product Cost</span>
                  <span className="text-stone-500 dark:text-stone-400">৳{totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Delivery</span>
                  <span className="text-xs text-stone-400">At checkout</span>
                </div>
              </div>

              <Separator className="my-3 bg-stone-200 dark:bg-stone-700" />

              <div
                className={`flex items-center justify-between border px-3 py-2 font-mono text-sm ${
                  totalProfit >= 0
                    ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200'
                    : 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 text-red-800 dark:text-red-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp className={`h-4 w-4 ${totalProfit < 0 ? 'rotate-180' : ''}`} />
                  <span>Est. {totalProfit >= 0 ? 'Profit' : 'Loss'}</span>
                </div>
                <span className="font-semibold">৳{Math.abs(totalProfit).toLocaleString()}</span>
              </div>

              <Separator className="my-3 bg-stone-200 dark:bg-stone-700" />

              <div className="flex justify-between font-serif font-semibold text-stone-800 dark:text-stone-200 mb-3">
                <span>Total</span>
                <span className="text-lg">৳{subtotal.toLocaleString()}</span>
              </div>

              <Link href="/reseller/checkout" className="block mb-2">
                <Button className="w-full h-11 font-mono rounded-none border border-stone-800 dark:border-amber-800 bg-stone-800 dark:bg-amber-900/40 text-[#f5f0e8] hover:bg-stone-700 dark:hover:bg-amber-800/60">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/reseller" className="block">
                <Button variant="ghost" className="w-full text-sm font-mono text-stone-600 dark:text-stone-400">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
