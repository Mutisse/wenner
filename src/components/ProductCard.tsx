import { Heart, ShoppingCart } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "../features/product/productTypes";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn, productionUrl } from "@/lib/utils";
import { useCart, CartItem } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useRequireAuth } from "@/hooks/auth/useRequireAuth";
import {
  addToFavorites,
  removeFromFavorites,
} from "@/features/favorite/favoriteActions";
import { selectIsFavorite } from "@/features/favorite/favoriteSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.favorites);
  const { user, requireAuth } = useRequireAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const navigate = useNavigate();
  const { addItem } = useCart();

  // Verificar se o produto está nos favoritos
  const productId = product.id ?? product._id;
  const isFavorite = useAppSelector((state) =>
    productId ? selectIsFavorite(productId)(state) : false
  );

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Faça login para favoritar",
        description: "Entre na sua conta para salvar produtos favoritos.",
        variant: "destructive",
      });
      return;
    }

    const productId = product.id ?? product._id;
    if (!productId) return;

    if (loading || isLoading) return;

    setIsLoading(true);

    try {
      // SEMPRE tenta adicionar - o backend vai validar se já existe
      await dispatch(addToFavorites({ productId })).unwrap();
      toast({
        title: "Adicionado aos favoritos!",
        description: `${product.name} foi adicionado.`,
      });
    } catch (error: any) {
      // Se o erro for que o produto JÁ ESTÁ nos favoritos, então remove
      if (
        error?.includes("já está nos favoritos") ||
        error?.includes("já existe")
      ) {
        try {
          await dispatch(removeFromFavorites({ productId })).unwrap();
          toast({
            title: "Removido dos favoritos",
            description: `${product.name} foi removido.`,
          });
        } catch (removeError) {
          toast({
            title: "Erro",
            description: "Erro ao remover dos favoritos",
            variant: "destructive",
          });
        }
      } else {
        // Outros erros (auth, network, etc)
        toast({
          title: "Erro",
          description: error?.message || "Erro ao processar favorito",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Não navegar se o modal estiver aberto
    if (isVariantDialogOpen) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Verificar se o clique veio de um botão, link ou elemento interativo
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.closest("button") ||
      target.closest('[role="button"]') ||
      target.closest("a") ||
      target.closest("[data-radix-portal]") ||
      target.closest("[data-state]");

    if (isInteractiveElement) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigate(`/product/${product.slug}`);
  };

  // Obter cores disponíveis (filtradas por tamanho selecionado se houver)
  const availableColors = useMemo(() => {
    const colorsSet = new Set<string>();
    const variants = product.variants || product.variations || [];

    if (selectedSize) {
      // Se há tamanho selecionado, mostrar apenas cores que têm esse tamanho E têm estoque
      variants.forEach((v) => {
        if (v.size === selectedSize && v.color && (v.stock ?? 0) > 0) {
          colorsSet.add(v.color);
        }
      });

      // Verificar também em product.colors
      if (product.colors) {
        product.colors.forEach((c) => {
          if (c.size === selectedSize && c.color) {
            colorsSet.add(c.color);
          }
        });
      }
    } else {
      // Se não há tamanho selecionado, mostrar apenas cores que têm pelo menos uma variante com estoque
      const colorStockMap = new Map<string, number>();

      variants.forEach((v) => {
        if (v.color) {
          const currentStock = colorStockMap.get(v.color) || 0;
          const variantStock = v.stock ?? 0;
          // Manter o maior estoque encontrado para esta cor
          if (variantStock > currentStock) {
            colorStockMap.set(v.color, variantStock);
          }
        }
      });

      // Adicionar apenas cores com estoque > 0
      colorStockMap.forEach((stock, color) => {
        if (stock > 0) {
          colorsSet.add(color);
        }
      });

      // Também verificar em product.colors (assumir que têm estoque se não especificado)
      if (product.colors) {
        product.colors.forEach((c) => {
          if (c.color) colorsSet.add(c.color);
        });
      }
    }

    return Array.from(colorsSet);
  }, [product, selectedSize]);

  // Tamanhos disponíveis para TODAS as cores (fallback se não houver variantes)
  const allAvailableSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    if (product.variants) {
      product.variants.forEach((v) => v.size && sizesSet.add(v.size));
    }
    if (product.variations) {
      product.variations.forEach((v) => v.size && sizesSet.add(v.size));
    }
    // Verificar também em product.colors
    if (product.colors) {
      product.colors.forEach((c) => {
        if (c.size) {
          sizesSet.add(c.size);
        }
      });
    }
    if (product.sizes) {
      product.sizes.forEach((s) => sizesSet.add(s));
    }
    return Array.from(sizesSet);
  }, [product]);

  // Verificar se o produto tem variantes (cores ou tamanhos)
  const hasVariants = useMemo(() => {
    const variants = product.variants || product.variations || [];
    const hasColors =
      variants.some((v) => v.color) ||
      (product.colors && product.colors.length > 0);
    const hasSizes =
      variants.some((v) => v.size) ||
      (product.sizes && product.sizes.length > 0);
    return hasColors || hasSizes;
  }, [product]);

  // Tamanhos disponíveis (filtrados por cor selecionada se houver)
  const availableSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    const variants = product.variants || product.variations || [];

    if (selectedColor) {
      // Se há cor selecionada, mostrar apenas tamanhos que têm essa cor E têm estoque
      variants.forEach((v) => {
        if (v.color === selectedColor && v.size && (v.stock ?? 0) > 0) {
          sizesSet.add(v.size);
        }
      });

      // Verificar também em product.colors
      if (product.colors) {
        product.colors.forEach((c) => {
          if (c.color === selectedColor && c.size) {
            sizesSet.add(c.size);
          }
        });
      }
    } else {
      // Se não há cor selecionada, mostrar apenas tamanhos que têm pelo menos uma variante com estoque
      const sizeStockMap = new Map<string, number>();

      variants.forEach((v) => {
        if (v.size) {
          const currentStock = sizeStockMap.get(v.size) || 0;
          const variantStock = v.stock ?? 0;
          // Manter o maior estoque encontrado para este tamanho
          if (variantStock > currentStock) {
            sizeStockMap.set(v.size, variantStock);
          }
        }
      });

      // Adicionar apenas tamanhos com estoque > 0
      sizeStockMap.forEach((stock, size) => {
        if (stock > 0) {
          sizesSet.add(size);
        }
      });

      // Também verificar em product.colors e product.sizes (assumir que têm estoque se não especificado)
      if (product.colors) {
        product.colors.forEach((c) => {
          if (c.size) sizesSet.add(c.size);
        });
      }
      if (product.sizes) {
        product.sizes.forEach((s) => sizesSet.add(s));
      }
    }

    return Array.from(sizesSet);
  }, [selectedColor, product]);

  // Resetar tamanho quando a cor mudar e o tamanho atual não estiver disponível para a nova cor
  useEffect(() => {
    if (selectedColor && selectedSize) {
      let sizeAvailableForColor = false;

      // Verificar em variants/variations
      const variants = product.variants || product.variations || [];
      sizeAvailableForColor = variants.some(
        (v) => v.color === selectedColor && v.size === selectedSize
      );

      // Se não encontrou, verificar em product.colors
      if (!sizeAvailableForColor && product.colors) {
        sizeAvailableForColor = product.colors.some(
          (c) => c.color === selectedColor && c.size === selectedSize
        );
      }

      if (!sizeAvailableForColor) {
        setSelectedSize("");
      }
    }
  }, [selectedColor, selectedSize, product]);

  // Obter preço e imagem da variante selecionada
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;

    // Primeiro tentar em variants/variations
    const variants = product.variants || product.variations || [];
    let variant = variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );

    // Se não encontrou, tentar em product.colors
    if (!variant && product.colors) {
      const colorVariant = product.colors.find(
        (c) => c.color === selectedColor && c.size === selectedSize
      );
      // Se encontrou em colors, criar um objeto compatível
      if (colorVariant) {
        variant = {
          color: colorVariant.color,
          size: colorVariant.size,
          price: product.priceDiscount || product.price,
          image: product.imageCover,
        } as any;
      }
    }

    return variant;
  }, [selectedColor, selectedSize, product]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    requireAuth(() => {
      // Se o produto tem variantes, abrir modal de seleção
      if (hasVariants) {
        e.stopPropagation();
        setIsVariantDialogOpen(true);
        return;
      }

      // Se não tem variantes, verificar se há estoque disponível
      // Se o produto tem variantes mas nenhuma foi selecionada, não pode adicionar sem variante
      const variants = product.variants || product.variations || [];
      if (variants.length > 0) {
        // Se há variantes, deve selecionar uma
        setIsVariantDialogOpen(true);
        return;
      }

      // Se não tem variantes, verificar estoque do produto e adicionar diretamente
      const productStock = product.stock || 0;
      if (productStock <= 0) {
        toast({
          title: "Produto fora de estoque",
          description: "Este produto não está disponível no momento.",
          variant: "destructive",
        });
        return;
      }

      const productId = product.id || product._id;
      if (!productId) return;

      addItem({
        id: productId,
        name: product.name,
        price: product.priceDiscount || product.price,
        image: product.imageCover
          ? `${productionUrl}/img/products/${product.imageCover}`
          : "",
      });
      toast({
        title: "Adicionado ao carrinho!",
        description: `${product.name} foi adicionado ao carrinho.`,
      });
    });
  };

  const handleConfirmAddToCart = () => {
    if (hasVariants) {
      // Validar se cor foi selecionada (se houver cores disponíveis)
      if (availableColors.length > 0 && !selectedColor) {
        toast({
          title: "Selecione uma cor",
          description:
            "Por favor, escolha uma cor antes de adicionar ao carrinho.",
          variant: "destructive",
        });
        return;
      }
      // Validar se tamanho foi selecionado (se houver tamanhos disponíveis)
      // Se há cor selecionada, validar tamanho apenas se houver tamanhos para essa cor
      if (selectedColor && availableSizes.length > 0 && !selectedSize) {
        toast({
          title: "Selecione um tamanho",
          description:
            "Por favor, escolha um tamanho antes de adicionar ao carrinho.",
          variant: "destructive",
        });
        return;
      }
      // Se não há cor mas há tamanhos disponíveis, validar tamanho
      if (!selectedColor && allAvailableSizes.length > 0 && !selectedSize) {
        toast({
          title: "Selecione um tamanho",
          description:
            "Por favor, escolha um tamanho antes de adicionar ao carrinho.",
          variant: "destructive",
        });
        return;
      }

      // Validar estoque da variante selecionada e quantidade
      if (selectedVariant) {
        const stock = selectedVariant.stock ?? 0;
        if (stock <= 0) {
          toast({
            title: "Produto fora de estoque",
            description: "Esta variante não está disponível no momento.",
            variant: "destructive",
          });
          return;
        }
        // Validar se a quantidade solicitada não excede o estoque
        if (quantity > stock) {
          toast({
            title: "Quantidade indisponível",
            description: `Apenas ${stock} unidade(s) disponível(eis) em estoque.`,
            variant: "destructive",
          });
          return;
        }
      } else if (selectedColor || selectedSize) {
        // Se há seleção mas não encontrou variante, verificar estoque em todas as variantes
        const variants = product.variants || product.variations || [];
        const matchingVariant = variants.find(
          (v) =>
            (!selectedColor || v.color === selectedColor) &&
            (!selectedSize || v.size === selectedSize)
        );

        if (matchingVariant && (matchingVariant.stock ?? 0) <= 0) {
          toast({
            title: "Produto fora de estoque",
            description: "Esta variante não está disponível no momento.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Validar quantidade para produtos sem variantes
    if (!hasVariants && product.stock !== undefined) {
      if (quantity > product.stock) {
        toast({
          title: "Quantidade indisponível",
          description: `Apenas ${product.stock} unidade(s) disponível(eis) em estoque.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Usar preço e imagem da variante se disponível, senão usar do produto
    const price =
      selectedVariant?.price || product.priceDiscount || product.price;
    let image = "";
    if (selectedVariant?.image) {
      // Se tem variante com imagem, construir URL completa
      image = `${productionUrl}/img/variants/${selectedVariant.image}`;
    } else if (product.imageCover) {
      // Se não tem variante, usar imageCover do produto
      image = `${productionUrl}/img/products/${product.imageCover}`;
    }
    const productId = product.id || product._id;

    if (!productId) return;

    addItem(
      {
        id: productId,
        name: product.name,
        price: price,
        image: image,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
      },
      quantity
    );

    toast({
      title: "Adicionado ao carrinho!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });

    // Limpar seleções e fechar modal
    setIsVariantDialogOpen(false);
    setSelectedColor("");
    setSelectedSize("");
    setQuantity(1);
  };

  const uniqueColors = useMemo(() => {
    if (!product.colors) return [];

    const colorValues = product.colors.map((colorObj) => colorObj.color);
    return [...new Set(colorValues)];
  }, [product.colors]);

  return (
    <div
      className="group relative bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
      onMouseDown={(e) => {
        // Prevenir navegação se o modal estiver aberto
        if (isVariantDialogOpen) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/3] overflow-hidden bg-muted">
        <img
          src={
            product.imageCover
              ? `${productionUrl}/img/products/${product.imageCover}`
              : "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg"
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src =
              "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
          }}
        />

        {/* Discount Badge */}
        {product.priceDiscount &&
          product.price > 0 &&
          product.priceDiscount < product.price && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground font-semibold">
              -{Math.round((1 - product.priceDiscount / product.price) * 100)}%
            </Badge>
          )}

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          disabled={loading || isLoading}
          className={cn(
            "absolute top-3 right-3 z-20 p-2 rounded-full transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isFavorite
              ? "bg-card/80 backdrop-blur-sm hover:bg-card"
              : "bg-card/80 backdrop-blur-sm text-muted-foreground hover:bg-card hover:text-[#0DA2E7]"
          )}
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-all",
              (loading || isLoading) && "animate-pulse",
              isFavorite && "fill-current"
            )}
            style={isFavorite ? { color: "#0DA2E7" } : undefined}
          />
        </button>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-medium text-card-foreground mb-1 line-clamp-1">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          {product.priceDiscount ? (
            <>
              <span className="text-lg font-bold text-card-foreground">
                {product.priceDiscount.toFixed(2)} MZN
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {product.price.toFixed(2)} MZN
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-card-foreground">
              {product.price.toFixed(2)} MZN
            </span>
          )}
        </div>

        {/* Colors and Add to Cart */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {uniqueColors.slice(0, 3).map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="w-5 h-5 rounded-full border-2 border-border cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
                onClick={(e) => e.stopPropagation()}
              />
            ))}
            {uniqueColors.length > 3 && (
              <div
                className="w-5 h-5 rounded-full border-2 border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                +{uniqueColors.length - 3}
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleAddToCart}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modal de Seleção de Variantes */}
      <Dialog
        open={isVariantDialogOpen}
        onOpenChange={(open) => {
          setIsVariantDialogOpen(open);
          if (!open) {
            setSelectedColor("");
            setSelectedSize("");
            setQuantity(1);
          }
        }}
        modal={true}
      >
        <DialogContent
          className="sm:max-w-md max-h-[90vh] flex flex-col p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header Fixo */}
          <DialogHeader
            className="px-6 pt-6 pb-4 flex-shrink-0 border-b"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              {hasVariants
                ? availableColors.length > 0 && allAvailableSizes.length > 0
                  ? "Selecione a cor e o tamanho desejados"
                  : availableColors.length > 0
                  ? "Selecione a cor desejada"
                  : "Selecione o tamanho desejado"
                : "Confirme os detalhes do produto"}
            </DialogDescription>
          </DialogHeader>

          {/* Conteúdo com Scroll */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Seleção de Cor */}
              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <Label>
                    Cor
                    {selectedSize && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (disponíveis para tamanho {selectedSize})
                      </span>
                    )}
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((color) => {
                      // Verificar se esta cor tem estoque disponível para o tamanho selecionado (se houver)
                      const variants =
                        product.variants || product.variations || [];
                      let hasStock = true;

                      if (selectedSize) {
                        // Se há tamanho selecionado, verificar se esta cor tem estoque para esse tamanho
                        const colorVariant = variants.find(
                          (v) => v.color === color && v.size === selectedSize
                        );
                        hasStock = (colorVariant?.stock ?? 0) > 0;
                      } else {
                        // Se não há tamanho selecionado, verificar se a cor tem ALGUM estoque em qualquer variante
                        const colorVariants = variants.filter(
                          (v) => v.color === color
                        );
                        // Verificar se existe pelo menos uma variante com estoque > 0
                        hasStock =
                          colorVariants.length > 0 &&
                          colorVariants.some((v) => (v.stock ?? 0) > 0);
                      }

                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Se já tinha uma cor selecionada e está selecionando a mesma, desselecionar
                            if (selectedColor === color) {
                              setSelectedColor("");
                              // Se não há tamanho selecionado, manter tamanho vazio
                              if (!selectedSize) {
                                setSelectedSize("");
                              }
                            } else {
                              setSelectedColor(color);
                              // Se há tamanho selecionado, verificar se é compatível com a nova cor
                              if (selectedSize) {
                                const isCompatible = variants.some(
                                  (v) =>
                                    v.color === color && v.size === selectedSize
                                );
                                if (!isCompatible) {
                                  setSelectedSize("");
                                }
                              } else {
                                setSelectedSize("");
                              }
                            }
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className={cn(
                            "w-12 h-12 rounded-full border-2 transition-all relative",
                            selectedColor === color
                              ? "border-primary scale-110 ring-2 ring-primary ring-offset-2"
                              : "border-border hover:scale-105",
                            !hasStock && "opacity-50"
                          )}
                          style={{ backgroundColor: color }}
                          title={hasStock ? color : `${color} (sem estoque)`}
                          disabled={!hasStock}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seleção de Tamanho - Só mostra se houver tamanhos disponíveis */}
              {availableSizes.length > 0 && (
                <div className="space-y-3">
                  <Label>
                    Tamanho
                    {selectedColor && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (disponíveis para cor {selectedColor})
                      </span>
                    )}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      // Verificar estoque para esta combinação de cor e tamanho
                      const variants =
                        product.variants || product.variations || [];
                      let variantForSize;
                      let stock = 0;

                      if (selectedColor) {
                        // Se há cor selecionada, buscar variante com cor e tamanho
                        variantForSize = variants.find(
                          (v) => v.color === selectedColor && v.size === size
                        );
                        stock = variantForSize?.stock ?? 0;
                      } else {
                        // Se não há cor selecionada, verificar se existe ALGUMA variante com estoque para este tamanho
                        const variantsWithSize = variants.filter(
                          (v) => v.size === size
                        );
                        // Encontrar a primeira variante com estoque disponível
                        variantForSize = variantsWithSize.find(
                          (v) => (v.stock ?? 0) > 0
                        );
                        // Se encontrou uma com estoque, usar seu estoque; senão, verificar se todas estão sem estoque
                        if (variantForSize) {
                          stock = variantForSize.stock ?? 0;
                        } else if (variantsWithSize.length > 0) {
                          // Se há variantes mas todas sem estoque, usar 0
                          stock = 0;
                        } else {
                          // Se não há variantes com este tamanho, não deveria estar na lista
                          stock = 0;
                        }
                      }

                      const isOutOfStock = stock <= 0;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isOutOfStock) {
                              // Se já tinha um tamanho selecionado e está selecionando o mesmo, desselecionar
                              if (selectedSize === size) {
                                setSelectedSize("");
                                // Se não há cor selecionada, manter cor vazia
                                if (!selectedColor) {
                                  setSelectedColor("");
                                }
                              } else {
                                setSelectedSize(size);
                                // Se a cor selecionada não é compatível com este tamanho, limpar cor
                                const variants =
                                  product.variants || product.variations || [];
                                const hasColorForThisSize = variants.some(
                                  (v) =>
                                    v.size === size && v.color === selectedColor
                                );
                                if (selectedColor && !hasColorForThisSize) {
                                  setSelectedColor("");
                                }
                              }
                            }
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          disabled={isOutOfStock}
                          className={cn(
                            "px-4 py-2 rounded-md border-2 transition-all text-sm font-medium relative",
                            isOutOfStock
                              ? "border-muted bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                              : selectedSize === size
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          )}
                          title={
                            isOutOfStock
                              ? "Fora de estoque"
                              : `${stock} disponível(eis)`
                          }
                        >
                          {size}
                          {isOutOfStock && (
                            <span className="absolute -top-1 -right-1 text-[10px] bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center">
                              ×
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seleção de Quantidade */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Quantidade
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (quantity > 1) {
                          setQuantity(quantity - 1);
                        }
                      }}
                      disabled={
                        quantity <= 1 || (hasVariants && !selectedVariant)
                      }
                    >
                      <span className="text-lg">−</span>
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={
                        hasVariants
                          ? selectedVariant?.stock ?? 999
                          : product.stock ?? 999
                      }
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const maxStock = hasVariants
                          ? selectedVariant?.stock ?? 999
                          : product.stock ?? 999;
                        if (value >= 1 && value <= maxStock) {
                          setQuantity(value);
                        }
                      }}
                      className="w-20 text-center text-sm"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={hasVariants && !selectedVariant}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const maxStock = hasVariants
                          ? selectedVariant?.stock ?? 999
                          : product.stock ?? 999;
                        if (quantity < maxStock) {
                          setQuantity(quantity + 1);
                        }
                      }}
                      disabled={
                        (hasVariants && !selectedVariant) ||
                        quantity >=
                          (hasVariants
                            ? selectedVariant?.stock ?? 999
                            : product.stock ?? 999)
                      }
                    >
                      <span className="text-lg">+</span>
                    </Button>
                  </div>
                </div>

                {/* Preview do Preço e Estoque */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Preço:
                    </span>
                    <span className="text-lg font-bold">
                      {(
                        selectedVariant?.price ||
                        product.priceDiscount ||
                        product.price
                      ).toFixed(2)}{" "}
                      MZN
                    </span>
                  </div>
                  {/* Mostrar estoque apenas quando uma variante foi selecionada OU quando o produto não tem variantes */}
                  {selectedVariant ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Estoque:
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          (selectedVariant.stock ?? 0) > 0
                            ? "text-green-600"
                            : "text-destructive"
                        )}
                      >
                        {(selectedVariant.stock ?? 0) > 0
                          ? `${selectedVariant.stock} disponível(eis)`
                          : "Fora de estoque"}
                      </span>
                    </div>
                  ) : !hasVariants && product.stock !== undefined ? (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Estoque:
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          (product.stock ?? 0) > 0
                            ? "text-green-600"
                            : "text-destructive"
                        )}
                      >
                        {(product.stock ?? 0) > 0
                          ? `${product.stock} disponível(eis)`
                          : "Fora de estoque"}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Fixo */}
          <DialogFooter
            className="px-6 pb-6 pt-4 flex-shrink-0 border-t"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsVariantDialogOpen(false);
                setSelectedColor("");
                setSelectedSize("");
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConfirmAddToCart();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled={
                (hasVariants && !selectedVariant) ||
                (selectedVariant && (selectedVariant.stock ?? 0) <= 0) ||
                (!hasVariants &&
                  product.stock !== undefined &&
                  (product.stock ?? 0) <= 0)
              }
            >
              {hasVariants && !selectedVariant
                ? "Selecione as opções"
                : selectedVariant && (selectedVariant.stock ?? 0) <= 0
                ? "Fora de Estoque"
                : !hasVariants &&
                  product.stock !== undefined &&
                  (product.stock ?? 0) <= 0
                ? "Fora de Estoque"
                : "Adicionar ao Carrinho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
