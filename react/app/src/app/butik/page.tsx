import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getPagesContent } from "@/lib/content";
import { getCategories, getProducts } from "@/lib/store-api";

export default async function ButikPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { butik, produkt } = getPagesContent();
  const [products, categories] = await Promise.all([getProducts({ category }), getCategories()]);
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-(--container-brand) px-brand-6 py-brand-8">
      <h1 className="font-heading text-brand-2xl font-bold">{butik.title}</h1>
      <p className="text-brand-ink-muted mt-brand-2">{butik.intro}</p>

      <div className="mt-brand-5 flex flex-wrap gap-brand-2">
        <Link
          href="/butik"
          className={`rounded-brand-sm px-brand-3 py-brand-1 text-brand-sm ${
            !activeCategory ? "bg-brand-primary text-brand-on-primary" : "bg-brand-surface text-brand-ink"
          }`}
        >
          Alla
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/butik?category=${encodeURIComponent(c.slug)}`}
            className={`rounded-brand-sm px-brand-3 py-brand-1 text-brand-sm ${
              activeCategory?.id === c.id
                ? "bg-brand-primary text-brand-on-primary"
                : "bg-brand-surface text-brand-ink"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-brand-6 grid grid-cols-2 gap-brand-5 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} addToCartLabel={produkt.add_to_cart_label} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-brand-ink-muted mt-brand-6 text-center">Inga produkter i den här kategorin ännu.</p>
      )}
    </div>
  );
}
