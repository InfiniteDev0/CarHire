"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Could not sign out. Try again.");
      setLoading(false);
      return;
    }
    router.replace("/auth");
    router.refresh();
  }

  return (
    <Button variant="outline" className={className} onClick={handleSignOut} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
      Sign out
    </Button>
  );
}
