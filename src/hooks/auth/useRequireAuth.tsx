import { useAppSelector } from "../../app/hooks";
import { useLoginModal } from "../../contexts/LoginModalContext";

export const useRequireAuth = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const { openLoginModal } = useLoginModal();

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      // Abrir modal de login e executar ação após login bem-sucedido
      openLoginModal(action);
      return;
    }
    action();
  };

  return { user, isAuthenticated, requireAuth };
};
