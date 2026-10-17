import { useCallback, useState } from "react";
import type { PadButton as PadButtonId } from "@virtual-shock/shared";
import {
  DEFAULT_PAD_LAYOUT,
  loadPadLayout,
  savePadLayout,
  type PadControlId,
  type PadLayoutMap,
  type PadRect,
} from "../layout/padLayout";
import { AnalogStick } from "./AnalogStick";
import { DraggableControl } from "./DraggableControl";
import { PadButton } from "./PadButton";

interface GamepadLayoutProps {
  pressed: Partial<Record<PadButtonId, boolean>>;
  onPadDown: (id: PadButtonId) => void;
  onPadUp: (id: PadButtonId) => void;
  onStickMove: (stick: "left" | "right", x: number, y: number) => void;
  onStickEnd: (stick: "left" | "right") => void;
  onDisconnect: () => void;
}

function Arrow({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  const map = { up: "▲", down: "▼", left: "◀", right: "▶" };
  return <span className="dpad-arrow">{map[dir]}</span>;
}

export function GamepadLayout({
  pressed,
  onPadDown,
  onPadUp,
  onStickMove,
  onStickEnd,
  onDisconnect,
}: GamepadLayoutProps) {
  const [layout, setLayout] = useState<PadLayoutMap>(() => loadPadLayout());
  const [editMode, setEditMode] = useState(false);

  const updateRect = useCallback((id: PadControlId, rect: PadRect) => {
    setLayout((prev) => {
      const next = { ...prev, [id]: rect };
      savePadLayout(next);
      return next;
    });
  }, []);

  const resetLayout = () => {
    const fresh = { ...DEFAULT_PAD_LAYOUT };
    setLayout(fresh);
    savePadLayout(fresh);
  };

  const playDown = editMode ? () => undefined : onPadDown;
  const playUp = editMode ? () => undefined : onPadUp;

  return (
    <div className={`gamepad-shell${editMode ? " is-editing" : ""}`}>
      <div className="pad-toolbar">
        <button
          type="button"
          className={`toolbar-btn${editMode ? " active" : ""}`}
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? "Concluir" : "Customizar"}
        </button>
        {editMode ? (
          <button type="button" className="toolbar-btn" onClick={resetLayout}>
            Resetar
          </button>
        ) : null}
        <button type="button" className="toolbar-btn ghost" onClick={onDisconnect}>
          Desconectar
        </button>
      </div>

      {editMode ? (
        <p className="edit-hint">
          Arraste para mover · canto para redimensionar · setas e YXAB são um
          bloco só
        </p>
      ) : null}

      <div className="gamepad-canvas">
        <DraggableControl
          id="lt"
          rect={layout.lt}
          editMode={editMode}
          label="LT"
          onChange={updateRect}
        >
          <PadButton
            id="LT"
            className="shoulder fill"
            pressed={Boolean(pressed.LT)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>

        <DraggableControl
          id="lb"
          rect={layout.lb}
          editMode={editMode}
          label="LB"
          onChange={updateRect}
        >
          <PadButton
            id="LB"
            className="shoulder fill"
            pressed={Boolean(pressed.LB)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>

        <DraggableControl
          id="dpad"
          rect={layout.dpad}
          editMode={editMode}
          label="D-pad"
          onChange={updateRect}
        >
          <div className="diamond fill">
            <PadButton
              id="DpadUp"
              className="diamond-n"
              label={<Arrow dir="up" />}
              pressed={Boolean(pressed.DpadUp)}
              onDown={playDown}
              onUp={playUp}
            />
            <PadButton
              id="DpadLeft"
              className="diamond-w"
              label={<Arrow dir="left" />}
              pressed={Boolean(pressed.DpadLeft)}
              onDown={playDown}
              onUp={playUp}
            />
            <PadButton
              id="DpadRight"
              className="diamond-e"
              label={<Arrow dir="right" />}
              pressed={Boolean(pressed.DpadRight)}
              onDown={playDown}
              onUp={playUp}
            />
            <PadButton
              id="DpadDown"
              className="diamond-s"
              label={<Arrow dir="down" />}
              pressed={Boolean(pressed.DpadDown)}
              onDown={playDown}
              onUp={playUp}
            />
          </div>
        </DraggableControl>

        <DraggableControl
          id="stickLeft"
          rect={layout.stickLeft}
          editMode={editMode}
          label="Stick L"
          onChange={updateRect}
        >
          <div className="stick-fill">
            <AnalogStick
              disabled={editMode}
              onMove={({ x, y }) => onStickMove("left", x, y)}
              onEnd={() => onStickEnd("left")}
            />
          </div>
        </DraggableControl>

        <DraggableControl
          id="guideTop"
          rect={layout.guideTop}
          editMode={editMode}
          label="Guide"
          onChange={updateRect}
        >
          <PadButton
            id="Guide"
            className="logo-btn fill"
            label="✕"
            pressed={Boolean(pressed.Guide)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>

        <DraggableControl
          id="back"
          rect={layout.back}
          editMode={editMode}
          label="Back"
          onChange={updateRect}
        >
          <PadButton
            id="Back"
            className="pill-v fill"
            pressed={Boolean(pressed.Back)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>

        <DraggableControl
          id="touchpad"
          rect={layout.touchpad}
          editMode={editMode}
          label="Touch"
          onChange={updateRect}
        >
          <div className="touchpad fill" aria-hidden />
        </DraggableControl>

        <DraggableControl
          id="start"
          rect={layout.start}
          editMode={editMode}
          label="Start"
          onChange={updateRect}
        >
          <PadButton
            id="Start"
            className="pill-v fill"
            pressed={Boolean(pressed.Start)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>

        <DraggableControl
          id="guideBottom"
          rect={layout.guideBottom}
          editMode={editMode}
          label="Guide"
          onChange={updateRect}
        >
          <div className="guide-fill">
            <span className="guide-label">Guide</span>
            <PadButton
              id="Guide"
              className="logo-btn fill"
              label="◐"
              pressed={Boolean(pressed.Guide)}
              onDown={playDown}
              onUp={playUp}
            />
          </div>
        </DraggableControl>

        <DraggableControl
          id="rb"
          rect={layout.rb}
          editMode={editMode}
          label="RB"
          onChange={updateRect}
        >
          <PadButton
            id="RB"
            className="shoulder fill"
            pressed={Boolean(pressed.RB)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>

        <DraggableControl
          id="rt"
          rect={layout.rt}
          editMode={editMode}
          label="RT"
          onChange={updateRect}
        >
          <PadButton
            id="RT"
            className="shoulder fill"
            pressed={Boolean(pressed.RT)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>

        <DraggableControl
          id="face"
          rect={layout.face}
          editMode={editMode}
          label="YXAB"
          onChange={updateRect}
        >
          <div className="diamond fill">
            <PadButton
              id="Y"
              className="diamond-n"
              pressed={Boolean(pressed.Y)}
              onDown={playDown}
              onUp={playUp}
            />
            <PadButton
              id="X"
              className="diamond-w"
              pressed={Boolean(pressed.X)}
              onDown={playDown}
              onUp={playUp}
            />
            <PadButton
              id="B"
              className="diamond-e"
              pressed={Boolean(pressed.B)}
              onDown={playDown}
              onUp={playUp}
            />
            <PadButton
              id="A"
              className="diamond-s"
              pressed={Boolean(pressed.A)}
              onDown={playDown}
              onUp={playUp}
            />
          </div>
        </DraggableControl>

        <DraggableControl
          id="stickRight"
          rect={layout.stickRight}
          editMode={editMode}
          label="Stick R"
          onChange={updateRect}
        >
          <div className="stick-fill">
            <AnalogStick
              disabled={editMode}
              onMove={({ x, y }) => onStickMove("right", x, y)}
              onEnd={() => onStickEnd("right")}
            />
          </div>
        </DraggableControl>

        <DraggableControl
          id="l3"
          rect={layout.l3}
          editMode={editMode}
          label="L3"
          onChange={updateRect}
        >
          <PadButton
            id="L3"
            className="thumb-click fill"
            pressed={Boolean(pressed.L3)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>

        <DraggableControl
          id="r3"
          rect={layout.r3}
          editMode={editMode}
          label="R3"
          onChange={updateRect}
        >
          <PadButton
            id="R3"
            className="thumb-click fill"
            pressed={Boolean(pressed.R3)}
            onDown={playDown}
            onUp={playUp}
          />
        </DraggableControl>
      </div>
    </div>
  );
}
