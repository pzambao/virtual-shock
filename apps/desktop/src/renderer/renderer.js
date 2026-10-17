const GAMEPAD_LABELS = {
  active: "Ativo",
  unavailable: "Indisponível",
  needs_install: "Precisa instalar",
  installing: "Instalando…",
  stub: "Stub (não-Windows)",
};

function render(info) {
  const statusEl = document.getElementById("status");
  const codeEl = document.getElementById("code");
  const portEl = document.getElementById("port");
  const ipsEl = document.getElementById("ips");
  const urlEl = document.getElementById("url");
  const qrEl = document.getElementById("qr");
  const qrFallback = document.getElementById("qr-fallback");
  const gamepadStatusEl = document.getElementById("gamepad-status");
  const gamepadDetailEl = document.getElementById("gamepad-detail");

  statusEl.textContent = info.clientConnected
    ? `Conectado${info.clientName ? ` (${info.clientName})` : ""}`
    : "Aguardando celular";
  codeEl.textContent = info.pairingCode;
  portEl.textContent = String(info.port);
  ipsEl.textContent = info.addresses.length
    ? info.addresses.join(", ")
    : "127.0.0.1 (sem IPv4 LAN detectado)";

  const primary = info.addresses[0] ?? "127.0.0.1";
  urlEl.textContent = `http://${primary}:${info.port}/`;

  gamepadStatusEl.textContent =
    GAMEPAD_LABELS[info.gamepadStatus] ?? info.gamepadStatus ?? "—";
  gamepadDetailEl.textContent = info.gamepadDetail ?? "";

  if (info.qrDataUrl) {
    qrEl.src = info.qrDataUrl;
    qrEl.hidden = false;
    qrFallback.hidden = true;
  } else {
    qrEl.hidden = true;
    qrFallback.hidden = false;
  }
}

async function init() {
  const info = await window.virtualShock.getHostInfo();
  render(info);
  window.virtualShock.onHostUpdate(render);

  document.getElementById("rotate").addEventListener("click", async () => {
    await window.virtualShock.rotateCode();
    const fresh = await window.virtualShock.getHostInfo();
    render(fresh);
  });

  document
    .getElementById("retry-gamepad")
    .addEventListener("click", async () => {
      const next = await window.virtualShock.retryGamepad();
      if (next) {
        render(next);
      }
    });
}

init();
