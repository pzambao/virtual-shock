import {
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  clampRect,
  SQUARE_CONTROLS,
  type PadControlId,
  type PadRect,
} from "../layout/padLayout";

interface DraggableControlProps {
  id: PadControlId;
  rect: PadRect;
  editMode: boolean;
  label?: string;
  children: ReactNode;
  onChange: (id: PadControlId, rect: PadRect) => void;
}

export function DraggableControl({
  id,
  rect,
  editMode,
  label,
  children,
  onChange,
}: DraggableControlProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    mode: "move" | "resize";
    pointerId: number;
    startX: number;
    startY: number;
    origin: PadRect;
    shellW: number;
    shellH: number;
  } | null>(null);

  const isSquare = SQUARE_CONTROLS.has(id);
  const style: CSSProperties = isSquare
    ? {
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        aspectRatio: "1",
        height: "auto",
      }
    : {
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
      };

  const begin = (
    e: ReactPointerEvent,
    mode: "move" | "resize",
  ) => {
    if (!editMode) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const shell = rootRef.current?.offsetParent as HTMLElement | null;
    if (!shell) {
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...rect },
      shellW: shell.clientWidth,
      shellH: shell.clientHeight,
    };
  };

  const onMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) {
      return;
    }
    e.preventDefault();
    const dxPct = ((e.clientX - drag.startX) / drag.shellW) * 100;
    const dyPct = ((e.clientY - drag.startY) / drag.shellH) * 100;

    if (drag.mode === "move") {
      onChange(
        id,
        clampRect({
          ...drag.origin,
          x: drag.origin.x + dxPct,
          y: drag.origin.y + dyPct,
        }),
      );
      return;
    }

    if (isSquare) {
      // Size by width only; keep square (avoids landscape stretch).
      const side = Math.max(4, drag.origin.w + dxPct);
      onChange(id, clampRect({ ...drag.origin, w: side, h: side }));
      return;
    }

    onChange(
      id,
      clampRect({
        ...drag.origin,
        w: drag.origin.w + dxPct,
        h: drag.origin.h + dyPct,
      }),
    );
  };

  const end = (e: ReactPointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div
      ref={rootRef}
      className={`pad-control${editMode ? " editing" : ""}`}
      style={style}
      data-control={id}
      onPointerDown={editMode ? (e) => begin(e, "move") : undefined}
      onPointerMove={editMode ? onMove : undefined}
      onPointerUp={editMode ? end : undefined}
      onPointerCancel={editMode ? end : undefined}
    >
      {editMode && label ? <span className="edit-label">{label}</span> : null}
      <div className={`pad-control-body${editMode ? " inert-play" : ""}`}>
        {children}
      </div>
      {editMode ? (
        <button
          type="button"
          className="resize-handle"
          aria-label={`Redimensionar ${id}`}
          onPointerDown={(e) => begin(e, "resize")}
          onPointerMove={onMove}
          onPointerUp={end}
          onPointerCancel={end}
        />
      ) : null}
    </div>
  );
}
