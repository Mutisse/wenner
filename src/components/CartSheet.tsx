import React, { useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { createOrder } from "@/features/order/orderActions";
import { createNotification } from "@/features/notification/notificationActions";
import { useToast } from "@/hooks/use-toast";
import { productionUrl } from "@/lib/utils";
import { generateInvoice } from "@/utils/generateInvoice";
import { CheckoutDialog } from "@/components/CheckoutDialog";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartSheet = ({ open, onOpenChange }: CartSheetProps) => {
  // Redux hooks
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.order);
  const { user } = useAppSelector((state) => state.user);
  const { products } = useAppSelector((state) => state.product);
  const { toast } = useToast();

  const { items, removeItem, updateQuantity, totalPrice, clearCart } =
    useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Função para obter a imagem correta do item
  const getItemImage = (item: any) => {
    // Primeiro, verificar se o item já tem uma imagem (prioridade máxima)
    // Isso garante que a imagem passada ao adicionar seja usada
    if (item.image && item.image !== "") {
      // Se já é uma URL completa, usar diretamente
      if (item.image.startsWith("http") || item.image.startsWith("/")) {
        return item.image;
      }
    }
    
    // Verificar se o produto tem variantes (tem cor ou tamanho selecionados)
    const hasVariant = !!(item.color || item.size);
    
    // Buscar o produto no Redux store
    const product = products.find((p) => p._id === item.id || p.id === item.id);
    
    if (hasVariant && product) {
      // Produto com variante: buscar a imagem específica da variante
      const variants = product.variants || product.variations || [];
      const matchingVariant = variants.find(
        (v: any) =>
          (!item.color || v.color === item.color) &&
          (!item.size || v.size === item.size)
      );
      
      if (matchingVariant?.image) {
        // Se encontrou a variante com imagem, usar ela
        return `${productionUrl}/img/variants/${matchingVariant.image}`;
      }
      
      // Se não encontrou variante mas o item já tem imagem, usar ela como variante
      if (item.image && item.image !== "") {
        return `${productionUrl}/img/variants/${item.image}`;
      }
    }
    
    // Produto sem variante: usar imageCover do produto (se encontrado no Redux)
    if (!hasVariant && product?.imageCover) {
      return `${productionUrl}/img/products/${product.imageCover}`;
    }
    
    // Fallback: usar a imagem do item (que foi passada ao adicionar)
    // Se é apenas o nome do arquivo, assumir que é imageCover (produto sem variante)
    if (item.image && item.image !== "") {
      return `${productionUrl}/img/products/${item.image}`;
    }
    
    // Imagem padrão
    return "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
  };

  const handleCheckout = () => {
    if (!items || items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos antes de finalizar.",
      });
      return;
    }

    // Abrir dialog de checkout
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = async (paymentData: {
    paymentMethod: "mpesa" | "emola" | "numerario" | "conta_bancaria" | "transferencia";
    phoneNumber?: string;
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
  }) => {
    // Mapear métodos de pagamento para o formato do backend
    const paymentMethodMap: Record<string, string> = {
      mpesa: "mpesa",
      emola: "emola",
      numerario: "numerario",
      conta_bancaria: "transferencia",
      transferencia: "transferencia",
    };

    const backendPaymentMethod = paymentMethodMap[paymentData.paymentMethod] || "numerario";

    // Reconhecer priceDiscount: se o preço do item for menor que o preço original,
    // significa que há desconto aplicado. O priceDiscount é o preço final após desconto.
    const payload = {
      products: items.map((item) => ({
        product: item.id,
        quantity: item.quantity,
        price: item.price, // Este é o priceDiscount (preço com desconto já aplicado)
        color: item.color,
        size: item.size,
      })),
      discount: 0, // Desconto adicional (cupom) se houver
      paymentMethod: backendPaymentMethod,
      totalPrice: totalPrice,
      notes: paymentData.bankAccount
        ? `Conta Bancária: ${paymentData.bankAccount.bankName} - ${paymentData.bankAccount.accountNumber} - ${paymentData.bankAccount.accountHolder}`
        : paymentData.phoneNumber
        ? `Telefone: ${paymentData.phoneNumber}`
        : "",
    };

    try {
      const resultAction = await dispatch(createOrder(payload as any));
      // handle both fulfilled and rejected shapes
      // RTK returns an action; check for `payload` and `error`
      if (createOrder.fulfilled.match(resultAction)) {
        const order = resultAction.payload;
        const orderId = order?._id || order?.id;

        // Criar notificação após pedido criado com sucesso
        if (user?._id && orderId) {
          try {
            await dispatch(
              createNotification({
                title: "Pedido Realizado",
                message: `Seu pedido #${orderId.slice(-6)} foi criado com sucesso. Total: ${totalPrice.toFixed(2)} MZN`,
                type: "Pedido",
                user: user._id,
                order: orderId,
              })
            ).unwrap();
          } catch (notificationError) {
            // Não bloquear o fluxo se a notificação falhar
            console.error("Erro ao criar notificação:", notificationError);
          }
        }

        // Gerar fatura/recibo em PDF
        try {
          const invoiceNumber = orderId?.slice(-8) || Date.now().toString().slice(-8);
          const orderDate = order?.createdAt ? new Date(order.createdAt) : new Date();
          
          // Preparar dados do cliente
          const customerName = user?.name || "Cliente";
          const customerPhone = user?.phone || "";
          
          // Formatar endereço do cliente (filtrar placeholders)
          let customerAddress = "";
          if (user?.address) {
            const placeholderTexts = [
              "Informe a rua e número",
              "Informe a cidade",
              "Informe o estado",
              "Informe o código de endereçamento postal",
            ];
            
            const addressParts = [
              user.address.street,
              user.address.city,
              user.address.state,
              user.address.zipCode,
            ].filter((part) => {
              // Filtrar partes vazias e placeholders
              if (!part) return false;
              return !placeholderTexts.some((placeholder) => part.includes(placeholder));
            });
            
            customerAddress = addressParts.join(", ");
          }

          // Preparar itens da fatura
          const invoiceItems = items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
            color: item.color,
            size: item.size,
          }));

          // Calcular subtotal e total
          const subtotal = totalPrice;
          const tax = 0; // Sem imposto por enquanto
          const finalTotal = subtotal + tax;

          // Preparar informações de pagamento para a fatura
          const getPaymentMethodLabel = (method: string) => {
            const labels: Record<string, string> = {
              mpesa: "M-Pesa",
              emola: "E-Mola",
              numerario: "Numerário",
              transferencia: "Transferência",
              conta_bancaria: "Conta Bancária",
            };
            return labels[method] || method;
          };

          // Preparar informações de pagamento baseadas no método selecionado
          let invoiceBankName: string | undefined;
          let invoiceAccountName: string | undefined;
          let invoiceAccountNumber: string | undefined;
          let invoicePaymentDetails: string | undefined;

          // Verificar se é método bancário (transferência ou conta bancária)
          const isBankMethod = backendPaymentMethod === "transferencia" || 
                               paymentData.paymentMethod === "conta_bancaria" || 
                               paymentData.paymentMethod === "transferencia";

          if (isBankMethod && paymentData.bankAccount) {
            // Se for transferência ou conta bancária, usar os dados informados pelo cliente
            invoiceBankName = paymentData.bankAccount.bankName;
            invoiceAccountName = paymentData.bankAccount.accountHolder;
            invoiceAccountNumber = paymentData.bankAccount.accountNumber;
            invoicePaymentDetails = `${paymentData.bankAccount.bankName} - Conta: ${paymentData.bankAccount.accountNumber} - Titular: ${paymentData.bankAccount.accountHolder}`;
          } else if (backendPaymentMethod === "mpesa" || backendPaymentMethod === "emola") {
            // Se for M-Pesa ou E-Mola, mostrar o número de telefone
            if (paymentData.phoneNumber) {
              invoicePaymentDetails = `Telefone: ${paymentData.phoneNumber}`;
            }
          }
          // Para "numerario", não precisa de informações adicionais

          // Gerar fatura
          generateInvoice({
            invoiceNumber,
            date: orderDate,
            customer: {
              name: customerName,
              phone: customerPhone,
              address: customerAddress || undefined,
            },
            items: invoiceItems,
            subtotal,
            tax,
            total: finalTotal,
            paymentMethod: getPaymentMethodLabel(paymentData.paymentMethod),
            paymentDetails: invoicePaymentDetails,
            businessName: "Wenner",
            businessAddress: "987 Anywhere St., Any City, Any State 987655",
            bankName: invoiceBankName,
            accountName: invoiceAccountName,
            accountNumber: invoiceAccountNumber,
          });
        } catch (invoiceError) {
          // Não bloquear o fluxo se a geração da fatura falhar
          console.error("Erro ao gerar fatura:", invoiceError);
        }

        toast({
          title: "Pedido realizado",
          description: "Seu pedido foi criado com sucesso. A fatura foi gerada automaticamente.",
        });
        clearCart();
        setIsCheckoutOpen(false);
        onOpenChange(false);
      } else {
        const apiPayload: any = (resultAction as any).payload;
        const msg =
          apiPayload?.message ||
          (resultAction as any).error?.message ||
          "Erro ao criar pedido";
        toast({ 
          title: "Erro", 
          description: msg,
          variant: "destructive"
        });
      }
    } catch (err: any) {
      // Tratar erros de timeout especificamente
      const errorMessage = err?.message || "";
      const isTimeout = errorMessage.includes("timeout") || 
                       errorMessage.includes("exceeded") ||
                       err?.code === "ECONNABORTED";
      
      toast({
        title: "Erro",
        description: isTimeout 
          ? "A requisição demorou muito. Por favor, verifique sua conexão e tente novamente."
          : (err?.message || "Erro ao criar pedido. Por favor, tente novamente."),
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <SheetTitle className="text-lg sm:text-xl">Carrinho de Compras</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground px-4">
            <p>Seu carrinho está vazio</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-4 sm:px-6 -mx-4 sm:-mx-6">
              <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="flex gap-3 sm:gap-4 py-3 sm:py-4 pl-2 sm:pl-4 border-b border-border"
                  >
                    <img
                      src={getItemImage(item)}
                      alt={item.name}
                      className="w-40 h-30 sm:w-35 sm:h-30 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
                      }}
                    />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base truncate">{item.name}</h4>
                          {/* Adicionando cor e tamanho - Só mostra se houver */}
                          {(item.color || item.size) && (
                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                              {item.color && (
                                <span className="flex items-center gap-1">
                                  Cor:
                                  <div
                                    className="w-3 h-3 rounded-full border flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                  />
                                </span>
                              )}
                              {item.color && item.size && <span>|</span>}
                              {item.size && <span>Tamanho: {item.size}</span>}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                          onClick={() => removeItem(item.key)}
                        >
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      <p className="text-sm sm:text-base font-semibold">
                        {item.price.toFixed(2)} MZN
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() =>
                            updateQuantity(item.key, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() =>
                            updateQuantity(item.key, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 pb-4 sm:pb-6 px-4 sm:px-6 border-t border-border bg-background">
              <div className="flex justify-between text-base sm:text-lg font-semibold">
                <span>Total</span>
                <span>{totalPrice.toFixed(2)} MZN</span>
              </div>
              <Button
                className="w-full h-11 sm:h-12 text-sm sm:text-base"
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Processando..." : "Finalizar Compra"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-10 sm:h-11 text-sm sm:text-base" 
                onClick={clearCart}
              >
                Limpar Carrinho
              </Button>
            </div>
          </>
        )}
      </SheetContent>

      {/* Dialog de Checkout */}
      <CheckoutDialog
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        items={items}
        totalPrice={totalPrice}
        onConfirm={handleConfirmPayment}
        loading={loading}
      />
    </Sheet>
  );
};
