# Sistema de Disparo de E-mails em Massa (MVP)

## Visão Geral

O objetivo deste projeto é criar uma aplicação web simples, moderna e funcional para envio de e-mails em massa.

Esta será a primeira versão (MVP), focada exclusivamente no envio dos e-mails, sem qualquer sistema de autenticação, banco de dados ou armazenamento de informações.

A aplicação deverá funcionar inteiramente em memória durante a execução.

---

# Objetivos

A aplicação deverá permitir:

- Informar o assunto do e-mail.
- Colar uma lista de destinatários em formato JSON.
- Escrever uma mensagem utilizando um editor HTML.
- Fazer upload de imagens para utilizar no corpo do e-mail.
- Configurar envio em lotes.
- Configurar intervalo entre os lotes.
- Iniciar o envio.
- Acompanhar o progresso em tempo real.
- Visualizar logs de sucesso e erro.

---

# Escopo do MVP

## O sistema NÃO deve possuir

- Login
- Cadastro de usuários
- Google Login
- JWT
- Banco de dados
- Supabase
- Histórico
- Templates
- Dashboard
- Agendamento
- Configurações avançadas
- Persistência de dados
- Permissões
- Campanhas salvas

Todo o estado da aplicação existirá apenas enquanto a página estiver aberta.

Ao atualizar ou fechar a página, todas as informações serão perdidas.

---

# Tecnologias

## Frontend

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form
- Tiptap (Editor HTML)

## Backend

Utilizar apenas API Routes do próprio Next.js.

Não utilizar Express.

Bibliotecas:

- Nodemailer

---

# Layout da Aplicação

A aplicação será composta por apenas **uma única tela**.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                 Disparador de E-mails em Massa               │
│                                                              │
├──────────────────────────────────────────────────────────────┤

Assunto

┌──────────────────────────────────────────────────────────┐
│                                                          │
└──────────────────────────────────────────────────────────┘


Lista de Emails (JSON)

┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘


Mensagem (Editor HTML)

┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘


Imagens

[ Selecionar arquivos ]


Arquivos

✔ logo.png

✔ banner.jpg

✔ imagem.png


Quantidade por lote

[100]


Intervalo entre lotes (segundos)

[30]


Botão

[ Enviar Emails ]


──────────────────────────────────────────────────────────────

Progresso

██████████████░░░░░░░░░░░░

145 / 500


Logs

✔ joao@gmail.com

✔ maria@gmail.com

✖ pedro@gmail.com

✔ ana@gmail.com

```

---

# Fluxo da Aplicação

```
Abrir aplicação

↓

Informar assunto

↓

Colar JSON

↓

Escrever mensagem

↓

Adicionar imagens

↓

Definir lote

↓

Definir intervalo

↓

Enviar

↓

Acompanhar progresso

↓

Finalizado
```

---

# Assunto

Campo simples.

Exemplo

```
Mentoria Faculdade & Primeiro Estágio
```

---

# Lista de Destinatários

O sistema deverá aceitar dois formatos.

## Formato completo

```json
[
  {
    "nome": "João",
    "email": "joao@gmail.com"
  },
  {
    "nome": "Maria",
    "email": "maria@gmail.com"
  }
]
```

## Formato simples

```json
[
  "joao@gmail.com",
  "maria@gmail.com",
  "ana@gmail.com"
]
```

O sistema deverá identificar automaticamente o formato informado.

---

# Variáveis

A mensagem poderá utilizar variáveis.

Disponíveis:

```
{{nome}}

{{email}}
```

Exemplo

Mensagem

```html
Olá {{nome}}

Recebemos seu interesse.

Obrigado.
```

Resultado

```html
Olá João

Recebemos seu interesse.

Obrigado.
```

---

# Editor HTML

Utilizar um editor visual moderno.

Funcionalidades:

- Texto
- Negrito
- Itálico
- Sublinhado
- Listas
- Links
- Cores
- Títulos
- Alinhamento
- Código HTML
- Inserção de imagens

Sugestão:

- Tiptap

---

# Upload de Imagens

O usuário poderá selecionar várias imagens.

Exemplo

```
logo.png

banner.jpg

foto.png
```

As imagens deverão ser incorporadas automaticamente ao HTML do e-mail ou enviadas como anexos inline.

---

# Configuração do Envio

Campos

Quantidade por lote

```
100
```

Intervalo

```
30 segundos
```

Fluxo

```
100 emails

↓

espera

↓

100 emails

↓

espera

↓

100 emails

↓

...
```

---

# Barra de Progresso

Durante o envio mostrar:

```
██████████████░░░░░░░

150 / 500
```

Também exibir:

- Quantidade enviada
- Quantidade restante
- Percentual
- Tempo estimado (opcional)

---

# Logs

Mostrar em tempo real.

Exemplo

```
✔ joao@gmail.com

✔ maria@gmail.com

✖ pedro@gmail.com

✔ ana@gmail.com
```

Quando houver erro

```
✖ maria@gmail.com

SMTP Timeout
```

---

# Envio dos E-mails

O sistema deverá utilizar um provedor SMTP configurável.

Exemplos:

- Amazon SES
- Brevo
- Resend
- SMTP próprio

O envio deverá respeitar:

- quantidade por lote
- intervalo configurado

---

# Arquitetura

```
┌──────────────────────────────────────┐
│              Next.js 15              │
│                                      │
│ Página única                         │
│                                      │
│ Assunto                              │
│ JSON                                 │
│ Editor HTML                          │
│ Upload                               │
│ Barra de progresso                   │
│ Logs                                 │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│          API Routes Next.js          │
│                                      │
│ Parse JSON                           │
│ Validação                            │
│ Substituição de variáveis            │
│ Controle dos lotes                   │
│ Envio via Nodemailer                 │
└─────────────────┬────────────────────┘
                  │
                  ▼
           Servidor SMTP

 Amazon SES / Resend / Brevo
```

---

# Estrutura do Projeto

```
app/
│
├── page.tsx
│
├── api/
│   └── send/
│       └── route.ts
│
components/
│
├── EmailSubject.tsx
├── EmailEditor.tsx
├── JsonInput.tsx
├── UploadImages.tsx
├── BatchConfig.tsx
├── ProgressBar.tsx
├── SendButton.tsx
├── Logs.tsx
│
lib/
│
├── sendEmails.ts
├── parseJson.ts
├── replaceVariables.ts
│
types/
│
└── email.ts
```

---

# Bibliotecas

Frontend

- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form
- Tiptap

Backend

- Nodemailer

---

# Futuras Melhorias (fora do MVP)

Quando o MVP estiver pronto, o sistema poderá evoluir para incluir:

- Login
- Supabase Auth
- Banco de dados
- Histórico
- Templates
- Dashboard
- Agendamento
- Reenvio automático
- Estatísticas
- Taxa de abertura
- Taxa de clique
- Upload permanente
- Campanhas
- Lista de contatos
- Múltiplos usuários
- Configuração de SMTP pela interface
- Fila de processamento
- Redis
- BullMQ

Essas funcionalidades **não fazem parte da primeira versão**.

---

# Prompt (Skill)

## Objetivo

Desenvolver uma aplicação web para envio de e-mails em massa utilizando Next.js 15.

O projeto será um MVP extremamente simples e não deverá utilizar autenticação nem banco de dados.

## Requisitos

Criar uma aplicação composta por apenas uma página.

A tela deverá conter:

- Campo para assunto.
- Área para colar JSON.
- Editor HTML.
- Upload de múltiplas imagens.
- Campo de quantidade por lote.
- Campo de intervalo entre lotes.
- Botão "Enviar Emails".
- Barra de progresso.
- Área de logs em tempo real.

## JSON aceito

Formato 1

```json
[
  {
    "nome": "João",
    "email": "joao@gmail.com"
  }
]
```

Formato 2

```json
[
  "joao@gmail.com",
  "maria@gmail.com"
]
```

Detectar automaticamente qual formato foi informado.

## Variáveis

O editor deverá aceitar:

```
{{nome}}

{{email}}
```

Durante o envio essas variáveis deverão ser substituídas automaticamente.

## Upload

Permitir múltiplas imagens.

As imagens deverão ser incorporadas ao HTML do e-mail.

## Envio

Enviar utilizando Nodemailer.

Os envios deverão ocorrer em lotes configuráveis, respeitando o intervalo informado.

## Tecnologias

Utilizar exclusivamente:

- Next.js 15
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form
- Tiptap
- Nodemailer

## Não utilizar

- Login
- JWT
- Google Login
- Banco de dados
- Supabase
- Express
- Histórico
- Dashboard
- Templates
- Persistência

Todo o estado da aplicação deverá existir apenas em memória durante a execução da página.