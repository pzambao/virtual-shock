import { useRef, type CSSProperties } from "react";
import type { AllowedKey } from "@virtual-shock/shared";

interface ControlButtonProps {
  label: string;
  keyCode: AllowedKey;
  pressed: boolean;
  wide?: boolean;
  disabled?: boolean;
  onDown: (key: AllowedKey) => void;
  onUp: (key: AllowedKey) => void;
}

export function ControlButton({
  label,
  keyCode,
  pressed,
  wide,
  disabled,
  onDown,
  onUp,
}: ControlButtonProps) {
  const activePointers = useRef<Set<number>>(new Set());

  const releasePointer = (pointerId: number) => {
    if (!activePointers.current.has(pointerId)) {
      return;
    }
    activePointers.current.delete(pointerId);
    if (activePointers.current.size === 0) {
      onUp(keyCode);
    }
  };

  const style: CSSProperties = {};

  return (
    <button
      type="button"
      className={`control-btn${pressed ? " pressed" : ""}${wide ? " wide" : ""}`}
      style={style}
      disabled={disabled}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (disabled) {
          return;
        }
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const wasEmpty = activePointers.current.size === 0;
        activePointers.current.add(e.pointerId);
        if (wasEmpty) {
          onDown(keyCode);
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
      {label}
    </button>
  );
}
