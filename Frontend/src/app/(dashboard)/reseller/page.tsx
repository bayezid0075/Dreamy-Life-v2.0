"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  SlidersHorizontal,
  ShoppingCart,
  Store,
  ImageOff,
  Plus,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { shopApi } from "@/lib/api";
import { useCartStore } from "@/store";
import type { ShopFilters, Product } from "@/types";

export default function ShopPage() {
  const router = useRouter();
  const { addItem } = useCartStore();
  const cartCount = useCartStore((s) =>
    s.items.reduce((c, i) => c + i.quantity, 0),
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [showFilters, setShowFilters] = useState(false);

  const filters: ShopFilters = useMemo(
    () => ({
      search: search || undefined,
      category: category ? parseInt(category) : undefined,
      brand: brand ? parseInt(brand) : undefined,
      sort_by: sortBy as ShopFilters["sort_by"],
      page_size: 40,
    }),
    [search, category, brand, sortBy],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["shop-products", filters],
    queryFn: () => shopApi.getProducts(filters),
  });

  const { data: categories } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: shopApi.getCategories,
    staleTime: 10 * 60 * 1000,
  });

  const { data: brands } = useQuery({
    queryKey: ["shop-brands"],
    queryFn: shopApi.getBrands,
    staleTime: 10 * 60 * 1000,
  });

  const handleAddToCart = (product: Product) => {
    const price =
      product.reseller_mrp_price || product.discount_price || product.price;
    addItem(product, 1, price);
    toast.success(`${product.title} added to cart`);
  };

  const getEffectivePrice = (product: Product) => {
    return product.effective_price || product.discount_price || product.price;
  };

  const panelClass =
    "rounded-lg border border-[#eaecef] dark:border-[#2b3139] bg-[#fafafa] dark:bg-[#1e2329]";
  const cardClass =
    "rounded-lg border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139]";

  return (
    <div className="min-h-[60vh] px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10">
      <div className={`${panelClass} overflow-hidden`}>
        {/* Hero strip */}
        <section className="border-b border-[#eaecef] dark:border-[#2b3139] p-5 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Reseller Shop
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Browse · Resell · Your price
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="rounded-md gap-1.5 h-9 border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] hover:bg-slate-50 dark:hover:bg-[#333b45]"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Link href="/reseller/cart">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md gap-1.5 h-9 relative border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] hover:bg-slate-50 dark:hover:bg-[#333b45]"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-md bg-[#f0b90b] text-[#1e2329] text-[10px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Search + filters */}
        <section className="border-b border-[#eaecef] dark:border-[#2b3139] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 h-10 rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-md h-10 gap-1.5 border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] ${showFilters ? "border-[#f0b90b] text-[#f0b90b]" : ""}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            {showFilters && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-md border border-[#2b3139]">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] text-sm">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-md border border-[#2b3139]">
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands?.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-md border border-[#2b3139]">
                    <SelectItem value="created_at">Newest</SelectItem>
                    <SelectItem value="price_asc">Price: Low → High</SelectItem>
                    <SelectItem value="price_desc">Price: High → Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {data && !isLoading && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              {data.count} product{data.count !== 1 ? "s" : ""}
            </p>
          )}
        </section>

        {/* Product grid */}
        <section className="p-4 sm:p-5">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`${cardClass} overflow-hidden`}>
                  <Skeleton className="aspect-square w-full rounded-t-lg rounded-b-none" />
                  <div className="p-4 space-y-2 border-t border-[#eaecef] dark:border-[#474d57]">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.results.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((product) => {
                const effectivePrice = getEffectivePrice(product);
                const hasDiscount =
                  product.discount_price &&
                  product.discount_price !== product.price;
                const hasResellerPrice = product.reseller_mrp_price;

                return (
                  <div
                    key={product.id}
                    className={`group overflow-hidden hover:border-[#f0b90b]/60 dark:hover:border-[#f0b90b]/50 transition-colors ${cardClass}`}
                  >
                    <Link href={`/reseller/${product.id}`}>
                      <div className="relative aspect-square bg-slate-100 dark:bg-[#1e2329] overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                          </div>
                        )}
                        {hasDiscount && product.discount_percentage && (
                          <span className="absolute top-2 left-2 rounded px-1.5 py-0.5 bg-slate-800 dark:bg-[#1e2329] text-[#f0b90b] text-[10px] font-medium">
                            -{product.discount_percentage}%
                          </span>
                        )}
                        {hasResellerPrice && (
                          <span className="absolute top-2 right-2 flex items-center gap-0.5 rounded px-1.5 py-0.5 border border-[#f0b90b]/50 text-[#f0b90b] text-[10px] font-medium bg-white/90 dark:bg-[#2b3139]/90">
                            <Tag className="h-2.5 w-2.5" />
                            Reseller
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-4 space-y-2 border-t border-[#eaecef] dark:border-[#474d57]">
                      <Link href={`/reseller/${product.id}`}>
                        <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 text-slate-900 dark:text-slate-100 hover:text-[#f0b90b] transition-colors">
                          {product.title}
                        </h3>
                      </Link>

                      {product.vendor_name && (
                        <div className="flex items-center gap-1">
                          <Store className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                            {product.vendor_name}
                          </span>
                        </div>
                      )}

                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-base font-bold text-[#f0b90b] dark:text-[#f0b90b]">
                            ৳{parseFloat(effectivePrice).toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                              ৳{parseFloat(product.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {hasResellerPrice && (
                          <p className="text-[10px] sm:text-xs text-[#f0b90b]/90 mt-0.5">
                            Reseller: ৳
                            {parseFloat(product.reseller_mrp_price!).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="w-full h-8 text-xs rounded-md bg-[#f0b90b] hover:bg-[#d9a60a] text-[#1e2329] font-medium border border-[#e5a708]"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={`rounded-lg border border-dashed border-[#eaecef] dark:border-[#474d57] p-10 sm:p-14 text-center ${cardClass}`}
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200/80 dark:bg-[#333b45] mb-5">
                <Store className="h-7 w-7 text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">
                No Products Found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {search || category || brand
                  ? "Try adjusting your search or filters."
                  : "No products are available yet."}
              </p>
            </div>
          )}

          {data && data.total_pages > 1 && (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
              {data.results.length} of {data.count}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
