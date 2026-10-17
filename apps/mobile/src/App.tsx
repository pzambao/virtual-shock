import { useMemo, useRef, useState } from "react";
import {
  DEFAULT_LAYOUT,
  KEY_LABELS,
  type AllowedKey,
} from "@virtual-shock/shared";
import { AnalogStick } from "./components/AnalogStick";
import { ControlButton } from "./components/ControlButton";
import {
  SessionClient,
  buildWsUrl,
  defaultHostFromLocation,
  type ConnectionStatus,
} from "./ws/client";

export function App() {
  const [host, setHost] = useState(defaultHostFromLocation);
  const [pairingCode, setPairingCode] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [detail, setDetail] = useState<string | undefined>();
  const [pressed, setPressed] = useState<Partial<Record<AllowedKey, boolean>>>(
    {},
  );
  const clientRef = useRef<SessionClient | null>(null);

  const buttons = useMemo(
    () => DEFAULT_LAYOUT.items.filter((item) => item.type === "button"),
    [],
  );

  const connected = status === "connected";

  const ensureClient = () => {
    if (!clientRef.current) {
      clientRef.current = new SessionClient({
        onStatus: (next, nextDetail) => {
          setStatus(next);
          setDetail(nextDetail);
          if (next !== "connected") {
            setPressed({});
          }
        },
      });
    }
    return clientRef.current;
  };

  const handleConnect = () => {
    const client = ensureClient();
    client.connect(buildWsUrl(host), pairingCode.trim());
  };

  const handleDisconnect = () => {
    clientRef.current?.stickMove("left", 0, 0);
    clientRef.current?.disconnect();
    setPressed({});
  };

  const handleDown = (key: AllowedKey) => {
    setPressed((prev) => ({ ...prev, [key]: true }));
    clientRef.current?.keyDown(key);
  };

  const handleUp = (key: AllowedKey) => {
    setPressed((prev) => ({ ...prev, [key]: false }));
    clientRef.current?.keyUp(key);
  };

  return (
    <div className="app">
      <div className="status">
        Status: <strong>{status}</strong>
        {detail ? ` — ${detail}` : ""}
      </div>

      {!connected ? (
        <div className="connect-form">
          <label>
            Host (IP:porta)
            <input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <label>
            Código de pareamento
            <input
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
            />
          </label>
          <button type="button" onClick={handleConnect}>
            Conectar
          </button>
          {status === "rejected" || status === "error" ? (
            <div className="error">{detail ?? "Falha na conexão"}</div>
          ) : null}
        </div>
      ) : (
        <div className="controller">
          <button
            type="button"
            className="secondary-btn"
            onClick={handleDisconnect}
          >
            Desconectar
          </button>
          <div className="button-grid">
            {buttons.map((item) =>
              item.type === "button" ? (
                <ControlButton
                  key={item.id}
                  label={KEY_LABELS[item.key] ?? item.label}
                  keyCode={item.key}
                  pressed={Boolean(pressed[item.key])}
                  wide={item.key === "Space"}
                  onDown={handleDown}
                  onUp={handleUp}
                />
              ) : null,
            )}
          </div>
          <div className="stick-area">
            <AnalogStick
              onMove={({ x, y }) => clientRef.current?.stickMove("left", x, y)}
              onEnd={() => clientRef.current?.stickMove("left", 0, 0)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
