# 🚀 Sistema RH Supabase v2.0

Sistema completo de gestão de RH com integração Google Sheets e Supabase.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura do Banco](#estrutura-do-banco)
- [API Endpoints](#api-endpoints)
- [Google Sheets](#google-sheets)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

**SUPABASE = Única fonte da verdade**  
**GOOGLE SHEETS = Interface + Gerador de relatórios**

### Fluxo de Trabalho

1. **Buscar** colaboradores no banco (com filtros)
2. **Selecionar** quais colaboradores
3. **Gerar** relatório com layout específico
4. **Editar/Exportar** conforme necessário

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Google Sheets  │ ← Interface do usuário
└────────┬────────┘
         │ Apps Script
         ↓
┌─────────────────┐
│   API Express   │ ← Backend Node.js
└────────┬────────┘
         │ Supabase Client
         ↓
┌─────────────────┐
│    Supabase     │ ← Banco de dados PostgreSQL
└─────────────────┘
```

---

## 💻 Tecnologias

- **Backend**: Node.js + Express
- **Banco de Dados**: Supabase (PostgreSQL)
- **Frontend**: Google Sheets + Apps Script
- **Deploy**: Vercel
- **Bibliotecas**:
  - `@supabase/supabase-js` - Cliente Supabase
  - `express` - Framework web
  - `cors` - CORS middleware
  - `dotenv` - Variáveis de ambiente
  - `xlsx` - Manipulação de Excel (opcional)

---

## 📦 Instalação

### 1. Clonar Repositório

```bash
git clone https://github.com/seu-usuario/sistema-rh-supabase.git
cd sistema-rh-supabase
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_KEY=sua_service_role_key
PORT=3000
NODE_ENV=development
```

### 4. Criar Banco de Dados

1. Acesse o [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo do arquivo `schema.sql`
5. Execute o SQL

✅ Banco de dados criado!

---

## ⚙️ Configuração

### Executar Localmente

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

A API estará disponível em: `http://localhost:3000`

### Testar API

Use o arquivo `test.http` com extensões como:
- REST Client (VS Code)
- Thunder Client (VS Code)
- Postman

Ou acesse diretamente:
- Health Check: `http://localhost:3000/api/health`
- Listar Colaboradores: `http://localhost:3000/api/colaboradores`

---

## 🗄️ Estrutura do Banco

### Tabelas Principais

1. **colaboradores** - Dados dos funcionários
2. **folha_pagamento** - Folhas de pagamento mensais
3. **beneficios** - Benefícios dos colaboradores
4. **apuracao_variavel** - Comissões e variáveis
5. **apontamentos** - Controle de ponto
6. **seguros** - Seguros de vida

### Diagrama ER Simplificado

```
colaboradores (1) ──→ (N) folha_pagamento
colaboradores (1) ──→ (N) beneficios
colaboradores (1) ──→ (N) apuracao_variavel
colaboradores (1) ──→ (N) apontamentos
colaboradores (1) ──→ (N) seguros
```

### Campos Principais

#### colaboradores
- `id` (UUID)
- `cpf` (VARCHAR, UNIQUE)
- `nome_completo`
- `email`, `telefone`
- `cargo`, `departamento`
- `status` (ativo, inativo, ferias, afastado)
- `data_admissao`, `data_demissao`

#### folha_pagamento
- `id` (UUID)
- `colaborador_id` (FK)
- `mes_referencia`, `ano_referencia`
- Proventos: `salario_base`, `horas_extras`, `comissoes`, etc.
- Descontos: `inss`, `irrf`, `vale_transporte`, etc.
- `salario_liquido` (calculado)

#### beneficios
- `tipo_beneficio` (vale_refeicao, plano_saude, etc.)
- `valor`, `quantidade`, `valor_total`
- `fornecedor`

#### apuracao_variavel
- Métricas por marca: Caffeine, Sublyme, Koala
- FAT (faturamento) e POS (pontos de venda)
- `multiplicador`, `valor_variavel`

#### apontamentos
- `tipo_apontamento` (presenca, falta, hora_extra, etc.)
- Horários: `hora_entrada`, `hora_saida`
- `horas_trabalhadas`, `horas_extras`

#### seguros
- `seguradora`, `apolice`
- `valor_cobertura`, `premio_mensal`
- `beneficiario_nome`, `beneficiario_cpf`

---

## 🔌 API Endpoints

### Colaboradores

```http
GET    /api/colaboradores              # Listar todos
GET    /api/colaboradores/:cpf         # Buscar por CPF
POST   /api/colaboradores              # Criar novo
PUT    /api/colaboradores/:cpf         # Atualizar
DELETE /api/colaboradores/:cpf         # Deletar
POST   /api/colaboradores/batch        # Criar em lote
POST   /api/colaboradores/buscar       # Buscar com filtros
```

### Folha de Pagamento

```http
GET    /api/folha                      # Listar todas
GET    /api/folha/:cpf                 # Por CPF
GET    /api/folha/:cpf/:ano/:mes       # Por período
POST   /api/folha                      # Criar
PUT    /api/folha/:id                  # Atualizar
DELETE /api/folha/:id                  # Deletar
POST   /api/folha/batch                # Criar em lote
```

### Benefícios

```http
GET    /api/beneficios                 # Listar todos
GET    /api/beneficios/:cpf            # Por CPF
GET    /api/beneficios/:cpf/:ano/:mes  # Por período
POST   /api/beneficios                 # Criar
PUT    /api/beneficios/:id             # Atualizar
DELETE /api/beneficios/:id             # Deletar
POST   /api/beneficios/batch           # Criar em lote
```

### Variável/Comissões

```http
GET    /api/variavel                   # Listar todas
GET    /api/variavel/:cpf              # Por CPF
POST   /api/variavel                   # Criar
PUT    /api/variavel/:id               # Atualizar
POST   /api/variavel/batch             # Criar em lote
```

### Apontamentos

```http
GET    /api/apontamentos               # Listar todos
GET    /api/apontamentos/:cpf          # Por CPF
POST   /api/apontamentos               # Criar
PUT    /api/apontamentos/:id           # Atualizar
POST   /api/apontamentos/batch         # Criar em lote
```

### Seguros

```http
GET    /api/seguros                    # Listar todos
GET    /api/seguros/:cpf               # Por CPF
POST   /api/seguros                    # Criar
PUT    /api/seguros/:id                # Atualizar
```

### Relatórios

```http
GET    /api/relatorios/tipos           # Tipos disponíveis
POST   /api/relatorios/gerar           # Gerar relatório
```

**Tipos de relatórios:**
- `folha` - Folha de pagamento
- `beneficios` - Benefícios
- `variavel` - Comissões
- `apontamentos` - Ponto
- `seguros` - Seguros de vida

---

## 📊 Google Sheets

### Configuração

1. Crie uma nova planilha no Google Sheets
2. Vá em **Extensões** → **Apps Script**
3. Cole o código do arquivo `google-apps-script.js`
4. **IMPORTANTE**: Altere a constante `API_URL` para sua URL da Vercel
5. Salve o projeto (Ctrl+S)
6. Atualize a planilha

### Menu Personalizado

Após configurar, você terá o menu **📊 Sistema RH** com:

- **🔍 Buscar Colaboradores**
  - Todos os Colaboradores
  - Somente Ativos
  - Por Departamento

- **📄 Gerar Relatórios**
  - Folha de Pagamento
  - Benefícios
  - Variável/Comissões
  - Apontamentos
  - Seguros

### Uso

1. Clique em **Sistema RH** → **Buscar Colaboradores**
2. Selecione os colaboradores desejados (checkbox)
3. Clique em **Sistema RH** → **Gerar Relatórios** → Escolha o tipo
4. Informe o período (mês/ano)
5. Nova aba será criada com o relatório!

---

## 🚀 Deploy

### Vercel (Recomendado)

#### Via Interface Web

1. Acesse [vercel.com](https://vercel.com)
2. Login com GitHub
3. **New Project** → Selecione o repositório
4. Configure **Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `NODE_ENV=production`
5. **Deploy**

#### Via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Configurar CORS no Supabase

1. Acesse seu projeto no Supabase
2. **Settings** → **API**
3. **CORS Settings** → Adicione:
   - `https://seu-projeto.vercel.app`
   - `https://docs.google.com` (para Google Sheets)

---

## 🔧 Troubleshooting

### Erro: "Cannot find module"

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "CORS blocked"

**Causa**: Domínio não autorizado no Supabase

**Solução:**
1. Supabase → Settings → API → CORS
2. Adicione o domínio da Vercel e Google Sheets

### Erro: "Invalid API key"

**Causa**: Chave do Supabase incorreta ou expirada

**Solução:**
1. Verifique o arquivo `.env`
2. Confirme as chaves no Supabase → Settings → API
3. Use `SUPABASE_SERVICE_KEY` no backend (não a anon key)

### Erro: "Table does not exist"

**Causa**: Schema SQL não foi executado

**Solução:**
1. Acesse Supabase → SQL Editor
2. Execute o arquivo `schema.sql` completo

### Google Sheets não conecta

**Causa**: URL da API incorreta ou CORS

**Solução:**
1. Verifique a constante `API_URL` no Apps Script
2. Teste a URL no navegador: `https://sua-url/api/health`
3. Configure CORS no Supabase

### Relatório vazio

**Causa**: Não há dados para o período selecionado

**Solução:**
1. Verifique se existem dados no banco
2. Confirme o período (mês/ano)
3. Teste a API diretamente com o arquivo `test.http`

---

## 📁 Estrutura do Projeto

```
sistema-rh-supabase/
├── src/
│   ├── config/
│   │   └── supabase.js           # Configuração Supabase
│   ├── controllers/
│   │   ├── colaboradorController.js
│   │   ├── folhaController.js
│   │   ├── beneficiosController.js
│   │   ├── variavelController.js
│   │   ├── apontamentosController.js
│   │   ├── segurosController.js
│   │   └── relatoriosController.js
│   ├── services/
│   │   └── relatorioService.js   # Lógica de relatórios
│   ├── templates/
│   │   ├── folha.template.js
│   │   ├── beneficios.template.js
│   │   ├── variavel.template.js
│   │   ├── apontamentos.template.js
│   │   └── seguros.template.js
│   ├── routes/
│   │   └── index.js              # Rotas da API
│   ├── utils/
│   │   └── validators.js         # Validações (CPF, etc)
│   └── index.js                  # Servidor Express
├── .env                          # Variáveis de ambiente (não commitar)
├── .env.example                  # Template de variáveis
├── .gitignore                    # Arquivos ignorados
├── package.json                  # Dependências
├── vercel.json                   # Config Vercel
├── schema.sql                    # Schema do banco
├── test.http                     # Testes de API
├── google-apps-script.js         # Código Google Sheets
└── README.md                     # Este arquivo
```

---

## 📝 Licença

MIT

---

## 👨‍💻 Autor

Sistema desenvolvido para gestão de RH com integração Supabase + Google Sheets

---

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Express](https://expressjs.com/)
- [Documentação Vercel](https://vercel.com/docs)
- [Google Apps Script](https://developers.google.com/apps-script)

---

**Versão:** 2.0.0  
**Arquitetura:** Corrigida ✅
