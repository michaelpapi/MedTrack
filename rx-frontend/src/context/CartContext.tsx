import React, { createContext, useReducer, useState, useEffect, useContext, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";

interface Product {
  id: number;
  name?: string;
  stock?: number;
  price?: number;
  brand?: { name?: string } | string;
  drug?: { name?: string } | string;
  strength?: string;
  nhia_cover?: boolean;
}

interface CartItem {
  product: Product;
  qty: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "UPDATE_QTY"; productId: number; qty: number }
  | { type: "REMOVE"; productId: number }
  | { type: "CLEAR" };

interface CartContextType extends CartState {
  addToCart: (product: Product, qty?: number) => void;
  updateQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD":
      const existing = state.items.find((i) => i.product.id === action.item.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.item.product.id ? { ...i, qty: i.qty + action.item.qty } : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, qty: action.qty } : i
        ),
      };
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.product.id !== action.productId) };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [refreshKey, setRefreshKey] = useState(0);

  const auth = useContext(AuthContext);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const addToCart = (product: Product, qty = 1) => dispatch({ type: "ADD", item: { product, qty } });
  const updateQty = (productId: number, qty: number) => dispatch({ type: "UPDATE_QTY", productId, qty });
  const remove = (productId: number) => dispatch({ type: "REMOVE", productId });
  const clear = () => dispatch({ type: "CLEAR" });

  useEffect(() => {
    if (!auth?.user) {
      clear();
    }
  }, [auth?.user]);

  return (
    <CartContext.Provider
      value={{ ...state, addToCart, updateQty, remove, clear, refreshKey, triggerRefresh }}
    >
      {children}
    </CartContext.Provider>
  );
};
