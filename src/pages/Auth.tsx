import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks"; // hooks tipados
import {
  loginUser,
  signupUser,
  forgotPassword,
  resetPassword,
  checkEmailExists,
} from "../features/user/userActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, User, Phone } from "lucide-react";
import InputField from "@/components/ui/input-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import Logo from "@/components/Logo";

// Validação de telefone de Moçambique
const mozambiquePhoneRegex = /^(\+258)?[89]\d{8}$/;

const validateMozambiquePhone = (phone: string): boolean => {
  // Remove espaços e caracteres especiais
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  
  // Verifica se começa com +258 seguido de 9 dígitos começando com 8 ou 9
  if (cleaned.startsWith("+258")) {
    return /^\+258[89]\d{8}$/.test(cleaned);
  }
  
  // Verifica se tem 9 dígitos começando com 8 ou 9
  if (cleaned.length === 9) {
    return /^[89]\d{8}$/.test(cleaned);
  }
  
  // Verifica se tem 8 dígitos começando com 8 ou 9 (formato antigo)
  if (cleaned.length === 8) {
    return /^[89]\d{7}$/.test(cleaned);
  }
  
  return false;
};

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Email inválido. Exemplo: exemplo@email.com" }),
  password: z
    .string()
    .min(1, { message: "Senha é obrigatória" })
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Nome é obrigatório" })
      .min(2, { message: "Nome deve ter no mínimo 2 caracteres" })
      .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
      .regex(/^[a-zA-ZÀ-ÿ\s'\-\.]+$/, {
        message: "Nome contém caracteres inválidos",
      }),
    email: z
      .string()
      .trim()
      .min(1, { message: "Email é obrigatório" })
      .email({ message: "Email inválido. Exemplo: exemplo@email.com" }),
    phone: z
      .string()
      .trim()
      .min(1, { message: "Contacto é obrigatório" })
      .refine(
        (phone) => validateMozambiquePhone(phone),
        {
          message:
            "Contacto inválido. Use o formato: +258841234567 ou 841234567",
        }
      ),
    password: z
      .string()
      .min(1, { message: "Senha é obrigatória" })
      .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
      .regex(/[A-Z]/, {
        message: "Senha deve conter pelo menos uma letra maiúscula",
      })
      .regex(/[a-z]/, {
        message: "Senha deve conter pelo menos uma letra minúscula",
      })
      .regex(/[0-9]/, {
        message: "Senha deve conter pelo menos um número",
      }),
    confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: "Senha é obrigatória" })
      .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
      .regex(/[A-Z]/, {
        message: "Senha deve conter pelo menos uma letra maiúscula",
      })
      .regex(/[a-z]/, {
        message: "Senha deve conter pelo menos uma letra minúscula",
      })
      .regex(/[0-9]/, {
        message: "Senha deve conter pelo menos um número",
      }),
    confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "reset">(
    "login"
  );
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string>("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Extract token from URL on mount
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
      setActiveTab("reset");
      setShowResetPassword(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      loginSchema.parse({ email, password });
      setIsLoading(true);

      const user = await dispatch(loginUser({ email, password })).unwrap();

      toast({
        title: "Login realizado com sucesso",
        variant: "default",
      });

      setIsLoading(false);
      
      // Redirecionar baseado no role do usuário
      if (user?.role === "admin" || user?.role === "manager") {
        navigate("/admin");
      } else {
        navigate("/");
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
        // Trata erro como um objeto com possível message
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

  const handleEmailBlur = async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailError("");
      return;
    }

    try {
      setIsCheckingEmail(true);
      const result = await dispatch(checkEmailExists(email)).unwrap();
      
      let errorMessage = "";
      
      if (result.exists) {
        errorMessage = "Este email já está cadastrado. Use outro email ou faça login.";
      } else if (!result.isValid) {
        errorMessage = `Email inválido: ${result.domainValidation?.reason || "Domínio não encontrado ou não aceita emails"}`;
      }
      
      setEmailError(errorMessage);
    } catch (error) {
      // Se houver erro na verificação, não bloqueia o cadastro
      setEmailError("");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || "";
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    try {
      signupSchema.parse({ name, email, password, confirmPassword, phone });
      
      // Verificar se o email já existe e é válido antes de cadastrar
      setIsCheckingEmail(true);
      const emailCheck = await dispatch(checkEmailExists(email)).unwrap();
      
      if (emailCheck.exists) {
        setEmailError("Este email já está cadastrado. Use outro email ou faça login.");
        setIsCheckingEmail(false);
        toast({
          title: "Email já cadastrado",
          description: "Este email já está em uso. Use outro email ou faça login.",
          variant: "destructive",
        });
        return;
      }
      
      if (!emailCheck.isValid) {
        setEmailError(`Email inválido: ${emailCheck.domainValidation?.reason || "Domínio não encontrado"}`);
        setIsCheckingEmail(false);
        toast({
          title: "Email inválido",
          description: emailCheck.domainValidation?.reason || "O domínio do email não existe ou não aceita emails.",
          variant: "destructive",
        });
        return;
      }
      
      setEmailError("");
      setIsCheckingEmail(false);
      
      setIsLoading(true);

      await dispatch(
        signupUser({
          name,
          email,
          phone,
          password,
          passwordConfirm: confirmPassword,
        })
      ).unwrap();

      toast({
        title: "Cadastro realizado com sucesso",
        variant: "default",
      });

      setIsLoading(false);
      navigate("/");
    } catch (error: unknown) {
      setIsLoading(false);
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        // Trata erro como um objeto com possível message
        const errorObj = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        let description = "Ocorreu um erro ao cadastrar";

        if (typeof error === "string") {
          description = error;
        } else if (errorObj?.response?.data?.message) {
          description = errorObj.response.data.message;
        } else if (errorObj?.message) {
          description = errorObj.message;
        }

        toast({
          title: "Erro no cadastro",
          description,
          variant: "destructive",
        });
      }
    }
  };

  const handleResetSubmit = async (email: string) => {
    try {
      await dispatch(forgotPassword({ email })).unwrap();
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error || "Erro ao enviar recuperação",
        variant: "destructive",
      });
    }
  };

  const handleResetPasswordSubmit = async (
    password: string,
    confirmPassword: string
  ) => {
    try {
      resetPasswordSchema.parse({ password, confirmPassword });

      if (!resetToken) {
        toast({
          title: "Erro",
          description:
            "Token de recuperação não encontrado. Solicite um novo email.",
          variant: "destructive",
        });
        return;
      }

      setLoadingReset(true);
      await dispatch(
        resetPassword({
          token: resetToken,
          payload: {
            password,
            passwordConfirm: confirmPassword,
          },
        })
      ).unwrap();
      setLoadingReset(false);

      toast({
        title: "Senha redefinida",
        description: "Sua senha foi alterada com sucesso.",
      });
      setShowResetPassword(false);
      setResetToken(null);
      setActiveTab("login");
      navigate("/auth");
    } catch (error: any) {
      setLoadingReset(false);
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error || "Erro ao redefinir senha",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <Logo />
          <CardDescription className="text-center">
            {activeTab === "reset"
              ? "Recupere o acesso à sua conta"
              : "Entre na sua conta ou crie uma nova"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-full"
          >
            {activeTab !== "reset" && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <InputField
                  label="Email"
                  id="login-email"
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
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  icon={Lock}
                  iconPosition="right"
                />
                <div className="flex justify-end  text-sm ">
                  <Button
                    onClick={() => setActiveTab("reset")}
                    className="font-medium hover:bg-transparent hover:text-current "
                    variant="ghost"
                  >
                    Esquece a senha?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <InputField
                  label="Nome"
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Informe o seu nome"
                  required
                  disabled={isLoading}
                  icon={User}
                  iconPosition="right"
                />

                <InputField
                  label="Contacto"
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  placeholder="Informe o seu contacto"
                  required
                  disabled={isLoading}
                  icon={Phone}
                  iconPosition="right"
                  maxLength={13}
                  pattern="(\+258)?[89]\d{8}"
                  title="Formato: +258841234567 ou 841234567 (9 dígitos começando com 8 ou 9)"
                />
                <div className="space-y-1">
                  <InputField
                    label="Email"
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Insira a seu email"
                    required
                    disabled={isLoading || isCheckingEmail}
                    icon={Mail}
                    iconPosition="right"
                    error={emailError}
                    onBlur={(e) => handleEmailBlur(e.target.value)}
                  />
                  {isCheckingEmail && !emailError && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Verificando disponibilidade do email...
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <InputField
                    label="Senha"
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Insira a sua senha"
                    required
                    disabled={isLoading}
                    icon={Lock}
                    iconPosition="right"
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground px-1">
                    Deve conter: letra maiúscula, minúscula e número
                  </p>
                </div>

                <InputField
                  label="Confirmar Senha"
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirme a sua senha"
                  required
                  disabled={isLoading}
                  icon={Lock}
                  iconPosition="right"
                  minLength={8}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>

            {/* Reset password tab */}
            <TabsContent value="reset">
              {!showResetPassword ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(
                      e.currentTarget as HTMLFormElement
                    );
                    const email = (formData.get("email") as string) || "";
                    setLoadingReset(true);
                    await handleResetSubmit(email);
                    setLoadingReset(false);
                  }}
                  className="space-y-4"
                >
                  <InputField
                    label="Email"
                    id="reset-email"
                    name="email"
                    type="email"
                    placeholder="Informe o seu email"
                    required
                    disabled={loadingReset}
                    icon={Mail}
                    iconPosition="right"
                  />

                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      className="font-medium hover:bg-transparent hover:text-current"
                      onClick={() => setActiveTab("login")}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="ml-auto"
                      disabled={loadingReset}
                    >
                      {loadingReset ? "Enviando..." : "Enviar recuperação"}
                    </Button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(
                      e.currentTarget as HTMLFormElement
                    );
                    const password = (formData.get("password") as string) || "";
                    const confirmPassword =
                      (formData.get("confirmPassword") as string) || "";
                    setLoadingReset(true);
                    await handleResetPasswordSubmit(password, confirmPassword);
                    setLoadingReset(false);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <InputField
                      label="Nova Senha"
                      id="reset-password"
                      name="password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      required
                      disabled={loadingReset}
                      icon={Lock}
                      iconPosition="right"
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground px-1">
                      Deve conter: letra maiúscula, minúscula e número
                    </p>
                  </div>

                  <InputField
                    label="Confirmar Senha"
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    required
                    disabled={loadingReset}
                    icon={Lock}
                    iconPosition="right"
                    minLength={8}
                  />

                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      className="font-medium hover:bg-transparent hover:text-current"
                      onClick={() => {
                        setShowResetPassword(false);
                        setActiveTab("login");
                      }}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="ml-auto"
                      disabled={loadingReset}
                    >
                      {loadingReset ? "Atualizando..." : "Redefinir Senha"}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
