# Virtual Shock

MVP: transforme o celular em controle de teclado para um PC Windows na mesma rede Wi‑Fi.

## O que está incluso

- App Electron no Windows (host HTTP + WebSocket + `SendInput`)
- UI web mínima no celular (botões WASD, Space, Shift, Ctrl, E)
- Pareamento por código de 6 dígitos
- Liberação de teclas ao desconectar

**Ainda não incluso:** editor visual, joystick/gamepad virtual, cloud.

## Estrutura

```
apps/mobile      UI React (Vite)
apps/desktop     Electron host
packages/shared  Protocolo, teclas, layout
```

## Pré-requisitos

- Node.js 20+
- pnpm 10+
- Windows para injeção real de teclado e geração do `.exe`
- macOS/Linux: dá para desenvolver UI/WS (teclado vira log stub)

## Setup

```bash
pnpm install
pnpm build:shared
```

## Desenvolvimento

### Opção A — tudo pelo desktop (recomendado)

Gera a UI mobile, copia para o Electron e sobe o host:

```bash
pnpm build:shared
pnpm build:mobile
pnpm --filter @virtual-shock/desktop prepare-mobile
pnpm dev:desktop
```

No app: anote o IP, a porta (`8787`) e o código. No celular (mesma Wi‑Fi), abra `http://IP:8787/` e conecte.

### Opção B — mobile separado (Vite)

Terminal 1:

```bash
pnpm build:shared
pnpm --filter @virtual-shock/desktop prepare-mobile || true
pnpm dev:desktop
```

Terminal 2:

```bash
pnpm dev:mobile
```

No celular, use o host `IP_DO_PC:8787` (WebSocket do Electron) e o código exibido no app. A UI do Vite (`5173`) só é o frontend; o WS continua na `8787`.

## Testes

```bash
pnpm test
pnpm smoke
```

`pnpm smoke` sobe o host em memória, autentica via WebSocket, pressiona teclas e confirma release na desconexão (+ serve da UI).

## Build / .exe (Windows)

```bash
pnpm pack:win
```

Artefatos em `apps/desktop/release/`:

- `VirtualShock-0.1.0-x64.exe` — portable (um arquivo)
- `win-unpacked/Virtual Shock.exe` — pasta unpacked (também funciona no Windows)

No macOS o `electron-builder` consegue gerar o alvo Windows; a injeção real de teclado (`SendInput`) só funciona ao rodar o app **no Windows**.

## Segurança (MVP)

- Serviço escuta só na LAN (`0.0.0.0:8787`), sem relay na internet
- Código de pareamento obrigatório
- Allowlist de teclas no protocolo
- Electron com `contextIsolation` e sem `nodeIntegration` no renderer

Limitações: quem está na mesma rede e souber/adivinhar o código pode tentar conectar. Não exponha a porta à internet (sem port-forward).

## Critérios do MVP

1. App inicia e mostra IP + código
2. Celular conecta na LAN
3. Pressionar/soltar botão gera keyDown/keyUp no Windows
4. Multitouch mantém várias teclas
5. Desconexão libera teclas presas
