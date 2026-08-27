import { VarukorgClient } from "@/components/varukorg-client";
import { getPagesContent } from "@/lib/content";

export default function VarukorgPage() {
  const { varukorg } = getPagesContent();
  return <VarukorgClient varukorg={varukorg} />;
}
