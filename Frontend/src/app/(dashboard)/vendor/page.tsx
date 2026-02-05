'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Store,
  Package,
  Upload,
  Loader2,
  CheckCircle2,
  ShoppingCart,
  Crown,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Edit,
  ChevronLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { vendorsApi } from '@/lib/api';
import { vendorSchema, type VendorFormData } from '@/lib/validations';
import { useVendor } from '@/hooks/use-vendor';
import type { Vendor } from '@/types';

type Step = 'payment' | 'details' | 'success';

export default function VendorPage() {
  const { vendor, hasVendor, isLoading } = useVendor();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  if (hasVendor && vendor) {
    return <VendorOverview vendor={vendor} />;
  }

  return <VendorCreationFlow />;
}

// ==================== MULTI-STEP CREATION FLOW ====================

function VendorCreationFlow() {
  const [step, setStep] = useState<Step>('payment');

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 md:px-0">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
          Become a Vendor
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Start selling on Dreamy Life marketplace
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {(['payment', 'details', 'success'] as Step[]).map((s, i) => {
          const labels = ['Payment', 'Shop Details', 'Complete'];
          const isActive = s === step;
          const isPast =
            (step === 'details' && s === 'payment') ||
            (step === 'success' && (s === 'payment' || s === 'details'));

          return (
            <div key={s} className="flex items-center gap-1.5 sm:gap-2">
              {i > 0 && (
                <div
                  className={`w-5 sm:w-8 h-0.5 ${
                    isPast
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                      : 'bg-muted'
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30'
                      : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPast ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium ${
                    isActive
                      ? 'text-violet-600 dark:text-violet-400'
                      : isPast
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {labels[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {step === 'payment' && (
        <PaymentStep onSuccess={() => setStep('details')} />
      )}
      {step === 'details' && (
        <DetailsStep
          onSuccess={() => setStep('success')}
          onBack={() => setStep('payment')}
        />
      )}
      {step === 'success' && <SuccessStep />}
    </div>
  );
}

// ==================== PAYMENT STEP ====================

function PaymentStep({ onSuccess }: { onSuccess: () => void }) {
  const [paymentResult, setPaymentResult] = useState<string>('');

  const handleProceed = () => {
    if (paymentResult === 'true') {
      toast.success('Payment successful! Proceed to set up your shop.');
      onSuccess();
    } else if (paymentResult === 'false') {
      toast.error('Payment failed. Please try again.');
    }
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl">
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500" />

      <CardHeader className="text-center pt-6 sm:pt-8 pb-2">
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center mb-3 sm:mb-4 shadow-xl shadow-fuchsia-500/30">
          <Store className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </div>
        <CardTitle className="text-xl sm:text-2xl">Vendor Registration</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          One-time registration fee to start your vendor journey
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-4 sm:px-6">
        {/* Fee Display */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 dark:from-violet-950/40 dark:via-fuchsia-950/30 dark:to-pink-950/20 p-4 sm:p-6 text-center">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-200/30 dark:bg-violet-800/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-fuchsia-200/30 dark:bg-fuchsia-800/10 rounded-full blur-2xl" />
          <p className="text-xs sm:text-sm text-muted-foreground relative">Registration Fee</p>
          <p className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent relative mt-1">
            &#x09F3;700
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 relative">
            One-time payment
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Sparkles, label: 'Your Own Shop', color: 'text-violet-500' },
            { icon: Package, label: 'Unlimited Products', color: 'text-fuchsia-500' },
            { icon: TrendingUp, label: 'Sales Analytics', color: 'text-emerald-500' },
            { icon: Shield, label: 'Secure Payments', color: 'text-blue-500' },
          ].map((benefit) => (
            <div
              key={benefit.label}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 dark:bg-muted/20"
            >
              <benefit.icon className={`h-5 w-5 ${benefit.color} flex-shrink-0`} />
              <span className="text-sm font-medium">{benefit.label}</span>
            </div>
          ))}
        </div>

        {/* Payment Simulation */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Simulate Payment{' '}
            <span className="text-muted-foreground">(Testing Mode)</span>
          </label>
          <Select value={paymentResult} onValueChange={setPaymentResult}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment result..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Payment Successful</SelectItem>
              <SelectItem value="false">Payment Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleProceed}
          disabled={!paymentResult}
          className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 transition-all"
        >
          Proceed to Payment
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ==================== DETAILS STEP ====================

function DetailsStep({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      shop_name: '',
      address: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: vendorsApi.createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Your shop has been created!');
      onSuccess();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to create vendor');
    },
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: VendorFormData) => {
    const formData = new FormData();
    formData.append('shop_name', data.shop_name);
    formData.append('address', data.address);
    formData.append('payment_status', 'true');
    if (bannerFile) {
      formData.append('banner_image', bannerFile);
    }
    createMutation.mutate(formData);
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500" />

      <CardHeader className="pt-6 sm:pt-8 pb-2">
        <CardTitle className="text-xl sm:text-2xl">Set Up Your Shop</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Give your shop a name and upload a banner to attract customers
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6 sm:pb-8 px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Banner Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Shop Banner</label>
              <div
                className="relative h-40 border-2 border-dashed border-violet-200 dark:border-violet-800 rounded-2xl overflow-hidden cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                {bannerPreview ? (
                  <>
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium text-sm">
                        Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/40 dark:to-fuchsia-900/30 flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6 text-violet-500" />
                    </div>
                    <p className="text-sm font-medium">
                      Click to upload banner
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recommended: 1200x400px, max 5MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
            </div>

            <FormField
              control={form.control}
              name="shop_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Dreamy Fashion House"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Dhaka, Bangladesh"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={createMutation.isPending}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-fuchsia-500/25"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-5 w-5" />
                )}
                Create Shop
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ==================== SUCCESS STEP ====================

function SuccessStep() {
  const router = useRouter();

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

      <CardContent className="pt-8 sm:pt-10 pb-8 sm:pb-10 px-4 sm:px-6 text-center">
        {/* Success Icon */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-5 sm:mb-6">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Your Shop is Live!</h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto mb-6 sm:mb-8">
          Congratulations! Your vendor shop has been created successfully. Start
          adding products to begin selling.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
          <Button
            onClick={() => router.push('/vendor/products')}
            variant="outline"
            className="flex-1 h-11"
          >
            <Package className="mr-2 h-4 w-4" />
            Add Products
          </Button>
          <Button
            onClick={() => router.refresh()}
            className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-fuchsia-500/25"
          >
            <Store className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== VENDOR OVERVIEW ====================

function VendorOverview({ vendor }: { vendor: Vendor }) {
  const router = useRouter();

  const { data: orders } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: vendorsApi.getVendorOrders,
  });

  const stats = [
    {
      title: 'Total Products',
      value: vendor.products_count,
      icon: Package,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
    },
    {
      title: 'Total Orders',
      value: orders?.length ?? 0,
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      title: 'Shop Status',
      value: vendor.payment_status ? 'Active' : 'Pending',
      icon: Zap,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
    },
    {
      title: 'Member Status',
      value: vendor.member_status,
      icon: Crown,
      gradient: 'from-pink-500 to-rose-600',
      shadow: 'shadow-pink-500/20',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add, edit or remove your products',
      icon: Package,
      href: '/vendor/products',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      title: 'View Orders',
      description: 'Track and manage customer orders',
      icon: ShoppingCart,
      href: '/vendor/orders',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Edit Shop',
      description: 'Update your shop name and banner',
      icon: Edit,
      href: '#',
      gradient: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-4 py-4 md:px-0 md:py-0">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Banner + Shop Info */}
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="relative h-36 sm:h-48 md:h-56 overflow-hidden">
          {vendor.banner_image ? (
            <img
              src={vendor.banner_image}
              alt={vendor.shop_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <Store className="h-14 w-14 sm:h-20 sm:w-20 text-white/20 relative" />
            </div>
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <h1 className="text-xl sm:text-3xl font-bold text-white">{vendor.shop_name}</h1>
            <p className="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1">{vendor.address}</p>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
              <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 shadow-lg text-[10px] sm:text-xs">
                {vendor.member_status}
              </Badge>
              <Badge
                variant={vendor.payment_status ? 'default' : 'secondary'}
                className={`text-[10px] sm:text-xs ${
                  vendor.payment_status
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0'
                    : ''
                }`}
              >
                {vendor.payment_status ? 'Verified' : 'Pending Verification'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow"
          >
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}
                >
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {stat.title}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}
                  >
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
