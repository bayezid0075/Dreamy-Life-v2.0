'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  ShoppingCart,
  Loader2,
  TrendingUp,
  ImageOff,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { ordersApi } from '@/lib/api';
import { useCartStore } from '@/store';
import { orderSchema, type OrderFormData } from '@/lib/validations/order';

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, clearCart } = useCartStore();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      delivery_address: '',
      delivery_area: undefined,
      apply_reseller_price: true,
    },
  });

  const deliveryArea = form.watch('delivery_area');

  // Calculate totals
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

  const deliveryCharge = items.reduce((sum, item) => {
    if (!deliveryArea) return sum;
    const charge =
      deliveryArea === 'inside_dhaka'
        ? parseFloat(item.product.delivery_charge_inside_dhaka || '0')
        : parseFloat(item.product.delivery_charge_outside_dhaka || '0');
    return sum + charge;
  }, 0);

  const vatAmount = items.reduce((sum, item) => {
    const price = parseFloat(
      item.resellerPrice || item.product.discount_price || item.product.price
    );
    const vat = parseFloat(item.product.vat || '0');
    return sum + (price * item.quantity * vat) / 100;
  }, 0);

  const totalAmount = subtotal + deliveryCharge + vatAmount;
  const totalProfit = subtotal - totalCost;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully!');
      router.push('/orders');
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const message =
        error?.response?.data?.detail ||
        'Failed to place order. Please try again.';
      toast.error(message);
    },
  });

  const onSubmit = (data: OrderFormData) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    createOrderMutation.mutate({
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        reseller_price: item.resellerPrice,
      })),
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      delivery_address: data.delivery_address,
      delivery_area: data.delivery_area,
      apply_reseller_price: true,
    });
  };

  if (items.length === 0) {
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
          <div className="w-12 h-12 mx-auto border border-stone-300 dark:border-stone-700 flex items-center justify-center mb-4">
            <ShoppingCart className="h-6 w-6 text-stone-400" />
          </div>
          <h3 className="font-serif text-lg font-normal text-stone-800 dark:text-stone-200 mb-1">Cart is Empty</h3>
          <p className="text-sm font-mono text-stone-500 dark:text-stone-400 max-w-xs mx-auto px-4 mb-4">
            Add products to your cart before checking out.
          </p>
          <Link href="/reseller">
            <Button className="rounded-none border border-stone-800 dark:border-amber-800 bg-stone-800 dark:bg-amber-900/40 text-[#f5f0e8] hover:bg-stone-700 dark:hover:bg-amber-800/60 font-mono">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f0e8] dark:bg-[#1a1714] font-serif px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 mb-6 font-serif"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="mb-6 border-b border-stone-300 dark:border-stone-700 pb-4">
        <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-stone-800 dark:text-stone-100 uppercase">
          Checkout
        </h1>
        <p className="text-sm font-mono text-stone-500 dark:text-stone-400 mt-1">
          Complete your order details
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2">
          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-stone-600 dark:text-amber-500" />
              <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 uppercase text-sm">
                Customer & Delivery Information
              </h3>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                id="checkout-form"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Customer Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full name"
                            {...field}
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="01XXXXXXXXX"
                            {...field}
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email@example.com"
                          type="email"
                          {...field}
                          className="text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Delivery Address
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Full delivery address"
                          {...field}
                          className="text-sm min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Delivery Area</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select delivery area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inside_dhaka">
                            Inside Dhaka
                          </SelectItem>
                          <SelectItem value="outside_dhaka">
                            Outside Dhaka
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/30 p-4 mt-3">
            <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 mb-3 uppercase text-sm">
              Order Items ({totalItems})
            </h3>
            <div className="space-y-3">
              {items.map((item) => {
                const price = parseFloat(
                  item.resellerPrice ||
                    item.product.discount_price ||
                    item.product.price
                );
                return (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 font-mono text-sm"
                  >
                    <div className="w-12 h-12 overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0].image}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-4 w-4 text-stone-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-stone-800 dark:text-stone-200 truncate">
                        {item.product.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        ৳{price.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-stone-800 dark:text-stone-200 flex-shrink-0">
                      ৳{(price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-4 lg:sticky lg:top-6">
            <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 mb-3 uppercase text-sm">
              Order Summary
            </h3>

            <div className="space-y-2.5 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Subtotal</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">Delivery</span>
                <span>
                  {deliveryArea ? `৳${deliveryCharge.toLocaleString()}` : 'Select area'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-stone-400">VAT</span>
                <span>৳{vatAmount.toLocaleString()}</span>
              </div>
            </div>

            <Separator className="my-3 bg-stone-200 dark:bg-stone-700" />

            <div className="flex justify-between font-serif font-semibold text-lg text-stone-800 dark:text-stone-200 mb-3">
              <span>Total</span>
              <span>৳{totalAmount.toLocaleString()}</span>
            </div>

            <div
              className={`flex items-center justify-between border px-3 py-2 mb-3 font-mono text-sm ${
                totalProfit >= 0
                  ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200'
                  : 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <TrendingUp className={`h-4 w-4 ${totalProfit < 0 ? 'rotate-180' : ''}`} />
                <span>{totalProfit >= 0 ? 'Profit' : 'Loss'}</span>
              </div>
              <span className="font-semibold">৳{Math.abs(totalProfit).toLocaleString()}</span>
            </div>

            <Separator className="mb-3 bg-stone-200 dark:bg-stone-700" />

            <Button
              form="checkout-form"
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full h-11 font-mono rounded-none border border-stone-800 dark:border-amber-800 bg-stone-800 dark:bg-amber-900/40 text-[#f5f0e8] hover:bg-stone-700 dark:hover:bg-amber-800/60"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                `Place Order — ৳${totalAmount.toLocaleString()}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
