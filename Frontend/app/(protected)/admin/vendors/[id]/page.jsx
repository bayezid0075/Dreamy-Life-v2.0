"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftIcon, PhotoIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

import { Page } from "components/shared/Page";
import { Card, Button, Input, Select, Upload, Spinner, Checkbox } from "components/ui";
import axios from "utils/axios";

export default function AdminEditVendorPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      shop_name: "",
      address: "",
      member_status: "Normal",
      payment_status: false,
    },
  });

  const memberStatusOptions = [
    { label: "Normal", value: "Normal" },
    { label: "VIP", value: "VIP" },
    { label: "VVIP", value: "VVIP" },
  ];

  useEffect(() => {
    fetchVendor();
    fetchProducts();
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/vendors/vendors/${vendorId}/`);
      const vendorData = response.data;
      setVendor(vendorData);

      setValue("shop_name", vendorData.shop_name || "");
      setValue("address", vendorData.address || "");
      setValue("member_status", vendorData.member_status || "Normal");
      setValue("payment_status", vendorData.payment_status || false);

      if (vendorData.banner_image) {
        const bannerUrl = vendorData.banner_image.startsWith('http')
          ? vendorData.banner_image
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${vendorData.banner_image}`;
        setBannerPreview(bannerUrl);
      }
    } catch (error) {
      console.error("Error fetching vendor:", error);
      toast.error("Failed to load vendor", {
        description: error.response?.data?.detail || "Please try again",
      });
      router.push("/admin/vendors");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/vendors/products/");
      // Filter products for this vendor
      const vendorProducts = response.data.filter(
        (product) => product.vendor === parseInt(vendorId)
      );
      setProducts(vendorProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
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
      formData.append("member_status", data.member_status);
      formData.append("payment_status", data.payment_status ? "true" : "false");
      
      if (bannerImage) {
        formData.append("banner_image", bannerImage);
      }

      await axios.put(`/api/vendors/vendors/${vendorId}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Vendor updated successfully!");
      router.push("/admin/vendors");
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast.error("Failed to update vendor", {
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
      <Page title="Edit Vendor">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit Vendor">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            onClick={() => router.back()}
            variant="flat"
            isIcon
            className="size-8 sm:size-9"
          >
            <ArrowLeftIcon className="size-4 sm:size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Edit Vendor
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-dark-300 sm:mt-1 sm:text-sm">
              Update vendor information and manage products
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
            {/* Main Form */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              {/* Shop Information */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Shop Information
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Input
                    label="Shop Name"
                    placeholder="Enter shop name"
                    {...register("shop_name", {
                      required: "Shop name is required",
                      maxLength: {
                        value: 200,
                        message: "Shop name must be less than 200 characters",
                      },
                    })}
                    error={errors.shop_name?.message}
                  />

                  <Input
                    label="Address"
                    placeholder="Enter shop address"
                    {...register("address", {
                      required: "Address is required",
                      maxLength: {
                        value: 255,
                        message: "Address must be less than 255 characters",
                      },
                    })}
                    error={errors.address?.message}
                  />
                </div>
              </Card>

              {/* Status Information */}
              <Card className="p-4 sm:p-6">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-dark-50 sm:mb-4 sm:text-lg">
                  Status Information
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <Select
                    label="Member Status"
                    data={memberStatusOptions}
                    {...register("member_status", {
                      required: "Member status is required",
                    })}
                    onChange={(e) => {
                      setValue("member_status", e.target.value);
                    }}
                    error={errors.member_status?.message}
                  />

                  <Checkbox
                    label="Payment Status (Paid)"
                    {...register("payment_status")}
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
                        className="w-full text-sm sm:text-base"
                      >
                        {bannerPreview ? "Change Banner" : "Upload Banner"}
                      </Button>
                    )}
                  </Upload>
                </div>
              </Card>

              {/* Products List */}
              <Card className="p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-dark-50 sm:text-lg">
                    Products ({products.length})
                  </h2>
                  <Button
                    onClick={() => router.push(`/vendors/products?vendor=${vendorId}`)}
                    variant="flat"
                    className="text-xs sm:text-sm"
                  >
                    View All Products
                  </Button>
                </div>
                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <ShoppingBagIcon className="size-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-dark-400">
                      No products yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-dark-600 dark:hover:bg-dark-800"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].image}
                              alt={product.title}
                              className="size-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600">
                              <PhotoIcon className="size-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-50 truncate">
                              {product.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-400">
                              SKU: {product.sku}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => router.push(`/vendors/products/${product.id}`)}
                          variant="flat"
                          className="text-xs sm:text-sm"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                    {products.length > 5 && (
                      <p className="text-center text-xs text-gray-500 dark:text-dark-400 pt-2">
                        + {products.length - 5} more products
                      </p>
                    )}
                  </div>
                )}
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
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-dark-400">Owner</p>
                      <p className="font-medium text-gray-900 dark:text-dark-50">
                        {vendor.user_username || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-dark-400">Products Count</p>
                      <p className="font-medium text-gray-900 dark:text-dark-50">
                        {vendor.products_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-dark-400">Created At</p>
                      <p className="font-medium text-gray-900 dark:text-dark-50">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Actions */}
              <Card className="p-4 sm:p-6 sticky top-4">
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    type="submit"
                    color="primary"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    variant="outlined"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    disabled={saving}
                  >
                    Cancel
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

