# Meu SaaS — Guia de Ativação

Este projeto já vem pronto com Next.js + Tailwind + Shadcn (config) + Prisma (schema) +
integrações preparadas para Clerk, Claude API, Resend, Asaas e PostHog.

O que falta e só voce fazer (exige seu e-mail/senha pessoal, ninguem pode fazer por voce):

## Passo 1 - Subir para o GitHub (2 min)
1. Acesse github.com/new pelo navegador do tablet
2. Nome do repositorio: meu-saas -> Create repository (deixe vazio, sem README)
3. Na tela do repo vazio, clique em "uploading an existing file"
4. Extraia o .zip que te enviei e arraste todos os arquivos/pastas para essa area
5. Commit changes

## Passo 2 - Abrir num editor completo na nuvem (1 min)
1. No seu repositorio no GitHub, clique no botao verde "Code"
2. Aba "Codespaces" -> "Create codespace on main"
3. Isso abre um VS Code completo com terminal Linux, rodando no navegador -
   funciona perfeitamente no tablet. Espere 1-2 min para o ambiente instalar.

## Passo 3 - Criar as contas e pegar as chaves
Faca isso na ordem, uma de cada vez. Depois de cada uma, cole a chave no arquivo
.env.local (copie de .env.example primeiro, rode no terminal do Codespaces: cp .env.example .env.local)

| # | Servico | Link | O que fazer |
|---|---------|------|--------------|
| 1 | Neon (voce ja tem) | console.neon.tech | Copie a Connection String (aba "Prisma") |
| 2 | Clerk | clerk.com -> Sign up gratis | Criar app -> copiar as 2 chaves |
| 3 | Anthropic Console | console.anthropic.com | Criar conta -> Settings -> API Keys -> Create Key |
| 4 | Resend (voce ja tem) | resend.com | Settings -> API Keys -> copiar |
| 5 | Asaas (voce ja tem) | asaas.com.br | Integracoes -> API -> copiar chave sandbox |
| 6 | PostHog (voce ja tem) | app.posthog.com | Project Settings -> copiar Project API Key |

## Passo 4 - Rodar o projeto
No terminal do Codespaces (ja aberto na tela), rode:

npm install
npx prisma generate
npx prisma db push
npm run dev

O Codespaces vai mostrar um link tipo https://xxxx-3000.app.github.dev -
clique nele para ver o site rodando, direto no navegador do tablet.

## Passo 5 - Colocar no ar (deploy)
1. Acesse vercel.com -> Sign up com sua conta GitHub
2. Import Project -> selecione o repositorio meu-saas
3. Cole todas as variaveis do .env.local em Environment Variables
4. Deploy - em ~2 minutos seu site esta no ar com SSL automatico

## O que ja esta pronto neste projeto
- Next.js 14 com TypeScript e App Router
- Tailwind CSS configurado
- Shadcn/ui preparado (rode npx shadcn@latest add button card input no Codespaces)
- Schema Prisma com models de User, Client (CRM) e Product
- .env.example com todas as variaveis mapeadas

## Se algo der errado
Volte na conversa com o Claude e cole a mensagem de erro exata - resolvemos juntos.
