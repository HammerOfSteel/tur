"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";

const NAV_LINKS = [
  { href: "/butik", label: "Butik" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Header() {
  const { cart } = useCart();
  const itemCount = cart?.items_count ?? 0;

  return (
    <header className="bg-brand-surface text-brand-ink">
      <div className="mx-auto flex max-w-(--container-brand) flex-wrap items-center justify-between gap-brand-4 px-brand-6 py-brand-5">
        <Link href="/" className="font-heading text-brand-xl font-bold">
          Tur Second Hand
        </Link>
        <nav className="flex items-center gap-brand-5">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
          <Link
            href="/varukorg"
            className="relative flex items-center gap-1 hover:underline"
            aria-label="Varukorg"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="bg-brand-primary text-brand-on-primary absolute -top-2 -right-3 flex size-5 items-center justify-center rounded-full text-xs">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
