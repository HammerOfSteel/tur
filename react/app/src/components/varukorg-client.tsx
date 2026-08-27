"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VarukorgContent } from "@/lib/content";
import { formatMinorUnitAmount, formatStorePrice } from "@/lib/format-price";
import { decodeHtmlEntities } from "@/lib/store-api";

export function VarukorgClient({ varukorg }: { varukorg: VarukorgContent }) {
  const { cart, loading, updateQuantity, remove } = useCart();
  const items = cart?.items ?? [];

  return (
    <div className="mx-auto max-w-(--container-brand) px-brand-6 py-brand-8">
      <h1 className="font-heading text-brand-2xl font-bold">{varukorg.title}</h1>

      {items.length === 0 ? (
        <div className="mt-brand-6 text-center">
          <p className="text-brand-ink-muted">{varukorg.empty_state_text}</p>
          <Link href="/butik" className="text-brand-primary mt-brand-3 inline-block font-semibold hover:underline">
            {varukorg.empty_state_link_text}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-brand-6 flex flex-col gap-brand-4">
            {items.map((item) => {
              const image = item.images[0];
              return (
                <div key={item.key} className="bg-brand-surface rounded-brand-md flex items-center gap-brand-4 p-brand-4">
                  {image && (
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-brand-sm">
                      <Image src={image.src} alt={image.alt || item.name} fill className="object-cover" sizes="80px" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-brand-ink font-semibold">{decodeHtmlEntities(item.name)}</p>
                    <p className="text-brand-ink-muted text-brand-sm">{formatStorePrice(item.prices)}</p>
                  </div>
                  <label className="flex items-center gap-brand-2">
                    <span className="text-brand-sm">{varukorg.quantity_label}</span>
                    <Input
                      type="number"
                      min={1}
                      disabled={loading}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.key, Math.max(1, Number(e.target.value)))}
                      className="w-16"
                    />
                  </label>
                  <p className="text-brand-ink w-24 text-right font-semibold">
                    {formatMinorUnitAmount(item.totals.line_total, cart?.totals.currency_minor_unit ?? 0)}
                  </p>
                  <Button variant="ghost" disabled={loading} onClick={() => remove(item.key)}>
                    {varukorg.remove_label}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-brand-6 flex items-center justify-between border-t pt-brand-4">
            <p className="text-brand-lg font-bold">
              {varukorg.subtotal_label}:{" "}
              {cart && formatMinorUnitAmount(cart.totals.total_price, cart.totals.currency_minor_unit)}
            </p>
            <Button render={<Link href="/kassa">{varukorg.checkout_button_label}</Link>} />
          </div>
        </>
      )}
    </div>
  );
}
