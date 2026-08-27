import Link from "next/link";
import type { StoreApiCategory } from "@/lib/store-api";

export function CategoryGrid({ title, categories }: { title: string; categories: StoreApiCategory[] }) {
  return (
    <section className="mx-auto max-w-(--container-brand) px-brand-6 py-brand-8">
      <h2 className="font-heading text-brand-2xl mb-brand-5 text-center font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-brand-4 sm:grid-cols-3 md:grid-cols-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/butik?category=${encodeURIComponent(category.slug)}`}
            className="bg-brand-primary text-brand-on-primary rounded-brand-md px-brand-4 py-brand-5 text-center font-semibold shadow-brand-sm transition hover:opacity-90"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
