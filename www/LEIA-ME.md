# CodeLens — fora da Replit, rodando no seu PC

É o mesmo CodeLens de antes, com as mesmas telas: projetos, editor, IA, terminal, preview, GitHub, Playground e Assistente. A diferença é que **não depende mais da Replit**.

## Jeito mais fácil: baixar pronto (Windows)
1. Envie esta pasta para o GitHub pelo 🐙 do Mini SK.
2. A receita **"Gerar app para Windows"** monta o app no Windows, testa e publica.
3. No ⚙️ Execuções do Mini SK (ou na aba **Releases** do repositório), toque em **⤓ Baixar CodeLens-Windows.zip**.
4. Extraia o .zip e dê dois cliques em **`Abrir-CodeLens.bat`**. Não precisa instalar nada, porque o Node já vem dentro.

## Como abrir (montando no seu PC)

**Windows**
1. Instale o **Node.js** (versão "LTS") em https://nodejs.org. Só precisa fazer isso uma vez.
2. **Extraia** o .zip: botão direito → "Extrair tudo…". Não abra de dentro do .zip.
3. Dê dois cliques em **`iniciar.bat`**.
   - Na **primeira vez**, ele baixa as peças e demora alguns minutos.
   - Depois ele abre o navegador sozinho em **http://localhost:8080**.
4. Deixe a janela preta aberta enquanto usa. Para desligar, feche essa janela.

**Celular (Termux), Linux ou Mac:** rode `sh iniciar.sh`. No Termux, instale o Node antes com `pkg install nodejs-lts`.

## Onde ficam as suas coisas
Tudo fica na pasta **`dados/`**, ao lado do programa:
- `dados/projetos/` guarda os projetos (os arquivos de verdade);
- `dados/banco/` guarda o banco de dados: lista de projetos, configurações, chaves e salvos do Playground.

**Para fazer cópia de segurança**, copie a pasta `dados` inteira para o Google Drive ou um pendrive. Dá para mudar o programa de lugar ou de computador que os projetos vêm junto, desde que a pasta `dados` vá também.

## O que foi consertado (por que não rodava em lugar nenhum)

| Problema | Por quê | O que foi feito |
|---|---|---|
| "Abria e fechava" | A receita da Replit desligava sozinha quando não achava PORT e BASE_PATH | O servidor agora usa a porta 8080 sozinho |
| Erro de "plugin" no preview e tela branca | Uma linha do `playground.tsx` (`<T>(`) estava escrita de um jeito que só passava na Replit e quebrava a montagem em todo o resto | A linha foi corrigida para `<T,>(` |
| "404" e "metade de um HTML" ao salvar ou importar | A tela e o servidor eram dois programas, e só a Replit ligava um no outro | Agora o servidor também mostra a tela, tudo no mesmo endereço |
| "Comando de script não existe" | Faltava o `package.json` com os comandos | Arquivo criado (`npm run iniciar`, `start`, `build`, `dev`) |
| Faltavam as peças `@workspace/...` | Elas ficaram presas no monorepo da Replit | Foram recriadas na pasta `lib/` |
| Banco Neon (precisava de senha e de internet) | — | Agora o banco fica numa pasta do PC (`dados/banco`), sem senha e sem internet |
| Projetos sumiam | A Replit guardava tudo em `/tmp`, que é apagado | Agora tudo fica em `dados/projetos` |
| Terminal com erro no Windows | Ele só sabia usar o `sh`, que é do Linux | No Windows usa o `cmd`; no Linux e no Termux continua com o `sh` |
| Tela presa numa versão velha | O service worker usava a cópia guardada antes da nova | Agora pega primeiro a versão nova |
| Playground logo de cara | — | Playground e Assistente foram para o cantinho, junto da Configuração; a tela inicial mostra os seus projetos |

## Novidades de 07/10/2026
- **Histórico (Git):** botão **Histórico** no alto do projeto. Mostra todas as versões salvas, procura um texto em TODAS as versões (ex.: `bcdata`, `tjmg`, `sucumbência`), mostra um arquivo como era, o que mudou, **restaura como cópia** (não apaga o atual) ou substitui, baixa uma versão inteira em .zip e gera o **relatório do histórico (.txt)**. Precisa do Git instalado no PC (`winget install Git.Git`).
- **Trazer histórico de outro lugar:** se o projeto veio sem a pasta `.git`, no PC onde está a pasta original rode `git bundle create "%USERPROFILE%\Desktop\projeto-completo.bundle" --all` e escolha esse arquivo no Histórico.
- **Importar .tar, .tar.gz e .tgz** (os exports antigos da Replit), além de .zip. Se o arquivo trouxer a pasta `.git`, o Histórico já aparece.
- **Conta do GitHub salva (como no SK):** em "Importar do GitHub" cole o token UMA vez (marque "repo" ao criar em github.com/settings/tokens/new). Ele fica salvo neste computador, aparece seu nome e a lista dos seus repositórios: um toque em **Importar** e pronto.
- **Enviar para um repositório que já existe:** botão **GitHub** dentro do projeto → escolha o repositório → **Enviar**. O repositório fica igual ao projeto; as versões antigas continuam no histórico do GitHub (é o seu backup). Ainda dá para criar um repositório novo pelo mesmo botão.
- **Sem o limite de 250 MB:** importa arquivos de até 4 GB (o arquivo vai direto para o disco, sem encher a memória).
- **Preview honesto:** antes, se o projeto não dissesse a porta em 30 s, o CodeLens fingia "rodando na porta 3000". Agora ele confere; se não abriu, explica o motivo.
- **Banco que se conserta sozinho:** se o computador desligar com o CodeLens aberto e o banco estragar, o banco velho é guardado de lado (nada é apagado), um novo é criado e os projetos da pasta `dados/projetos` são reencontrados. Fica um aviso em `dados/AVISO-banco-recuperado.txt`.

## IA
Cole a sua chave em **Configurações** (Groq, Gemini, OpenRouter…). O "Gemini da Replit" não existe fora de lá.

## Para quem mexe no código
- `npm run dev` liga a tela (5173) e o servidor (8080) juntos, com o "carteiro" do `/api`, e atualiza enquanto você edita.
- `npm run build` monta a tela em `dist/`.
- `npm start` liga só o servidor, que também mostra a tela de `dist/`.
- `.github/workflows/teste.yml` testa tudo sozinho no GitHub, no Linux e no Windows, a cada envio. Verde quer dizer que está funcionando. Ele não gera arquivo para baixar.
- `.github/workflows/windows.yml` gera o **CodeLens-Windows.zip** pronto, já testado, e publica em Releases.

## Pastas
| Pasta | O que é |
|---|---|
| `src/` | a tela (React) |
| `server/` | o servidor (antes se chamava "api server") |
| `lib/db` | o banco local (substitui o `@workspace/db`) |
| `lib/api-zod` | a conferência dos pedidos (substitui o `@workspace/api-zod`) |
| `lib/api-client-react` | a ligação da tela com o servidor (substitui o `@workspace/api-client-react`) |
| `public/` | ícones, manifest e service worker |
| `scripts/iniciar.mjs` | o que o `iniciar.bat` usa: instala, monta, liga e abre o navegador |

## Chave nova do Gemini — "AQ." (08/10/2026)
O Google mudou as chaves do Gemini: as novas começam com **AQ.** (as antigas, **AIza**, param de funcionar em setembro). As novas são recusadas no caminho "compatível com OpenAI" que o programa usava.
- Agora o programa **reconhece AIza e AQ.** em todos os lugares onde se cola chave.
- Uma "ponte" (`gemini-ponte.ts`) traduz sozinha qualquer pedido ao Gemini para o caminho próprio dele, que aceita as duas chaves. Nenhuma tela precisou mudar.
- O modelo padrão do Gemini passou de `gemini-2.0-flash` (antigo) para `gemini-2.5-flash`.

## Conserto de 09/10/2026 — "só funcionava no primeiro dia"
**Causa:** quando a janela preta era fechada (ou o PC desligava) com o programa aberto, o banco local deixava uma **trava** na pasta `dados/banco`. No dia seguinte o banco não abria: aparecia "Aborted()", "aperte qualquer tecla" e fechava.
**O que mudou:**
1. Antes de abrir, o programa **tira a trava velha** sozinho. Na maioria das vezes isso já resolve, e os seus dados continuam lá.
2. Se mesmo assim o banco não abrir, o programa **não fecha mais**: guarda o banco com defeito ao lado (`dados/banco-com-defeito-…`, nada é apagado), cria um banco novo e segue. Deixa um aviso em `dados/AVISO-banco-recuperado.txt`.
**Se já estava quebrado:** troque pelos arquivos desta versão (mantenha a sua pasta `dados`) e abra de novo.
**Para fechar do jeito certo:** na janela preta, aperte **Ctrl + C** e espere ela terminar.

## Porta automática (09/10/2026)
Você não precisa mais mexer com "porta". Ao abrir:
- se o programa **já estiver aberto** (ficou ligado de antes), ele só abre o navegador nele — não abre outro por cima (isso estragaria o banco);
- se a porta de sempre estiver **ocupada por outro programa**, ele escolhe sozinho uma livre (5001, 5002…) e abre o navegador nela. O endereço certo aparece escrito na janela preta.

## 📱 No celular, pelo Termux (09/10/2026)
O Termux vira o "computador" dentro do celular: o CodeLens roda nele, o **terminal do CodeLens passa a rodar comandos de verdade** (git, node, python…) e você usa a tela pelo Chrome — instalado como app.

**Uma vez só** (copie e cole no Termux, uma linha por vez):
```
termux-setup-storage
pkg install -y nodejs-lts unzip
cd ~ && unzip -o storage/downloads/CodeLens-local-09-10-c.zip -d codelens
cd ~/codelens && sh termux-atalho.sh
```
(Se o zip estiver com outro nome na pasta Download, troque no comando.)

**Para abrir:** no Termux, `cd ~/codelens && sh iniciar.sh` — ou, com o app **Termux:Widget**, toque no atalho **CodeLens** na tela inicial.
Na 1ª vez ele instala as peças e monta a tela (demora bastante no celular — deixe a tela ligada). Depois abre o Chrome sozinho em `http://localhost:8080`.

**Virar app:** com ele aberto no Chrome → menu ⋮ → **Instalar app**. Fica um ícone igual a um app. (Funciona porque `localhost` é aceito como seguro; não precisa de APK.)
Lembre: o ícone só abre se o Termux estiver ligado com o CodeLens rodando (o atalho faz isso).

**Fechar do jeito certo (para não estragar o banco):** no Termux, aperte **Volume-baixo + C** (é o Ctrl+C do Termux).
**Seus dados** ficam em `~/codelens/dados`. Para backup: `cp -r ~/codelens/dados ~/storage/downloads/codelens-dados-backup`.
