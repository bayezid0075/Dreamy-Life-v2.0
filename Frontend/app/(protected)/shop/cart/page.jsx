"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("shop_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("shop_cart", JSON.stringify(newCart));
  };

  const updateQuantity = (productId, change) => {
    const updatedCart = cart.map((item) => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart(updatedCart);
  };

  const removeItem = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    updateCart(updatedCart);
    toast.success("Item removed from cart");
  };

  const updateResellerPrice = (productId, price) => {
    const updatedCart = cart.map((item) => {
      if (item.id === productId) {
        return { ...item, reseller_price: price ? parseFloat(price) : null };
      }
      return item;
    });
    updateCart(updatedCart);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.reseller_price || item.effective_price || item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].image;
    }
    return "/images/placeholder-product.png";
  };

  if (cart.length === 0) {
    return (
      <Page title="Shopping Cart">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary-200 opacity-20"></div>
            <ShoppingBagIcon className="relative size-24 text-gray-300 dark:text-dark-600 sm:size-32" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-3xl">
            Your cart is empty
          </h2>
          <p className="mt-2 text-center text-base text-gray-600 dark:text-dark-300 sm:text-lg">
            Add some amazing products to get started
          </p>
          <Button
            onClick={() => router.push("/shop")}
            className="mt-8 rounded-xl px-8 py-3 text-base font-semibold shadow-lg"
            color="primary"
            size="lg"
          >
            Continue Shopping
          </Button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Shopping Cart">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
        {/* Modern Header Design */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary-200 bg-white p-6 shadow-2xl dark:border-primary-800 dark:bg-dark-800 sm:p-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 opacity-50 dark:from-primary-900/20 dark:via-purple-900/20 dark:to-pink-900/20"></div>
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-primary-400/30 to-purple-400/30 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-gradient-to-tr from-pink-400/20 to-orange-400/20 blur-2xl"></div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Icon Circle */}
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg sm:size-20">
                <ShoppingBagIcon className="size-8 text-white sm:size-10" />
              </div>
              
              {/* Text Content */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-3xl lg:text-4xl">
                    Shopping Cart
                  </h1>
                  <SparklesIcon className="size-5 animate-pulse text-primary-500 sm:size-6" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </span>
                  <span className="text-sm font-medium text-gray-600 dark:text-dark-300">
                    in your cart
                  </span>
                </div>
              </div>
            </div>
            
            {/* Total Amount Badge */}
            <div className="flex-shrink-0 rounded-2xl bg-gradient-to-r from-primary-600 to-purple-600 p-4 text-center shadow-lg sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-100 sm:text-sm">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                ৳{calculateTotal().toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cart.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border-2 border-gray-100 p-4 shadow-md transition-all hover:border-primary-300 hover:shadow-lg dark:border-dark-600 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Product Image */}
                  <div
                    className="relative h-32 w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-gray-100 transition-transform hover:scale-105 dark:bg-dark-600 sm:h-28 sm:w-28"
                    onClick={() => router.push(`/shop/products/${item.id}`)}
                  >
                    <img
                      src={getProductImage(item)}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="cursor-pointer text-base font-bold text-gray-900 transition-colors hover:text-primary-600 dark:text-dark-50 sm:text-lg"
                          onClick={() => router.push(`/shop/products/${item.id}`)}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-primary-600 dark:text-primary-400 sm:text-sm">
                          {item.vendor_name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-dark-400">
                          SKU: {item.sku}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 rounded-xl bg-red-50 p-2.5 text-red-500 transition-all hover:scale-110 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </div>

                    {/* Price and Quantity */}
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-400 sm:hidden">
                          Qty:
                        </label>
                        <div className="flex items-center gap-1 rounded-xl border-2 border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-700">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="rounded-l-xl p-2.5 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-dark-600"
                          >
                            <MinusIcon className="size-4" />
                          </button>
                          <span className="w-12 text-center text-base font-bold text-gray-900 dark:text-dark-50">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="rounded-r-xl p-2.5 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-dark-600"
                          >
                            <PlusIcon className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-xl font-bold text-primary-600 dark:text-primary-400 sm:text-2xl">
                          ৳
                          {(
                            (item.reseller_price ||
                              item.effective_price ||
                              item.price) * item.quantity
                          ).toFixed(2)}
                        </div>
                        {item.reseller_price ? (
                          <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                            ✓ Reseller price applied
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-gray-500 dark:text-dark-400">
                            ৳
                            {(
                              (item.effective_price || item.price) *
                              item.quantity
                            ).toFixed(2)}
                            /unit
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reseller Price Input */}
                    {item.reseller_mrp_price && (
                      <div className="mt-4 rounded-xl bg-green-50 p-3 dark:bg-green-900/10">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                          Reseller Price (Optional)
                        </label>
                        <input
                          type="number"
                          value={item.reseller_price || ""}
                          onChange={(e) =>
                            updateResellerPrice(item.id, e.target.value)
                          }
                          placeholder={`Default: ৳${item.reseller_mrp_price}`}
                          className="h-10 w-full rounded-lg border-2 border-green-200 bg-white px-3 text-sm font-medium transition-all focus:border-green-400 focus:outline-none dark:border-green-800 dark:bg-dark-700 dark:text-dark-50"
                        />
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                          Leave empty to use default reseller price
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50 p-6 shadow-xl dark:border-primary-800 dark:from-dark-700 dark:to-dark-800 sm:p-8">
              <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
                Order Summary
              </h2>

              <div className="space-y-3 border-b-2 border-primary-200 pb-4 dark:border-primary-800">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700 dark:text-dark-300">
                    Subtotal ({cart.length} {cart.length === 1 ? "item" : "items"})
                  </span>
                  <span className="font-bold text-gray-900 dark:text-dark-50">
                    ৳{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-2xl font-bold">
                  <span className="text-gray-900 dark:text-dark-50">Total</span>
                  <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                    ৳{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/shop/checkout")}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 py-3 text-base font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                size="lg"
              >
                Proceed to Checkout
              </Button>

              <Button
                onClick={() => router.push("/shop")}
                className="mt-3 w-full rounded-xl border-2 font-semibold"
                variant="outlined"
              >
                Continue Shopping
              </Button>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </Page>
  );
}

