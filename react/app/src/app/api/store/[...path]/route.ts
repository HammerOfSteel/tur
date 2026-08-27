// Same-origin proxy for the WooCommerce Store API's stateful endpoints (cart + checkout).
//
// Why this exists: the Store API tracks an anonymous shopping session via a `Cart-Token`
// response header (a JWT) that the client must echo back as a `Cart-Token` request header on
// every subsequent call, plus a `Nonce` header for write operations. Doing this directly from
// the browser against a different origin (Next.js on :3000/:8093 vs the headless WordPress
// backend) runs into CORS/cookie complications. Instead, the browser always talks to this
// same-origin route; this route talks server-to-server to WORDPRESS_STORE_API_URL and persists
// the two WooCommerce headers as ordinary same-origin cookies in between requests.
//
// Read-only catalog calls (products/categories) do NOT need this proxy — call
// lib/store-api.ts's getProducts/getProduct/getCategories directly from Server Components.
import { NextRequest, NextResponse } from "next/server";
import { rewriteImageOrigin } from "@/lib/store-api";

const STORE_API_URL = process.env.WORDPRESS_STORE_API_URL || "http://localhost:8093";
const STORE_API_BASE = `${STORE_API_URL.replace(/\/$/, "")}/wp-json/wc/store/v1`;

const CART_TOKEN_COOKIE = "wc_cart_token";
const NONCE_COOKIE = "wc_store_api_nonce";

async function proxy(req: NextRequest, path: string[]) {
  const search = req.nextUrl.search;
  const targetUrl = `${STORE_API_BASE}/${path.join("/")}${search}`;

  const cartToken = req.cookies.get(CART_TOKEN_COOKIE)?.value;
  const nonce = req.cookies.get(NONCE_COOKIE)?.value;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (cartToken) headers["Cart-Token"] = cartToken;
  if (nonce) headers["Nonce"] = nonce;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    if (text) {
      body = text;
      headers["Content-Type"] = req.headers.get("content-type") || "application/json";
    }
  }

  const upstream = await fetch(targetUrl, { method: req.method, headers, body, cache: "no-store" });
  const rawPayload = await upstream.text();
  // Cart responses embed product image URLs pointing at this backend's public localhost:port
  // origin (see rewriteImageOrigin in lib/store-api.ts for why that breaks next/image's
  // server-side fetch) — rewrite every occurrence to the internal Docker Compose hostname
  // before this JSON reaches the browser/cart state. WordPress's JSON encoder escapes forward
  // slashes by default (json_encode without JSON_UNESCAPED_SLASHES), so the raw text actually
  // contains "http:\/\/localhost:8093" with backslashes — match that escaped form too, not just
  // the unescaped "http://" a plain URL regex would expect.
  const payload = rawPayload.replace(/https?:\\?\/\\?\/localhost:\d+/g, (match) =>
    rewriteImageOrigin(match.replace(/\\\//g, "/")),
  );

  const response = new NextResponse(payload, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
  });

  const newCartToken = upstream.headers.get("Cart-Token");
  const newNonce = upstream.headers.get("Nonce");
  if (newCartToken) {
    response.cookies.set(CART_TOKEN_COOKIE, newCartToken, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  if (newNonce) {
    response.cookies.set(NONCE_COOKIE, newNonce, { httpOnly: true, sameSite: "lax", path: "/" });
  }

  return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxy(req, (await ctx.params).path);
}
