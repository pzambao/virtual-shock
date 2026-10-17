# Virtual Shock

Controle o PC pelo celular, na mesma rede Wi-Fi. O Windows recebe um controle **Xbox 360 virtual** (ViGEm): dois analógicos, botões de face, gatilhos, D-pad, Start, Back, Guide e o clique dos sticks (L3 e R3).

O app no PC abre um endereço local e mostra um código de 6 dígitos. O celular abre esse endereço no navegador, digita o código e passa a enviar o controle. Ao desconectar, os botões são soltos e os analógicos voltam ao centro.

Ainda não há relay na internet: celular e PC precisam estar na mesma Wi-Fi.

## Como usar

Windows 10 ou 11, 64 bits. Não precisa de Node.js nem de terminal.

1. Baixe [VirtualShock-0.1.0-x64.exe](https://github.com/pzambao/virtual-shock/releases/download/v0.1.0/VirtualShock-0.1.0-x64.exe) na [página de releases](https://github.com/pzambao/virtual-shock/releases/latest).
2. Abra o arquivo. Se o Windows mostrar “Windows protegeu o seu PC”, clique em **Mais informações** e depois em **Executar assim mesmo**. O executável ainda não é assinado.
3. Na primeira abertura, aceite o pedido de administrador. O app instala o driver ViGEmBus, que cria o controle Xbox virtual. Em geral não é preciso reiniciar o PC. Se cancelar, use **Instalar / reconectar ViGEm** dentro do app.
4. Deixe o Virtual Shock aberto. A janela mostra os IPs, a porta `8787`, o código e o status do gamepad. Há também um QR code.
5. No celular, na horizontal e na mesma Wi-Fi, abra o navegador em `http://IP:8787/` (o IP que aparece no app) ou escaneie o QR.
6. Digite o código de pareamento.

No celular, **Customizar** deixa arrastar e redimensionar os controles. A posição fica salva no aparelho.

## Desenvolvimento

```
apps/mobile      UI React (Vite), servida pelo app desktop
apps/desktop     Electron host (HTTP + WebSocket + ViGEm)
packages/shared  Protocolo, botões do pad, layout
```

Pré-requisitos: Node.js 20+, pnpm 10+, Windows para o controle real e para gerar o `.exe`. No macOS/Linux a UI e o WebSocket sobem, mas o input vira log. No Windows, a primeira instalação de `vigemclient` precisa do Visual Studio Build Tools.

```bash
pnpm install
pnpm build:shared
pnpm --filter @virtual-shock/desktop download-vigem
```

Se `vigemclient` não compilou:

```bash
pnpm --filter @virtual-shock/desktop exec electron-rebuild -f -w vigemclient
```

Para rodar em desenvolvimento:

```bash
pnpm build:shared
pnpm build:mobile
pnpm --filter @virtual-shock/desktop prepare-mobile
pnpm --filter @virtual-shock/desktop download-vigem
pnpm dev:desktop
```

Testes e o executável portátil:

```bash
pnpm test
pnpm smoke
pnpm pack:win
```

`pnpm pack:win` baixa o instalador oficial do ViGEmBus (MIT, Nefarius), embute em `extraResources` e grava `VirtualShock-<versão>-x64.exe` em `apps/desktop/release/`. Essa pasta fica no `.gitignore`; o arquivo para o usuário vai anexado numa GitHub Release.

## Segurança

- Só rede local (`0.0.0.0:8787`), sem relay na internet
- Código de pareamento obrigatório
- Allowlist de botões do pad e de teclas; eixos validados em `[-1, 1]`
- Electron com `contextIsolation` e sem `nodeIntegration` no renderer
