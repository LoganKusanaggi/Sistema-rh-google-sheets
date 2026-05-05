# Guia de Implementação: Gerenciamento Administrativo de Planos

Este documento detalha os passos necessários para ativar o novo módulo de gerenciamento de planos de saúde e odontológicos.

## 1. Banco de Dados (Supabase)
Você precisa executar a nova migration para garantir a integridade dos dados e adicionar o controle de status.

1.  Acesse o **SQL Editor** do seu projeto no Supabase.
2.  Abra o arquivo `src/database/migrations/006_admin_plans_management.sql`.
3.  Copie o conteúdo e cole no SQL Editor.
4.  Clique em **Run**.
    *   *Nota: Esta migration remove automaticamente duplicatas de faixas de preços e impede a criação de novas.*

## 2. Backend (Vercel)
Atualizamos o controller de planos e as rotas.

1.  Certifique-se de que as alterações em `src/controllers/planosController.js` e `src/routes/index.js` foram salvas.
2.  Faça o deploy do backend para a Vercel (geralmente via `git push` ou comando de deploy).
3.  **Importante**: Caso queira alterar a chave de segurança administrativa, adicione a variável de ambiente `ADMIN_API_KEY` na Vercel. Caso contrário, a chave padrão é `SISTEMA_RH_ADMIN_2025`.

## 3. Frontend (Google Apps Script)
O código principal foi atualizado para incluir o modal moderno de gerenciamento.

1.  Abra o arquivo `USE_ESTE_CODIGO.txt` neste repositório.
2.  Copie **todo o conteúdo** (mais de 7000 linhas).
3.  Vá ao Editor do Apps Script no Google Sheets.
4.  Substitua todo o código existente pelo conteúdo copiado.
5.  Salve e atualize a planilha.
6.  Acesse o menu: **🔄 Sistema RH > ⚙️ Configurações > 📋 Gerenciar Planos**.

## 4. Segurança (Opcional mas Recomendado)
Para definir sua própria chave de admin:
1.  No Apps Script, vá em **Configurações do Projeto (engrenagem) > Propriedades do Script**.
2.  Adicione a propriedade `ADMIN_API_KEY` com o valor desejado.
3.  Certifique-se de colocar a mesma chave nas variáveis de ambiente da Vercel.

---
**Status da Implementação:**
- [x] Migration SQL Criada
- [x] Endpoints Administrativos (Backend) implementados
- [x] Interface SaaS Modern (Apps Script) implementada
- [x] Sistema de Diagnóstico de integridade concluído
