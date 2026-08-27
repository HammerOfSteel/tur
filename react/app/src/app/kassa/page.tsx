import { KassaClient } from "@/components/kassa-client";
import { getPagesContent } from "@/lib/content";

export default function KassaPage() {
  const { kassa } = getPagesContent();
  return <KassaClient kassa={kassa} />;
}
