import { networkInterfaces } from "node:os";

export function getLanIPv4Addresses(): string[] {
  const nets = networkInterfaces();
  const addresses: string[] = [];

  for (const entries of Object.values(nets)) {
    if (!entries) {
      continue;
    }
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }

  return addresses;
}

export function generatePairingCode(): string {
  const value = Math.floor(Math.random() * 1_000_000);
  return value.toString().padStart(6, "0");
}
