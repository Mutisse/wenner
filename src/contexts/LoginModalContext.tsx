import React, { createContext, useContext, useState, useCallback } from "react";
import { useAppDispatch } from "../app/hooks";
import { loginUser } from "../features/user/userActions";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InputField from "@/components/ui/input-field";
import { Mail, Lock, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

interface LoginModalContextType {
  openLoginModal: (onSuccess?: () => void) => void;
  closeLoginModal: () => void;
  isOpen: boolean;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(
  undefined
);

export const LoginModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const openLoginModal = useCallback((onSuccess?: () => void) => {
    if (onSuccess) {
      setPendingAction(() => onSuccess);
    }
    setIsOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      loginSchema.parse({ email, password });
      setIsLoading(true);

      await dispatch(loginUser({ email, password })).unwrap();

      toast({
        title: "Login realizado com sucesso",
        variant: "default",
      });

      setIsLoading(false);
      closeLoginModal();

      // Executar ação pendente após login bem-sucedido
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } catch (error: unknown) {
      setIsLoading(false);
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        const errorObj = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        let description = "Ocorreu um erro";

        if (typeof error === "string") {
          description = error;
        } else if (errorObj?.response?.data?.message) {
          description = errorObj.response.data.message;
        } else if (errorObj?.message) {
          description = errorObj.message;
        }

        toast({
          title: "Erro no login",
          description,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <LoginModalContext.Provider
      value={{ openLoginModal, closeLoginModal, isOpen }}
    >
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          closeLoginModal();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <Logo />
            </div>
            <DialogDescription className="text-center text-base">
              Faça login para continuar
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="login">Login</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <InputField
                  label="Email"
                  id="modal-login-email"
                  name="email"
                  type="email"
                  placeholder="Informe o seu email"
                  required
                  disabled={isLoading}
                  icon={Mail}
                  iconPosition="right"
                />

                <InputField
                  label="Senha"
                  id="modal-login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  icon={Lock}
                  iconPosition="right"
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </LoginModalContext.Provider>
  );
};

export const useLoginModal = () => {
  const context = useContext(LoginModalContext);
  if (context === undefined) {
    throw new Error("useLoginModal must be used within a LoginModalProvider");
  }
  return context;
};

