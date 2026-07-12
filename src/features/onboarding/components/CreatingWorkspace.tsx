"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";

import type { OnboardingApi } from "../types";
import { completeOnboarding } from "../actions";
import { Button } from "@/components/ui/button";

export function CreatingWorkspace({ api }: { api: OnboardingApi }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  async function run() {
    setError(null);
    api.setSubmitting(true);
    try {
      const result = await completeOnboarding({
        name: api.name,
        county: api.county,
        phone: api.phone,
        fleetSize: api.fleetSize,
        inviteEmails: api.inviteEmails,
        curfewStart: api.curfewStart,
        curfewEnd: api.curfewEnd,
        rateFloor: api.rateFloor,
        rateCeiling: api.rateCeiling,
      });

      if (result.invitesSent > 0) {
        toast.success(`Workspace created · ${result.invitesSent} invite(s) sent`);
      }
      if (result.invitesFailed > 0) {
        toast.error(`${result.invitesFailed} invite(s) couldn't be sent`);
      }

      router.replace(`/workspace/${result.orgId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast.error(message);
      api.setSubmitting(false);
    }
  }

  // Fire once on mount (guard against React dev double-invoke).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 p-6 text-center text-white">
      {error ? (
        <>
          <AlertCircle className="size-10 text-red-400" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Couldn&apos;t create your workspace</h1>
            <p className="max-w-sm text-sm text-zinc-400">{error}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="text-zinc-300 hover:text-white"
              onClick={() => api.goBack()}
            >
              Edit details
            </Button>
            <Button className="bg-white text-black hover:bg-zinc-200" onClick={run}>
              Try again
            </Button>
          </div>
        </>
      ) : (
        <>
          <Loader className="size-10 animate-spin text-white" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Creating {api.name || "your workspace"}…</h1>
            <p className="text-sm text-zinc-400">Setting things up. This takes a moment.</p>
          </div>
        </>
      )}
    </div>
  );
}
