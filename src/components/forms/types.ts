import type { ComponentProps } from "react";

export type AuthMode = "login" | "signup" | "forgot";

export type AuthFormProps = ComponentProps<"form"> & {
  onSwitch?: (mode: AuthMode) => void;
};
