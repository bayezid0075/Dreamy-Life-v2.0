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
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="mb-4 md:mb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/20 flex items-center justify-center mb-4">
            <ShoppingCart className="h-7 w-7 text-violet-500" />
          </div>
          <h3 className="text-base font-semibold mb-1">Your Cart is Empty</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto px-4 mb-4">
            Browse products and add them to your cart to get started.
          </p>
          <Link href="/reseller">
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0">
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
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-3 sm:p-4"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Image */}
                    <Link
                      href={`/reseller/${item.product.id}`}
                      className="flex-shrink-0"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {item.product.images &&
                        item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].image}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/reseller/${item.product.id}`}>
                            <h3 className="font-medium text-sm line-clamp-2 hover:text-violet-600 transition-colors">
                              {item.product.title}
                            </h3>
                          </Link>
                          {item.product.vendor_name && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Store className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {item.product.vendor_name}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex-shrink-0"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Cost Price */}
                      <p className="text-xs text-muted-foreground">
                        Cost: ৳{costPrice.toLocaleString()}
                      </p>

                      {/* Reseller Price + Quantity */}
                      <div className="flex items-end gap-3 flex-wrap">
                        {/* Reseller Price */}
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[10px] font-medium text-muted-foreground block mb-1">
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
                            className="h-8 text-sm font-semibold"
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
                        className={`flex items-center gap-1 text-xs font-medium ${
                          itemProfit >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
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
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 lg:sticky lg:top-6">
              <h3 className="text-base font-semibold mb-3">Order Summary</h3>

              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Items ({totalItems})
                  </span>
                  <span className="font-medium">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product Cost</span>
                  <span className="font-medium text-muted-foreground">
                    ৳{totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-xs text-muted-foreground">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <Separator className="my-3" />

              <div
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  totalProfit >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-rose-100 dark:bg-rose-900/30'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp
                    className={`h-4 w-4 ${
                      totalProfit >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400 rotate-180'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      totalProfit >= 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    Est. {totalProfit >= 0 ? 'Profit' : 'Loss'}
                  </span>
                </div>
                <span
                  className={`font-bold ${
                    totalProfit >= 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  ৳{Math.abs(totalProfit).toLocaleString()}
                </span>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between font-semibold mb-3">
                <span>Total</span>
                <span className="text-lg">৳{subtotal.toLocaleString()}</span>
              </div>

              <Link href="/reseller/checkout" className="block mb-2">
                <Button className="w-full h-11 font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-violet-500/25">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/reseller" className="block">
                <Button variant="ghost" className="w-full text-sm">
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
