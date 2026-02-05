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
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="min-h-full bg-[#f5f0e8] dark:bg-[#1a1714] font-serif px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
      {/* Back + Cart */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 font-serif"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Link href="/reseller/cart">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 relative border-stone-400 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 font-serif"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-sm bg-stone-800 dark:bg-amber-800 text-[#f5f0e8] text-[10px] font-bold flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 border-b border-stone-300 dark:border-stone-700 pb-4">
        <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-stone-800 dark:text-stone-100 uppercase">
          Reseller Shop
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-mono">
          Browse · Resell · Your price
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-stone-900/80 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-mono text-sm placeholder:text-stone-400 focus-visible:ring-amber-800/40"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`border-stone-400 dark:border-stone-600 font-serif ${showFilters ? "border-amber-800 text-amber-800 dark:text-amber-600 bg-amber-50/50 dark:bg-amber-900/20" : "text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="text-sm font-mono border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900/80">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="font-mono border-stone-200 dark:border-stone-800 bg-[#f5f0e8] dark:bg-[#1a1714]">
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="text-sm font-mono border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900/80">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent className="font-mono border-stone-200 dark:border-stone-800 bg-[#f5f0e8] dark:bg-[#1a1714]">
              <SelectItem value="all">All Brands</SelectItem>
              {brands?.map((b) => (
                <SelectItem key={b.id} value={b.id.toString()}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="text-sm font-mono col-span-2 sm:col-span-1 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900/80">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="font-mono border-stone-200 dark:border-stone-800 bg-[#f5f0e8] dark:bg-[#1a1714]">
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results count */}
      {data && !isLoading && (
        <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-3">
          {data.count} product{data.count !== 1 ? "s" : ""}
        </p>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 overflow-hidden"
            >
              <Skeleton className="aspect-[1] w-full rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
              <div className="p-3 space-y-2 border-t border-stone-200 dark:border-stone-800">
                <Skeleton className="h-4 w-3/4 rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
                <Skeleton className="h-3 w-1/2 rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
                <Skeleton className="h-6 w-16 rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
                <Skeleton className="h-8 w-full rounded-none bg-stone-200/50 dark:bg-stone-800/50" />
              </div>
            </div>
          ))}
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {data.results.map((product) => {
            const effectivePrice = getEffectivePrice(product);
            const hasDiscount =
              product.discount_price &&
              product.discount_price !== product.price;
            const hasResellerPrice = product.reseller_mrp_price;

            return (
              <div
                key={product.id}
                className="group bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 overflow-hidden hover:border-stone-400 dark:hover:border-stone-600 transition-colors"
              >
                <Link href={`/reseller/${product.id}`}>
                  <div className="relative aspect-square bg-stone-100 dark:bg-stone-800/50 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].image}
                        alt={product.title}
                        className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="h-8 w-8 text-stone-300 dark:text-stone-600" />
                      </div>
                    )}
                    {hasDiscount && product.discount_percentage && (
                      <span className="absolute top-1.5 left-1.5 bg-stone-800 dark:bg-amber-900 text-[#f5f0e8] text-[10px] font-mono px-1.5 py-0.5">
                        -{product.discount_percentage}%
                      </span>
                    )}
                    {hasResellerPrice && (
                      <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 border border-stone-600 dark:border-amber-700 text-stone-700 dark:text-amber-200 text-[10px] font-mono px-1.5 py-0.5 bg-white/90 dark:bg-stone-900/90">
                        <Tag className="h-2.5 w-2.5" />
                        Reseller
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-3 space-y-1.5 border-t border-stone-200 dark:border-stone-800">
                  <Link href={`/reseller/${product.id}`}>
                    <h3 className="font-serif font-normal text-xs sm:text-sm line-clamp-2 leading-snug text-stone-800 dark:text-stone-200 hover:text-amber-800 dark:hover:text-amber-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>

                  {product.vendor_name && (
                    <div className="flex items-center gap-1">
                      <Store className="h-3 w-3 text-stone-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-mono text-stone-500 dark:text-stone-400 truncate">
                        {product.vendor_name}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm sm:text-base font-serif font-semibold text-stone-800 dark:text-amber-100">
                        ৳{parseFloat(effectivePrice).toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] sm:text-xs font-mono text-stone-400 line-through">
                          ৳{parseFloat(product.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {hasResellerPrice && (
                      <p className="text-[10px] sm:text-xs font-mono text-amber-800/80 dark:text-amber-400/90">
                        Reseller: ৳
                        {parseFloat(
                          product.reseller_mrp_price!,
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    className="w-full h-7 sm:h-8 text-xs font-mono rounded-none border border-stone-800 dark:border-amber-800 bg-stone-800 dark:bg-amber-900/40 text-[#f5f0e8] hover:bg-stone-700 dark:hover:bg-amber-800/60"
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
        <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/30 py-16 text-center">
          <div className="w-12 h-12 mx-auto border border-stone-300 dark:border-stone-700 flex items-center justify-center mb-4">
            <Store className="h-6 w-6 text-stone-400" />
          </div>
          <h3 className="font-serif text-lg font-normal text-stone-800 dark:text-stone-200 mb-1">No Products Found</h3>
          <p className="text-sm font-mono text-stone-500 dark:text-stone-400 max-w-xs mx-auto px-4">
            {search || category || brand
              ? "Try adjusting your search or filters."
              : "No products are available yet."}
          </p>
        </div>
      )}

      {data && data.total_pages > 1 && (
        <p className="text-center text-xs font-mono text-stone-500 dark:text-stone-400 mt-4">
          {data.results.length} of {data.count}
        </p>
      )}
    </div>
  );
}
