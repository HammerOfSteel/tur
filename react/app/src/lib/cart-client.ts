"use client";
// Browser-side cart helper — calls our own same-origin `/api/store/*` proxy (see
// app/api/store/[...path]/route.ts), never the WooCommerce backend directly, so the
// Cart-Token/Nonce cookie dance is handled transparently. All calls include credentials so the
// proxy's cookies are sent automatically.
import type { StoreApiCart } from "@/lib/store-api";

async function proxyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/store${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cart request ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export function getCart(): Promise<StoreApiCart> {
  return proxyFetch<StoreApiCart>("/cart");
}

export function addToCart(productId: number, quantity = 1): Promise<StoreApiCart> {
  return proxyFetch<StoreApiCart>("/cart/add-item", {
    method: "POST",
    body: JSON.stringify({ id: productId, quantity }),
  });
}

export function updateCartItem(key: string, quantity: number): Promise<StoreApiCart> {
  return proxyFetch<StoreApiCart>("/cart/update-item", {
    method: "POST",
    body: JSON.stringify({ key, quantity }),
  });
}

export function removeCartItem(key: string): Promise<StoreApiCart> {
  return proxyFetch<StoreApiCart>("/cart/remove-item", {
    method: "POST",
    body: JSON.stringify({ key }),
  });
}

export interface CheckoutPayload {
  billing_address: {
    first_name: string;
    last_name: string;
    email: string;
    address_1: string;
    city: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
}

export interface CheckoutResult {
  order_id: number;
  order_key: string;
  status: string;
  payment_result: { payment_status: string; redirect_url: string };
}

export function checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
  return proxyFetch<CheckoutResult>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
