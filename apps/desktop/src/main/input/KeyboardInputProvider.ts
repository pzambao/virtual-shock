import { createRequire } from "node:module";
import { VIRTUAL_KEY_CODES, type AllowedKey } from "@virtual-shock/shared";
import type { InputProvider } from "./InputProvider.js";

const KEYEVENTF_KEYUP = 0x0002;
const INPUT_KEYBOARD = 1;

type SendInputFn = (nInputs: number, pInputs: Buffer, cbSize: number) => number;

interface NativeKeyboard {
  sendKey(vk: number, keyUp: boolean): void;
}

function createWindowsKeyboard(): NativeKeyboard {
  const require = createRequire(import.meta.url);
  const koffi = require("koffi") as typeof import("koffi");

  const user32 = koffi.load("user32.dll");

  // Pack INPUT manually: sizeof(INPUT) is 28 (x86) / 40 (x64).
  const inputSize = process.arch === "ia32" ? 28 : 40;
  const unionOffset = process.arch === "ia32" ? 4 : 8;

  const SendInput = user32.func(
    "uint32 __stdcall SendInput(uint32 nInputs, void *pInputs, int cbSize)",
  ) as SendInputFn;

  return {
    sendKey(vk: number, keyUp: boolean) {
      const input = Buffer.alloc(inputSize);
      input.writeUInt32LE(INPUT_KEYBOARD, 0);
      input.writeUInt16LE(vk & 0xffff, unionOffset);
      input.writeUInt16LE(0, unionOffset + 2);
      input.writeUInt32LE(keyUp ? KEYEVENTF_KEYUP : 0, unionOffset + 4);
      input.writeUInt32LE(0, unionOffset + 8);

      const written = SendInput(1, input, inputSize);
      if (written !== 1) {
        console.warn(
          `[KeyboardInputProvider] SendInput failed for vk=0x${vk.toString(16)} keyUp=${keyUp}`,
        );
      }
    },
  };
}

function createStubKeyboard(): NativeKeyboard {
  return {
    sendKey(vk: number, keyUp: boolean) {
      console.log(
        `[KeyboardInputProvider:stub] vk=0x${vk.toString(16)} ${keyUp ? "UP" : "DOWN"}`,
      );
    },
  };
}

export class KeyboardInputProvider implements InputProvider {
  readonly kind = "keyboard" as const;
  private readonly native: NativeKeyboard;

  constructor() {
    this.native =
      process.platform === "win32"
        ? createWindowsKeyboard()
        : createStubKeyboard();
  }

  keyDown(key: AllowedKey): void {
    const vk = VIRTUAL_KEY_CODES[key];
    this.native.sendKey(vk, false);
  }

  keyUp(key: AllowedKey): void {
    const vk = VIRTUAL_KEY_CODES[key];
    this.native.sendKey(vk, true);
  }

  releaseAll(keys: AllowedKey[]): void {
    for (const key of keys) {
      this.keyUp(key);
    }
  }
}
