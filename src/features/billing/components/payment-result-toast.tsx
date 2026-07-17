"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Shows the Paystack outcome once, then strips the query param. */
export function PaymentResultToast({ result }: { result?: string }) {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (!result || fired.current) return;
    fired.current = true;
    if (result === "success") {
      toast.success("Payment received — your plan is now active. 🎉");
    } else if (result === "failed") {
      toast.error("Payment didn't go through. You haven't been charged — try again.");
    }
    router.replace(window.location.pathname);
  }, [result, router]);

  return null;
}
