import { contextBridge, ipcRenderer } from "electron";

export interface HostInfoView {
  port: number;
  pairingCode: string;
  addresses: string[];
  clientConnected: boolean;
  clientName?: string;
  qrDataUrl: string | null;
}

contextBridge.exposeInMainWorld("virtualShock", {
  getHostInfo: (): Promise<HostInfoView> => ipcRenderer.invoke("host:getInfo"),
  rotateCode: (): Promise<HostInfoView | null> =>
    ipcRenderer.invoke("host:rotateCode"),
  onHostUpdate: (callback: (info: HostInfoView) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: HostInfoView) => {
      callback(info);
    };
    ipcRenderer.on("host:update", listener);
    return () => ipcRenderer.removeListener("host:update", listener);
  },
});
