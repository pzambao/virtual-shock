import type { HostInfoView } from "../preload/index";

declare global {
  interface Window {
    virtualShock: {
      getHostInfo: () => Promise<HostInfoView>;
      rotateCode: () => Promise<HostInfoView | null>;
      retryGamepad: () => Promise<HostInfoView | null>;
      onHostUpdate: (callback: (info: HostInfoView) => void) => () => void;
    };
  }
}

export {};
