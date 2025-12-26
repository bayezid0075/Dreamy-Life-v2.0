"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftIcon, PhotoIcon } from "@heroicons/react/24/outline";

import { Page } from "components/shared/Page";
import { Card, Button, Input, Select, Upload, Checkbox } from "components/ui";
import axios from "utils/axios";

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleBannerUpload = (file) => {
    if (file) {
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("shop_name", data.shop_name);
      formData.append("address", data.address);
      formData.append("member_status", data.member_status);
      formData.append("payment_status", data.payment_status ? "true" : "false");
      
      if (bannerImage) {
        formData.append("banner_image", bannerImage);
      }

      // Try /api/vendors/vendors/ endpoint
      try {
        await axios.post("/api/vendors/vendors/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (error) {
        if (error.response?.status === 404) {
          toast.error("Vendor endpoint not found", {
            description: "The vendor creation endpoint is not available. Please ensure the backend has vendor CRUD endpoints implemented at /api/vendors/vendors/",
            duration: 6000,
          });
          throw error;
        } else {
          throw error;
        }
      }

      toast.success("Vendor created successfully!");
      router.push("/vendors");
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast.error("Failed to create vendor", {
        description:
          error.response?.data?.detail ||
          Object.values(error.response?.data || {})[0]?.[0] ||
          "Please check all fields and try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="New Vendor">
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
              Create New Vendor
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-dark-300 sm:mt-1 sm:text-sm">
              Add a new vendor to the system
            </p>
          </div>
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
            </div>

            {/* Sidebar - Actions */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    type="submit"
                    color="primary"
                    className="w-full text-sm sm:text-base"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Vendor"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    variant="outlined"
                    className="w-full text-sm sm:text-base"
                    disabled={loading}
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

