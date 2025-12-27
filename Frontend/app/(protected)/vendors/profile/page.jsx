"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BuildingStorefrontIcon, PhotoIcon, PlusIcon, ShoppingBagIcon, ChartBarIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

import { Page } from "components/shared/Page";
import { Card, Button, Input, Upload, Spinner } from "components/ui";
import axios from "utils/axios";

export default function VendorProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [vendor, setVendor] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      shop_name: "",
      address: "",
    },
  });

  useEffect(() => {
    fetchVendorProfile();
  }, [router]);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      // Get vendor profile - API returns only user's own vendor for regular users
      const response = await axios.get("/api/vendors/vendors/");
      // API returns list, get the first one (user's own vendor)
      const vendorData = Array.isArray(response.data) && response.data.length > 0
        ? response.data[0] 
        : response.data;
      
      if (vendorData) {
        setVendor(vendorData);
        setValue("shop_name", vendorData.shop_name || "");
        setValue("address", vendorData.address || "");
        if (vendorData.banner_image) {
          // Handle both relative and absolute URLs
          const bannerUrl = vendorData.banner_image.startsWith('http') 
            ? vendorData.banner_image 
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${vendorData.banner_image}`;
          setBannerPreview(bannerUrl);
        }
      } else {
        // No vendor exists, set vendor to null to show create page
        setVendor(null);
      }
    } catch (error) {
      console.error("Error fetching vendor profile:", error);
      // If vendor doesn't exist (404 or 403), set vendor to null to show create page
      if (error.response?.status === 404 || error.response?.status === 403) {
        setVendor(null);
      } else {
        toast.error("Failed to load vendor profile", {
          description: error.response?.data?.detail || "Please try again",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = (file) => {
    if (file) {
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("shop_name", data.shop_name);
      formData.append("address", data.address);
      if (bannerImage) {
        formData.append("banner_image", bannerImage);
      }

      if (vendor) {
        // Update existing vendor - only banner can be updated via PATCH
        // For other fields, might need PUT or different endpoint
        await axios.patch(`/api/vendors/vendors/${vendor.id}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Vendor profile updated successfully!");
      } else {
        // Create new vendor - might need to use applications endpoint first
        // Try vendors endpoint, fallback to applications if needed
        try {
          await axios.post("/api/vendors/vendors/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          toast.success("Vendor profile created successfully!");
        } catch (createError) {
          // If vendors endpoint doesn't exist, try applications
          if (createError.response?.status === 404) {
            toast.info("Please apply for vendor status first", {
              description: "You may need to submit a vendor application",
            });
            throw createError;
          }
          throw createError;
        }
      }

      fetchVendorProfile();
    } catch (error) {
      console.error("Error saving vendor profile:", error);
      toast.error("Failed to save vendor profile", {
        description:
          error.response?.data?.detail ||
          Object.values(error.response?.data || {})[0]?.[0] ||
          "Please check all fields and try again",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page title="Vendor Profile">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  // If user doesn't have a vendor, show create vendor page
  if (!vendor) {
    return (
      <Page title="Vendor Profile">
        <div className="space-y-4 sm:space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 shadow-xl sm:p-8 lg:p-10">
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-xl bg-white/20 p-2 sm:p-3 backdrop-blur-sm">
                  <BuildingStorefrontIcon className="size-5 text-white sm:size-6 lg:size-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                    Create Your Vendor Shop
                  </h1>
                  <p className="mt-1 text-sm text-primary-100 sm:text-base lg:text-lg">
                    Set up your vendor profile to start selling products
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl sm:size-48 lg:size-64" />
            <div className="absolute -bottom-8 -left-8 size-24 rounded-full bg-white/10 blur-2xl sm:size-40 lg:size-56" />
          </div>

          {/* Create Vendor Card */}
          <Card className="p-6 sm:p-8 lg:p-10">
            <div className="text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 sm:size-24">
                <BuildingStorefrontIcon className="size-10 text-primary-600 dark:text-primary-400 sm:size-12" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
                No Vendor Profile Found
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-dark-300 sm:text-base">
                Create your vendor profile to start managing products, track sales, and grow your business
              </p>
              
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                  <ShoppingBagIcon className="mx-auto size-8 text-primary-600 dark:text-primary-400" />
                  <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-dark-50">
                    Product Management
                  </h3>
                  <p className="mt-1 text-xs text-gray-600 dark:text-dark-400">
                    Add and manage your product inventory
                  </p>
                </div>
                <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                  <ChartBarIcon className="mx-auto size-8 text-primary-600 dark:text-primary-400" />
                  <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-dark-50">
                    Sales Analytics
                  </h3>
                  <p className="mt-1 text-xs text-gray-600 dark:text-dark-400">
                    Track your sales and income
                  </p>
                </div>
                <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-dark-600">
                  <CurrencyDollarIcon className="mx-auto size-8 text-primary-600 dark:text-primary-400" />
                  <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-dark-50">
                    Income Tracking
                  </h3>
                  <p className="mt-1 text-xs text-gray-600 dark:text-dark-400">
                    Monitor your earnings and revenue
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.push("/vendors/new")}
                color="primary"
                size="lg"
                className="mt-8 w-full space-x-2 sm:w-auto sm:px-8"
              >
                <PlusIcon className="size-5" />
                <span>Create Vendor Shop</span>
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Vendor Profile">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
            Vendor Profile
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
            Manage your vendor shop information
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Shop Information */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Shop Information
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Input
                    label="Shop Name"
                    placeholder="Enter your shop name"
                    {...register("shop_name", {
                      required: "Shop name is required",
                    })}
                    error={errors.shop_name?.message}
                  />

                  <Input
                    label="Address"
                    placeholder="Enter your shop address"
                    {...register("address", {
                      required: "Address is required",
                    })}
                    error={errors.address?.message}
                  />
                </div>
              </Card>

              {/* Banner Image */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Banner Image
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {bannerPreview ? (
                    <div className="relative">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="h-40 w-full rounded-lg object-cover sm:h-48"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerImage(null);
                          setBannerPreview(null);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 sm:p-2"
                      >
                        <PhotoIcon className="size-3.5 sm:size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-600 sm:h-48">
                      <div className="text-center">
                        <PhotoIcon className="mx-auto size-10 text-gray-400 sm:size-12" />
                        <p className="mt-2 text-xs text-gray-600 dark:text-dark-400 sm:text-sm">
                          No banner image
                        </p>
                      </div>
                    </div>
                  )}

                  <Upload accept="image/*" onChange={handleBannerUpload}>
                    {({ onClick, disabled }) => (
                      <Button
                        type="button"
                        onClick={onClick}
                        disabled={disabled}
                        variant="outlined"
                        className="w-full"
                      >
                        {bannerPreview ? "Change Banner" : "Upload Banner"}
                      </Button>
                    )}
                  </Upload>
                </div>
              </Card>
            </div>

            {/* Sidebar - Info & Actions */}
            <div className="space-y-4 sm:space-y-6">
              {/* Vendor Info */}
              {vendor && (
                <Card className="p-4 sm:p-6">
                  <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                    Vendor Information
                  </h2>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-dark-400">
                        Member Status
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-dark-50">
                        {vendor.member_status || "Normal"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-dark-400">
                        Payment Status
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-dark-50">
                        {vendor.payment_status ? (
                          <span className="text-green-600 dark:text-green-400">
                            Paid
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            Unpaid
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-dark-400">
                        Created At
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-dark-50">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Actions */}
              <Card className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    type="submit"
                    color="primary"
                    className="w-full text-sm sm:text-base"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push("/vendors/dashboard")}
                    variant="outlined"
                    className="w-full text-sm sm:text-base"
                    disabled={saving}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push("/vendors/products")}
                    variant="flat"
                    className="w-full text-sm sm:text-base"
                    disabled={saving}
                  >
                    Manage Products
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}

