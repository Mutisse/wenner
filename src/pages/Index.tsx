import { FilterSidebar, type Filters } from "@/components/FilterSidebar";
import Header from "../components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, PackageSearch } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchProducts } from "@/features/product/productActions";
import { useToast } from "@/hooks/use-toast";
import { clearError } from "@/features/product/productSlice";
import { fetchFavorites } from "@/features/favorite/favoriteActions";

// Single accent token, reused everywhere instead of scattered hex/utility clashes
const ACCENT = "#0DA2E7";
const ACCENT_SOFT = "rgba(13, 162, 231, 0.12)";

const Index = () => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const dispatch = useAppDispatch();
  const { products, loading, error, searchQuery } = useAppSelector((state) => state.product);
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  const maxPrice = products.length > 0 ? Math.max(...products.map((product) => product.price)) : 200;

  const [filters, setFilters] = useState<Filters>({
    gender: [],
    categories: [],
    colors: [],
    priceRange: [0, maxPrice],
    rating: [],
  });

  const ITEMS_PER_PAGE = 6;

  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchFavorites());
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const prevCategoriesRef = useRef<string[]>([]);

  useEffect(() => {
    const prevCategories = prevCategoriesRef.current;
    const currentCategories = filters.categories;

    const categoriesChanged =
      prevCategories.length !== currentCategories.length ||
      prevCategories.some((cat) => !currentCategories.includes(cat)) ||
      currentCategories.some((cat) => !prevCategories.includes(cat));

    if (categoriesChanged && filters.colors.length > 0) {
      setFilters((prevFilters) => ({ ...prevFilters, colors: [] }));
    }

    prevCategoriesRef.current = [...currentCategories];
  }, [filters.categories]);

  useEffect(() => {
    if (products && products.length > 0) {
      const newMax = Math.max(...products.map((p) => p.price));
      setFilters((prev) => {
        if (prev.priceRange[1] === 200 || prev.priceRange[1] < newMax) {
          return { ...prev, priceRange: [0, newMax] };
        }
        return prev;
      });
    }
  }, [products]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar produtos", description: error });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const appliedFiltersProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products.filter((product) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesDescription = product.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesDescription) return false;
      }

      if (filters.gender.length > 0 && !filters.gender.includes(product.gender)) return false;

      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) return false;

      if (filters.colors.length > 0) {
        const productColorValues = product.colors?.map((colorObj) => colorObj.color.toLowerCase()) || [];
        const hasMatchingColor = productColorValues.some((productColor) =>
          filters.colors.some((filterColor) => productColor === filterColor.toLowerCase())
        );
        if (!hasMatchingColor) return false;
      }

      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false;

      if (filters.rating.length > 0) {
        const productRating = (product as any).rating ?? (product as any).ratingsAverage ?? 0;
        const numericProductRating = Number(productRating) || 0;
        const meetsRating = filters.rating.some((minRating) => numericProductRating >= Number(minRating));
        if (!meetsRating) return false;
      }

      return true;
    });
  }, [products, filters, searchQuery]);

  const totalPages = Math.ceil(appliedFiltersProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return appliedFiltersProducts.slice(startIndex, endIndex);
  }, [appliedFiltersProducts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters({ gender: [], categories: [], colors: [], priceRange: [0, maxPrice], rating: [] });
    setCurrentPage(1);
  };

  // Human-readable chips for every active filter, each individually removable
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    filters.gender.forEach((g) =>
      chips.push({
        key: `gender-${g}`,
        label: g,
        onRemove: () => setFilters((prev) => ({ ...prev, gender: prev.gender.filter((x) => x !== g) })),
      })
    );
    filters.categories.forEach((c) =>
      chips.push({
        key: `category-${c}`,
        label: c,
        onRemove: () => setFilters((prev) => ({ ...prev, categories: prev.categories.filter((x) => x !== c) })),
      })
    );
    filters.colors.forEach((c) =>
      chips.push({
        key: `color-${c}`,
        label: c,
        onRemove: () => setFilters((prev) => ({ ...prev, colors: prev.colors.filter((x) => x !== c) })),
      })
    );
    filters.rating.forEach((r) =>
      chips.push({
        key: `rating-${r}`,
        label: `${r}+ estrelas`,
        onRemove: () => setFilters((prev) => ({ ...prev, rating: prev.rating.filter((x) => x !== r) })),
      })
    );
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) {
      chips.push({
        key: "price",
        label: `${filters.priceRange[0]} MT – ${filters.priceRange[1]} MT`,
        onRemove: () => setFilters((prev) => ({ ...prev, priceRange: [0, maxPrice] })),
      });
    }

    return chips;
  }, [filters, maxPrice]);

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="container px-3 sm:px-4 md:px-6">
          <div className="flex gap-4 sm:gap-6">
            <div className="hidden lg:block w-64">
              <div className="bg-sidebar border-r border-sidebar-border p-6 space-y-4">
                <Skeleton className="h-7 w-20 mb-6" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <div className="space-y-2 pl-2">
                      {[...Array(3)].map((_, j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <main className="flex-1 pb-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex-1">
                  <Skeleton className="h-8 sm:h-10 w-32 mb-2" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-9 w-20 lg:hidden" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Skeleton key={j} className="h-3 w-3 rounded-sm" />
                          ))}
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 sm:mt-12">
                <div className="flex items-center justify-center gap-2">
                  <Skeleton className="h-9 w-20 rounded-md" />
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-9 rounded-md" />
                  ))}
                  <Skeleton className="h-9 w-20 rounded-md" />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="container px-4 md:px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
          <span>/</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">E-commerce</span>
          <span>/</span>
          <span className="text-foreground font-medium">Itens disponíveis</span>
        </div>
      </div>

      <div className="container px-4 md:px-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Main Content */}
          <main className="flex-1 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Itens Disponíveis</h1>
                <p className="text-muted-foreground">
                  Exibindo {appliedFiltersProducts.length} de {products.length} itens disponíveis
                </p>
              </div>

              {/* Mobile Filter Button */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden relative gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtro
                    {activeFilterChips.length > 0 && (
                      <span
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-white text-xs font-semibold flex items-center justify-center"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {activeFilterChips.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 overflow-hidden flex flex-col max-h-screen">
                  <div className="flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    <FilterSidebar filters={filters} onFilterChange={setFilters} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active filter chips */}
            {activeFilterChips.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-6 animate-fade-in">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={chip.onRemove}
                    className="group flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-medium border transition-colors hover:border-transparent"
                    style={{ backgroundColor: ACCENT_SOFT, borderColor: "transparent", color: ACCENT }}
                  >
                    <span className="capitalize">{chip.label}</span>
                    <X className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                  </button>
                ))}
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-1"
                >
                  Limpar tudo
                </button>
              </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {appliedFiltersProducts.length > 0 ? (
                paginatedProducts.map((product, index) => (
                  <div
                    key={product._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 flex flex-col items-center gap-3">
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: ACCENT_SOFT }}
                  >
                    <PackageSearch className="h-6 w-6" style={{ color: ACCENT }} />
                  </div>
                  <p className="text-muted-foreground text-lg">Nenhum produto encontrado com os filtros selecionados</p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {appliedFiltersProducts.length > 0 && totalPages > 1 && (
              <div className="mt-12">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        const active = currentPage === page;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={active}
                              className="cursor-pointer"
                              style={active ? { backgroundColor: ACCENT, borderColor: ACCENT, color: "white" } : undefined}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;