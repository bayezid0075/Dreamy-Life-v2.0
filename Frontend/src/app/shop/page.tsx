'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, Filter, X, ShoppingCart, ShoppingBag, Grid, List } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

import { shopApi } from '@/lib/api';
import { useCartStore } from '@/store';
import type { ShopFilters, Product } from '@/types';

export default function ShopPage() {
  const [filters, setFilters] = useState<ShopFilters>({
    page: 1,
    page_size: 12,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const addToCart = useCartStore((state) => state.addItem);

  const { data: products, isLoading } = useQuery({
    queryKey: ['shop-products', filters],
    queryFn: () => shopApi.getProducts(filters),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: shopApi.getCategories,
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: shopApi.getBrands,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchQuery, page: 1 }));
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success(`${product.title} added to cart`);
  };

  const clearFilters = () => {
    setFilters({ page: 1, page_size: 12 });
    setSearchQuery('');
  };

  const hasActiveFilters =
    filters.category || filters.brand || filters.search || filters.min_price || filters.max_price;

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-amber-500/20"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative container py-12 md:py-16 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Amazing <span className="text-yellow-300">Products</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Browse through our curated collection of premium products. Find exactly what you need with our easy filters.
          </p>
        </div>
      </div>

      <div className="container pb-8">
        {/* Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{products?.count || 0}</span> products found
            </p>
          </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px] md:w-[300px]"
              />
            </div>
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* View Toggle */}
          <div className="hidden md:flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.category?.toString() || ''}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        category: value ? parseInt(value) : undefined,
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand</label>
                  <Select
                    value={filters.brand?.toString() || ''}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        brand: value ? parseInt(value) : undefined,
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All brands" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={filters.sort_by || 'created_at'}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        sort_by: value as ShopFilters['sort_by'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Newest</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.min_price || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          min_price: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                          page: 1,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.max_price || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          max_price: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                          page: 1,
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Products Grid/List */}
      {isLoading ? (
        <div
          className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products?.results && products.results.length > 0 ? (
        <>
          <div
            className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {products.results.map((product) => (
              <Card
                key={product.id}
                className={`overflow-hidden group bg-white dark:bg-slate-900 border-0 shadow-lg hover:shadow-2xl hover:shadow-fuchsia-500/20 transition-all duration-500 hover:-translate-y-2 ${
                  viewMode === 'list' ? 'flex flex-row' : ''
                }`}
              >
                <Link
                  href={`/shop/${product.id}`}
                  className={viewMode === 'list' ? 'w-48 shrink-0' : ''}
                >
                  <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0].image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-violet-300 dark:text-violet-700" />
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {product.discount_price && (
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 shadow-lg px-3 py-1 font-bold">
                        -{Math.round(
                          ((parseFloat(product.price) -
                            parseFloat(product.discount_price)) /
                            parseFloat(product.price)) *
                            100
                        )}%
                      </Badge>
                    )}
                  </div>
                </Link>

                <CardContent className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <Link href={`/shop/${product.id}`}>
                    <h3 className="font-semibold line-clamp-2 hover:text-fuchsia-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  {product.brand_name && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.brand_name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    {product.discount_price ? (
                      <>
                        <span className="font-bold text-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                          ৳{parseFloat(product.discount_price).toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ৳{parseFloat(product.price).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                        ৳{parseFloat(product.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className={`p-5 pt-0 ${viewMode === 'list' ? 'items-end' : ''}`}>
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-600 text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 transition-all h-11 rounded-xl font-semibold"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {products.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={products.page === 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                }
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, products.total_pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={products.page === pageNum ? 'default' : 'outline'}
                      size="icon"
                      className={products.page === pageNum ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0' : 'border-violet-200 dark:border-violet-800 hover:border-violet-400'}
                      onClick={() => setFilters((prev) => ({ ...prev, page: pageNum }))}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                disabled={products.page === products.total_pages}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-muted-foreground mb-4">No products found</div>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
