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
    <div className="px-4 pt-3 pb-6 md:px-0 md:pt-0 md:pb-0">
      {/* Back + Cart */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Link href="/reseller/cart">
          <Button variant="outline" size="sm" className="gap-1.5 relative">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-4 md:mb-5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Reseller Shop
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse products and resell with your custom pricing
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "border-violet-500 text-violet-600" : ""}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands?.map((b) => (
                <SelectItem key={b.id} value={b.id.toString()}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="text-sm col-span-2 sm:col-span-1">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results count */}
      {data && !isLoading && (
        <p className="text-xs text-muted-foreground mb-3">
          {data.count} product{data.count !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm"
            >
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-full" />
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
                className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href={`/reseller/${product.id}`}>
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
                      <Badge className="absolute top-1.5 left-1.5 bg-rose-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                        -{product.discount_percentage}%
                      </Badge>
                    )}
                    {hasResellerPrice && (
                      <Badge className="absolute top-1.5 right-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 text-[10px] px-1.5 py-0.5">
                        <Tag className="h-2.5 w-2.5 mr-0.5" />
                        Reseller
                      </Badge>
                    )}
                  </div>
                </Link>

                <div className="p-3 space-y-1.5">
                  <Link href={`/reseller/${product.id}`}>
                    <h3 className="font-medium text-xs sm:text-sm line-clamp-2 leading-snug hover:text-violet-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>

                  {product.vendor_name && (
                    <div className="flex items-center gap-1">
                      <Store className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {product.vendor_name}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-violet-600 dark:text-violet-400">
                        ৳{parseFloat(effectivePrice).toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                          ৳{parseFloat(product.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {hasResellerPrice && (
                      <p className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
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
                    className="w-full h-7 sm:h-8 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0"
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
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/20 flex items-center justify-center mb-4">
            <Store className="h-7 w-7 text-violet-500" />
          </div>
          <h3 className="text-base font-semibold mb-1">No Products Found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto px-4">
            {search || category || brand
              ? "Try adjusting your search or filters."
              : "No products are available yet."}
          </p>
        </div>
      )}

      {data && data.total_pages > 1 && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Showing {data.results.length} of {data.count} products
        </p>
      )}
    </div>
  );
}
