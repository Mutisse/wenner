import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Shield,
  LogOut,
  Bell,
  Package,
  Tag,
  Box,
  Star,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useState, useEffect } from "react";
import { CartSheet } from "./CartSheet";
import { useCart } from "@/contexts/CartContext";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import { useAppSelector } from "../app/hooks";
import { useAppDispatch } from "../app/hooks";
import { logoutUser } from "@/features/user/userActions";
import { setSearchQuery } from "@/features/product/productSlice";
import { getAllNotifications, updateNotification } from "@/features/notification/notificationActions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// Função para obter ícone baseado no tipo de notificação
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "Pedido":
      return Package;
    case "Entregue":
      return Package;
    case "Avaliação":
      return Star;
    case "Promoção":
      return Tag;
    case "Reserva":
      return Box;
    case "Sistema":
      return Bell;
    default:
      return Bell;
  }
};

// Função para obter estilos do ícone baseado no tipo
const getNotificationIconStyles = (type: string) => {
  switch (type) {
    case "Pedido":
      return {
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
      };
    case "Entregue":
      return {
        iconBg: "bg-green-500/10",
        iconColor: "text-green-500",
      };
    case "Avaliação":
      return {
        iconBg: "bg-yellow-500/10",
        iconColor: "text-yellow-500",
      };
    case "Promoção":
      return {
        iconBg: "bg-green-500/10",
        iconColor: "text-green-500",
      };
    case "Reserva":
      return {
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-500",
      };
    case "Sistema":
      return {
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-500",
      };
    default:
      return {
        iconBg: "bg-gray-500/10",
        iconColor: "text-gray-500",
      };
  }
};

// Função para formatar data relativa
const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return "Data inválida";
  }
};

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const { searchQuery } = useAppSelector((state) => state.product);
  const { notifications, loading: notificationsLoading } = useAppSelector(
    (state) => state.notification
  );
  const dispatch = useAppDispatch();
  const isHome = location.pathname === "/";
  
  // Buscar notificações quando o usuário estiver logado
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      dispatch(getAllNotifications());
    }
  }, [isAuthenticated, user?._id, dispatch]);

  // Filtrar notificações do usuário logado
  const userNotifications = notifications.filter((notification) => {
    if (!user?._id) return false;
    // O campo user pode ser string (ObjectId) ou objeto populado
    const notificationUserId = typeof notification.user === "string" 
      ? notification.user 
      : (notification.user as any)?._id || notification.user;
    return notificationUserId === user._id;
  });

  // Ordenar notificações: mais recentes primeiro e não lidas primeiro
  const sortedNotifications = [...userNotifications].sort((a, b) => {
    // Primeiro ordena por não lidas
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    // Depois ordena por data (mais recentes primeiro)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Limitar a 5 primeiras notificações para o dropdown
  const displayedNotifications = sortedNotifications.slice(0, 5);

  // Contar notificações não lidas do usuário
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  // Função para marcar notificação como lida
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(
        updateNotification({
          id: notificationId,
          data: { isRead: true, readAt: new Date().toISOString() },
        })
      ).unwrap();
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  // Função para lidar com clique em notificação
  const handleNotificationClick = async (notification: any) => {
    // Marcar como lida se não estiver lida
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // Se for notificação de cupom/promoção, navegar para aba de cupons no perfil
    if (notification.type === "Promoção" || 
        notification.title.toLowerCase().includes("cupom") ||
        notification.message.toLowerCase().includes("cupom")) {
      navigate("/profile?tab=coupons");
      setNotificationsOpen(false);
      return;
    }

    // Se for notificação de pedido entregue ou avaliação, navegar para página de avaliações
    if (notification.order) {
      // Verificar se é notificação de entrega ou avaliação
      const isDeliveryNotification = 
        notification.type === "Entregue" ||
        notification.type === "Avaliação" ||
        (notification.type === "Pedido" && 
         (notification.title.toLowerCase().includes("entregue") ||
          notification.title.toLowerCase().includes("avalie") ||
          notification.message.toLowerCase().includes("avaliar")));

      if (isDeliveryNotification) {
        // Navegar para a página de avaliações com o orderId
        navigate(`/avaliacoes?orderId=${notification.order}`);
        setNotificationsOpen(false);
        return;
      }
    }
  };

  // Sincronizar searchValue com Redux quando searchQuery mudar externamente
  useEffect(() => {
    if (searchQuery !== searchValue) {
      setSearchValue(searchQuery);
    }
  }, [searchQuery]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    dispatch(setSearchQuery(value));

    // Se não estiver na página home, navegar para lá
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchValue);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchValue);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full">
              <div className="flex-1 px-4 py-4 space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Button
                      variant="default"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/auth");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Login / Cadastrar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/profile");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </Button>
                    {user?.role === "admin" && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          navigate("/admin");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Painel Admin
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate("/notificacoes");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notificações
                      {unreadCount > 0 && (
                        <Badge className="ml-auto bg-primary text-primary-foreground">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        sessionStorage.setItem("intentionalLogout", "true");
                        dispatch(logoutUser());
                        navigate("/");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Search Bar (only visible on home desktop) */}
        {isHome && (
          <div className="flex-1 max-w-xl mx-auto hidden md:flex">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por itens disponíveis"
                className="pl-10 bg-background"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </form>
          </div>
        )}

        {/* Actions - Desktop */}
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Button */}
          {!isHome && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => navigate("/")}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Botões Login / Cadastrar - Desktop */}
          {!isAuthenticated && (
            <>
              <NavLink to="/auth" className="hidden md:block">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "outline"} size="sm">
                    Login
                  </Button>
                )}
              </NavLink>
              <NavLink to="/auth" className="hidden md:block">
                {({ isActive }) => (
                  <Button variant="default" size="sm">
                    Cadastrar
                  </Button>
                )}
              </NavLink>
            </>
          )}

          {/* Botões Autenticados - Desktop */}
          {isAuthenticated && (
            <>
              {/* Perfil - Desktop */}
              <NavLink to="/profile" className="hidden md:block">
                {({ isActive }) => (
                  <Button variant={isActive ? "default" : "ghost"} size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                )}
              </NavLink>

              {/* Admin - Desktop */}
              {user?.role === "admin" && (
                <NavLink to="/admin" className="hidden md:block">
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="icon"
                      title="Painel Admin"
                    >
                      <Shield className="h-5 w-5" />
                    </Button>
                  )}
                </NavLink>
              )}

              {/* Carrinho - Oculto para admin */}
              {user?.role !== "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-[10px] font-semibold">
                      {totalItems > 99 ? "99+" : totalItems}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Notifications Dropdown */}
              <DropdownMenu
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
              >
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-muted rounded-full transition-colors relative">
                    <Bell className="h-5 w-5 text-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card"></span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[calc(100vw-2rem)] sm:w-96 p-0 bg-card border-border shadow-xl rounded-xl overflow-hidden"
                >
                  <DropdownMenuLabel className="flex items-center justify-between px-4 sm:px-5 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm sm:text-base">
                        Notificações
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="text-xs font-medium bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-sm">
                        {unreadCount} novas
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <div className="max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Carregando notificações...
                        </p>
                      </div>
                    ) : displayedNotifications.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Nenhuma notificação
                        </p>
                      </div>
                    ) : (
                      displayedNotifications.map((notification, index) => {
                        const IconComponent = getNotificationIcon(
                          notification.type
                        );
                        const iconStyles = getNotificationIconStyles(
                          notification.type
                        );
                        const isUnread = !notification.isRead;

                        return (
                          <DropdownMenuItem
                            key={notification._id}
                            className={`flex items-start gap-3 p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:bg-muted/50 focus:bg-muted/50 rounded-none ${
                              isUnread ? "bg-primary/[0.02]" : ""
                            } ${
                              index !== displayedNotifications.length - 1
                                ? "border-b border-border/50"
                                : ""
                            }`}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <div
                              className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full ${iconStyles.iconBg} flex items-center justify-center`}
                            >
                              <IconComponent
                                className={`h-4 w-4 sm:h-5 sm:w-5 ${iconStyles.iconColor}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span
                                  className={`font-medium text-xs sm:text-sm truncate ${
                                    isUnread
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {notification.title}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {isUnread && (
                                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                  )}
                                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                    {formatRelativeTime(notification.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <p
                                className={`text-[11px] sm:text-xs leading-relaxed line-clamp-2 ${
                                  isUnread
                                    ? "text-muted-foreground"
                                    : "text-muted-foreground/70"
                                }`}
                              >
                                {notification.message}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </div>
                  <div className="border-t border-border bg-muted/30">
                    <DropdownMenuItem
                      className="justify-center py-3 cursor-pointer hover:bg-muted/50 focus:bg-muted/50 rounded-none"
                      onSelect={(e) => {
                        e.preventDefault();
                        setNotificationsOpen(false);
                        navigate("/notificacoes");
                      }}
                    >
                      <span className="text-xs sm:text-sm font-medium text-primary hover:underline">
                        Ver todas as notificações
                      </span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout - Desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => {
                  sessionStorage.setItem("intentionalLogout", "true");
                  dispatch(logoutUser());
                  navigate("/");
                }}
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Search (only visible on home) */}
      {isHome && (
        <div className="md:hidden px-3 sm:px-4 pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              className="pl-10 bg-background text-sm"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </form>
        </div>
      )}

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
};

export default Header;
