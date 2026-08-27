import Image from "next/image";
import type { ReactNode } from "react";

export function Hero({
  title,
  subtitle,
  imageSrc,
  imageAlt = "",
  children,
}: {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
      <Image src={imageSrc} alt={imageAlt} fill priority className="object-cover" sizes="100vw" />
      {/* Overlay + text-shadow mirror the WordPress track's contrast fix: never rely on a
       * translucent overlay alone for light-on-photo text legibility (see OVERVIEW.md's
       * quality-fix pass notes). */}
      <div className="bg-brand-primary-dark absolute inset-0 opacity-45" aria-hidden="true" />
      <div className="text-brand-on-primary relative mx-auto max-w-2xl px-brand-6 py-brand-9 text-center [text-shadow:0_2px_6px_rgba(0,0,0,0.45)]">
        <h1 className="font-heading text-brand-3xl font-bold">{title}</h1>
        <p className="text-brand-lg mt-brand-4">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
