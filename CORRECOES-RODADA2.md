# 📋 CORREÇÕES RODADA 2 — Sistema RH (GAS + Vercel + Supabase)

**Data:** 23 de março de 2026  
**Versão:** 2.1.0  
**Status:** ✅ Implementado

---

## 🎯 Resumo das Correções

Este documento descreve todas as correções técnicas implementadas para resolver os 6 problemas diagnosticados no código-fonte do Sistema RH.

---

## ✅ PROBLEMA 1 — Filtros do dashboard não funcionavam

### O que foi feito

#### Backend Vercel (`src/controllers/dashboardController.js`)
- ✅ Adicionado suporte a **query params**: `mes`, `ano`, `departamento`
- ✅ Todas as queries Supabase agora aplicam filtros dinamicamente
- ✅ Filtros são usados em: colaboradores, folha, benefícios, variável, turnover, vagas, gráficos

#### Google Apps Script (`google-apps-script.js`)
- ✅ **Barra de filtros** já existia no HTML (mes/ano/depto)
- ✅ Adicionada função `popularDepartamentos(graficos)` — popula select com dados reais do backend
- ✅ Adicionada função `limparFiltros()` — reseta filtros e recarrega dashboard
- ✅ Atualizada função `aplicarFiltros()` — inclui status visual e handlers de erro
- ✅ Adicionado botão "✕ Limpar" na UI
- ✅ Adicionado span `filtro_status` para feedback visual

### Como usar
1. Abrir Dashboard Gerencial RH
2. Selecionar mês, ano e/ou departamento
3. Clicar em "🔍 Aplicar"
4. Para limpar: clicar em "✕ Limpar"

---

## ✅ PROBLEMA 2 — KPIs zerados (Folha, Benefícios, Variável, Turnover, Ticket Médio)

### O que foi feito

#### Backend Vercel — Queries Reimplementadas

| KPI | Tabela Supabase | Campos | Cálculo |
|-----|-----------------|--------|---------|
| **Folha Bruta** | `folha_pagamento` | `salario_base` | Soma de `salario_base` no período filtrado |
| **Benefícios** | `beneficios` | `valor_total` | Soma de `valor_total` no período filtrado |
| **Variável** | `variavel` | `valor` | Soma de `valor` no período filtrado |
| **Turnover** | `colaboradores` | `data_demissao` | `(desligados_no_mês / media_headcount) * 100` |
| **Ticket Médio** | — | — | `folhaAtual / totalAtivos` |

### Fórmulas Implementadas

```js
// Turnover
const desligados = count(colaboradores WHERE data_demissao BETWEEN inicioMes AND fimMes)
const mediaHeadcount = (totalAtivos + desligados) / 2
turnover = (desligados / mediaHeadcount) * 100

// Ticket Médio
ticketMedio = folhaAtual / totalAtivos

// Variação Month-over-Month
variacao = ((atual - anterior) / anterior) * 100
```

### Sparklines (6 meses)
- ✅ Implementada função helper `getSparklineMensal()`
- ✅ Busca últimos 6 meses anteriores ao período filtrado
- ✅ Retorna array de valores para mini-gráficos nos cards

---

## ✅ PROBLEMA 3 — Gráfico "Top Performers (Variável)" em branco

### O que foi feito

#### Backend Vercel
```js
// Query implementada
const qPerformers = supabase
    .from('variavel')
    .select('cpf, valor, nome_colaborador')
    .eq('mes_referencia', mes)
    .eq('ano_referencia', ano);

// Agrupamento por CPF
const mapPerf = {};
(perfRows || []).forEach(r => {
    if (!mapPerf[r.cpf]) mapPerf[r.cpf] = { nome: r.nome_colaborador || r.cpf, valor: 0 };
    mapPerf[r.cpf].valor += parseFloat(r.valor) || 0;
});

// Join com colaboradores para buscar nomes (fallback)
if (cpfsPerf.length > 0) {
    const { data: collabs } = await supabase
        .from('colaboradores')
        .select('cpf, nome_completo')
        .in('cpf', cpfsPerf);
    (collabs || []).forEach(c => {
        if (mapPerf[c.cpf]) mapPerf[c.cpf].nome = c.nome_completo;
    });
}

// Top 8 performers
const performers = Object.values(mapPerf)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8)
    .map(p => ({
        nome: p.nome.split(' ').slice(0, 2).join(' '),
        valor: parseFloat(p.valor.toFixed(2))
    }));
```

### Resultado
- ✅ Gráfico de barras horizontal exibe top 8 colaboradores
- ✅ Valores em R$ (variável/bônus)
- ✅ Nomes truncados (primeiro + segundo nome) para caber no gráfico

---

## ✅ PROBLEMA 4 — Letreiro (ticker): conteúdo mais útil

### O que foi feito

#### Backend Vercel — Array de Alertas

```js
const alertas = [
    // 1. Resumo Ativos/Inativos
    { mensagem: '👥 Ativos: 150 | Inativos: 12' },
    
    // 2. Folha do Mês (se tiver dados)
    { mensagem: '💰 Folha Mar/2025: R$ 450.000,00' },
    
    // 3. Ticket Médio
    { mensagem: '🎯 Ticket Médio: R$ 3.000,00' },
    
    // 4. Turnover
    { mensagem: '🔄 Turnover Mar: 2.5%' },
    
    // 5. Aniversariantes do Mês (um por pessoa)
    { mensagem: '🎂 Aniversário: João (dia 15)' },
    { mensagem: '🎂 Aniversário: Maria (dia 22)' },
    
    // Fallback se não houver aniversariantes
    { mensagem: '🎂 Sem aniversariantes em Mar' }
];
```

### Frontend GAS
- ✅ Itera sobre `payload.alertas[]`
- ✅ Exibe cada `{ mensagem: string }` no letreiro
- ✅ Clique no item navega para seção relacionada

---

## ✅ PROBLEMA 5 — "Vagas Abertas" mostrando valor 7 incorreto

### Diagnóstico
Valor 7 estava **hardcoded** no código anterior.

### Correção
```js
let vagasAbertas = 0;
try {
    const { count: cntVagas } = await supabase
        .from('vagas')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'aberta');
    vagasAbertas = cntVagas || 0;
} catch (eVagas) {
    // Tabela não existe → retornar 0 sem quebrar
    vagasAbertas = 0;
    console.warn('Tabela vagas não encontrada:', eVagas.message);
}
```

### Resultado
- ✅ Se tabela `vagas` existir: retorna count real de vagas abertas
- ✅ Se tabela não existir: retorna 0 (sem erro)
- ✅ KPI mostra valor correto ou 0

---

## ✅ PROBLEMA 6 — Submenu "Central de Relatórios (Avançado)" sumiu

### Diagnóstico
- ✅ Código do `onOpen()` está **correto**
- ✅ Função `mostrarModalRelatoriosAvancados` existe
- ✅ Problema era de **deploy do GAS** (re-trigger do `onOpen`)

### Solução (orientação)
1. No editor do Google Apps Script: **Executar > Executar função > `onOpen`**
2. Autorizar permissões se solicitado
3. Recarregar a planilha no Google Sheets

---

## 📊 Estrutura de Dados Esperada (Supabase)

| Tabela | Campos Obrigatórios |
|--------|---------------------|
| `colaboradores` | `cpf`, `nome_completo`, `status`, `departamento`, `data_admissao`, `data_demissao`, `data_nascimento` |
| `folha_pagamento` | `cpf`, `salario_base`, `mes_referencia`, `ano_referencia`, `departamento` |
| `beneficios` | `cpf`, `valor_total`, `mes_referencia`, `ano_referencia`, `departamento` |
| `variavel` | `cpf`, `nome_colaborador` (opcional), `valor`, `mes_referencia`, `ano_referencia`, `departamento` |
| `vagas` | `status` ('aberta', 'fechada') — *opcional* |

---

## 🧪 Testes Recomendados

### Backend Vercel
```bash
# Testar endpoint sem filtros
curl https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis

# Testar com filtros
curl "https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis?mes=3&ano=2025&departamento=Comercial"
```

### Google Apps Script
1. Abrir planilha → Menu `🔄 Sistema RH` → `📈 Dashboard Gerencial RH`
2. Verificar se filtros aparecem preenchidos (departamentos)
3. Aplicar filtros e validar atualização dos KPIs
4. Validar letreiro com informações úteis
5. Validar gráfico Top Performers

---

## 📝 Próximos Passos

1. **Deploy Backend Vercel:**
   ```bash
   cd src
   git add .
   git commit -m "corr: dashboard kpis com queries reais e filtros"
   git push
   # Vercel faz deploy automático
   ```

2. **Deploy GAS:**
   - Copiar conteúdo de `google-apps-script.js`
   - Colar no editor do Google Apps Script
   - Salvar (Ctrl+S)
   - Executar `onOpen()` manualmente para re-trigger do menu

3. **Validação em Produção:**
   - Aguardar 2-3 minutos após deploy
   - Abrir planilha e testar dashboard
   - Verificar logs no Vercel e Supabase

---

## 🔧 Arquivos Modificados

| Arquivo | Alterações |
|---------|------------|
| `src/controllers/dashboardController.js` | Reescrito completamente (380 linhas) |
| `google-apps-script.js` | Adições: `popularDepartamentos()`, `limparFiltros()`, UI filters |

---

## 📌 Checklist de Validação

- [ ] Backend: KPIs retornam valores reais (não zero)
- [ ] Backend: Filtros mes/ano/depto funcionam
- [ ] Backend: Top Performers retorna array de colaboradores
- [ ] Backend: Alertas tem formato `{ mensagem: string }`
- [ ] Backend: Vagas abertas retorna count real ou 0
- [ ] GAS: Barra de filtros visível e funcional
- [ ] GAS: Select de departamentos populado
- [ ] GAS: Botão "Limpar" funcional
- [ ] GAS: Letreiro exibe informações úteis
- [ ] GAS: Gráfico Top Performers renderiza

---

**Implementado por:** Assistant  
**Revisão Pendente:** @paulo.rodrigues
