import { FilterSidebar, type Filters } from "@/components/FilterSidebar";
import Header from "../components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
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
import hero from "../assets/img/wenner-hero.jpg";
const Index = () => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Redux hooks
  const dispatch = useAppDispatch();
  const { products, loading, error, searchQuery } = useAppSelector(
    (state) => state.product
  );
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  const maxPrice =
    products.length > 0
      ? Math.max(...products.map((product) => product.price))
      : 200;

  const [filters, setFilters] = useState<Filters>({
    gender: [],
    categories: [],
    colors: [],
    priceRange: [0, maxPrice],
    rating: [],
  });

  const ITEMS_PER_PAGE = 6;

  const { toast } = useToast();

  // Fetch products on component mount
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Fetch favorites when user is authenticated (para marcar os corações)
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchFavorites());
    }
  }, [isAuthenticated, user, dispatch]);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Track previous categories to detect changes
  const prevCategoriesRef = useRef<string[]>([]);

  // Reset colors when category changes
  useEffect(() => {
    const prevCategories = prevCategoriesRef.current;
    const currentCategories = filters.categories;

    // Verifica se a categoria realmente mudou (comparando arrays)
    const categoriesChanged =
      prevCategories.length !== currentCategories.length ||
      prevCategories.some((cat) => !currentCategories.includes(cat)) ||
      currentCategories.some((cat) => !prevCategories.includes(cat));

    // Se a categoria mudou e há cores selecionadas, resetar cores
    if (categoriesChanged && filters.colors.length > 0) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        colors: [],
      }));
    }

    // Atualizar a referência para a próxima comparação
    prevCategoriesRef.current = [...currentCategories];
  }, [filters.categories]);

  // Ensure priceRange covers available products after they load
  useEffect(() => {
    if (products && products.length > 0) {
      const newMax = Math.max(...products.map((p) => p.price));
      setFilters((prev) => {
        // If the current upper bound is the initial fallback (200)
        // or smaller than the new max, expand it so products are visible.
        if (prev.priceRange[1] === 200 || prev.priceRange[1] < newMax) {
          return { ...prev, priceRange: [0, newMax] };
        }
        return prev;
      });
    }
  }, [products]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: error,
      });
      // Clear error after showing
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  // Apply filters and search to products from Redux state
  const appliedFiltersProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products.filter((product) => {
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesDescription = product.description
          ?.toLowerCase()
          .includes(query);

        if (!matchesName && !matchesCategory && !matchesDescription) {
          return false;
        }
      }

      // Filter by gender
      if (
        filters.gender.length > 0 &&
        !filters.gender.includes(product.gender)
      ) {
        return false;
      }

      // Filter by category
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(product.category)
      ) {
        return false;
      }

      // Filter by colors - CORRIGIDO
      if (filters.colors.length > 0) {
        const productColorValues =
          product.colors?.map((colorObj) => colorObj.color.toLowerCase()) || [];
        const hasMatchingColor = productColorValues.some((productColor) =>
          filters.colors.some(
            (filterColor) => productColor === filterColor.toLowerCase()
          )
        );
        if (!hasMatchingColor) return false;
      }

      // Filter by price range
      if (
        product.price < filters.priceRange[0] ||
        product.price > filters.priceRange[1]
      ) {
        return false;
      }

      // Filter by rating (support both `rating` and `ratingsAverage` fields)
      if (filters.rating.length > 0) {
        const productRating =
          (product as any).rating ?? (product as any).ratingsAverage ?? 0;
        const numericProductRating = Number(productRating) || 0;
        const meetsRating = filters.rating.some(
          (minRating) => numericProductRating >= Number(minRating)
        );
        if (!meetsRating) return false;
      }

      // NOTE: removed automatic exclusion of out-of-stock products
      // Previously the UI filtered out products with zero stock here.
      // Keep all products visible by default; provide an explicit
      // filter/toggle later if needed.

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
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleClearFilters = () => {
    setFilters({
      gender: [],
      categories: [],
      colors: [],
      priceRange: [0, 200],
      rating: [],
    });
    setCurrentPage(1);
  };

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
    {/* Hero */}

        {/* Breadcrumb Skeleton */}
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
            {/* Desktop Sidebar Skeleton */}
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

            {/* Main Content Skeleton */}
            <main className="flex-1 pb-12">
              {/* Header Skeleton */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex-1">
                  <Skeleton className="h-8 sm:h-10 w-32 mb-2" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-9 w-20 lg:hidden" />
              </div>

              {/* Product Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-lg border border-border overflow-hidden"
                  >
                    {/* Product Image Skeleton */}
                    <Skeleton className="aspect-square w-full" />

                    <div className="p-4 space-y-3">
                      {/* Product Name Skeleton */}
                      <Skeleton className="h-5 w-3/4" />

                      {/* Category Skeleton */}
                      <Skeleton className="h-4 w-1/2" />

                      {/* Price Skeleton */}
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>

                      {/* Rating Skeleton */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Skeleton key={j} className="h-3 w-3 rounded-sm" />
                          ))}
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>

                      {/* Button Skeleton */}
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Skeleton */}
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
<section className="relative w-full overflow-hidden">
  <img
    src={hero}
    alt="Wenner - Moda, estilo e qualidade"
    className="w-full h-auto block"
  />

  {/* Container de conteúdo sobreposto à imagem */}
  <div className="absolute inset-0 flex items-center">
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
      <div className="max-w-xl">
        {/* Label superior */}
        <span className="block text-xs sm:text-sm font-semibold tracking-[0.3em] text-foreground uppercase mb-4">
          Moda · Estilo · Qualidade
        </span>

        {/* Título principal */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
          O que precisas,
          <br />
          <span className="text-[#8B6F47]">num só lugar.</span>
        </h1>

        {/* Subtítulo */}
        <p className="mt-6 text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed">
          Descobre as melhores peças de roupa, calçado e acessórios
          com qualidade garantida e entrega rápida. O teu estilo,
          à distância de um clique.
        </p>

        {/* Botão CTA */}
        <button className="mt-8 inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-black transition-colors">
          Comprar Agora
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</section>
      {/* Breadcrumb */}
      <div className="container px-4 md:px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hover:text-foreground cursor-pointer transition-colors">
            Home
          </span>
          <span>/</span>
          <span className="hover:text-foreground cursor-pointer transition-colors">
            E-commerce
          </span>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Itens Disponíveis
                </h1>
                <p className="text-muted-foreground">
                  Exibindo {appliedFiltersProducts.length} de {products.length}{" "}
                  Itens disponíveis
                </p>
              </div>

              {/* Mobile Filter Button */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filtro
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-80 p-0 overflow-hidden flex flex-col max-h-screen"
                >
                  <div className="flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    <FilterSidebar
                      filters={filters}
                      onFilterChange={setFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {appliedFiltersProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    Nenhum produto encontrado com os filtros selecionados
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
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
                        onClick={() =>
                          handlePageChange(Math.max(1, currentPage - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          handlePageChange(
                            Math.min(totalPages, currentPage + 1)
                          )
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
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
