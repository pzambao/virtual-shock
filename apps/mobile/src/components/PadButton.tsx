import { useRef, type ReactNode } from "react";
import type { PadButton as PadButtonId } from "@virtual-shock/shared";

interface PadButtonProps {
  id: PadButtonId;
  label?: ReactNode;
  className?: string;
  pressed: boolean;
  onDown: (id: PadButtonId) => void;
  onUp: (id: PadButtonId) => void;
}

export function PadButton({
  id,
  label,
  className = "",
  pressed,
  onDown,
  onUp,
}: PadButtonProps) {
  const activePointers = useRef<Set<number>>(new Set());

  const releasePointer = (pointerId: number) => {
    if (!activePointers.current.has(pointerId)) {
      return;
    }
    activePointers.current.delete(pointerId);
    if (activePointers.current.size === 0) {
      onUp(id);
    }
  };

  return (
    <button
      type="button"
      className={`pad-btn ${className}${pressed ? " pressed" : ""}`}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const wasEmpty = activePointers.current.size === 0;
        activePointers.current.add(e.pointerId);
        if (wasEmpty) {
          onDown(id);
        }
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        releasePointer(e.pointerId);
      }}
      onPointerCancel={(e) => {
        releasePointer(e.pointerId);
      }}
      onLostPointerCapture={(e) => {
        releasePointer(e.pointerId);
      }}
    >
      {label ?? id}
    </button>
  );
}
