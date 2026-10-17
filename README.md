# Virtual Shock

Controle de PC pelo celular: teclado (`SendInput`) + joystick analógico real (Xbox 360 virtual via **ViGEm**).

## O que está incluso

- App Electron no Windows (HTTP + WebSocket + teclado + gamepad virtual)
- UI web no celular (botões WASD/Space/Shift/Ctrl/E + stick analógico)
- Pareamento por código de 6 dígitos
- Liberação de teclas e recentro do stick ao desconectar
- ViGEmBus embutido: na 1ª execução o app pode instalar o driver (UAC uma vez)

**Ainda não incluso:** editor visual, botões face do gamepad, stick direito, cloud.

## Estrutura

```
apps/mobile      UI React (Vite)
apps/desktop     Electron host
packages/shared  Protocolo, teclas, layout
```

## Pré-requisitos

- Node.js 20+
- pnpm 10+
- Windows para teclado/gamepad reais e o `.exe`
- macOS/Linux: UI/WS funcionam; input vira log stub
- No Windows, para o stick real: Visual Studio Build Tools (para compilar `vigemclient`) na primeira instalação

## Setup

```bash
pnpm install
pnpm build:shared
```

No Windows, baixe o instalador ViGEm (embutido no pack; útil também em dev):

```bash
pnpm --filter @virtual-shock/desktop download-vigem
```

Se `vigemclient` não compilou, no Windows:

```bash
pnpm --filter @virtual-shock/desktop exec electron-rebuild -f -w vigemclient
```

## Desenvolvimento

```bash
pnpm build:shared
pnpm build:mobile
pnpm --filter @virtual-shock/desktop prepare-mobile
pnpm --filter @virtual-shock/desktop download-vigem
pnpm dev:desktop
```

No app: IP, porta `8787`, código e status do **Gamepad virtual**.  
No celular (mesma Wi‑Fi): `http://IP:8787/` → código → botões + stick.

## ViGEmBus (joystick real)

- O setup oficial (MIT, Nefarius) vai em `apps/desktop/resources/vigem/`
- Na 1ª abertura, se o driver não existir, o app dispara a instalação elevada (**um UAC**)
- Em geral **não precisa reiniciar** o PC
- Depois disso, o Windows vê um controle **Xbox 360**; o stick do celular move o eixo esquerdo de verdade (não é WASD)
- Se cancelar o UAC, use o botão **Instalar / reconectar ViGEm** no app

## Testes

```bash
pnpm test
pnpm smoke
```

## Build / .exe (Windows)

```bash
pnpm pack:win
```

Artefatos em `apps/desktop/release/` (portable + `win-unpacked`). O pack baixa o ViGEmBus e inclui em `extraResources`.

## Segurança

- Só LAN (`0.0.0.0:8787`), sem relay na internet
- Código de pareamento obrigatório
- Allowlist de teclas + validação de eixos `[-1, 1]`
- Electron com `contextIsolation` e sem `nodeIntegration` no renderer

## Critérios

1. App inicia com IP + código + status do gamepad
2. Celular conecta na LAN
3. Botões → keyDown/keyUp no Windows
4. Stick → eixos do pad Xbox virtual
5. Desconexão libera teclas e recentra o stick
