'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';

import { useCartStore, useAuthStore } from '@/store';
import { ordersApi } from '@/lib/api';
import { orderSchema, type OrderFormData } from '@/lib/validations';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { items, getSubtotal, clearCart } = useCartStore();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_name: user?.user.username || '',
      customer_email: user?.user.email || '',
      customer_phone: user?.user.phone_number || '',
      delivery_address: user?.address || '',
      delivery_area: 'inside_dhaka',
      apply_reseller_price: false,
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/shop/checkout');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      router.push('/shop/cart');
    }
  }, [items, isLoading, router]);

  const deliveryArea = form.watch('delivery_area');

  // Calculate totals
  const subtotal = getSubtotal();
  const deliveryCharge = items.reduce((total, item) => {
    const charge =
      deliveryArea === 'inside_dhaka'
        ? item.product.delivery_charge_inside_dhaka
        : item.product.delivery_charge_outside_dhaka;
    return total + (charge ? parseFloat(charge) : 0) * item.quantity;
  }, 0);
  const vat = items.reduce((total, item) => {
    const price = parseFloat(item.product.discount_price || item.product.price);
    const vatPercent = parseFloat(item.product.vat || '0');
    return total + (price * item.quantity * vatPercent) / 100;
  }, 0);
  const total = subtotal + deliveryCharge + vat;

  const orderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (data) => {
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders?success=${data.order_number}`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to place order');
    },
  });

  const onSubmit = (data: OrderFormData) => {
    const orderData = {
      ...data,
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };
    orderMutation.mutate(orderData);
  };

  if (isLoading || items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customer_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delivery_area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Area</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select area" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delivery_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter full delivery address"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {user?.member_status !== 'user' && (
                    <FormField
                      control={form.control}
                      name="apply_reseller_price"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">
                            Apply reseller pricing (if available)
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => {
                    const price = parseFloat(
                      item.product.discount_price || item.product.price
                    );

                    return (
                      <div key={item.product.id} className="flex gap-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                          {item.product.images && item.product.images[0] ? (
                            <img
                              src={item.product.images[0].image}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-1">
                            {item.product.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ৳{(price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={orderMutation.isPending}
              >
                {orderMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Place Order - ৳{total.toLocaleString()}
              </Button>
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                  items)
                </span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>৳{deliveryCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT</span>
                <span>৳{vat.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>৳{total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
