import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata = { title: "Reset password · CarHire" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
