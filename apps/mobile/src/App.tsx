import { useEffect, useRef, useState } from "react";
import type { PadButton as PadButtonId } from "@virtual-shock/shared";
import { GamepadLayout } from "./components/GamepadLayout";
import {
  loadConnectionPrefs,
  saveConnectionPrefs,
} from "./connectionPrefs";
import {
  SessionClient,
  buildWsUrl,
  defaultHostFromLocation,
  type ConnectionStatus,
} from "./ws/client";

function initialHost(): string {
  return loadConnectionPrefs().host?.trim() || defaultHostFromLocation();
}

function initialPairingCode(): string {
  return loadConnectionPrefs().pairingCode?.trim() ?? "";
}

export function App() {
  const [host, setHost] = useState(initialHost);
  const [pairingCode, setPairingCode] = useState(initialPairingCode);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [detail, setDetail] = useState<string | undefined>();
  const [pressed, setPressed] = useState<
    Partial<Record<PadButtonId, boolean>>
  >({});
  const clientRef = useRef<SessionClient | null>(null);
  const autoConnectTried = useRef(false);

  const connected = status === "connected";

  const persistPrefs = (nextHost: string, nextCode: string) => {
    saveConnectionPrefs({ host: nextHost, pairingCode: nextCode });
  };

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

  const handleConnect = (overrideHost?: string, overrideCode?: string) => {
    const nextHost = (overrideHost ?? host).trim();
    const nextCode = (overrideCode ?? pairingCode).trim();
    persistPrefs(nextHost, nextCode);
    ensureClient().connect(buildWsUrl(nextHost), nextCode);
  };

  const handleDisconnect = () => {
    clientRef.current?.stickMove("left", 0, 0);
    clientRef.current?.stickMove("right", 0, 0);
    clientRef.current?.disconnect();
    setPressed({});
  };

  const handlePadDown = (id: PadButtonId) => {
    setPressed((prev) => ({ ...prev, [id]: true }));
    clientRef.current?.padDown(id);
  };

  const handlePadUp = (id: PadButtonId) => {
    setPressed((prev) => ({ ...prev, [id]: false }));
    clientRef.current?.padUp(id);
  };

  // Auto-reconnect after refresh when prefs exist and desktop is still up.
  useEffect(() => {
    if (autoConnectTried.current) {
      return;
    }
    autoConnectTried.current = true;
    const code = pairingCode.trim();
    const nextHost = host.trim();
    if (code.length >= 4 && nextHost) {
      handleConnect(nextHost, code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  return (
    <div className={`app${connected ? " app-playing" : ""}`}>
      {!connected ? (
        <>
          <div className="status-bar">
            Status: <strong>{status}</strong>
            {detail ? ` — ${detail}` : ""}
          </div>
          <div className="connect-screen">
            <div className="connect-form">
              <label>
                Host (IP:porta)
                <input
                  value={host}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHost(value);
                    persistPrefs(value, pairingCode);
                  }}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
              <label>
                Código de pareamento
                <input
                  value={pairingCode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPairingCode(value);
                    persistPrefs(host, value);
                  }}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                />
              </label>
              <button type="button" onClick={() => handleConnect()}>
                Conectar
              </button>
              {status === "rejected" || status === "error" ? (
                <div className="error">{detail ?? "Falha na conexão"}</div>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <GamepadLayout
          pressed={pressed}
          onPadDown={handlePadDown}
          onPadUp={handlePadUp}
          onStickMove={(stick, x, y) =>
            clientRef.current?.stickMove(stick, x, y)
          }
          onStickEnd={(stick) => clientRef.current?.stickMove(stick, 0, 0)}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  );
}
