## Summary

- Layout mobile **landscape** estilo DualSense (print): LT/LB + D-pad + stick L | centro | RB/RT + YXBA + stick R.
- Sticks L/R e botões do pad via **ViGEm** (Xbox 360 virtual), sem simular stick com WASD.
- Host Electron na LAN; ViGEmBus embutido (UAC na 1ª instalação).

## Test plan

- [ ] `pnpm install && pnpm build:shared && pnpm test && pnpm smoke`
- [ ] Windows: `download-vigem` + `electron-rebuild -w vigemclient` + `pnpm dev:desktop`
- [ ] Aceitar UAC do ViGEmBus (se pedido) e ver status **Gamepad virtual: Ativo**
- [ ] Celular na mesma Wi‑Fi conecta com o código; botões digita no Notepad
- [ ] Stick move eixos no *Game Controllers* / jogo XInput; soltar recentra
- [ ] Desconectar celular libera teclas e zera o stick
