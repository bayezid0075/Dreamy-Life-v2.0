'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  ShoppingCart,
  Loader2,
  TrendingUp,
  ImageOff,
  MapPin,
  Wallet,
  Smartphone,
  Truck,
  Banknote,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

import { ordersApi, walletsApi } from '@/lib/api';
import { useCartStore } from '@/store';
import { orderSchema, type OrderFormData } from '@/lib/validations/order';

const PAYMENT_METHODS = [
  {
    value: 'wallet',
    label: 'Wallet balance',
    description: 'Pay from your Dreamy Life wallet',
    icon: Wallet,
    color: 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    active: 'ring-2 ring-amber-500 dark:ring-amber-400 border-amber-500',
  },
  {
    value: 'mobile_banking',
    label: 'Mobile banking',
    description: 'bKash, Nagad, Rocket, etc.',
    icon: Smartphone,
    color: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
    active: 'ring-2 ring-emerald-500 dark:ring-emerald-400 border-emerald-500',
  },
  {
    value: 'cash_on_delivery',
    label: 'Cash on delivery',
    description: 'Pay delivery charge now; collect from customer later',
    icon: Truck,
    color: 'bg-teal-100 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200',
    active: 'ring-2 ring-teal-500 dark:ring-teal-400 border-teal-500',
  },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, getSelectedItems, removeItemsByIds } = useCartStore();
  const selectedItems = getSelectedItems();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: walletsApi.getWallet,
  });

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      delivery_address: '',
      delivery_area: undefined,
      apply_reseller_price: true,
      payment_method: 'wallet',
      delivery_payment_method: undefined,
    },
  });

  const deliveryArea = form.watch('delivery_area');
  const paymentMethod = form.watch('payment_method');

  // Calculate totals from selected items only
  const subtotal = selectedItems.reduce((sum, item) => {
    const price = parseFloat(
      item.resellerPrice || item.product.discount_price || item.product.price
    );
    return sum + price * item.quantity;
  }, 0);

  const totalCost = selectedItems.reduce((sum, item) => {
    const cost = parseFloat(item.product.discount_price || item.product.price);
    return sum + cost * item.quantity;
  }, 0);

  const deliveryCharge = selectedItems.reduce((sum, item) => {
    if (!deliveryArea) return sum;
    const charge =
      deliveryArea === 'inside_dhaka'
        ? parseFloat(item.product.delivery_charge_inside_dhaka || '0')
        : parseFloat(item.product.delivery_charge_outside_dhaka || '0');
    return sum + charge;
  }, 0);

  const vatAmount = selectedItems.reduce((sum, item) => {
    const price = parseFloat(
      item.resellerPrice || item.product.discount_price || item.product.price
    );
    const vat = parseFloat(item.product.vat || '0');
    return sum + (price * item.quantity * vat) / 100;
  }, 0);

  const totalAmount = subtotal + deliveryCharge + vatAmount;
  const totalProfit = subtotal - totalCost;
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const walletBalance = parseFloat(wallet?.balance ?? '0');
  const canPayWithWallet = walletBalance >= totalAmount;
  const dueAmount =
    paymentMethod === 'cash_on_delivery'
      ? totalAmount - deliveryCharge
      : paymentMethod === 'mobile_banking'
        ? totalAmount
        : 0;
  const payNowAmount =
    paymentMethod === 'wallet'
      ? totalAmount
      : paymentMethod === 'cash_on_delivery'
        ? deliveryCharge
        : 0;

  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (_data, variables) => {
      const productIds = variables.items.map((i) => i.product_id);
      removeItemsByIds(productIds);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
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
    if (selectedItems.length === 0) {
      toast.error('No items selected for checkout. Select products in your cart first.');
      return;
    }
    if (data.payment_method === 'wallet' && !canPayWithWallet) {
      toast.error('Insufficient wallet balance. Add funds or choose another payment method.');
      return;
    }
    if (data.payment_method === 'cash_on_delivery' && walletBalance < deliveryCharge) {
      toast.error('Insufficient wallet balance to pay delivery charge. Add funds or choose another option.');
      return;
    }

    createOrderMutation.mutate({
      items: selectedItems.map((item) => ({
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
      payment_method: data.payment_method,
      ...(data.payment_method === 'cash_on_delivery' && { delivery_payment_method: 'wallet' as const }),
    });
  };

  if (items.length === 0 || selectedItems.length === 0) {
    return (
      <div className="min-h-full bg-[#f5f0e8] dark:bg-[#1a1714] font-serif px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1 text-amber-900/80 dark:text-amber-200/80 hover:text-amber-900 dark:hover:text-amber-100 mb-6 font-serif"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-stone-900/50 py-16 px-6 text-center rounded-sm shadow-sm">
            <div className="w-14 h-14 mx-auto border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center mb-5 rounded-full bg-amber-50 dark:bg-amber-950/30">
              <ShoppingCart className="h-7 w-7 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="font-serif text-xl font-normal text-stone-800 dark:text-stone-200 mb-2">
              {items.length === 0 ? 'Cart is Empty' : 'No Items Selected'}
            </h3>
            <p className="text-sm font-mono text-stone-500 dark:text-stone-400 max-w-xs mx-auto mb-6">
              {items.length === 0
                ? 'Add products to your cart before checking out.'
                : 'Select at least one product in your cart to checkout.'}
            </p>
            <Link href={items.length === 0 ? '/reseller' : '/reseller/cart'}>
              <Button className="rounded-sm border-2 border-amber-800 dark:border-amber-600 bg-amber-700 dark:bg-amber-800 text-white hover:bg-amber-800 dark:hover:bg-amber-700 font-mono px-6">
                {items.length === 0 ? 'Browse Products' : 'Back to Cart'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f0e8] dark:bg-[#1a1714] font-serif px-4 py-6 md:px-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-amber-900/80 dark:text-amber-200/80 hover:text-amber-900 dark:hover:text-amber-100 mb-6 font-serif"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="mb-8 pb-6 border-b-2 border-amber-200/60 dark:border-amber-800/60">
          <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-stone-800 dark:text-stone-100 uppercase">
            Checkout
          </h1>
          <p className="text-sm font-mono text-stone-500 dark:text-stone-400 mt-2">
            Complete your order and choose how to pay
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="border-2 border-amber-200/80 dark:border-amber-800/80 bg-white dark:bg-stone-900/40 p-5 md:p-6 rounded-sm shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <MapPin className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </div>
                <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 uppercase text-sm tracking-wide">
                  Customer & delivery
                </h3>
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                  id="checkout-form"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-mono text-stone-600 dark:text-stone-400">Customer name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Full name"
                              {...field}
                              className="text-sm border-amber-200 dark:border-amber-800 rounded-sm bg-white dark:bg-stone-900/50"
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
                          <FormLabel className="text-xs font-mono text-stone-600 dark:text-stone-400">Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="01XXXXXXXXX"
                              {...field}
                              className="text-sm border-amber-200 dark:border-amber-800 rounded-sm bg-white dark:bg-stone-900/50"
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
                        <FormLabel className="text-xs font-mono text-stone-600 dark:text-stone-400">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@example.com"
                            type="email"
                            {...field}
                            className="text-sm border-amber-200 dark:border-amber-800 rounded-sm bg-white dark:bg-stone-900/50"
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
                        <FormLabel className="text-xs font-mono text-stone-600 dark:text-stone-400">Delivery address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Full delivery address"
                            {...field}
                            className="text-sm min-h-[88px] border-amber-200 dark:border-amber-800 rounded-sm bg-white dark:bg-stone-900/50"
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
                        <FormLabel className="text-xs font-mono text-stone-600 dark:text-stone-400">Delivery area</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-sm border-amber-200 dark:border-amber-800 rounded-sm bg-white dark:bg-stone-900/50">
                              <SelectValue placeholder="Select area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="inside_dhaka">Inside Dhaka</SelectItem>
                            <SelectItem value="outside_dhaka">Outside Dhaka</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Separator className="bg-amber-200/60 dark:bg-amber-800/40 my-6" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                      <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 uppercase text-sm tracking-wide">
                        Payment method
                      </h3>
                    </div>
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid gap-3"
                            >
                              {PAYMENT_METHODS.map((pm) => {
                                const Icon = pm.icon;
                                const isWallet = pm.value === 'wallet';
                                const isCOD = pm.value === 'cash_on_delivery';
                                const disabled =
                                  isWallet && totalAmount > 0 && !walletLoading && !canPayWithWallet;
                                const codDeliveryInsufficient =
                                  isCOD && deliveryCharge > 0 && !walletLoading && walletBalance < deliveryCharge;
                                return (
                                  <Label
                                    key={pm.value}
                                    htmlFor={`payment-${pm.value}`}
                                    className={`flex items-start gap-4 p-4 rounded-sm border-2 cursor-pointer transition-all ${pm.color} ${
                                      field.value === pm.value ? pm.active : 'hover:opacity-90'
                                    } ${disabled || codDeliveryInsufficient ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  >
                                    <RadioGroupItem
                                      value={pm.value}
                                      id={`payment-${pm.value}`}
                                      disabled={disabled || codDeliveryInsufficient}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        <span className="font-semibold text-sm">{pm.label}</span>
                                        {isWallet && !walletLoading && (
                                          <span className="font-mono text-xs opacity-90">
                                            Balance: ৳{walletBalance.toLocaleString()}
                                            {!canPayWithWallet && totalAmount > 0 && (
                                              <span className="text-red-600 dark:text-red-400 ml-1">(insufficient)</span>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs mt-1 opacity-90">{pm.description}</p>
                                      {isCOD && deliveryArea && deliveryCharge > 0 && (
                                        <p className="text-xs mt-2 font-mono bg-white/50 dark:bg-black/20 px-2 py-1 rounded mt-2 inline-block">
                                          Pay ৳{deliveryCharge.toLocaleString()} delivery now (Wallet); ৳
                                          {(totalAmount - deliveryCharge).toLocaleString()} due later
                                        </p>
                                      )}
                                    </div>
                                  </Label>
                                );
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </div>

            <div className="border-2 border-amber-200/80 dark:border-amber-800/80 bg-white dark:bg-stone-900/40 p-5 md:p-6 rounded-sm shadow-sm">
              <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 uppercase text-sm tracking-wide mb-4">
                Order items ({totalItems})
              </h3>
              <div className="space-y-4">
                {selectedItems.map((item) => {
                  const price = parseFloat(
                    item.resellerPrice ||
                      item.product.discount_price ||
                      item.product.price
                  );
                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-4 font-mono text-sm py-2 border-b border-amber-100 dark:border-amber-900/50 last:border-0"
                    >
                      <div className="w-14 h-14 overflow-hidden rounded-sm border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].image}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-5 w-5 text-stone-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-stone-800 dark:text-stone-200 truncate">
                          {item.product.title}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          ৳{price.toLocaleString()} × {item.quantity}
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
            <div className="border-2 border-amber-200/80 dark:border-amber-800/80 bg-white dark:bg-stone-900/50 p-5 md:p-6 rounded-sm shadow-sm lg:sticky lg:top-6">
              <h3 className="font-serif font-normal text-stone-800 dark:text-stone-200 uppercase text-sm tracking-wide mb-4">
                Order summary
              </h3>

              <div className="space-y-3 font-mono text-sm">
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

              <Separator className="my-4 bg-amber-200/60 dark:bg-amber-800/40" />

              <div className="flex justify-between font-serif font-semibold text-lg text-stone-800 dark:text-stone-200 mb-3">
                <span>Total</span>
                <span>৳{totalAmount.toLocaleString()}</span>
              </div>

              {dueAmount > 0 && (
                <div className="mb-3 px-3 py-2 rounded-sm bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 font-mono text-sm">
                  <span className="text-stone-600 dark:text-stone-300">Due later: </span>
                  <span className="font-semibold text-amber-900 dark:text-amber-200">
                    ৳{dueAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div
                className={`flex items-center justify-between border-2 px-4 py-3 rounded-sm font-mono text-sm mb-4 ${
                  totalProfit >= 0
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                    : 'border-red-300 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 text-red-800 dark:text-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${totalProfit < 0 ? 'rotate-180' : ''}`} />
                  <span>{totalProfit >= 0 ? 'Est. profit' : 'Est. loss'}</span>
                </div>
                <span className="font-semibold">৳{Math.abs(totalProfit).toLocaleString()}</span>
              </div>

              <Separator className="mb-4 bg-amber-200/60 dark:bg-amber-800/40" />

              <Button
                form="checkout-form"
                type="submit"
                disabled={
                  createOrderMutation.isPending ||
                  (paymentMethod === 'wallet' && !canPayWithWallet) ||
                  (paymentMethod === 'cash_on_delivery' && deliveryCharge > 0 && walletBalance < deliveryCharge)
                }
                className="w-full h-12 font-mono rounded-sm border-2 border-amber-800 dark:border-amber-600 bg-amber-700 dark:bg-amber-800 text-white hover:bg-amber-800 dark:hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing order...
                  </>
                ) : payNowAmount > 0 ? (
                  `Place order — Pay ৳${payNowAmount.toLocaleString()} now`
                ) : (
                  `Place order — ৳${dueAmount.toLocaleString()} due later`
                )}
              </Button>

              <Link href="/reseller/cart" className="block mt-3 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm font-mono text-stone-600 dark:text-stone-400"
                >
                  Back to cart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
