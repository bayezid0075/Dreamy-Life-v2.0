"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
  HeartIcon,
  TruckIcon,
  ShieldCheckIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [resellerPrice, setResellerPrice] = useState("");
  const [useResellerPrice, setUseResellerPrice] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("shop_favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(
          `/api/vendors/shop/products/${productId}/`
        );
        setProduct(response.data);
        if (response.data.reseller_mrp_price) {
          setResellerPrice(response.data.reseller_mrp_price);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Product not found");
        router.push("/shop");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("shop_cart") || "[]");
    const existingItem = cart.find((item) => item.id === product.id);

    const cartItem = {
      ...product,
      quantity,
      reseller_price: useResellerPrice
        ? resellerPrice || product.reseller_mrp_price
        : null,
    };

    if (existingItem) {
      const updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      localStorage.setItem("shop_cart", JSON.stringify(updatedCart));
    } else {
      localStorage.setItem("shop_cart", JSON.stringify([...cart, cartItem]));
    }

    toast.success("Added to cart");
  };

  const toggleFavorite = () => {
    const isFavorite = favorites.includes(product.id);
    const newFavorites = isFavorite
      ? favorites.filter((id) => id !== product.id)
      : [...favorites, product.id];
    setFavorites(newFavorites);
    localStorage.setItem("shop_favorites", JSON.stringify(newFavorites));
  };

  if (loading) {
    return (
      <Page title="Product Details">
        <div className="animate-pulse space-y-6">
          <div className="h-96 w-full rounded-lg bg-gray-200 dark:bg-dark-600" />
          <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-dark-600" />
        </div>
      </Page>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images || [];
  const displayPrice = useResellerPrice && resellerPrice
    ? resellerPrice
    : product.effective_price;

  return (
    <Page title={product.title}>
      <div className="space-y-4 sm:space-y-6">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="outlined"
          size="sm"
          className="rounded-xl border-2"
        >
          <ArrowLeftIcon className="mr-2 size-4" />
          Back
        </Button>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg dark:from-dark-600 dark:to-dark-700">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]?.image}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${
                      selectedImageIndex === idx
                        ? "border-primary-600 ring-2 ring-primary-300"
                        : "border-gray-300 dark:border-dark-600"
                    }`}
                  >
                    <img
                      src={img.image}
                      alt={`${product.title} ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400 sm:text-sm">
                {product.vendor_name}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-dark-50 sm:text-3xl lg:text-4xl">
                {product.title}
              </h1>
              <p className="mt-2 text-xs text-gray-600 dark:text-dark-300 sm:text-sm">
                SKU: <span className="font-mono font-semibold">{product.sku}</span>
              </p>
            </div>

            {/* Price Section */}
            <div className="space-y-4 rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50 p-4 shadow-md dark:border-primary-800 dark:from-primary-900/20 dark:to-purple-900/20 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-600 dark:text-primary-400 sm:text-4xl">
                      ৳{displayPrice}
                    </span>
                    {product.discount_price && !useResellerPrice && (
                      <span className="text-lg font-medium text-gray-500 line-through dark:text-dark-400">
                        ৳{product.price}
                      </span>
                    )}
                  </div>
                  {product.discount_percentage > 0 && !useResellerPrice && (
                    <p className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Save {product.discount_percentage}%
                    </p>
                  )}
                </div>
                <button
                  onClick={toggleFavorite}
                  className="flex-shrink-0 rounded-xl bg-white p-3 shadow-md transition-all hover:scale-110 hover:shadow-lg dark:bg-dark-700"
                >
                  {favorites.includes(product.id) ? (
                    <HeartIconSolid className="size-6 animate-pulse text-red-500" />
                  ) : (
                    <HeartIcon className="size-6 text-gray-600 transition-colors hover:text-red-500 dark:text-dark-300" />
                  )}
                </button>
              </div>

              {/* Reseller Price Option */}
              {product.reseller_mrp_price && (
                <div className="space-y-3 rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={useResellerPrice}
                      onChange={(e) => setUseResellerPrice(e.target.checked)}
                      className="size-5 rounded border-2 border-green-300 text-primary-600 focus:ring-2 focus:ring-green-500 dark:border-green-700"
                    />
                    <span className="text-sm font-bold text-green-800 dark:text-green-400 sm:text-base">
                      Use Reseller Price
                    </span>
                  </label>
                  {useResellerPrice && (
                    <div className="mt-3 animate-in slide-in-from-top-2">
                      <input
                        type="number"
                        value={resellerPrice}
                        onChange={(e) => setResellerPrice(e.target.value)}
                        placeholder={`Default: ৳${product.reseller_mrp_price}`}
                        className="h-11 w-full rounded-xl border-2 border-green-200 bg-white px-4 text-sm font-medium transition-all focus:border-green-400 focus:outline-none dark:border-green-800 dark:bg-dark-700 dark:text-dark-50"
                      />
                      <p className="mt-2 text-xs text-green-700 dark:text-green-500">
                        Leave empty to use default reseller price
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <label className="text-sm font-semibold text-gray-700 dark:text-dark-300 sm:text-base">
                Quantity:
              </label>
              <div className="flex items-center gap-1 rounded-xl border-2 border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-700">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outlined"
                  size="sm"
                  className="rounded-l-xl border-0 hover:bg-primary-50"
                >
                  <MinusIcon className="size-4" />
                </Button>
                <span className="w-16 text-center text-base font-bold text-gray-900 dark:text-dark-50 sm:w-20 sm:text-lg">
                  {quantity}
                </span>
                <Button
                  onClick={() => setQuantity(quantity + 1)}
                  variant="outlined"
                  size="sm"
                  className="rounded-r-xl border-0 hover:bg-primary-50"
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={addToCart}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 py-3 text-base font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                size="lg"
              >
                <ShoppingCartIcon className="mr-2 size-5" />
                Add to Cart
              </Button>
              <Button
                onClick={() => {
                  addToCart();
                  router.push("/shop/cart");
                }}
                variant="outlined"
                size="lg"
                className="flex-1 rounded-xl border-2 font-semibold"
              >
                Buy Now
              </Button>
            </div>

            {/* Product Details */}
            <Card className="border-2 border-gray-100 p-4 shadow-md dark:border-dark-600 sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-dark-50 sm:text-xl">
                Description
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-dark-300 whitespace-pre-line sm:text-base">
                {product.description}
              </p>
            </Card>

            {/* Additional Info */}
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="flex items-start gap-3 rounded-xl border-2 border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <div className="flex-shrink-0 rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <TruckIcon className="size-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-dark-50 sm:text-base">
                    Delivery
                  </p>
                  <p className="mt-1 text-xs text-gray-700 dark:text-dark-300 sm:text-sm">
                    Inside Dhaka: <span className="font-semibold">৳{product.delivery_charge_inside_dhaka || "Free"}</span>
                  </p>
                  <p className="text-xs text-gray-700 dark:text-dark-300 sm:text-sm">
                    Outside: <span className="font-semibold">৳{product.delivery_charge_outside_dhaka || "Free"}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border-2 border-green-100 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                <div className="flex-shrink-0 rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <ShieldCheckIcon className="size-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-dark-50 sm:text-base">
                    Secure Payment
                  </p>
                  <p className="mt-1 text-xs text-gray-700 dark:text-dark-300 sm:text-sm">
                    Protected transactions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

