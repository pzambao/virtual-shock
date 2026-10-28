import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  isPadButton,
  type PadButton as PadButtonId,
} from "@virtual-shock/shared";

function padIdFromPoint(x: number, y: number): PadButtonId | null {
  if (typeof document === "undefined") {
    return null;
  }
  const stack = document.elementsFromPoint(x, y);
  for (const node of stack) {
    if (!(node instanceof Element)) {
      continue;
    }
    const host = node.closest("[data-pad-id]");
    const raw = host?.getAttribute("data-pad-id");
    if (raw && isPadButton(raw)) {
      return raw;
    }
  }
  return null;
}

export function usePadSlide(
  enabled: boolean,
  onDown: (id: PadButtonId) => void,
  onUp: (id: PadButtonId) => void,
) {
  const enabledRef = useRef(enabled);
  const onDownRef = useRef(onDown);
  const onUpRef = useRef(onUp);
  enabledRef.current = enabled;
  onDownRef.current = onDown;
  onUpRef.current = onUp;

  const pointerButtons = useRef(new Map<number, PadButtonId | null>());
  const buttonPointers = useRef(new Map<PadButtonId, Set<number>>());

  const bind = (id: PadButtonId, pointerId: number) => {
    let set = buttonPointers.current.get(id);
    if (!set) {
      set = new Set();
      buttonPointers.current.set(id, set);
    }
    const wasEmpty = set.size === 0;
    set.add(pointerId);
    if (wasEmpty) {
      onDownRef.current(id);
    }
  };

  const unbind = (id: PadButtonId, pointerId: number) => {
    const set = buttonPointers.current.get(id);
    if (!set || !set.has(pointerId)) {
      return;
    }
    set.delete(pointerId);
    if (set.size === 0) {
      buttonPointers.current.delete(id);
      onUpRef.current(id);
    }
  };

  const releasePointer = (pointerId: number) => {
    const current = pointerButtons.current.get(pointerId);
    if (!pointerButtons.current.has(pointerId)) {
      return;
    }
    pointerButtons.current.delete(pointerId);
    if (current) {
      unbind(current, pointerId);
    }
  };

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current) {
      return;
    }
    const id = padIdFromPoint(e.clientX, e.clientY);
    if (!id) {
      return;
    }
    e.preventDefault();
    pointerButtons.current.set(e.pointerId, id);
    bind(id, e.pointerId);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Untrusted/synthetic pointer events cannot capture.
    }
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerButtons.current.has(e.pointerId)) {
      return;
    }
    e.preventDefault();
    const next = padIdFromPoint(e.clientX, e.clientY);
    const prev = pointerButtons.current.get(e.pointerId) ?? null;
    if (next === prev) {
      return;
    }
    if (prev) {
      unbind(prev, e.pointerId);
    }
    if (next) {
      bind(next, e.pointerId);
    }
    pointerButtons.current.set(e.pointerId, next);
  }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerButtons.current.has(e.pointerId)) {
      return;
    }
    e.preventDefault();
    releasePointer(e.pointerId);
  }, []);

  const onPointerCancel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    releasePointer(e.pointerId);
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture: onPointerCancel,
  };
}
