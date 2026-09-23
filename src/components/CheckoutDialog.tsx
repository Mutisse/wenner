import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Wallet,
  Banknote,
  Building2,
  Phone,
  ArrowRightLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/app/hooks";
import { productionUrl } from "@/lib/utils";

type PaymentMethod =
  | "mpesa"
  | "emola"
  | "numerario"
  | "conta_bancaria"
  | "transferencia";

// Função para converter cor hexadecimal para nome em português
const hexToColorName = (hex: string): string | null => {
  const hexToColorNameMap: Record<string, string> = {
    "#000000": "Preto",
    "#ffffff": "Branco",
    "#ff0000": "Vermelho",
    "#00ff00": "Verde",
    "#008000": "Verde",
    "#0000ff": "Azul",
    "#ffff00": "Amarelo",
    "#ff00ff": "Magenta",
    "#00ffff": "Ciano",
    "#808080": "Cinza",
    "#ffa500": "Laranja",
    "#800080": "Roxo",
    "#a52a2a": "Marrom",
    "#000080": "Azul Marinho",
    "#f5deb3": "Bege",
  };

  const normalizedHex = hex.toLowerCase().trim();
  return hexToColorNameMap[normalizedHex] || null;
};

interface CheckoutItem {
  key: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  image?: string;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CheckoutItem[];
  totalPrice: number;
  onConfirm: (paymentData: {
    paymentMethod: PaymentMethod;
    phoneNumber?: string;
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
  }) => void;
  loading?: boolean;
}

export const CheckoutDialog = ({
  open,
  onOpenChange,
  items,
  totalPrice,
  onConfirm,
  loading = false,
}: CheckoutDialogProps) => {
  const { user } = useAppSelector((state) => state.user);
  const { products } = useAppSelector((state) => state.product);

  // Helper to detect placeholder address parts and hide them
  const isPlaceholderAddress = (value?: string) => {
    if (!value) return true;
    const placeholders = [
      "Informe a rua e número",
      "Informe a cidade",
      "Informe o estado",
      "Informe o código de endereçamento postal",
    ];
    return placeholders.some((ph) => value.includes(ph));
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [useRegisteredPhone, setUseRegisteredPhone] = useState(true);
  const [bankAccount, setBankAccount] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  // Preencher número de telefone do cadastro quando o dialog abrir
  useEffect(() => {
    if (open && user?.phone) {
      setPhoneNumber(user.phone);
      setUseRegisteredPhone(true);
    }
  }, [open, user?.phone]);

  // Resetar formulário quando fechar
  useEffect(() => {
    if (!open) {
      setPaymentMethod("");
      setPhoneNumber(user?.phone || "");
      setUseRegisteredPhone(true);
      setBankAccount({
        bankName: "",
        accountNumber: "",
        accountHolder: "",
      });
    }
  }, [open, user?.phone]);

  const getItemImage = (item: CheckoutItem) => {
    if (item.image && item.image !== "") {
      if (item.image.startsWith("http") || item.image.startsWith("/")) {
        return item.image;
      }
    }

    const hasVariant = !!(item.color || item.size);
    const product = products.find((p) => p._id === item.id || p.id === item.id);

    if (hasVariant && product) {
      const variants = product.variants || product.variations || [];
      const matchingVariant = variants.find(
        (v: any) =>
          (!item.color || v.color === item.color) &&
          (!item.size || v.size === item.size)
      );

      if (matchingVariant?.image) {
        return `${productionUrl}/img/variants/${matchingVariant.image}`;
      }

      if (item.image && item.image !== "") {
        return `${productionUrl}/img/variants/${item.image}`;
      }
    }

    if (!hasVariant && product?.imageCover) {
      return `${productionUrl}/img/products/${product.imageCover}`;
    }

    if (item.image && item.image !== "") {
      return `${productionUrl}/img/products/${item.image}`;
    }

    return "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
  };

  const handleConfirm = () => {
    if (!paymentMethod) {
      return;
    }

    // Validações específicas por método
    if (
      (paymentMethod === "mpesa" || paymentMethod === "emola") &&
      !phoneNumber
    ) {
      return;
    }

    if (
      paymentMethod === "conta_bancaria" ||
      paymentMethod === "transferencia"
    ) {
      if (
        !bankAccount.bankName ||
        !bankAccount.accountNumber ||
        !bankAccount.accountHolder
      ) {
        return;
      }
    }

    onConfirm({
      paymentMethod: paymentMethod as PaymentMethod,
      phoneNumber:
        paymentMethod === "mpesa" || paymentMethod === "emola"
          ? phoneNumber
          : undefined,
      bankAccount: paymentMethod === "conta_bancaria" ? bankAccount : undefined,
    });
  };

  const canConfirm = () => {
    if (!paymentMethod) return false;

    if (paymentMethod === "mpesa" || paymentMethod === "emola") {
      return !!phoneNumber;
    }

    if (
      paymentMethod === "conta_bancaria" ||
      paymentMethod === "transferencia"
    ) {
      return !!(
        bankAccount.bankName &&
        bankAccount.accountNumber &&
        bankAccount.accountHolder
      );
    }

    return true; // Numerário não precisa de validação
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      mpesa: "M-Pesa",
      emola: "E-Mola",
      numerario: "Numerário",
      conta_bancaria: "Conta Bancária",
      transferencia: "Transferência",
    };
    return labels[method];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] sm:max-h-[95vh] overflow-hidden p-0 flex flex-col w-[95vw] sm:w-full">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-2xl font-bold">
              Checkout
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 sm:h-8 sm:w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Coluna Esquerda - Método de Pagamento */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r">
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-2">
                  Método de Pagamento
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  Todas as transações são seguras e protegidas.
                </p>

                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as PaymentMethod)
                  }
                  className="space-y-3 sm:space-y-4"
                >
                  {/* M-Pesa */}
                  <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem
                      value="mpesa"
                      id="mpesa"
                      className="mt-0.5 sm:mt-1 flex-shrink-0"
                    />
                    <label
                      htmlFor="mpesa"
                      className="flex-1 cursor-pointer space-y-2 min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">
                          M-Pesa
                        </span>
                      </div>
                      {paymentMethod === "mpesa" && (
                        <div className="mt-3 sm:mt-4 space-y-3 pl-0 sm:pl-7">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                id="use-registered-phone-mpesa"
                                checked={useRegisteredPhone}
                                onChange={(e) => {
                                  setUseRegisteredPhone(e.target.checked);
                                  if (e.target.checked && user?.phone) {
                                    setPhoneNumber(user.phone);
                                  }
                                }}
                                className="rounded mt-0.5 flex-shrink-0"
                              />
                              <Label
                                htmlFor="use-registered-phone-mpesa"
                                className="text-xs sm:text-sm cursor-pointer leading-tight"
                              >
                                Usar número do cadastro ({user?.phone || "N/A"})
                              </Label>
                            </div>
                          </div>
                          {!useRegisteredPhone && (
                            <div className="space-y-2">
                              <Label
                                htmlFor="mpesa-phone"
                                className="text-xs sm:text-sm"
                              >
                                Número do M-Pesa *
                              </Label>
                              <Input
                                id="mpesa-phone"
                                type="tel"
                                placeholder="Ex: 846570328"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full sm:max-w-xs text-sm sm:text-base"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </label>
                  </div>

                  {/* E-Mola */}
                  <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem
                      value="emola"
                      id="emola"
                      className="mt-0.5 sm:mt-1 flex-shrink-0"
                    />
                    <label
                      htmlFor="emola"
                      className="flex-1 cursor-pointer space-y-2 min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">
                          E-Mola
                        </span>
                      </div>
                      {paymentMethod === "emola" && (
                        <div className="mt-3 sm:mt-4 space-y-3 pl-0 sm:pl-7">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                id="use-registered-phone-emola"
                                checked={useRegisteredPhone}
                                onChange={(e) => {
                                  setUseRegisteredPhone(e.target.checked);
                                  if (e.target.checked && user?.phone) {
                                    setPhoneNumber(user.phone);
                                  }
                                }}
                                className="rounded mt-0.5 flex-shrink-0"
                              />
                              <Label
                                htmlFor="use-registered-phone-emola"
                                className="text-xs sm:text-sm cursor-pointer leading-tight"
                              >
                                Usar número do cadastro ({user?.phone || "N/A"})
                              </Label>
                            </div>
                          </div>
                          {!useRegisteredPhone && (
                            <div className="space-y-2">
                              <Label
                                htmlFor="emola-phone"
                                className="text-xs sm:text-sm"
                              >
                                Número do E-Mola *
                              </Label>
                              <Input
                                id="emola-phone"
                                type="tel"
                                placeholder="Ex: 846570328"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full sm:max-w-xs text-sm sm:text-base"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Numerário */}
                  <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem
                      value="numerario"
                      id="numerario"
                      className="mt-0.5 sm:mt-1 flex-shrink-0"
                    />
                    <label
                      htmlFor="numerario"
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">
                          Numerário
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-0 sm:ml-7">
                        Pagamento em dinheiro na entrega
                      </p>
                    </label>
                  </div>

                  {/* Conta Bancária */}
                  <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem
                      value="conta_bancaria"
                      id="conta_bancaria"
                      className="mt-0.5 sm:mt-1 flex-shrink-0"
                    />
                    <label
                      htmlFor="conta_bancaria"
                      className="flex-1 cursor-pointer space-y-2 min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">
                          Conta Bancária
                        </span>
                      </div>
                      {paymentMethod === "conta_bancaria" && (
                        <div className="mt-3 sm:mt-4 space-y-3 pl-0 sm:pl-7">
                          <div className="space-y-2">
                            <Label
                              htmlFor="bank-name"
                              className="text-xs sm:text-sm"
                            >
                              Nome do Banco *
                            </Label>
                            <Input
                              id="bank-name"
                              placeholder="Ex: Banco de Moçambique"
                              value={bankAccount.bankName}
                              onChange={(e) =>
                                setBankAccount((prev) => ({
                                  ...prev,
                                  bankName: e.target.value,
                                }))
                              }
                              className="w-full sm:max-w-xs text-sm sm:text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="account-number"
                              className="text-xs sm:text-sm"
                            >
                              Número da Conta *
                            </Label>
                            <Input
                              id="account-number"
                              placeholder="Ex: 1234567890"
                              value={bankAccount.accountNumber}
                              onChange={(e) =>
                                setBankAccount((prev) => ({
                                  ...prev,
                                  accountNumber: e.target.value,
                                }))
                              }
                              className="w-full sm:max-w-xs text-sm sm:text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="account-holder"
                              className="text-xs sm:text-sm"
                            >
                              Titular da Conta *
                            </Label>
                            <Input
                              id="account-holder"
                              placeholder="Ex: João Silva"
                              value={bankAccount.accountHolder}
                              onChange={(e) =>
                                setBankAccount((prev) => ({
                                  ...prev,
                                  accountHolder: e.target.value,
                                }))
                              }
                              className="w-full sm:max-w-xs text-sm sm:text-base"
                            />
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Transferência */}
                  <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem
                      value="transferencia"
                      id="transferencia"
                      className="mt-0.5 sm:mt-1 flex-shrink-0"
                    />
                    <label
                      htmlFor="transferencia"
                      className="flex-1 cursor-pointer space-y-2 min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">
                          Transferência
                        </span>
                      </div>
                      {paymentMethod === "transferencia" && (
                        <div className="mt-3 sm:mt-4 space-y-3 pl-0 sm:pl-7">
                          <div className="space-y-2">
                            <Label
                              htmlFor="transfer-bank-name"
                              className="text-xs sm:text-sm"
                            >
                              Nome do Banco *
                            </Label>
                            <Input
                              id="transfer-bank-name"
                              placeholder="Ex: Banco de Moçambique"
                              value={bankAccount.bankName}
                              onChange={(e) =>
                                setBankAccount((prev) => ({
                                  ...prev,
                                  bankName: e.target.value,
                                }))
                              }
                              className="w-full sm:max-w-xs text-sm sm:text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="transfer-account-number"
                              className="text-xs sm:text-sm"
                            >
                              Número da Conta *
                            </Label>
                            <Input
                              id="transfer-account-number"
                              placeholder="Ex: 1234567890"
                              value={bankAccount.accountNumber}
                              onChange={(e) =>
                                setBankAccount((prev) => ({
                                  ...prev,
                                  accountNumber: e.target.value,
                                }))
                              }
                              className="w-full sm:max-w-xs text-sm sm:text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="transfer-account-holder"
                              className="text-xs sm:text-sm"
                            >
                              Titular da Conta *
                            </Label>
                            <Input
                              id="transfer-account-holder"
                              placeholder="Ex: João Silva"
                              value={bankAccount.accountHolder}
                              onChange={(e) =>
                                setBankAccount((prev) => ({
                                  ...prev,
                                  accountHolder: e.target.value,
                                }))
                              }
                              className="w-full sm:max-w-xs text-sm sm:text-base"
                            />
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <Separator className="my-4 sm:my-6" />

              <div className="space-y-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Ao clicar em "Confirmar Pagamento", você concorda com os
                  Termos e Condições.
                </p>
                <Button
                  onClick={handleConfirm}
                  disabled={!canConfirm() || loading}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base"
                  size="lg"
                >
                  {loading ? "Processando..." : "Confirmar Pagamento"}
                </Button>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Resumo do Pedido */}
          <div className="w-full lg:w-96 bg-muted/30 p-4 sm:p-6 overflow-y-auto flex flex-col border-t lg:border-t-0 lg:border-l">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                  Resumo do Pedido
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>
                      {items.length} {items.length === 1 ? "item" : "itens"}
                    </span>
                    <span className="font-semibold">
                      {items
                        .reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )
                        .toFixed(2)}{" "}
                      MZN
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Imposto</span>
                    <span>0.00 MZN</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Entrega</span>
                    <span className="text-green-600 font-semibold">GRÁTIS</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>{totalPrice.toFixed(2)} MZN</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                  Detalhes do Pedido
                </h3>
                <ScrollArea className="h-[300px] sm:h-[400px]">
                  <div className="space-y-3 sm:space-y-4">
                    {items.map((item) => (
                      <div key={item.key} className="flex gap-2 sm:gap-3">
                        <img
                          src={getItemImage(item)}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm truncate">
                            {item.name}
                          </h4>
                          {(item.color || item.size) &&
                            (() => {
                              const colorName = item.color
                                ? hexToColorName(item.color)
                                : null;
                              return (
                                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                  {colorName && <span>Cor: {colorName}</span>}
                                  {colorName && item.size && <span> • </span>}
                                  {item.size && (
                                    <span>Tamanho: {item.size}</span>
                                  )}
                                </div>
                              );
                            })()}
                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            Quantidade: {item.quantity}
                          </div>
                          <div className="font-semibold text-xs sm:text-sm mt-1">
                            {(item.price * item.quantity).toFixed(2)} MZN
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {user?.address &&
                (() => {
                  const addressParts = [
                    user.address.street,
                    user.address.city,
                    user.address.state,
                    user.address.zipCode,
                  ].filter((p) => !!p && !isPlaceholderAddress(p));

                  if (addressParts.length === 0) return null;

                  return (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-base sm:text-lg font-bold mb-2">
                          Endereço de Entrega
                        </h3>
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                          {addressParts.map((part, idx) => (
                            <p key={idx}>{part}</p>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
