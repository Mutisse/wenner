import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useRef } from "react";
import { logout } from "@/features/user/userSlice";
import { useAppDispatch } from "@/app/hooks";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: "admin" | "client" | "manager" | ("admin" | "client" | "manager")[];
  redirectTo?: string;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = "/",
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const { toast } = useToast();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const hasShownToast = useRef(false);

  // Verificar se foi logout intencional ou estamos na página de auth - NUNCA mostrar toast nesses casos
  const isIntentionalLogout = sessionStorage.getItem("intentionalLogout") === "true";
  const isOnAuthPage = location.pathname === "/auth";

  // Normalizar requiredRole para array
  const allowedRoles = useMemo(() => {
    if (!requiredRole) return null;
    return Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  }, [requiredRole]);

  // Verificar se o usuário tem permissão
  const hasPermission = useMemo(() => {
    // Se não requer autenticação e não há role requerida, permitir acesso
    if (!requireAuth && !allowedRoles) return true;
    
    // Se não requer autenticação mas há role requerida
    if (!requireAuth && allowedRoles) {
      // Se não está autenticado, permitir (usuários não autenticados podem acessar)
      if (!isAuthenticated || !user) return true;
      
      // Se está autenticado, verificar se tem a role permitida
      // Se não tem a role permitida, negar acesso (será redirecionado)
      return allowedRoles.includes(user.role as any);
    }
    
    // Se requer autenticação
    if (!isAuthenticated || !user) return false;
    
    // Verificar se o usuário está ativo
    if (user.active === false) {
      return false;
    }

    // Se não há role requerida, apenas verificar autenticação
    if (!allowedRoles) return true;

    // Verificar se o usuário tem uma das roles permitidas
    return allowedRoles.includes(user.role as any);
  }, [isAuthenticated, user, allowedRoles, requireAuth]);

  // Resetar toast quando a rota mudar
  useEffect(() => {
    hasShownToast.current = false;
  }, [location.pathname]);

  useEffect(() => {
    // Limpar a flag após um delay se foi logout intencional
    let timeoutId: NodeJS.Timeout | null = null;
    if (isIntentionalLogout) {
      timeoutId = setTimeout(() => {
        sessionStorage.removeItem("intentionalLogout");
      }, 1000);
    }

    // Se foi logout intencional ou estamos na página de auth, NUNCA mostrar toast
    if (isIntentionalLogout || isOnAuthPage) {
      // Retornar cleanup function sempre, mesmo quando não há timeout
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }

    // Evitar múltiplos toasts
    if (hasShownToast.current) {
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }

    if (requireAuth && !isAuthenticated) {
      hasShownToast.current = true;
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
    } else if (requireAuth && isAuthenticated && user?.active === false) {
      hasShownToast.current = true;
      toast({
        title: "Conta desativada",
        description: "Sua conta foi desativada. Entre em contato com o suporte.",
        variant: "destructive",
      });
      // Fazer logout se a conta estiver desativada
      dispatch(logout());
    } else if (requireAuth && allowedRoles && user && !hasPermission) {
      hasShownToast.current = true;
      const rolesText = allowedRoles.length === 1 
        ? `role "${allowedRoles[0]}"` 
        : `roles "${allowedRoles.join('" ou "')}"`;
      toast({
        title: "Acesso negado",
        description: `Você não tem permissão para acessar esta página. Apenas usuários com ${rolesText} podem acessar.`,
        variant: "destructive",
      });
    }

    // Sempre retornar uma função de cleanup (mesmo que vazia) para manter consistência
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, user, hasPermission, allowedRoles, requireAuth, toast, dispatch, location.pathname, isIntentionalLogout, isOnAuthPage]);

  // Se requer autenticação e não estiver autenticado, redirecionar para login
  // Não redirecionar se foi logout intencional (já estamos na rota correta)
  if (requireAuth && !isAuthenticated && !isIntentionalLogout) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Se o usuário está desativado, fazer logout e redirecionar
  if (isAuthenticated && user?.active === false) {
    dispatch(logout());
    return <Navigate to="/auth" replace />;
  }

  // Se tiver role(s) requerida(s) e o usuário não tiver permissão, redirecionar
  // Isso funciona tanto para requireAuth=true quanto requireAuth=false
  if (allowedRoles && isAuthenticated && user && !hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

