import Link from "next/link";
import { getPagesContent } from "@/lib/content";

export function Footer() {
  const { kontakt } = getPagesContent();

  return (
    <footer className="bg-brand-primary-dark text-brand-on-primary">
      <div className="mx-auto flex max-w-(--container-brand) flex-wrap items-start justify-between gap-brand-4 px-brand-6 py-brand-6">
        <div>
          <p>{kontakt.address}</p>
          <p>{kontakt.hours}</p>
        </div>
        <p>
          <a href={kontakt.instagram_url} className="hover:underline">
            Instagram
          </a>
          {" · "}
          <Link href="/galleri" className="hover:underline">
            Galleri
          </Link>
        </p>
        <p>© Tur Second Hand</p>
      </div>
    </footer>
  );
}
