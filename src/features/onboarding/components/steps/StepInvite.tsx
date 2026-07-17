"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import type { OnboardingApi } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StepInvite({ api }: { api: OnboardingApi }) {
  const [email, setEmail] = useState("");

  function add() {
    if (!email.trim()) return;
    const ok = api.addInviteEmail(email);
    if (!ok) {
      toast.error("Enter a valid email address");
      return;
    }
    setEmail("");
  }

  return (
    <OnboardingLayout
      currentStep={4}
      onBack={api.goBack}
      onNext={api.goNext}
      showSkip
      onSkip={api.goNext}
      nextLabel="Continue"
      title="Invite a co-admin"
      subtitle="Optional. Co-admins can manage staff, cars and settings — just like you."
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="admin@example.com"
            className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600"
          />
          <Button
            type="button"
            onClick={add}
            className="shrink-0 bg-white text-black hover:bg-zinc-200"
          >
            <Plus size={16} /> Add
          </Button>
        </div>

        {api.inviteEmails.length > 0 && (
          <ul className="flex flex-col gap-2">
            {api.inviteEmails.map((e) => (
              <li
                key={e}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
              >
                <span className="text-zinc-200">{e}</span>
                <button
                  type="button"
                  onClick={() => api.removeInviteEmail(e)}
                  className="text-zinc-500 hover:text-white"
                  aria-label={`Remove ${e}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-zinc-600">
          They&apos;ll get an email invite to set a password and join this workspace.
        </p>
      </div>
    </OnboardingLayout>
  );
}
