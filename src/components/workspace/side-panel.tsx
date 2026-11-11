"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";

import { useIsMobile } from "@/hooks/use-mobile";

/**
 * The shared shell for every workspace sheet — vehicle details/form/filters,
 * client form/details, rental wizard, complaint form, staff activity — so they
 * all appear and disappear the same way.
 *
 * Desktop: right-corner sliding panel. Mobile: bottom drawer with a grab
 * handle, like a native app sheet.
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
  const isMobile = useIsMobile();
  const dragControls = useDragControls();

  // Drag the grab handle down far/fast enough to dismiss; otherwise the elastic
  // constraint (bottom: 0) springs the sheet back into place on release.
  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 120 || info.velocity.y > 700) onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          {isMobile ? (
            <motion.div
              role="dialog"
              aria-modal="true"
              className={`scrollbar-pill fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] flex-col gap-5 overflow-y-auto rounded-t-[1.75rem] bg-popover p-4 pb-8 text-popover-foreground shadow-2xl ring-1 ring-foreground/10 ${className}`}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 340 }}
              drag="y"
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={handleDragEnd}
            >
              {/* Grab handle — press and pull down to dismiss */}
              <div
                className="mx-auto -mb-2 flex w-full shrink-0 cursor-grab touch-none justify-center py-1 active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
              </div>
              {children}
            </motion.div>
          ) : (
            <motion.div
              role="dialog"
              aria-modal="true"
              className={`scrollbar-pill fixed right-2 top-2 z-50 flex h-[calc(100svh-1rem)] w-110 max-w-[calc(100vw-0.5rem)] flex-col gap-5 overflow-y-auto rounded-xl bg-popover p-4 text-popover-foreground shadow-2xl ring-1 ring-foreground/10 ${className}`}
              initial={{ x: "110%" }}
              animate={{ x: 0 }}
              exit={{ x: "110%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              {children}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
