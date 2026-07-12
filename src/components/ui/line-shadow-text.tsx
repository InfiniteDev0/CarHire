"use client";
import { motion } from "motion/react";
import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function LineShadowText({
  children,
  shadowColor = "black",
  className,
  as: Component = "span",
  ...props
}) {
  const MotionComponent: any = motion.create(Component);
  const content = typeof children === "string" ? children : null;

  // Hydration-safe: default to black for SSR, update on client
  const [hydratedShadowColor, setHydratedShadowColor] = useState("black");
  useEffect(() => {
    setHydratedShadowColor(shadowColor);
  }, [shadowColor]);

  if (!content) {
    throw new Error("LineShadowText only accepts string content");
  }

  return (
    <MotionComponent
      style={
        {
          "--shadow-color": hydratedShadowColor,
        } as CSSProperties
      }
      className={cn(
        "relative z-0 inline-flex",
        "after:absolute after:top-[0.04em] after:left-[0.04em] after:content-[attr(data-text)]",
        "after:bg-[linear-gradient(45deg,transparent_45%,var(--shadow-color)_45%,var(--shadow-color)_55%,transparent_0)]",
        "after:-z-10 after:bg-size-[0.06em_0.06em] after:bg-clip-text after:text-transparent",
        "after:animate-line-shadow",
        className,
      )}
      data-text={content}
      {...props}
    >
      {content}
    </MotionComponent>
  );
}
