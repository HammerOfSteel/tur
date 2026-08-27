"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart-provider";

export function AddToCartForm({ productId, label }: { productId: number; label: string }) {
  const { add, loading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  return (
    <div className="flex items-center gap-brand-3">
      <Input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
        className="w-20"
      />
      <Button
        disabled={loading}
        onClick={async () => {
          await add(productId, quantity);
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1500);
        }}
      >
        {justAdded ? "✓ Tillagd" : label}
      </Button>
    </div>
  );
}
