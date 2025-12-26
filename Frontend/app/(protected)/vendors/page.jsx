"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { Page } from "components/shared/Page";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Card } from "components/ui";
import { Button, Table, Spinner } from "components/ui";
import axios from "utils/axios";

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    vendorId: null,
    vendorName: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // Try /api/vendors/vendors/ first, fallback to /api/vendors/ if 404
      let response;
      try {
        response = await axios.get("/api/vendors/vendors/");
      } catch (error) {
        if (error.response?.status === 404) {
          // Try alternative endpoint
          response = await axios.get("/api/vendors/");
        } else {
          throw error;
        }
      }
      const vendorsData = Array.isArray(response.data) 
        ? response.data 
        : [response.data];
      setVendors(vendorsData);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      // If still 404, show helpful message
      if (error.response?.status === 404) {
        toast.error("Vendor endpoints not available", {
          description: "The vendor API endpoints may not be implemented yet. Please check the backend configuration.",
        });
      } else {
        toast.error("Failed to load vendors", {
          description: error.response?.data?.detail || "Please try again later",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.vendorId) return;

    try {
      setDeleteLoading(true);
      // Try /api/vendors/vendors/ first, fallback to /api/vendors/ if 404
      try {
        await axios.delete(`/api/vendors/vendors/${deleteModal.vendorId}/`);
      } catch (error) {
        if (error.response?.status === 404) {
          await axios.delete(`/api/vendors/${deleteModal.vendorId}/`);
        } else {
          throw error;
        }
      }
      toast.success("Vendor deleted successfully");
      setDeleteModal({ show: false, vendorId: null, vendorName: "" });
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Failed to delete vendor", {
        description: error.response?.data?.detail || "Please try again",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getBannerUrl = (bannerImage) => {
    if (!bannerImage) return null;
    if (bannerImage.startsWith('http')) return bannerImage;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${bannerImage}`;
  };

  if (loading) {
    return (
      <Page title="Vendors">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Vendors">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Vendors
            </h1>
            <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
              Manage vendor accounts and profiles
            </p>
          </div>
          <Button
            onClick={() => router.push("/vendors/new")}
            color="primary"
            className="w-full space-x-2 sm:w-auto"
          >
            <PlusIcon className="size-4 sm:size-5" />
            <span className="text-sm sm:text-base">Add Vendor</span>
          </Button>
        </div>

        {/* Vendors Table */}
        <Card className="p-0 sm:p-6">
          {vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 sm:py-12">
              <BuildingStorefrontIcon className="size-12 text-gray-400 dark:text-dark-400 sm:size-16" />
              <p className="mt-4 text-base font-medium text-gray-900 dark:text-dark-100 sm:text-lg">
                No vendors yet
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
                Get started by adding your first vendor
              </p>
              <Button
                onClick={() => router.push("/vendors/new")}
                color="primary"
                className="mt-4 sm:mt-6"
              >
                Add Your First Vendor
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block space-y-4 p-4 sm:hidden">
                {vendors.map((vendor) => {
                  const bannerUrl = getBannerUrl(vendor.banner_image);
                  return (
                    <Card key={vendor.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {bannerUrl ? (
                              <img
                                src={bannerUrl}
                                alt={vendor.shop_name}
                                className="size-16 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600">
                                <PhotoIcon className="size-8 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 dark:text-dark-50 truncate">
                                {vendor.shop_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 truncate">
                                {vendor.address}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-dark-600">
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              vendor.payment_status 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {vendor.payment_status ? 'Paid' : 'Unpaid'}
                            </span>
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-dark-600 dark:text-dark-200">
                              {vendor.member_status || 'Normal'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => router.push(`/vendors/${vendor.id}`)}
                              variant="flat"
                              isIcon
                              className="size-9"
                            >
                              <PencilIcon className="size-4" />
                            </Button>
                            <Button
                              onClick={() =>
                                setDeleteModal({
                                  show: true,
                                  vendorId: vendor.id,
                                  vendorName: vendor.shop_name,
                                })
                              }
                              variant="flat"
                              color="error"
                              isIcon
                              className="size-9"
                            >
                              <TrashIcon className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto sm:block">
                <Table hoverable className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-600">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Member Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Payment Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                    {vendors.map((vendor) => {
                      const bannerUrl = getBannerUrl(vendor.banner_image);
                      return (
                        <tr
                          key={vendor.id}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-dark-800"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              {bannerUrl ? (
                                <img
                                  src={bannerUrl}
                                  alt={vendor.shop_name}
                                  className="size-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600">
                                  <PhotoIcon className="size-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-dark-50">
                                  {vendor.shop_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-dark-200">
                            {vendor.address}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-dark-600 dark:text-dark-200">
                              {vendor.member_status || "Normal"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              vendor.payment_status 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {vendor.payment_status ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-dark-200">
                            {new Date(vendor.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                onClick={() => router.push(`/vendors/${vendor.id}`)}
                                variant="flat"
                                isIcon
                                className="size-8"
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  setDeleteModal({
                                    show: true,
                                    vendorId: vendor.id,
                                    vendorName: vendor.shop_name,
                                  })
                                }
                                variant="flat"
                                color="error"
                                isIcon
                                className="size-8"
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        onClose={() =>
          setDeleteModal({ show: false, vendorId: null, vendorName: "" })
        }
        onOk={handleDelete}
        confirmLoading={deleteLoading}
        state="pending"
        messages={{
          pending: {
            title: "Delete Vendor?",
            description: `Are you sure you want to delete "${deleteModal.vendorName}"? This action cannot be undone.`,
          },
        }}
      />
    </Page>
  );
}

