import { useRef, useState } from "react";

const DEADZONE = 0.08;
const SEND_INTERVAL_MS = 33;

export interface StickAxes {
  x: number;
  y: number;
}

interface AnalogStickProps {
  disabled?: boolean;
  onMove: (axes: StickAxes) => void;
  onEnd: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyDeadzone(x: number, y: number): StickAxes {
  const magnitude = Math.hypot(x, y);
  if (magnitude < DEADZONE) {
    return { x: 0, y: 0 };
  }
  const scaled = (magnitude - DEADZONE) / (1 - DEADZONE);
  const factor = scaled / magnitude;
  return {
    x: clamp(x * factor, -1, 1),
    y: clamp(y * factor, -1, 1),
  };
}

export function AnalogStick({ disabled, onMove, onEnd }: AnalogStickProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);
  const pendingRef = useRef<StickAxes | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const emit = (axes: StickAxes, force = false) => {
    const now = Date.now();
    if (!force && now - lastSentRef.current < SEND_INTERVAL_MS) {
      pendingRef.current = axes;
      return;
    }
    lastSentRef.current = now;
    pendingRef.current = null;
    onMove(axes);
  };

  const flushPending = () => {
    if (pendingRef.current) {
      const axes = pendingRef.current;
      pendingRef.current = null;
      lastSentRef.current = Date.now();
      onMove(axes);
    }
  };

  const computeAxes = (clientX: number, clientY: number): StickAxes => {
    const el = areaRef.current;
    if (!el) {
      return { x: 0, y: 0 };
    }
    const rect = el.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) / 2;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = (clientX - centerX) / radius;
    let dy = (centerY - clientY) / radius;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }
    return applyDeadzone(dx, dy);
  };

  const release = (pointerId: number) => {
    if (pointerIdRef.current !== pointerId) {
      return;
    }
    pointerIdRef.current = null;
    flushPending();
    setKnob({ x: 0, y: 0 });
    onEnd();
  };

  return (
    <div
      ref={areaRef}
      className={`analog-stick${disabled ? " disabled" : ""}`}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (disabled || pointerIdRef.current !== null) {
          return;
        }
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerIdRef.current = e.pointerId;
        const axes = computeAxes(e.clientX, e.clientY);
        setKnob(axes);
        emit(axes, true);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) {
          return;
        }
        e.preventDefault();
        const axes = computeAxes(e.clientX, e.clientY);
        setKnob(axes);
        emit(axes);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        release(e.pointerId);
      }}
      onPointerCancel={(e) => {
        release(e.pointerId);
      }}
      onLostPointerCapture={(e) => {
        release(e.pointerId);
      }}
    >
      <div
        className="analog-knob"
        style={{
          transform: `translate(calc(-50% + ${knob.x * 36}%), calc(-50% + ${-knob.y * 36}%))`,
        }}
      />
    </div>
  );
}
