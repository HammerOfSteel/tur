import Image from "next/image";
import { getPagesContent } from "@/lib/content";

export default function GalleriPage() {
  const { galleri } = getPagesContent();

  return (
    <div className="mx-auto max-w-(--container-brand) px-brand-6 py-brand-8">
      <h1 className="font-heading text-brand-2xl font-bold">{galleri.title}</h1>
      <div className="mt-brand-6 grid grid-cols-2 gap-brand-3 sm:grid-cols-3 md:grid-cols-4">
        {galleri.images.map((filename) => (
          <div key={filename} className="relative aspect-square overflow-hidden rounded-brand-md">
            <Image
              src={`/images/gallery/${filename}`}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 25vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
