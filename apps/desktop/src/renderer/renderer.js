function render(info) {
  const statusEl = document.getElementById("status");
  const codeEl = document.getElementById("code");
  const portEl = document.getElementById("port");
  const ipsEl = document.getElementById("ips");
  const urlEl = document.getElementById("url");
  const qrEl = document.getElementById("qr");
  const qrFallback = document.getElementById("qr-fallback");

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
}

init();
