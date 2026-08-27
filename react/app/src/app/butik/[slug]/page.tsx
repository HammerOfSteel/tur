import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { getPagesContent } from "@/lib/content";
import { formatStorePrice } from "@/lib/format-price";
import { getProduct } from "@/lib/store-api";

export default async function ProduktPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const { produkt } = getPagesContent();
  const image = product.images[0];

  return (
    <div className="mx-auto grid max-w-(--container-brand) gap-brand-6 px-brand-6 py-brand-8 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-brand-md">
        {image && (
          <Image src={image.src} alt={image.alt || product.name} fill className="object-cover" sizes="50vw" />
        )}
      </div>
      <div>
        <h1 className="font-heading text-brand-2xl font-bold">{product.name}</h1>
        {product.categories[0] && (
          <p className="text-brand-ink-muted mt-brand-1">
            {produkt.category_label}: {product.categories[0].name}
          </p>
        )}
        <p className="text-brand-xl mt-brand-4 font-bold">{formatStorePrice(product.prices)}</p>
        {product.short_description && (
          <div
            className="text-brand-ink mt-brand-4"
            dangerouslySetInnerHTML={{ __html: product.short_description }}
          />
        )}
        <div className="mt-brand-6">
          <AddToCartForm productId={product.id} label={produkt.add_to_cart_label} />
        </div>
      </div>
    </div>
  );
}
