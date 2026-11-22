"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteVendorProduct } from "@/app/vendor/actions";
import { Button } from "@/components/ui/button";

/** Two-step delete without a browser confirm dialog: the first tap arms it, the second deletes. */
export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [armed, setArmed] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  const onClick = () => {
    if (!armed) return setArmed(true);
    const body = new FormData();
    body.append("id", productId);
    startTransition(() => deleteVendorProduct(body));
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-label={armed ? `Confirm delete ${productName}` : `Delete ${productName}`}
      className={armed ? "border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800" : undefined}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {armed ? "Confirm" : "Delete"}
    </Button>
  );
}
