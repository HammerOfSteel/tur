"use client";
// Shared cart state, backed by the WooCommerce Store API via the same-origin proxy in
// lib/cart-client.ts. Wrapped around the whole app in app/layout.tsx so both the header's
// mini-cart badge and the /varukorg, /butik, /butik/[slug] pages share one live cart.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { StoreApiCart } from "@/lib/store-api";
import { addToCart, getCart, removeCartItem, updateCartItem } from "@/lib/cart-client";

interface CartContextValue {
  cart: StoreApiCart | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<StoreApiCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCart(await getCart());
      setError(null);
    } catch {
      setError("Kunde inte hämta varukorgen just nu.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCart()
      .then((next) => {
        if (!cancelled) setCart(next);
      })
      .catch(() => {
        if (!cancelled) setError("Kunde inte hämta varukorgen just nu.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const withLoading = useCallback(async (fn: () => Promise<StoreApiCart>) => {
    setLoading(true);
    setError(null);
    try {
      setCart(await fn());
    } catch {
      setError("Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(
    (productId: number, quantity = 1) => withLoading(() => addToCart(productId, quantity)),
    [withLoading],
  );
  const updateQuantity = useCallback(
    (key: string, quantity: number) => withLoading(() => updateCartItem(key, quantity)),
    [withLoading],
  );
  const remove = useCallback((key: string) => withLoading(() => removeCartItem(key)), [withLoading]);

  return (
    <CartContext.Provider value={{ cart, loading, error, refresh, add, updateQuantity, remove }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
