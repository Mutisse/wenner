import Header from "../components/Header";
import {
  Package,
  Tag,
  Box,
  Star,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import {
  getAllNotifications,
  updateNotification,
  markAllAsRead as markAllAsReadAction,
} from "@/features/notification/notificationActions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useNavigate } from "react-router-dom";

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

const Notifications = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { notifications, loading } = useAppSelector(
    (state) => state.notification
  );
  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const [currentPage, setCurrentPage] = useState(1);
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState<string[]>(
    []
  );
  const [showAll, setShowAll] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Buscar todas as notificações quando a página for aberta
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      // pass true to include read when showAll is true
      dispatch(getAllNotifications(showAll));
    }
  }, [isAuthenticated, user?._id, dispatch]);

  // Filtrar notificações do usuário logado
  const userNotifications = useMemo(() => {
    if (!user?._id) return [];
    // Normalizar para garantir que `isRead` exista (compatibilidade com `read`)
    const normalized = notifications.map((notification: any) => ({
      ...notification,
      isRead:
        notification.isRead !== undefined
          ? notification.isRead
          : notification.read !== undefined
          ? notification.read
          : false,
    }));

    return normalized.filter((notification: any) => {
      // O campo user pode ser string (ObjectId) ou objeto populado
      const notificationUserId =
        typeof notification.user === "string"
          ? notification.user
          : (notification.user as any)?._id || notification.user;
      return notificationUserId === user._id;
    });
  }, [notifications, user?._id]);

  // Determine which notifications to display based on `showAll`
  const displayedNotifications = useMemo(() => {
    const base = userNotifications.filter(
      (n) => !hiddenNotificationIds.includes(n._id)
    );
    if (showAll) {
      // show all (read + unread), sort by date desc
      return base.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    // show only unread
    return base
      .filter((n) => !(n.isRead || n.read))
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [userNotifications, hiddenNotificationIds, showAll]);

  const sortedNotifications = displayedNotifications;

  // Calcular paginação
  const totalPages = Math.ceil(sortedNotifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = sortedNotifications.slice(
    startIndex,
    endIndex
  );
  const unreadCount = userNotifications.filter(
    (n) => !(n.isRead || n.read)
  ).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markAllAsRead = async () => {
    // Otimista: esconder imediatamente todas as notificações não lidas
    const currentUnreadIds = userUnreadNotifications.map((n) => n._id);
    if (currentUnreadIds.length > 0) setHiddenNotificationIds(currentUnreadIds);

    try {
      await dispatch(markAllAsReadAction()).unwrap();
      // Recarregar notificações para garantir sincronização
      await dispatch(getAllNotifications());
      setCurrentPage(1);
      // Limpar ocultações locais depois da sincronização
      setHiddenNotificationIds([]);
      toast({
        title: "Notificações marcadas",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    } catch (error) {
      // Reverter ocultação em caso de erro
      setHiddenNotificationIds([]);
      console.error("Erro ao marcar todas como lidas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas como lidas.",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Return the promise so caller can handle success/error and show toasts
    return dispatch(
      updateNotification({
        id: notificationId,
        // Set both `isRead` and `read` for compatibility with different payloads
        data: { isRead: true, read: true, readAt: new Date().toISOString() },
      })
    ).unwrap();
  };

  // Função para lidar com clique em notificação
  const handleNotificationClick = async (notification: any) => {
    // Marcar como lida se não estiver lida (otimista: esconder imediatamente)
    if (!(notification.isRead || notification.read)) {
      // Ocultar imediatamente da lista
      setHiddenNotificationIds((prev) => [...prev, notification._id]);
      try {
        await markAsRead(notification._id);
        toast({
          title: "Notificação marcada",
          description: "Notificação marcada como lida.",
        });
      } catch (err) {
        // Reverter ocultação em caso de erro
        setHiddenNotificationIds((prev) =>
          prev.filter((id) => id !== notification._id)
        );
        toast({
          title: "Erro",
          description: "Não foi possível marcar a notificação como lida.",
          variant: "destructive",
        });
        console.error("Erro ao marcar notificação como lida:", err);
      }
    }

    // Se for notificação de cupom/promoção, navegar para aba de cupons no perfil
    if (
      notification.type === "Promoção" ||
      notification.title.toLowerCase().includes("cupom") ||
      notification.message.toLowerCase().includes("cupom")
    ) {
      navigate("/profile?tab=coupons");
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
        return;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-6 md:py-8">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">
                  Notificações
                </h1>
                <p className="text-[11px] sm:text-sm text-muted-foreground truncate">
                  {unreadCount > 0 ? `${unreadCount} não lidas` : "Todas lidas"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAll((s) => !s);
                  // refetch with the updated flag
                  dispatch(getAllNotifications(!showAll));
                }}
                className="text-[11px] sm:text-sm h-8 sm:h-9"
              >
                {showAll ? "Ver não lidas" : "Ver todas"}
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-1.5 sm:gap-2 w-full sm:w-auto text-[11px] sm:text-sm h-8 sm:h-9 shrink-0"
                >
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    Marcar todas como lidas
                  </span>
                  <span className="sm:hidden">Marcar todas</span>
                </Button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-12">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Carregando notificações...
                </p>
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div className="flex items-center justify-center py-6 sm:py-12">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Nenhuma notificação
                </p>
              </div>
            ) : (
              paginatedNotifications.map((notification, index) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconStyles = getNotificationIconStyles(notification.type);
                const isUnread = !(notification.isRead || notification.read);

                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-4 md:p-5 cursor-pointer transition-all duration-200 hover:bg-muted/50 active:bg-muted/70 touch-manipulation ${
                      isUnread ? "bg-primary/[0.02]" : ""
                    } ${
                      index !== paginatedNotifications.length - 1
                        ? "border-b border-border/50"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-full ${iconStyles.iconBg} flex items-center justify-center`}
                    >
                      <IconComponent
                        className={`h-4 w-4 sm:h-6 sm:w-6 ${iconStyles.iconColor}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-1">
                        <span
                          className={`text-xs sm:text-base font-semibold break-words line-clamp-2 ${
                            isUnread
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 self-start sm:self-center">
                          {isUnread && (
                            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full animate-pulse flex-shrink-0"></span>
                          )}
                          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`text-[11px] sm:text-sm leading-relaxed break-words line-clamp-3 ${
                          isUnread
                            ? "text-muted-foreground"
                            : "text-muted-foreground/70"
                        }`}
                      >
                        {notification.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-3 sm:mt-6 flex justify-center overflow-x-auto">
              <Pagination>
                <PaginationContent className="flex-wrap gap-0.5 sm:gap-1 min-w-0">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      className={`h-7 w-7 sm:h-10 sm:w-10 flex items-center justify-center mr-5 ${
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </PaginationPrevious>
                  </PaginationItem>

                  {/* Primeira página - ocultar em mobile se houver muitas páginas */}
                  {currentPage > 2 && (
                    <>
                      <PaginationItem className="hidden sm:block">
                        <PaginationLink
                          onClick={() => handlePageChange(1)}
                          className="cursor-pointer text-[10px] sm:text-sm h-7 w-7 sm:h-10 sm:w-10"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && (
                        <PaginationItem className="hidden sm:block">
                          <PaginationEllipsis className="h-7 w-7 sm:h-10 sm:w-10" />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {/* Páginas ao redor da atual - mostrar apenas página atual e adjacentes em mobile */}
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Em mobile, mostrar apenas: página atual, anterior e próxima (se existirem)
                    // Em desktop, mostrar: primeira, última, atual e adjacentes
                    const isMobileVisible =
                      page === currentPage ||
                      page === currentPage - 1 ||
                      page === currentPage + 1;
                    const isDesktopVisible =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (isMobileVisible || isDesktopVisible) {
                      return (
                        <PaginationItem
                          key={page}
                          className={isMobileVisible ? "" : "hidden sm:block"}
                        >
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer text-[10px] sm:text-sm h-7 w-7 sm:h-10 sm:w-10"
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
                        <PaginationItem key={page} className="hidden sm:block">
                          <PaginationEllipsis className="h-7 w-7 sm:h-10 sm:w-10" />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  {/* Última página - ocultar em mobile se houver muitas páginas */}
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <PaginationItem className="hidden sm:block">
                          <PaginationEllipsis className="h-7 w-7 sm:h-10 sm:w-10" />
                        </PaginationItem>
                      )}
                      <PaginationItem className="hidden sm:block">
                        <PaginationLink
                          onClick={() => handlePageChange(totalPages)}
                          className="cursor-pointer text-[10px] sm:text-sm h-7 w-7 sm:h-10 sm:w-10"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      className={`h-7 w-7 sm:h-10 sm:w-10 flex items-center justify-center  ml-5 ${
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Informação de paginação */}
          {sortedNotifications.length > 0 && (
            <div className="mt-2 sm:mt-4 text-center text-[10px] sm:text-sm text-muted-foreground px-2">
              Mostrando {startIndex + 1}-
              {Math.min(endIndex, sortedNotifications.length)} de{" "}
              {sortedNotifications.length} notificações
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
