import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Package, User, Lock, MapPin, Ticket, Copy, Check, Loader2 } from "lucide-react";
import { mockProducts } from "@/data/products";
import { useState, useEffect, useMemo } from "react";
import { updateProfile, updatePassword } from "@/features/user/userActions";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { getAllCoupons, getMyCoupons } from "@/features/coupon/cupomActions";
import { ICoupon } from "@/features/coupon/cupomTypes";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchFavorites,
  removeFromFavorites,
} from "@/features/favorite/favoriteActions";
import { fetchOrders, fetchOrderById, confirmOrderReceived } from "@/features/order/orderActions";
import { Order } from "@/features/order/orderTypes";
import { productionUrl } from "@/lib/utils";
import ProductImage from "../components/ProductImage";
import { useSearchParams } from "react-router-dom";

const validTabs = ["info", "favorites", "orders", "coupons", "address", "password"];

const Profile = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetailsPage, setOrderDetailsPage] = useState(1);
  
  // Obter tab inicial da query string
  const tabFromQuery = searchParams.get("tab");
  const initialTab = tabFromQuery && validTabs.includes(tabFromQuery) ? tabFromQuery : "info";
  const [activeTab, setActiveTab] = useState(initialTab);

  const itemsPerPage = 4;
  const orderDetailsItemsPerPage = 3;

  // User data (from logged in user) with fallbacks to mock values
  const loggedUser = useAppSelector((state) => state.user.user);
  const extendedUser = loggedUser as unknown as
    | {
        phone?: string;
        address?: {
          street?: string;
          city?: string;
          state?: string;
          zipCode?: string;
        };
      }
    | undefined;

  const [name, setName] = useState(loggedUser?.name ?? "");
  const [email, setEmail] = useState(loggedUser?.email ?? "");
  const [phone, setPhone] = useState(extendedUser?.phone ?? "");
  const [city, setCity] = useState(extendedUser?.address?.city ?? "");
  const [state, setState] = useState(extendedUser?.address?.state ?? "");
  const [street, setStreet] = useState(extendedUser?.address?.street ?? "");
  const [zipCode, setZipCode] = useState(extendedUser?.address?.zipCode ?? "");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const dispatch = useAppDispatch();

  const { favorites, loading, error } = useAppSelector(
    (state) => state.favorites
  );

  const { orders: userOrders, currentOrder } = useAppSelector(
    (state) => state.order
  );

  const { user } = useAppSelector((state) => state.user);
  const { coupons, loading: couponsLoading } = useAppSelector(
    (state) => state.coupon
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Verificar se o usuário é admin
  const isAdmin = user?.role === "admin";

  // Sincronizar tab com query params quando a página carregar ou query mudar
  useEffect(() => {
    const tabFromQuery = searchParams.get("tab");
    if (tabFromQuery && validTabs.includes(tabFromQuery) && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (user?._id && !isAdmin) {
      // Admin não precisa carregar favoritos, pedidos e cupons
      dispatch(fetchFavorites());
      dispatch(fetchOrders(user._id));
      // Usuários não-admin usam getMyCoupons para ver apenas seus cupons
      dispatch(getMyCoupons());
    } else if (user?._id && isAdmin) {
      // Admin pode ver todos os cupons
      dispatch(getAllCoupons());
    }
  }, [dispatch, user?._id, isAdmin]);

  // Debug: Log dos cupons e usuário (apenas quando necessário)
  useEffect(() => {
    if (coupons.length > 0 && user?._id) {
      ("🔍 [Profile] Cupons carregados:", {
        totalCoupons: coupons.length,
        userId: user._id || user.userId,
        coupons: coupons.map(c => ({ code: c.code, assignedTo: c.assignedTo })),
      });
    }
  }, [coupons.length, user?._id]);

  const handleSaveProfile = async () => {
    try {
      await dispatch(
        updateProfile({
          name,
          email,
          phone,
          address: {
            street,
            city,
            state,
            zipCode,
          },
        })
      ).unwrap();
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram salvos com sucesso.",
        variant: "default",
      });
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.";
      toast({
        title: "Erro ao salvar",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await dispatch(
        updatePassword({
          passwordCurrent: currentPassword,
          password: newPassword,
          passwordConfirm: confirmPassword,
        })
      ).unwrap();
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
        variant: "default",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha.";
      toast({
        title: "Erro ao alterar",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const allFavoriteProducts = favorites;
  const totalFavoritesPages = Math.ceil(
    allFavoriteProducts.length / itemsPerPage
  );
  const favoriteProducts = allFavoriteProducts.slice(
    (favoritesPage - 1) * itemsPerPage,
    favoritesPage * itemsPerPage
  );

  useEffect(() => {
    const totalPages = Math.ceil(allFavoriteProducts.length / itemsPerPage);

    if (favoritesPage > totalPages) {
      setFavoritesPage(Math.max(totalPages, 1));
    }
  }, [allFavoriteProducts]);

  const handleRemoveFavorite = async (
    productId: string,
    productName: string
  ) => {
    try {
      await dispatch(removeFromFavorites({ productId })).unwrap();

      toast({
        title: "Removido dos favoritos",
        description: `${productName} foi removido da sua lista de favoritos.`,
      });

      // ajuste de página imediato
      const updatedCount = allFavoriteProducts.length - 1;
      const totalPages = Math.ceil(updatedCount / itemsPerPage);

      if (favoritesPage > totalPages) {
        setFavoritesPage(Math.max(totalPages, 1));
      }
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao remover favorito.",
        variant: "destructive",
      });
    }
  };

  // Map API orders to display format
  const allOrders = userOrders.map((order: Order) => ({
    id: order._id || order.id || "",
    date: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("pt-BR")
      : "",
    createdAt: order.createdAt, // Manter original para formatação no modal
    total: order.totalPrice || 0,
    status: order.status || "pendente",
    items: order.totalItems || order.products?.length || 0,
    products: order.products || [],
    raw: order, // Manter objeto original completo
  }));

  const totalOrdersPages = Math.ceil(allOrders.length / itemsPerPage);
  const orders = allOrders.slice(
    (ordersPage - 1) * itemsPerPage,
    ordersPage * itemsPerPage
  );

  const handleSelectOrder = async (orderId: string) => {
    setSelectedOrder(orderId);
    setOrderDetailsPage(1);
    // Fetch order details if needed
    await dispatch(fetchOrderById(orderId));
  };

  const handleConfirmReceived = async (orderId: string) => {
    try {
      await dispatch(confirmOrderReceived(orderId)).unwrap();
      toast({
        title: "Recebimento confirmado!",
        description: "Você confirmou o recebimento do pedido. Aguarde a confirmação final do administrador.",
        variant: "default",
      });
      // Recarregar pedidos para atualizar o status
      if (user?._id) {
        await dispatch(fetchOrders(user._id));
      }
      // Se o pedido estiver aberto no diálogo, atualizar
      if (selectedOrder === orderId) {
        await dispatch(fetchOrderById(orderId));
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível confirmar o recebimento.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      pendente: { label: "Pendente", variant: "secondary" },
      confirmado: { label: "Confirmado", variant: "default" },
      enviado: { label: "Enviado", variant: "default" },
      entregue: { label: "Entregue", variant: "outline" },
      cancelado: { label: "Cancelado", variant: "destructive" },
    };

    const config = statusMap[status] || statusMap.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Filtrar cupons atribuídos ao usuário
  // Se for admin, mostra todos os cupons; caso contrário, mostra apenas os atribuídos
  const userCoupons = useMemo(() => {
    if (isAdmin) {
      // Admin vê todos os cupons
      return coupons;
    }
    
    // Para usuários não-admin, a API já retorna apenas os cupons atribuídos
    // Mas vamos manter a filtragem como fallback de segurança
    if (!user?._id && !user?.userId) {
      return [];
    }
    
    if (coupons.length === 0) {
      return [];
    }
    
    // Obter todos os possíveis IDs do usuário
    const userIds = [
      user._id,
      user.userId,
      (user as any)?.id,
    ].filter(Boolean).map(id => String(id).trim());
    
    const filtered = coupons.filter((coupon: ICoupon) => {
      if (!coupon.assignedTo) {
        return false;
      }
      
      // Converter assignedTo para string
      const assignedTo = String(coupon.assignedTo).trim();
      
      // Verificar se corresponde a algum ID do usuário
      const matches = userIds.some(userId => assignedTo === userId);
      
      return matches;
    });
    
    return filtered;
  }, [coupons, user?._id, user?.userId, isAdmin]);

  // Função para copiar código do cupom
  const handleCopyCouponCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Código copiado!",
        description: `Código ${code} copiado para a área de transferência`,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código",
        variant: "destructive",
      });
    }
  };

  // Verificar se cupom está válido
  const isCouponValid = (coupon: ICoupon) => {
    if (!coupon.isActive) return false;
    if (coupon.usedAt) return false;
    const now = new Date();
    const expiresAt = new Date(coupon.expiresAt);
    return expiresAt > now;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
              Meu Perfil
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie suas informações e pedidos
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // Atualizar query params quando mudar de tab
            if (value !== "info") {
              setSearchParams({ tab: value });
            } else {
              setSearchParams({});
            }
          }} className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-3 md:grid-cols-6'} h-auto gap-1`}>
              <TabsTrigger value="info" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Dados</span>
              </TabsTrigger>
              {!isAdmin && (
                <>
                  <TabsTrigger value="favorites" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Favoritos</span>
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Pedidos</span>
                  </TabsTrigger>
                  <TabsTrigger value="coupons" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                    <Ticket className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Cupons</span>
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="address" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Endereço</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Senha</span>
              </TabsTrigger>
            </TabsList>

            {/* Dados Pessoais */}
            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize seus dados pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favoritos - Oculto para admin */}
            {!isAdmin && (
              <TabsContent value="favorites" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Favoritos</CardTitle>
                  <CardDescription>
                    {allFavoriteProducts.length} produtos salvos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {favoriteProducts.map((product: any) => (
                      <div
                        key={product._id}
                        className="flex gap-4 p-4 border border-border rounded-lg hover:border-accent transition-colors"
                      >
                        <ProductImage 
                          src={product.imageCover 
                            ? `${productionUrl}/img/products/${product.imageCover}` 
                            : product.image 
                              ? (product.image.startsWith('http') ? product.image : `${productionUrl}/img/products/${product.image}`)
                              : undefined
                          } 
                          alt={product.name} 
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {product.category}
                          </p>
                          {product.priceDiscount ? (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-lg font-bold text-accent">
                                {product.priceDiscount} MZN
                              </p>
                              <p className="text-sm line-through text-muted-foreground">
                                {product.price} MZN
                              </p>
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-accent mt-1">
                              {product.price} MZN
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveFavorite(product._id, product.name)
                          }
                          aria-label="Remover dos favoritos"
                        >
                          <Heart className="h-5 w-5 fill-current" style={{ color: '#0DA2E7' }} />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {totalFavoritesPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setFavoritesPage((prev) => Math.max(1, prev - 1))
                            }
                            className={
                              favoritesPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: totalFavoritesPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setFavoritesPage(page)}
                              isActive={favoritesPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setFavoritesPage((prev) =>
                                Math.min(totalFavoritesPages, prev + 1)
                              )
                            }
                            className={
                              favoritesPage === totalFavoritesPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </CardContent>
              </Card>
              </TabsContent>
            )}

            {/* Pedidos - Oculto para admin */}
            {!isAdmin && (
              <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Pedidos</CardTitle>
                  <CardDescription>
                    Acompanhe o status dos seus pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 border border-border rounded-lg hover:border-accent transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              Pedido #{order.id?.slice(-8)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <Separator className="my-3" />
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {order.items} {order.items === 1 ? "item" : "itens"}
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {order.total.toFixed(2)} MZN
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleSelectOrder(order.id)}
                          >
                            Ver Detalhes
                          </Button>
                          {order.status === "enviado" && (() => {
                            // Verificar se o cliente já confirmou
                            const orderRaw = (order as any).raw || order;
                            const clientConfirmed = orderRaw?.clientConfirmed || false;
                            
                            if (clientConfirmed) {
                              return (
                                <Badge variant="secondary" className="flex-1 justify-center">
                                  <Check className="h-3 w-3 mr-1" />
                                  Confirmado
                                </Badge>
                              );
                            }
                            
                            return (
                              <Button
                                variant="default"
                                className="flex-1"
                                onClick={() => handleConfirmReceived(order.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Confirmar Recebimento
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalOrdersPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setOrdersPage((prev) => Math.max(1, prev - 1))
                            }
                            className={
                              ordersPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: totalOrdersPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setOrdersPage(page)}
                              isActive={ordersPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setOrdersPage((prev) =>
                                Math.min(totalOrdersPages, prev + 1)
                              )
                            }
                            className={
                              ordersPage === totalOrdersPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </CardContent>
              </Card>
              </TabsContent>
            )}

            {/* Cupons - Oculto para admin */}
            {!isAdmin && (
              <TabsContent value="coupons" className="mt-4 sm:mt-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Meus Cupons</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {userCoupons.length} cupom{userCoupons.length !== 1 ? "s" : ""} disponível{userCoupons.length !== 1 ? "eis" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {couponsLoading ? (
                    <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
                      Carregando cupons...
                    </div>
                  ) : userCoupons.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-muted-foreground">
                      <Ticket className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">Você não possui cupons atribuídos</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                      {userCoupons.map((coupon: ICoupon) => {
                        const isValid = isCouponValid(coupon);
                        const isExpired = new Date(coupon.expiresAt) < new Date();
                        const isUsed = !!coupon.usedAt;

                        return (
                          <div
                            key={coupon._id}
                            className={`p-3 sm:p-4 border rounded-lg transition-colors ${
                              isValid
                                ? "border-accent bg-accent/5 hover:border-accent/80"
                                : "border-border opacity-60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Ticket className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isValid ? "text-accent" : "text-muted-foreground"}`} />
                                  <h3 className="font-bold text-base sm:text-lg text-foreground break-words">
                                    {coupon.code}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      isValid
                                        ? "default"
                                        : isUsed
                                        ? "secondary"
                                        : isExpired
                                        ? "destructive"
                                        : "outline"
                                    }
                                    className="text-[10px] sm:text-xs"
                                  >
                                    {isValid
                                      ? "Válido"
                                      : isUsed
                                      ? "Usado"
                                      : isExpired
                                      ? "Expirado"
                                      : "Inativo"}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCopyCouponCode(coupon.code)}
                                className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                                disabled={!isValid}
                              >
                                {copiedCode === coupon.code ? (
                                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </Button>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Desconto:</span>
                                <span className="font-semibold text-foreground">
                                  {coupon.discount}
                                  {coupon.type === "percentage" ? "%" : " MZN"}
                                </span>
                              </div>

                              {coupon.minPurchaseAmount && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Compra mínima:
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {coupon.minPurchaseAmount.toFixed(2)} MZN
                                  </span>
                                </div>
                              )}

                              {coupon.maxDiscountAmount &&
                                coupon.type === "percentage" && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                      Desconto máximo:
                                    </span>
                                    <span className="font-medium text-foreground">
                                      {coupon.maxDiscountAmount.toFixed(2)} MZN
                                    </span>
                                  </div>
                                )}

                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Válido até:</span>
                                <span className="font-medium text-foreground">
                                  {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>

                              {coupon.usageLimit && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Usos permitidos:
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {coupon.usageCount || 0} / {coupon.usageLimit}
                                  </span>
                                </div>
                              )}

                              {isUsed && coupon.usedAt && (
                                <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t">
                                  <span className="text-muted-foreground">Usado em:</span>
                                  <span className="font-medium text-foreground text-[10px] sm:text-xs">
                                    {new Date(coupon.usedAt).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>
                              )}
                            </div>

                            {isValid && (
                              <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs sm:text-sm"
                                  onClick={() => handleCopyCouponCode(coupon.code)}
                                >
                                  {copiedCode === coupon.code ? (
                                    <>
                                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                      Código copiado!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                      Copiar código
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              </TabsContent>
            )}

            {/* Endereço */}
            <TabsContent value="address" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Endereço de Entrega</CardTitle>
                  <CardDescription>
                    Atualize seu endereço de entrega
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Rua e Número</Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile}>Salvar Endereço</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alterar Senha */}
            <TabsContent value="password" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>Mantenha sua conta segura</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirmar Nova Senha
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      "Alterar Senha"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setOrderDetailsPage(1);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido #{selectedOrder?.slice(-8)}
            </DialogTitle>
            <DialogDescription>
              Confira os produtos do seu pedido
            </DialogDescription>
          </DialogHeader>

          {selectedOrder &&
            (() => {
              // Busca pelo ID correto (suporta id ou _id)
              const order = allOrders.find(
                (o) => o.id === selectedOrder || o._id === selectedOrder
              );
              if (!order || !order.products) return null;

              const totalProductPages = Math.ceil(
                order.products.length / orderDetailsItemsPerPage
              );
              const displayedProducts = order.products.slice(
                (orderDetailsPage - 1) * orderDetailsItemsPerPage,
                orderDetailsPage * orderDetailsItemsPerPage
              );

              return (
                <div className="space-y-6">
                  {/* Cabeçalho com data e status */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Data do Pedido
                      </p>
                      <p className="font-semibold">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("pt-BR")
                          : order.date || "Data não disponível"}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <Separator />

                  {/* Lista de produtos */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">
                      Produtos ({order.products.length})
                    </h3>
                    {displayedProducts.map((item, index) => {
                      // Extrai o produto do objeto item
                      const product = item.product || {};
                      return (
                        <div
                          key={item._id || index}
                          className="flex gap-4 p-4 border border-border rounded-lg"
                        >
                          {/* Imagem do produto */}
                          <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                            <img
                              src={
                                product.imageCover
                                  ? `${productionUrl}/img/products/${product.imageCover}`
                                  : product.images?.[0]
                                    ? (product.images[0].startsWith('http') 
                                        ? product.images[0] 
                                        : `${productionUrl}/img/products/${product.images[0]}`)
                                    : "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg"
                              }
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
                              }}
                            />
                          </div>

                          {/* Informações do produto */}
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">
                              {product.name || "Produto não encontrado"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {product.category?.name ||
                                product.category ||
                                "Sem categoria"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Quantidade:{" "}
                              <span className="font-semibold">
                                {item.quantity}
                              </span>
                            </p>
                          </div>

                          {/* Preço */}
                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {(item.price * item.quantity).toFixed(2)} MZN
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.price.toFixed(2)} MZN cada
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Paginação */}
                    {totalProductPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                setOrderDetailsPage((prev) =>
                                  Math.max(1, prev - 1)
                                )
                              }
                              className={
                                orderDetailsPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {Array.from(
                            { length: totalProductPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setOrderDetailsPage(page)}
                                isActive={orderDetailsPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setOrderDetailsPage((prev) =>
                                  Math.min(totalProductPages, prev + 1)
                                )
                              }
                              className={
                                orderDetailsPage === totalProductPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>

                  <Separator />

                  {/* Resumo financeiro */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground">
                        Subtotal (
                        {order.totalItems ||
                          order.products.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}{" "}
                        itens):
                      </span>
                      <span className="text-foreground">{order.total.toFixed(2)} MZN</span>
                    </div>

                    {(() => {
                      const discount = (order as any).raw?.discount || (order as any).priceDiscount || 0;
                      const discountAmount = typeof discount === 'number' ? discount : 0;
                      return discountAmount > 0 ? (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto:</span>
                          <span>-{discountAmount.toFixed(2)} MZN</span>
                        </div>
                      ) : null;
                    })()}

                    <Separator />

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold">Preço Total</span>
                      <span className="text-2xl font-bold text-accent">
                        {order.total.toFixed(2)} MZN
                      </span>
                    </div>
                  </div>

                  {/* Observações */}
                  {order.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold mb-1">Observações:</p>
                      <p className="text-sm text-foreground">{order.notes}</p>
                    </div>
                  )}

                  {/* Botão de confirmação de recebimento */}
                  {order.status === "enviado" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {(() => {
                        // Verificar se o cliente já confirmou
                        const orderRaw = (order as any).raw || order;
                        const clientConfirmed = orderRaw?.clientConfirmed || false;
                        
                        if (clientConfirmed) {
                          return (
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Check className="h-5 w-5 text-green-600" />
                                <p className="text-sm font-semibold text-foreground">
                                  Recebimento Confirmado
                                </p>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Você confirmou o recebimento deste pedido. Aguarde a confirmação final do administrador.
                              </p>
                              {orderRaw?.clientConfirmedAt && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Confirmado em: {new Date(orderRaw.clientConfirmedAt).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          );
                        }
                        
                        return (
                          <>
                            <div className="bg-primary/10 p-4 rounded-lg mb-4">
                              <p className="text-sm text-foreground mb-2">
                                Seu pedido foi enviado e está a caminho. Por favor, confirme o recebimento quando o pedido chegar.
                              </p>
                            </div>
                            <Button
                              variant="default"
                              className="w-full"
                              onClick={() => handleConfirmReceived(order.id)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Confirmar Recebimento do Pedido
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
