import { Hero } from "@/components/hero";
import { CategoryGrid } from "@/components/category-grid";
import { getPagesContent } from "@/lib/content";
import { getCategories } from "@/lib/store-api";

export default async function Home() {
  const { home } = getPagesContent();
  const categories = await getCategories();

  return (
    <>
      <Hero title={home.hero_tagline} subtitle={home.hero_subtext} imageSrc="/images/hero.jpg" />
      <CategoryGrid title={home.featured_categories_title} categories={categories} />
      <section className="bg-brand-surface">
        <div className="mx-auto max-w-(--container-brand) px-brand-6 py-brand-8 text-center">
          <p className="text-brand-ink text-brand-lg mx-auto max-w-2xl">{home.circular_economy_blurb}</p>
        </div>
      </section>
      <section className="mx-auto max-w-(--container-brand) px-brand-6 py-brand-6 text-center">
        <p className="text-brand-ink-muted">{home.hours_location_teaser}</p>
      </section>
    </>
  );
}
