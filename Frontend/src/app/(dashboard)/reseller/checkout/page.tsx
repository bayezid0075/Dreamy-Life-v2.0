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
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/20 flex items-center justify-center mb-4">
            <ShoppingCart className="h-7 w-7 text-violet-500" />
          </div>
          <h3 className="text-base font-semibold mb-1">Cart is Empty</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto px-4 mb-4">
            Add products to your cart before checking out.
          </p>
          <Link href="/reseller">
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1 text-muted-foreground hover:text-foreground mb-4 md:mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <div className="mb-4 md:mb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Checkout
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete your order details
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Customer Info Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-violet-500" />
              <h3 className="text-base font-semibold">
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

          {/* Order Items Review */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 mt-3">
            <h3 className="text-base font-semibold mb-3">
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
                    className="flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      {item.product.images &&
                      item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0].image}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ৳{price.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0">
                      ৳{(price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 lg:sticky lg:top-6">
            <h3 className="text-base font-semibold mb-3">Order Summary</h3>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>
                  {deliveryArea
                    ? `৳${deliveryCharge.toLocaleString()}`
                    : 'Select area'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT</span>
                <span>৳{vatAmount.toLocaleString()}</span>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex justify-between font-semibold text-lg mb-3">
              <span>Total</span>
              <span>৳{totalAmount.toLocaleString()}</span>
            </div>

            {/* Profit Display */}
            <div
              className={`flex items-center justify-between rounded-lg px-3 py-2 mb-3 ${
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
                  {totalProfit >= 0 ? 'Profit' : 'Loss'}
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

            <Separator className="mb-3" />

            <Button
              form="checkout-form"
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full h-11 font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-lg shadow-violet-500/25"
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
