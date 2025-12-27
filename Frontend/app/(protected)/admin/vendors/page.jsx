"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  ShoppingBagIcon,
  UserIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { Page } from "components/shared/Page";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Card, Button, Input, Table, Spinner } from "components/ui";
import axios from "utils/axios";

export default function AdminVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    vendorId: null,
    vendorName: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/vendors/vendors/");
      const vendorsData = Array.isArray(response.data) 
        ? response.data 
        : [response.data];
      setVendors(vendorsData);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors", {
        description: error.response?.data?.detail || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filtered = vendors.filter((vendor) =>
      vendor.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
      vendor.address?.toLowerCase().includes(search.toLowerCase()) ||
      vendor.user_username?.toLowerCase().includes(search.toLowerCase())
    );
    // For now, just filter client-side. Can be enhanced with backend search
    return filtered;
  };

  const handleDelete = async () => {
    if (!deleteModal.vendorId) return;

    try {
      setDeleteLoading(true);
      await axios.delete(`/api/vendors/vendors/${deleteModal.vendorId}/`);
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

  const filteredVendors = search ? handleSearch() : vendors;

  if (loading) {
    return (
      <Page title="Vendors Management">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Vendors Management">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Vendors Management
            </h1>
            <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
              Manage all vendor accounts and their products
            </p>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by shop name, address, or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<MagnifyingGlassIcon className="size-4" />}
              />
            </div>
            <Button onClick={handleSearch} color="primary" className="w-full sm:w-auto">
              Search
            </Button>
          </div>
        </Card>

        {/* Vendors Table */}
        <Card className="p-0 sm:p-6">
          {filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 sm:py-12">
              <BuildingStorefrontIcon className="size-12 text-gray-400 dark:text-dark-400 sm:size-16" />
              <p className="mt-4 text-base font-medium text-gray-900 dark:text-dark-100 sm:text-lg">
                {search ? "No vendors found" : "No vendors yet"}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
                {search
                  ? "Try adjusting your search"
                  : "Vendors will appear here once they register"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block space-y-3 p-3 sm:hidden">
                {filteredVendors.map((vendor) => {
                  const bannerUrl = getBannerUrl(vendor.banner_image);
                  return (
                    <Card key={vendor.id} className="p-3">
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                            {bannerUrl ? (
                              <img
                                src={bannerUrl}
                                alt={vendor.shop_name}
                                className="size-14 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600">
                                <PhotoIcon className="size-7 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-900 dark:text-dark-50 truncate">
                                {vendor.shop_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 truncate">
                                {vendor.user_username || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-dark-400 line-clamp-2">
                                {vendor.address}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-dark-600">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <ShoppingBagIcon className="size-3" />
                              {vendor.products_count || 0} Products
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                vendor.payment_status
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {vendor.payment_status ? "Paid" : "Unpaid"}
                            </span>
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-dark-600 dark:text-dark-200">
                              {vendor.member_status || "Normal"}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                              variant="flat"
                              isIcon
                              className="size-10"
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
                              className="size-10"
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
              <div className="hidden overflow-x-auto md:block">
                <Table hoverable className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-600">
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Vendor
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Owner
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Address
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Products
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Member Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Payment Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Created At
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300 md:px-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                    {filteredVendors.map((vendor) => {
                      const bannerUrl = getBannerUrl(vendor.banner_image);
                      return (
                        <tr
                          key={vendor.id}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-dark-800"
                        >
                          <td className="px-3 py-4 md:px-4">
                            <div className="flex items-center space-x-2 md:space-x-3">
                              {bannerUrl ? (
                                <img
                                  src={bannerUrl}
                                  alt={vendor.shop_name}
                                  className="size-10 rounded-lg object-cover md:size-12"
                                />
                              ) : (
                                <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600 md:size-12">
                                  <PhotoIcon className="size-5 text-gray-400 md:size-6" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm text-gray-900 dark:text-dark-50 truncate md:text-base">
                                  {vendor.shop_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 md:px-4">
                            <div className="flex items-center gap-2">
                              <UserIcon className="size-4 text-gray-400" />
                              <span className="text-xs text-gray-900 dark:text-dark-200 md:text-sm">
                                {vendor.user_username || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-xs text-gray-900 dark:text-dark-200 md:px-4 md:text-sm">
                            <div className="max-w-[200px] truncate" title={vendor.address}>
                              {vendor.address}
                            </div>
                          </td>
                          <td className="px-3 py-4 md:px-4">
                            <div className="flex items-center gap-1.5">
                              <ShoppingBagIcon className="size-4 text-gray-400" />
                              <span className="text-xs font-medium text-gray-900 dark:text-dark-200 md:text-sm">
                                {vendor.products_count || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-4 md:px-4">
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-dark-600 dark:text-dark-200">
                              {vendor.member_status || "Normal"}
                            </span>
                          </td>
                          <td className="px-3 py-4 md:px-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                vendor.payment_status
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {vendor.payment_status ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-xs text-gray-900 dark:text-dark-200 md:px-4 md:text-sm">
                            {new Date(vendor.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-4 text-right md:px-4">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
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
            description: `Are you sure you want to delete "${deleteModal.vendorName}"? This will also delete all associated products. This action cannot be undone.`,
          },
        }}
      />
    </Page>
  );
}

