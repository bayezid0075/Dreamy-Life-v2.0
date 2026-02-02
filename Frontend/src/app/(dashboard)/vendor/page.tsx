'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Store, Package, Upload, Loader2, Plus, Edit } from 'lucide-react';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import { vendorsApi } from '@/lib/api';
import { vendorSchema, type VendorFormData } from '@/lib/validations';

export default function VendorPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: vendorsApi.getVendors,
  });

  const myVendor = vendors?.[0];

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      shop_name: myVendor?.shop_name || '',
      address: myVendor?.address || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: vendorsApi.createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor profile created successfully!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to create vendor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      vendorsApi.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor profile updated successfully!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to update vendor');
    },
  });

  const resetForm = () => {
    form.reset();
    setBannerFile(null);
    setBannerPreview(null);
    setIsEditing(false);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditDialog = () => {
    if (myVendor) {
      form.reset({
        shop_name: myVendor.shop_name,
        address: myVendor.address,
      });
      setBannerPreview(myVendor.banner_image);
      setIsEditing(true);
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: VendorFormData) => {
    const formData = new FormData();
    formData.append('shop_name', data.shop_name);
    formData.append('address', data.address);
    if (bannerFile) {
      formData.append('banner_image', bannerFile);
    }

    if (isEditing && myVendor) {
      updateMutation.mutate({ id: myVendor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!myVendor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Shop</h1>
          <p className="text-muted-foreground">
            Create your vendor profile to start selling
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No Vendor Profile Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your vendor profile to start listing products and selling
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Vendor Profile
            </Button>
          </CardContent>
        </Card>

        <VendorDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          isEditing={false}
          bannerPreview={bannerPreview}
          onBannerChange={handleBannerChange}
          fileInputRef={fileInputRef}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Shop</h1>
          <p className="text-muted-foreground">
            Manage your vendor profile and products
          </p>
        </div>
        <Button onClick={openEditDialog}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Vendor Profile Card */}
      <Card>
        <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
          {myVendor.banner_image ? (
            <img
              src={myVendor.banner_image}
              alt={myVendor.shop_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{myVendor.shop_name}</h2>
              <p className="text-muted-foreground mt-1">{myVendor.address}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge>{myVendor.member_status}</Badge>
                <Badge variant={myVendor.payment_status ? 'default' : 'secondary'}>
                  {myVendor.payment_status ? 'Verified' : 'Pending Verification'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{myVendor.products_count}</p>
              <p className="text-sm text-muted-foreground">Products</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myVendor.products_count}</div>
            <p className="text-xs text-muted-foreground">
              Listed products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shop Status</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myVendor.payment_status ? 'Active' : 'Pending'}
            </div>
            <p className="text-xs text-muted-foreground">
              {myVendor.payment_status
                ? 'Your shop is live'
                : 'Awaiting verification'}
            </p>
          </CardContent>
        </Card>
      </div>

      <VendorDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          resetForm();
        }}
        form={form}
        onSubmit={onSubmit}
        isPending={isPending}
        isEditing={isEditing}
        bannerPreview={bannerPreview || myVendor.banner_image}
        onBannerChange={handleBannerChange}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}

function VendorDialog({
  isOpen,
  onClose,
  form,
  onSubmit,
  isPending,
  isEditing,
  bannerPreview,
  onBannerChange,
  fileInputRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  form: ReturnType<typeof useForm<VendorFormData>>;
  onSubmit: (data: VendorFormData) => void;
  isPending: boolean;
  isEditing: boolean;
  bannerPreview: string | null;
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Vendor Profile' : 'Create Vendor Profile'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your shop details'
              : 'Set up your vendor profile to start selling'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Banner Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Shop Banner</label>
              <div
                className="relative h-32 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm">Click to upload banner</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onBannerChange}
              />
            </div>

            <FormField
              control={form.control}
              name="shop_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shop name" {...field} />
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shop address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
