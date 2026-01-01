"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { Page } from "components/shared/Page";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Card } from "components/ui";
import { Button, Table, Spinner } from "components/ui";
import axios from "utils/axios";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    productId: null,
    productTitle: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    checkVendorAndFetchProducts();
  }, []);

  const checkVendorAndFetchProducts = async () => {
    try {
      setLoading(true);
      // First check if user has a vendor
      try {
        const vendorResponse = await axios.get("/api/vendors/vendors/");
        const vendorData = Array.isArray(vendorResponse.data) && vendorResponse.data.length > 0
          ? vendorResponse.data[0]
          : vendorResponse.data;
        
        if (!vendorData) {
          // No vendor exists, redirect to create page
          router.push("/vendors/new");
          return;
        }
      } catch (vendorError) {
        // If 404 or 403, user has no vendor
        if (vendorError.response?.status === 404 || vendorError.response?.status === 403) {
          router.push("/vendors/new");
          return;
        }
      }
      
      // User has vendor, fetch products
      const response = await axios.get("/api/vendors/products/");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      if (error.response?.status === 404 || error.response?.status === 403) {
        router.push("/vendors/new");
        return;
      }
      toast.error("Failed to load products", {
        description: error.response?.data?.detail || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.productId) return;

    try {
      setDeleteLoading(true);
      await axios.delete(`/api/vendors/products/${deleteModal.productId}/`);
      toast.success("Product deleted successfully");
      setDeleteModal({ show: false, productId: null, productTitle: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product", {
        description: error.response?.data?.detail || "Please try again",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
    }).format(price);
  };

  if (loading) {
    return (
      <Page title="Products">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Products">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-50 sm:text-2xl">
              Products
            </h1>
            <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
              Manage your product inventory
            </p>
          </div>
          <Button
            onClick={() => router.push("/vendors/products/new")}
            color="primary"
            className="w-full space-x-2 sm:w-auto"
          >
            <PlusIcon className="size-4 sm:size-5" />
            <span className="text-sm sm:text-base">Add Product</span>
          </Button>
        </div>

        {/* Products Table */}
        <Card className="p-0 sm:p-6">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 sm:py-12">
              <PhotoIcon className="size-12 text-gray-400 dark:text-dark-400 sm:size-16" />
              <p className="mt-4 text-base font-medium text-gray-900 dark:text-dark-100 sm:text-lg">
                No products yet
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
                Get started by adding your first product
              </p>
              <Button
                onClick={() => router.push("/vendors/products/new")}
                color="primary"
                className="mt-4 sm:mt-6"
              >
                Add Your First Product
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block space-y-4 p-4 sm:hidden">
                {products.map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].image}
                              alt={product.title}
                              className="size-16 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600">
                              <PhotoIcon className="size-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-dark-50 truncate">
                              {product.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                              {product.brand?.name || "No brand"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                              SKU: {product.sku}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-dark-600">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                            {formatPrice(product.price)}
                          </div>
                          {product.discount_price && (
                            <div className="text-xs text-gray-500 line-through dark:text-dark-400">
                              {formatPrice(product.discount_price)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() =>
                              router.push(`/vendors/products/${product.id}`)
                            }
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
                                productId: product.id,
                                productTitle: product.title,
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
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto sm:block">
                <Table hoverable className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-600">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Stock Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-dark-800"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].image}
                                alt={product.title}
                                className="size-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600">
                                <PhotoIcon className="size-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-dark-50">
                                {product.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-dark-400">
                                {product.brand?.name || "No brand"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 dark:text-dark-200">
                          {product.sku}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 dark:text-dark-200">
                          {product.category?.name || "Uncategorized"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-dark-50">
                            {formatPrice(product.price)}
                          </div>
                          {product.discount_price && (
                            <div className="text-xs text-gray-500 line-through dark:text-dark-400">
                              {formatPrice(product.discount_price)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              onClick={() =>
                                router.push(`/vendors/products/${product.id}`)
                              }
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
                                  productId: product.id,
                                  productTitle: product.title,
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
                    ))}
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
          setDeleteModal({ show: false, productId: null, productTitle: "" })
        }
        onOk={handleDelete}
        confirmLoading={deleteLoading}
        state="pending"
        messages={{
          pending: {
            title: "Delete Product?",
            description: `Are you sure you want to delete "${deleteModal.productTitle}"? This action cannot be undone.`,
          },
        }}
      />
      </div>
    </Page>
  );
}

