const GAMEPAD_LABELS = {
  active: "Ativo",
  unavailable: "Indisponível",
  needs_install: "Precisa instalar",
  installing: "Instalando…",
  stub: "Stub (não-Windows)",
};

function render(info) {
  document.getElementById("status").textContent = info.clientConnected
    ? `Conectado${info.clientName ? ` (${info.clientName})` : ""}`
    : "Aguardando celular";
  const statusPill = document.getElementById("status-pill");
  statusPill.classList.toggle("is-connected", info.clientConnected);
  statusPill.classList.toggle("is-waiting", !info.clientConnected);

  document.getElementById("code").textContent = info.pairingCode;
  document.getElementById("port").textContent = String(info.port);
  document.getElementById("ips").textContent = info.addresses.length
    ? info.addresses.join(", ")
    : "127.0.0.1 (sem IPv4 LAN detectado)";

  const primary = info.addresses[0] ?? "127.0.0.1";
  document.getElementById("url").textContent =
    `http://${primary}:${info.port}/`;

  document.getElementById("gamepad-status").textContent =
    GAMEPAD_LABELS[info.gamepadStatus] ?? info.gamepadStatus ?? "—";
  document.getElementById("gamepad-detail").textContent =
    info.gamepadDetail ?? "";
  document.getElementById("gamepad-card").dataset.status =
    info.gamepadStatus ?? "";

  const qrEl = document.getElementById("qr");
  const qrFallback = document.getElementById("qr-fallback");
  const qrWrap = qrEl.parentElement;
  if (info.qrDataUrl) {
    qrEl.src = info.qrDataUrl;
    qrEl.hidden = false;
    qrFallback.hidden = true;
    qrWrap.classList.add("has-qr");
  } else {
    qrEl.hidden = true;
    qrFallback.hidden = false;
    qrWrap.classList.remove("has-qr");
  }
}

async function init() {
  const info = await window.virtualShock.getHostInfo();
  render(info);
  window.virtualShock.onHostUpdate(render);

  document.getElementById("rotate").addEventListener("click", async () => {
    await window.virtualShock.rotateCode();
    render(await window.virtualShock.getHostInfo());
  });

  document
    .getElementById("retry-gamepad")
    .addEventListener("click", async () => {
      const next = await window.virtualShock.retryGamepad();
      if (next) render(next);
    });
}

init();
