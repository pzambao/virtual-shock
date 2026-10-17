import { contextBridge, ipcRenderer } from "electron";

export type GamepadStatusView =
  | "active"
  | "unavailable"
  | "needs_install"
  | "installing"
  | "stub";

export interface HostInfoView {
  port: number;
  pairingCode: string;
  addresses: string[];
  clientConnected: boolean;
  clientName?: string;
  gamepadStatus: GamepadStatusView;
  gamepadDetail?: string;
  qrDataUrl: string | null;
}

contextBridge.exposeInMainWorld("virtualShock", {
  getHostInfo: (): Promise<HostInfoView> => ipcRenderer.invoke("host:getInfo"),
  rotateCode: (): Promise<HostInfoView | null> =>
    ipcRenderer.invoke("host:rotateCode"),
  retryGamepad: (): Promise<HostInfoView | null> =>
    ipcRenderer.invoke("host:retryGamepad"),
  onHostUpdate: (callback: (info: HostInfoView) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: HostInfoView) => {
      callback(info);
    };
    ipcRenderer.on("host:update", listener);
    return () => ipcRenderer.removeListener("host:update", listener);
  },
});
