"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/cart-provider";
import type { KassaContent } from "@/lib/content";
import { checkout } from "@/lib/cart-client";
import { formatMinorUnitAmount } from "@/lib/format-price";
import { decodeHtmlEntities } from "@/lib/store-api";

export function KassaClient({ kassa }: { kassa: KassaContent }) {
  const { cart, refresh } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ order_id: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = {
      name: !form.name.trim(),
      email: !form.email.trim(),
      address: !form.address.trim(),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const [firstName, ...rest] = form.name.trim().split(/\s+/);
      const result = await checkout({
        billing_address: {
          first_name: firstName,
          last_name: rest.join(" ") || firstName,
          email: form.email,
          address_1: form.address,
          city: "Östersund",
          postcode: "83133",
          country: "SE",
        },
        payment_method: "cheque",
      });
      setConfirmation({ order_id: result.order_id });
      await refresh();
    } catch {
      setSubmitError("Kunde inte genomföra köpet. Kontrollera uppgifterna och försök igen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-(--container-brand) px-brand-6 py-brand-8 text-center">
        <h1 className="font-heading text-brand-2xl font-bold">{kassa.confirmation_title}</h1>
        <p className="mt-brand-3">
          {kassa.confirmation_order_number_label}: #{confirmation.order_id}
        </p>
        <Button className="mt-brand-5" onClick={() => router.push("/")}>
          Tillbaka till startsidan
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-(--container-brand) gap-brand-6 px-brand-6 py-brand-8 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-brand-4">
        <h1 className="font-heading text-brand-2xl font-bold">{kassa.title}</h1>
        <div>
          <Label htmlFor="name">{kassa.name_label}</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <p className="text-brand-error text-brand-sm mt-1">{kassa.validation_required_text}</p>}
        </div>
        <div>
          <Label htmlFor="email">{kassa.email_label}</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <p className="text-brand-error text-brand-sm mt-1">{kassa.validation_required_text}</p>}
        </div>
        <div>
          <Label htmlFor="address">{kassa.address_label}</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          {errors.address && <p className="text-brand-error text-brand-sm mt-1">{kassa.validation_required_text}</p>}
        </div>
        {submitError && <p className="text-brand-error text-brand-sm">{submitError}</p>}
        <Button type="submit" disabled={submitting}>
          {kassa.submit_button_label}
        </Button>
      </form>

      <div className="bg-brand-surface rounded-brand-md h-fit p-brand-5">
        <h2 className="font-heading text-brand-lg font-bold">{kassa.order_summary_title}</h2>
        <ul className="mt-brand-3 flex flex-col gap-brand-2">
          {cart?.items.map((item) => (
            <li key={item.key} className="flex justify-between text-brand-sm">
              <span>
                {decodeHtmlEntities(item.name)} × {item.quantity}
              </span>
              <span>{formatMinorUnitAmount(item.totals.line_total, cart.totals.currency_minor_unit)}</span>
            </li>
          ))}
        </ul>
        {cart && (
          <p className="mt-brand-4 border-t pt-brand-3 font-bold">
            {formatMinorUnitAmount(cart.totals.total_price, cart.totals.currency_minor_unit)}
          </p>
        )}
      </div>
    </div>
  );
}
