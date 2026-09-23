import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  // product id
  id: string;
  // unique key combining id/color/size to distinguish variants
  key: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "key">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Generate unique key combining product ID, color, and size
  const getItemKey = (item: Omit<CartItem, "quantity" | "key">) => {
    return `${item.id}-${item.color || ""}-${item.size || ""}`;
  };

  const addItem = (item: Omit<CartItem, "quantity" | "key">, quantity: number = 1) => {
    setItems((prev) => {
      const itemKey = getItemKey(item);
      const existingItem = prev.find((i) => i.key === itemKey);
      if (existingItem) {
        return prev.map((i) =>
          i.key === itemKey ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity: quantity, key: itemKey } as CartItem];
    });
  };
  const removeItem = (itemKey: string) => {
    setItems((prev) => prev.filter((item) => item.key !== itemKey));
  };

  const updateQuantity = (itemKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemKey);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.key === itemKey ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
