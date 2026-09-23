import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Star,
  CheckCircle2,
  ArrowLeft,
  Filter,
  ChevronDown,
  Send,
  MessageSquarePlus,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getAllReviews, createReview } from "@/features/reviews/reviewActions";
import { fetchProductBySlug } from "@/features/product/productActions";
import { fetchOrderById, fetchOrders } from "@/features/order/orderActions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Design tokens — one accent, used consistently instead of scattered hex codes
// ---------------------------------------------------------------------------
const ACCENT = "#0DA2E7";
const ACCENT_SOFT = "rgba(13, 162, 231, 0.12)";
const ACCENT_SOFTER = "rgba(13, 162, 231, 0.28)";

const RATING_LABELS: Record<number, string> = {
  1: "Muito insatisfeito",
  2: "Insatisfeito",
  3: "Razoável",
  4: "Satisfeito",
  5: "Excelente",
};

const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return "Data inválida";
  }
};

// A small reusable star row — keeps every rating display visually identical
const StarRow = ({
  value,
  size = "h-4 w-4",
  interactive = false,
  onChange,
  hovered,
  onHover,
}: {
  value: number;
  size?: string;
  interactive?: boolean;
  onChange?: (v: number) => void;
  hovered?: number;
  onHover?: (v: number | null) => void;
}) => {
  const active = hovered ?? value;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(active);
        return (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onClick={interactive ? () => onChange?.(star) : undefined}
            onMouseEnter={interactive ? () => onHover?.(star) : undefined}
            onMouseLeave={interactive ? () => onHover?.(null) : undefined}
            className={
              interactive
                ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-sm transition-transform hover:scale-110 active:scale-95"
                : "cursor-default"
            }
            style={interactive ? ({ "--tw-ring-color": ACCENT } as React.CSSProperties) : undefined}
            aria-label={interactive ? `Avaliar com ${star} ${star === 1 ? "estrela" : "estrelas"}` : undefined}
          >
            <Star
              className={`${size} transition-colors ${filled ? "" : "text-muted-foreground/25"}`}
              style={filled ? { fill: ACCENT, color: ACCENT } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
};

const AllReviews = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const productId = searchParams.get("productId");
  const productSlug = searchParams.get("slug");
  const orderId = searchParams.get("orderId");

  const { reviews, loading } = useAppSelector((state) => state.review);
  const { currentProduct } = useAppSelector((state) => state.product);
  const { currentOrder, orders } = useAppSelector((state) => state.order);
  const { isAuthenticated, user } = useAppSelector((state) => state.user);

  const [filter, setFilter] = useState<"all" | number>("all");
  const [sort, setSort] = useState<"recent" | "helpful">("recent");
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { toast } = useToast();

  const MAX_REVIEW_LENGTH = 500;

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      dispatch(fetchOrders(user._id));
    }
  }, [isAuthenticated, user?._id, dispatch]);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [orderId, dispatch]);

  const actualOrder = useMemo(() => {
    if (!currentOrder) return null;
    return (currentOrder as any)?.data || currentOrder;
  }, [currentOrder]);

  useEffect(() => {
    if (productSlug) {
      dispatch(fetchProductBySlug(productSlug));
    }
  }, [productSlug, dispatch]);

  const orderProducts = useMemo(() => {
    const order = actualOrder || currentOrder;
    if (!orderId || !order || !order.products || !Array.isArray(order.products) || order.products.length === 0) {
      return [];
    }

    const uniqueProducts = new Map<string, any>();
    order.products.forEach((orderProduct: any) => {
      let productId: string | null = null;

      if (typeof orderProduct.product === "string") {
        productId = orderProduct.product;
      } else if (orderProduct.product && typeof orderProduct.product === "object") {
        productId = (orderProduct.product as any)?._id || (orderProduct.product as any)?.id || null;
      }

      if (productId && !uniqueProducts.has(productId)) {
        uniqueProducts.set(productId, {
          _id: productId,
          name: orderProduct.name || (orderProduct.product as any)?.name || "Produto",
          imageCover: orderProduct.imageCover || orderProduct.image || (orderProduct.product as any)?.imageCover || "",
          slug: (orderProduct.product as any)?.slug || "",
        });
      }
    });

    return Array.from(uniqueProducts.values());
  }, [orderId, currentOrder, actualOrder]);

  const currentProductForReview = useMemo(() => {
    if (orderId && orderProducts.length > 0) {
      return orderProducts[selectedProductIndex] || orderProducts[0];
    }
    if (currentProduct) return currentProduct;
    if (productId) {
      return { _id: productId, id: productId, name: "Produto", imageCover: "", slug: "" } as any;
    }
    return null;
  }, [orderId, orderProducts, selectedProductIndex, currentProduct, productId]);

  const product = currentProductForReview;

  const canReviewProduct = useMemo(() => {
    if (!isAuthenticated || !user?._id || !product?._id) return false;

    return orders.some((order) => {
      const normalizedOrder = (order as any)?.data || order;
      if (normalizedOrder.status !== "entregue") return false;

      const orderUserId =
        typeof normalizedOrder.user === "string" ? normalizedOrder.user : normalizedOrder.user?._id;
      if (orderUserId !== user._id) return false;

      const orderProducts = normalizedOrder.products || [];
      return orderProducts.some((orderProduct: any) => {
        const orderProductId =
          typeof orderProduct.product === "string" ? orderProduct.product : (orderProduct.product as any)?._id || orderProduct.product;
        return orderProductId === product?._id;
      });
    });
  }, [isAuthenticated, user?._id, product?._id, orders]);

  const hasUserReviewed = useMemo(() => {
    if (!isAuthenticated || !user?._id) return false;

    return reviews.some((review) => {
      const reviewUserId = typeof review.user === "string" ? review.user : (review.user as any)?._id || review.user;
      const reviewProductId =
        typeof review.product === "string" ? review.product : (review.product as any)?._id || review.product;

      return reviewUserId === user._id && product?._id && reviewProductId === product._id;
    });
  }, [isAuthenticated, user?._id, reviews, product?._id]);

  useEffect(() => {
    if (isAuthenticated && product?._id) {
      const idToFetch = product._id;
      const isValidObjectId = idToFetch && idToFetch !== "1" && idToFetch.length > 10;
      if (isValidObjectId) dispatch(getAllReviews(idToFetch));
    } else if (isAuthenticated && productId && productId !== "1" && productId.length > 10) {
      dispatch(getAllReviews(productId));
    }
  }, [isAuthenticated, productId, product?._id, selectedProductIndex, dispatch]);

  const filteredReviews = useMemo(() => {
    let filtered = reviews.filter((review) => {
      if (product?._id) {
        let reviewProductId = "";
        if (typeof review.product === "string") {
          reviewProductId = review.product;
        } else if (review.product && typeof review.product === "object") {
          reviewProductId = (review.product as any)._id || "";
        }
        if (reviewProductId && reviewProductId !== product?._id) return false;
      }
      if (filter !== "all" && review.rating !== filter) return false;
      return true;
    });

    if (sort === "recent") {
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "helpful") {
      filtered = filtered.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return filtered;
  }, [reviews, filter, sort, productId, product?._id]);

  const averageRating =
    filteredReviews.length > 0
      ? (filteredReviews.reduce((acc, r) => acc + r.rating, 0) / filteredReviews.length).toFixed(1)
      : "0.0";

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Faça login para avaliar o produto.", variant: "destructive" });
      return;
    }
    if (!canReviewProduct) {
      toast({
        title: "Avaliação não permitida",
        description: "Você precisa ter comprado e recebido este produto para avaliá-lo.",
        variant: "destructive",
      });
      return;
    }
    if (hasUserReviewed) {
      toast({ title: "Avaliação já realizada", description: "Você já avaliou este produto.", variant: "destructive" });
      return;
    }
    if (reviewRating === 0) {
      toast({ title: "Avaliação necessária", description: "Selecione uma nota de 1 a 5 estrelas.", variant: "destructive" });
      return;
    }
    if (!reviewText.trim()) {
      toast({ title: "Comentário necessário", description: "Escreva um comentário sobre o produto.", variant: "destructive" });
      return;
    }
    if (!product?._id) {
      toast({ title: "Erro", description: "Produto não encontrado.", variant: "destructive" });
      return;
    }

    setIsSubmittingReview(true);
    try {
      await dispatch(
        createReview({ product: product._id, rating: reviewRating, review: reviewText.trim() })
      ).unwrap();

      toast({ title: "Avaliação enviada!", description: "Sua avaliação foi publicada com sucesso." });

      setReviewRating(0);
      setReviewText("");
      setShowReviewForm(false);

      if (product._id && product._id !== "1" && product._id.length > 10) {
        dispatch(getAllReviews(product._id));
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar avaliação",
        description: error || "Não foi possível enviar sua avaliação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-10 text-center flex flex-col items-center gap-3">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: ACCENT_SOFT }}
              >
                <MessageSquarePlus className="h-6 w-6" style={{ color: ACCENT }} />
              </div>
              <p className="text-muted-foreground">Produto não encontrado.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pb-24 sm:pb-8">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2 -ml-2 hover:bg-transparent hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {orderId && orderProducts.length > 1 && (
          <Card className="border-0 shadow-md mb-6 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Produtos do pedido:</span>
                {orderProducts.map((prod, idx) => {
                  const active = selectedProductIndex === idx;
                  return (
                    <button
                      key={prod._id}
                      onClick={() => setSelectedProductIndex(idx)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                        active ? "text-white shadow-sm" : "text-foreground border-border hover:border-muted-foreground/40"
                      }`}
                      style={active ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined}
                    >
                      {prod.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product hero */}
        <Card className="border-0 shadow-lg mb-6 overflow-hidden animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
              <img
                src={product.imageCover || product.image || "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg"}
                alt={product.name || "Produto"}
                className="w-20 h-20 object-cover rounded-xl shadow-md ring-1 ring-black/5"
              />
              <div className="flex-1 min-w-[180px]">
                <h1 className="text-xl font-semibold text-foreground mb-1.5 leading-tight">{product.name || "Produto"}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <StarRow value={Number(averageRating)} />
                  <span className="text-sm text-muted-foreground">
                    {averageRating} · {filteredReviews.length}{" "}
                    {filteredReviews.length === 1 ? "avaliação" : "avaliações"}
                  </span>
                </div>
              </div>

              {/* Desktop CTA — hidden on mobile, replaced by the floating action button */}
              <div className="hidden sm:block">
                {canReviewProduct && !hasUserReviewed ? (
                  <Button
                    onClick={() => setShowReviewForm(true)}
                    className="gap-2 text-white shadow-sm hover:shadow-md transition-shadow"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <PenLine className="h-4 w-4" />
                    Avaliar produto
                  </Button>
                ) : hasUserReviewed ? (
                  <Badge variant="secondary" className="gap-1.5 py-2 px-3 bg-emerald-500/10 text-emerald-600 border-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Já avaliado
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground max-w-[160px] text-right">
                    Compre e receba o produto para avaliar
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating summary */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-card to-muted/10 mb-6 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center gap-8 flex-col sm:flex-row">
              <div className="text-center shrink-0">
                <div className="text-5xl font-bold text-foreground">{averageRating}</div>
                <div className="mt-2 flex justify-center">
                  <StarRow value={Number(averageRating)} size="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredReviews.length} {filteredReviews.length === 1 ? "avaliação" : "avaliações"}
                </p>
              </div>
              <div className="flex-1 w-full space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = filteredReviews.filter((r) => r.rating === stars).length;
                  const percentage = filteredReviews.length > 0 ? (count / filteredReviews.length) * 100 : 0;
                  const active = filter === stars;
                  return (
                    <button
                      key={stars}
                      onClick={() => setFilter(active ? "all" : stars)}
                      className="flex items-center gap-3 w-full group transition-colors rounded-lg p-1.5 -m-1.5 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        backgroundColor: active ? ACCENT_SOFT : undefined,
                        ["--tw-ring-color" as any]: ACCENT,
                      }}
                    >
                      <div className="flex items-center gap-1 w-12 shrink-0">
                        <span className="text-sm font-medium text-foreground">{stars}</span>
                        <Star className="h-3.5 w-3.5" style={{ fill: ACCENT, color: ACCENT }} />
                      </div>
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%`, backgroundColor: ACCENT }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right shrink-0">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review modal */}
        <Dialog
          open={showReviewForm && canReviewProduct && !hasUserReviewed}
          onOpenChange={(open) => {
            setShowReviewForm(open);
            if (!open) {
              setReviewRating(0);
              setReviewText("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Avaliar produto</DialogTitle>
              <DialogDescription>Compartilhe sua experiência com este produto</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div>
                <Label className="mb-3 block text-base font-medium">Sua avaliação</Label>
                <div className="flex items-center gap-4 flex-wrap">
                  <StarRow
                    value={reviewRating}
                    size="h-10 w-10 sm:h-11 sm:w-11"
                    interactive
                    onChange={setReviewRating}
                    hovered={hoveredRating ?? undefined}
                    onHover={setHoveredRating}
                  />
                  <span
                    className="text-sm font-medium min-h-[20px] transition-opacity"
                    style={{ color: (hoveredRating ?? reviewRating) > 0 ? ACCENT : undefined }}
                  >
                    {RATING_LABELS[hoveredRating ?? reviewRating] || ""}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="review-text" className="text-base font-medium">
                    Seu comentário
                  </Label>
                  <span
                    className={`text-xs ${
                      reviewText.length > MAX_REVIEW_LENGTH ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {reviewText.length}/{MAX_REVIEW_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="review-text"
                  placeholder="Compartilhe sua experiência com este produto..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
                  className="min-h-[120px] resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Seja específico e detalhado em sua avaliação</p>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewRating(0);
                    setReviewText("");
                  }}
                  className="w-full sm:w-auto"
                  disabled={isSubmittingReview}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview || reviewRating === 0 || !reviewText.trim()}
                  className="gap-2 w-full sm:w-auto text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Send className="h-4 w-4" />
                  {isSubmittingReview ? "Enviando..." : "Enviar avaliação"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              {filter === "all"
                ? `Mostrando todas as ${filteredReviews.length} avaliações`
                : `Mostrando ${filteredReviews.length} avaliações com ${filter} estrelas`}
            </span>
            {filter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter("all")}
                className="h-6 px-2 text-xs"
                style={{ color: ACCENT }}
              >
                Limpar filtro
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {sort === "recent" ? "Mais recentes" : "Mais úteis"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort("recent")}>Mais recentes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("helpful")}>Mais úteis</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-3.5 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-2/3 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review, index) => {
              const reviewUser = typeof review.user === "object" ? review.user : null;
              const userName = reviewUser?.name || "Usuário";
              const userPhoto = reviewUser?.photo;

              return (
                <Card
                  key={review._id}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-muted shrink-0">
                        <AvatarImage src={userPhoto} alt={userName} />
                        <AvatarFallback>{userName[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">{userName}</span>
                            <Badge variant="secondary" className="gap-1 text-xs bg-emerald-500/10 text-emerald-600 border-0">
                              <CheckCircle2 className="h-3 w-3" />
                              Verificado
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(review.createdAt)}
                          </span>
                        </div>
                        <div className="mb-3">
                          <StarRow value={review.rating} />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.review}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredReviews.length === 0 && !loading && (
          <Card className="border-0 shadow-md animate-fade-in">
            <CardContent className="p-12 text-center flex flex-col items-center gap-3">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: ACCENT_SOFT }}
              >
                <Star className="h-6 w-6" style={{ color: ACCENT }} />
              </div>
              <p className="text-muted-foreground">
                {filter === "all" ? "Ainda não há avaliações para este produto." : "Nenhuma avaliação encontrada com este filtro."}
              </p>
              {filter !== "all" && (
                <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                  Ver todas as avaliações
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile floating action button */}
      {canReviewProduct && !hasUserReviewed && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="sm:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white font-medium shadow-lg active:scale-95 transition-transform"
          style={{ backgroundColor: ACCENT, boxShadow: `0 8px 24px ${ACCENT_SOFTER}` }}
        >
          <PenLine className="h-4 w-4" />
          Avaliar
        </button>
      )}
    </div>
  );
};

export default AllReviews;