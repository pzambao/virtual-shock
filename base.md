# Projeto: Controle de PC pelo celular — Speed Controller

## 1. Objetivo

Quero desenvolver um sistema que transforme o celular em um controle personalizável para computadores Windows.

O usuário acessará uma interface pelo navegador do celular, poderá montar seu próprio layout de controle e associar cada botão a uma tecla do teclado do computador.

O sistema deverá funcionar tanto em jogos executáveis do Windows quanto em jogos executados em navegadores, respeitando as limitações de compatibilidade de cada aplicação.

**IMPORTANTE: nesta primeira etapa, implemente somente os botões de teclado. O joystick ainda não deve funcionar, mas a arquitetura precisa ser preparada desde o início para adicionar um joystick analógico real, reconhecido pelos jogos como um dispositivo gamepad virtual.**

## 2. Tecnologias escolhidas

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS, se apropriado
- Interface responsiva para celulares
- Compatibilidade com navegadores móveis modernos

### Aplicativo desktop Windows
- Electron
- Node.js
- TypeScript
- API nativa do Windows `SendInput` para simular teclas
- WebSocket para comunicação em tempo real entre o celular e o computador

### Persistência
- Armazenamento local para os layouts e configurações.
- Não implementar banco de dados, autenticação de usuários ou backend na nuvem nesta primeira versão.

Utilize versões estáveis e compatíveis das dependências. Antes de escolher bibliotecas adicionais, verifique sua manutenção, licença e compatibilidade com Windows.

## 3. Arquitetura desejada

Organize o projeto como um monorepo TypeScript, separando os seguintes módulos:

- `apps/mobile`: interface acessada pelo celular.
- `apps/desktop`: aplicativo Electron para Windows.
- `packages/shared`: tipos, contratos de mensagens, configurações e modelos compartilhados.

A estrutura exata pode ser ajustada se houver uma justificativa técnica clara.

O frontend do celular deve ser independente da implementação específica de entrada do Windows.

Crie uma camada de abstração para entradas, por exemplo:

- `InputProvider`: contrato geral para envio de entradas.
- `KeyboardInputProvider`: implementação inicial usando `SendInput`.
- `GamepadInputProvider`: contrato ou ponto de extensão para a futura implementação de gamepad virtual, sem implementar o joystick nesta fase.

A arquitetura deve permitir adicionar um gamepad virtual real posteriormente sem precisar reescrever o editor de controles, o sistema de comunicação ou os layouts existentes.

Não simule um joystick analógico usando WASD como substituto da futura implementação. O joystick analógico real será uma funcionalidade separada, a ser desenvolvida em uma etapa posterior.

## 4. Funcionalidades obrigatórias da primeira versão

### 4.1. Aplicativo Windows

O aplicativo deverá:

- Iniciar um servidor WebSocket local.
- Permitir que o celular se conecte pela mesma rede Wi-Fi.
- Exibir o endereço de conexão e um QR Code, se possível.
- Exibir o estado da conexão.
- Receber comandos de pressionamento e soltura de teclas.
- Utilizar `SendInput` para simular os eventos de teclado.
- Gerenciar corretamente teclas pressionadas simultaneamente.
- Liberar todas as teclas mantidas quando ocorrer desconexão ou encerramento.
- Tratar erros e impedir estados inconsistentes.
- Ter uma estrutura que permita futuramente adicionar configurações, perfis e suporte a gamepad.

Não implementar drivers ou dispositivos virtuais nesta etapa.

### 4.2. Interface mobile

Criar uma página de controle funcional, com aparência moderna e otimizada para uso em tela cheia no celular.

Inicialmente, incluir botões de exemplo para:

- W, A, S e D.
- Espaço.
- Shift.
- Ctrl.
- Uma tecla adicional configurável.

Cada botão deverá:

- Enviar `keyDown` quando pressionado.
- Enviar `keyUp` quando solto.
- Permitir manter a tecla pressionada.
- Funcionar com multitouch, permitindo pressionar vários botões simultaneamente.
- Responder corretamente a cancelamento do toque, perda de foco e desconexão.

Evite depender de eventos de clique convencionais para a lógica principal dos botões. Utilize eventos de ponteiro ou uma abordagem equivalente que funcione bem com multitouch.

O layout inicial pode ser fixo, mas implemente os componentes de maneira que possam receber posições, tamanhos, rótulos e ações configuráveis futuramente.

### 4.3. Comunicação

Utilize WebSocket com mensagens tipadas em TypeScript.

Defina contratos claros para mensagens de conexão, pressionamento e soltura de teclas, erros e estado da sessão.

Inclua mecanismos para evitar teclas presas em caso de desconexão. O protocolo deve ser projetado para que a conexão não seja considerada confiável sem tratamento explícito de falhas.

A comunicação deve ocorrer diretamente entre celular e computador pela rede local, sem depender de um servidor externo.

### 4.4. Segurança

- Não exponha o serviço de entrada indiscriminadamente à internet.
- Implemente um mecanismo de pareamento ou código temporário de conexão.
- Valide todas as mensagens recebidas.
- Aceite somente teclas e ações permitidas.
- Configure o Electron com isolamento de contexto e sem habilitar Node.js diretamente no renderer.
- Restrinja as operações privilegiadas ao processo principal e a uma interface IPC controlada.
- Documente as limitações de segurança da conexão pela rede local.

## 5. Preparação para o joystick futuro

Embora o joystick não seja implementado agora, leve em consideração os seguintes requisitos arquiteturais:

- O modelo de entrada deve distinguir teclado de gamepad.
- O protocolo deve poder transportar, futuramente, valores analógicos X e Y, além dos estados dos botões.
- O layout deve permitir adicionar componentes de controle diferentes sem modificar toda a aplicação.
- O Windows deverá poder receber futuramente entradas por meio de um gamepad virtual real, compatível com os jogos que aceitam esse tipo de dispositivo.
- A futura implementação poderá exigir uma biblioteca nativa, driver ou componente específico para Windows.

Não escolha agora uma biblioteca de gamepad virtual sem avaliar manutenção, licença, compatibilidade e estratégia de distribuição.

Não declare que o sistema possui suporte a gamepad enquanto essa camada não estiver implementada e testada.

## 6. Interface e experiência de uso

Quero uma interface minimalista, moderna e escura, com foco em usabilidade.

A primeira tela deve permitir:

- Ver o estado da conexão.
- Acessar o controle.
- Pressionar e soltar os botões com facilidade.
- Usar vários botões simultaneamente.
- Visualizar um feedback discreto quando os comandos são enviados.

O aplicativo Windows deve exibir as informações necessárias para conectar o celular e diagnosticar problemas.

Não desenvolva ainda o editor visual completo de arrastar e redimensionar controles. Apenas prepare os componentes e os modelos de dados para essa evolução.

## 7. Organização e qualidade do código

- Utilize TypeScript com tipagem estrita.
- Evite `any` sempre que possível.
- Separe interface, comunicação, gerenciamento de estado e emissão de teclas.
- Evite acoplamento entre componentes React e APIs específicas do Windows.
- Utilize scripts claros para desenvolvimento, testes e compilação.
- Inclua tratamento de erros e logs úteis.
- Escreva testes para o protocolo e para o gerenciamento do estado das teclas.
- Documente as decisões arquiteturais relevantes.
- Não implemente funcionalidades desnecessárias nesta primeira etapa.

## 8. Ordem de execução

Trabalhe em etapas incrementais:

1. Inspecione o ambiente e proponha a estrutura inicial do projeto.
2. Crie o monorepo e configure as dependências.
3. Implemente o servidor WebSocket no aplicativo Windows.
4. Implemente a camada de simulação de teclado usando `SendInput`.
5. Crie a interface mobile com os botões de exemplo.
6. Integre os dois lados e teste pressionamento, soltura, multitouch e desconexão.
7. Configure o empacotamento inicial do aplicativo Windows.
8. Documente como executar, testar e compilar o projeto.

Comece pela prova de conceito mais simples: conectar o celular ao Windows e conseguir pressionar e soltar uma tecla em um campo de texto.

Depois, avance para os botões simultâneos e a estabilidade da conexão.

Não tente implementar tudo de uma vez. Trabalhe por etapas, execute os testes disponíveis e corrija os problemas antes de avançar.

## 9. Critérios de conclusão da primeira versão

A primeira versão será considerada funcional quando:

- O aplicativo Windows iniciar corretamente.
- O celular conseguir se conectar pela rede local.
- Pressionar um botão no celular gerar o pressionamento correspondente no Windows.
- Soltar o botão gerar a soltura da tecla.
- Várias teclas puderem ser mantidas pressionadas simultaneamente.
- Desconexões não deixarem teclas presas.
- O sistema puder ser testado em um navegador e em pelo menos um jogo executável compatível.
- O projeto estiver organizado e documentado para permitir a criação futura do editor visual e do gamepad virtual.

## Instrução final

Antes de começar a escrever muitos arquivos, apresente uma visão breve da arquitetura e da estrutura de pastas proposta. Depois, implemente a primeira etapa funcional.

Se encontrar uma limitação técnica importante, explique-a e proponha uma alternativa antes de adotar uma arquitetura diferente.

Priorize um MVP funcional, simples de testar e preparado para evoluir, em vez de criar uma estrutura excessivamente complexa desde o início.