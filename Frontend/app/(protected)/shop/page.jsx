"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ShoppingCartIcon,
  HeartIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { Page } from "components/shared/Page";
import { Button, Card, Input } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("created_at");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("shop_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    const savedFavorites = localStorage.getItem("shop_favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Fetch categories, brands, vendors
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catsRes, brandsRes, vendorsRes] = await Promise.all([
          axios.get("/api/vendors/shop/categories/"),
          axios.get("/api/vendors/shop/brands/"),
          axios.get("/api/vendors/shop/vendors/"),
        ]);
        setCategories(catsRes.data);
        setBrands(brandsRes.data);
        setVendors(vendorsRes.data);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: "20",
          sort_by: sortBy,
        });

        if (search) params.append("search", search);
        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedBrand) params.append("brand", selectedBrand);
        if (selectedVendor) params.append("vendor", selectedVendor);
        if (priceRange.min) params.append("min_price", priceRange.min);
        if (priceRange.max) params.append("max_price", priceRange.max);

        const response = await axios.get(
          `/api/vendors/shop/products/?${params.toString()}`
        );
        setProducts(response.data.results);
        setTotalPages(response.data.total_pages);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    search,
    selectedCategory,
    selectedBrand,
    selectedVendor,
    priceRange,
    sortBy,
    page,
  ]);

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      const updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
      localStorage.setItem("shop_cart", JSON.stringify(updatedCart));
    } else {
      const newCart = [
        ...cart,
        {
          ...product,
          quantity: 1,
          reseller_price: product.reseller_mrp_price || null,
        },
      ];
      setCart(newCart);
      localStorage.setItem("shop_cart", JSON.stringify(newCart));
    }
    toast.success("Added to cart");
  };

  const toggleFavorite = (productId) => {
    const isFavorite = favorites.includes(productId);
    const newFavorites = isFavorite
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
    localStorage.setItem("shop_favorites", JSON.stringify(newFavorites));
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedVendor(null);
    setPriceRange({ min: "", max: "" });
    setSearch("");
    setPage(1);
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].image;
    }
    return "/images/placeholder-product.png";
  };

  return (
    <Page title="Reselling Shop">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
        {/* Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-purple-600 p-6 text-white shadow-lg sm:p-8">
          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-6 sm:size-8" />
                  <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                    Reselling Shop
                  </h1>
                </div>
                <p className="mt-2 text-sm text-primary-50 sm:text-base">
                  Discover amazing products from all vendors
                </p>
              </div>
              <Button
                onClick={() => router.push("/shop/cart")}
                className="relative mt-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 sm:mt-0"
                size="lg"
              >
                <ShoppingCartIcon className="size-5" />
                {cart.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg animate-pulse">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </Button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-purple-400/20 blur-2xl"></div>
        </div>

        {/* Search and Filters Bar */}
        <Card className="border-2 border-gray-100 p-4 shadow-md dark:border-dark-600 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Search products, brands, vendors..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  prefix={<MagnifyingGlassIcon className="size-5 text-gray-400" />}
                  className="w-full rounded-xl border-2 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Sort and Filter Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 flex-1 rounded-xl border-2 border-gray-200 bg-white px-3 text-sm font-medium transition-all hover:border-primary-300 focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50 sm:flex-none sm:w-auto"
              >
                <option value="created_at">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>

              {/* Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "filled" : "outlined"}
                color={showFilters ? "primary" : "neutral"}
                className="rounded-xl"
              >
                <FunnelIcon className="mr-2 size-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 animate-in slide-in-from-top-2 space-y-4 border-t-2 border-gray-100 pt-4 dark:border-dark-600">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Category Filter */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-400">
                    Category
                  </label>
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value || null);
                      setPage(1);
                    }}
                    className="h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-medium transition-all hover:border-primary-300 focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-400">
                    Brand
                  </label>
                  <select
                    value={selectedBrand || ""}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value || null);
                      setPage(1);
                    }}
                    className="h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-medium transition-all hover:border-primary-300 focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendor Filter */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-400">
                    Vendor
                  </label>
                  <select
                    value={selectedVendor || ""}
                    onChange={(e) => {
                      setSelectedVendor(e.target.value || null);
                      setPage(1);
                    }}
                    className="h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-medium transition-all hover:border-primary-300 focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                  >
                    <option value="">All Vendors</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.shop_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-400">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      className="h-11 rounded-xl border-2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      className="h-11 rounded-xl border-2"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={clearFilters}
                  variant="outlined"
                  size="sm"
                  className="rounded-xl border-2"
                >
                  <XMarkIcon className="mr-2 size-4" />
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden p-0">
                <div className="aspect-square w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-600 dark:to-dark-700" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-dark-600" />
                  <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-dark-600" />
                </div>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-600">
              <MagnifyingGlassIcon className="size-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-600 dark:text-dark-300 sm:text-lg">
              No products found
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-dark-400">
              Try adjusting your filters or search terms
            </p>
          </Card>
        ) : (
          <>
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group relative flex h-full flex-col overflow-hidden border-2 border-gray-100 transition-all duration-300 hover:border-primary-300 hover:shadow-xl dark:border-dark-600 dark:hover:border-primary-500"
                >
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2.5 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-dark-700/95"
                  >
                    {favorites.includes(product.id) ? (
                      <HeartIconSolid className="size-5 animate-pulse text-red-500" />
                    ) : (
                      <HeartIcon className="size-5 text-gray-600 transition-colors hover:text-red-500 dark:text-dark-300" />
                    )}
                  </button>

                  {/* Discount Badge */}
                  {product.discount_percentage > 0 && (
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      -{product.discount_percentage}% OFF
                    </div>
                  )}

                  {/* Product Image - Fixed aspect ratio */}
                  <div
                    className="relative w-full cursor-pointer overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-600 dark:to-dark-700"
                    onClick={() => router.push(`/shop/products/${product.id}`)}
                  >
                    <div className="aspect-square w-full">
                      <img
                        src={getProductImage(product)}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
                  </div>

                  {/* Product Info - Flex grow to fill space */}
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                      {product.vendor_name}
                    </p>
                    <h3
                      className="mt-1.5 line-clamp-2 min-h-[2.5rem] cursor-pointer text-sm font-bold text-gray-900 transition-colors hover:text-primary-600 dark:text-dark-50 sm:text-base"
                      onClick={() => router.push(`/shop/products/${product.id}`)}
                    >
                      {product.title}
                    </h3>

                    {/* Price - Push to bottom */}
                    <div className="mt-auto">
                      <div className="mt-3 flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                            ৳{product.effective_price}
                          </span>
                          {product.discount_price && (
                            <span className="text-sm font-medium text-gray-500 line-through dark:text-dark-400">
                              ৳{product.price}
                            </span>
                          )}
                        </div>
                        {/* Reseller Price Info */}
                        {product.reseller_mrp_price && (
                          <p className="text-xs font-medium text-green-600 dark:text-green-400">
                            Reseller: ৳{product.reseller_mrp_price}
                          </p>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        onClick={() => addToCart(product)}
                        className="mt-4 w-full rounded-xl font-semibold shadow-md transition-all hover:scale-105 hover:shadow-lg"
                        color="primary"
                        size="sm"
                      >
                        <ShoppingCartIcon className="mr-2 size-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outlined"
                  className="w-full rounded-xl border-2 sm:w-auto"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`h-10 w-10 rounded-lg font-semibold transition-all ${
                            page === pageNum
                              ? "bg-primary-600 text-white shadow-lg"
                              : "bg-white text-gray-700 hover:bg-primary-50 dark:bg-dark-700 dark:text-dark-50 dark:hover:bg-dark-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum} className="text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outlined"
                  className="w-full rounded-xl border-2 sm:w-auto"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </Page>
  );
}

