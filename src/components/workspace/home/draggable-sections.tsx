"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardSection {
  id: string;
  node: ReactNode;
}

/**
 * Drag-to-reorder dashboard sections (grip handle, like the reference
 * dashboards). Order persists per browser in localStorage.
 */
export function DraggableSections({
  storageKey,
  sections,
}: {
  storageKey: string;
  sections: DashboardSection[];
}) {
  const ids = sections.map((s) => s.id);
  const [order, setOrder] = useState<string[]>(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  const armed = useRef(false); // only start a drag from the grip handle

  // Restore saved order once mounted (append any new sections at the end).
  useEffect(() => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      const valid = saved.filter((id) => ids.includes(id));
      const missing = ids.filter((id) => !valid.includes(id));
      if (valid.length > 0) setOrder([...valid, ...missing]);
    } catch {
      /* corrupted storage — keep default order */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function moveOver(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setOrder((cur) => {
      const next = cur.filter((id) => id !== dragId);
      next.splice(next.indexOf(targetId), 0, dragId);
      return next;
    });
  }

  function endDrag() {
    setDragId(null);
    armed.current = false;
    try {
      localStorage.setItem(storageKey, JSON.stringify(order));
    } catch {
      /* private mode etc. */
    }
  }

  const byId = new Map(sections.map((s) => [s.id, s.node]));

  return (
    <div className="flex flex-col gap-3">
      {order.map((id) => (
        <div
          key={id}
          draggable
          onDragStart={(e) => {
            if (!armed.current) {
              e.preventDefault();
              return;
            }
            setDragId(id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            moveOver(id);
          }}
          onDragEnd={endDrag}
          onDrop={(e) => {
            e.preventDefault();
            endDrag();
          }}
          className={cn(
            "group/section relative transition-opacity",
            dragId === id && "opacity-40"
          )}
        >
          <button
            type="button"
            aria-label="Drag to reorder"
            onMouseDown={() => (armed.current = true)}
            onMouseUp={() => (armed.current = false)}
            onTouchStart={() => (armed.current = true)}
            className="absolute -left-1 top-1 z-10 hidden cursor-grab rounded p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-foreground active:cursor-grabbing group-hover/section:block"
          >
            <GripVertical className="size-4" />
          </button>
          {byId.get(id)}
        </div>
      ))}
    </div>
  );
}
