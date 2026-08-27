import { getPagesContent } from "@/lib/content";

export default function OmOssPage() {
  const { om_oss } = getPagesContent();
  return (
    <div className="mx-auto max-w-2xl px-brand-6 py-brand-8">
      <h1 className="font-heading text-brand-2xl font-bold">{om_oss.title}</h1>
      <p className="text-brand-ink mt-brand-4 text-brand-lg leading-relaxed">{om_oss.body}</p>
    </div>
  );
}
