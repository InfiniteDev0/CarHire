"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Right-corner sliding panel (framer). The shared shell for every workspace
 * sheet — vehicle details/form/filters, client form/details, rental wizard,
 * complaint form — so they all appear and disappear the same way.
 */
export function SidePanel({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`scrollbar-pill fixed right-1 top-1 z-50 flex h-[calc(100svh-0.5rem)] w-110 max-w-[calc(100vw-0.5rem)] flex-col gap-5 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 p-4 text-white shadow-2xl ${className}`}
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
