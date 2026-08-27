"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import type { StoreApiProduct } from "@/lib/store-api";
import { formatStorePrice } from "@/lib/format-price";

export function ProductCard({
  product,
  addToCartLabel,
}: {
  product: StoreApiProduct;
  addToCartLabel: string;
}) {
  const { add, loading } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const image = product.images[0];

  return (
    <div className="bg-brand-surface rounded-brand-md shadow-brand-sm flex flex-col overflow-hidden">
      <Link href={`/butik/${product.slug}`} className="relative aspect-square block">
        {image && (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-brand-2 p-brand-4">
        <Link href={`/butik/${product.slug}`} className="text-brand-ink font-semibold hover:underline">
          {product.name}
        </Link>
        {product.short_description && (
          <p
            className="text-brand-ink-muted text-brand-sm"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}
        <p className="text-brand-ink mt-auto font-bold">{formatStorePrice(product.prices)}</p>
        <Button
          disabled={loading || !product.is_purchasable}
          onClick={async () => {
            await add(product.id);
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 1500);
          }}
        >
          {justAdded ? "✓" : addToCartLabel}
        </Button>
      </div>
    </div>
  );
}
