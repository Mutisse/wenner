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

      // Filter by colors
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

      // Filter by rating
      if (filters.rating.length > 0) {
        const productRating =
          (product as any).rating ?? (product as any).ratingsAverage ?? 0;
        const numericProductRating = Number(productRating) || 0;
        const meetsRating = filters.rating.some(
          (minRating) => numericProductRating >= Number(minRating)
        );
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
              <Skeleton className="w-full h-64 sm:h-80 rounded-2xl mb-8" />
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
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  </div>
                ))}
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
        <div className="flex gap-6 items-start">
          {/* Desktop Sidebar (Filtros) */}
          <aside className="hidden lg:block shrink-0">
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1 min-w-0 pb-12 space-y-8">
            {/* HERO HERO BANNER - Posicionado ao lado do Filtro no Desktop */}
            <section className="relative w-full overflow-hidden rounded-2xl min-h-[320px] sm:min-h-[400px] flex items-center bg-muted">
              <img
                src={hero}
                alt="Wenner - Moda, estilo e qualidade"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Camada para contraste de texto */}

              {/* Conteúdo do Hero */}
              <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-lg">
                <span className="block text-xs sm:text-sm font-semibold tracking-[0.3em] text-gray-600 uppercase mb-3">
                  Moda · Estilo · Qualidade
                </span>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-gray-600">
                  O que precisas,
                  <br />
                  <span className="text-[#E0C097]">num só lugar.</span>
                </h1>

                <p className="mt-4 text-xs sm:text-sm text-gray-500 leading-relaxed">
                  Descobre as melhores peças de roupa, calçado e acessórios com
                  qualidade garantida e entrega rápida.
                </p>

                {/* <button className="mt-6 inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors shadow-md">
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
                </button> */}
              </div>
            </section>

            {/* Cabeçalho da Seção de Produtos */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  Itens Disponíveis
                </h2>
                <p className="text-sm text-muted-foreground">
                  Exibindo {appliedFiltersProducts.length} de {products.length}{" "}
                  itens disponíveis
                </p>
              </div>

              {/* Botão de Filtro Mobile */}
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

            {/* Grid de Produtos */}
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

            {/* Paginação */}
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