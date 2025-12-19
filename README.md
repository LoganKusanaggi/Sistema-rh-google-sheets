# 🚀 Sistema RH Supabase v2.0

## Arquitetura Correta

**SUPABASE = Única fonte da verdade**  
**GOOGLE SHEETS = Interface + Gerador de relatórios**

## Fluxo de Trabalho

1. **Buscar** colaboradores no banco (com filtros)
2. **Selecionar** quais colaboradores
3. **Gerar** relatório com layout específico
4. **Editar/Exportar** conforme necessário

## Estrutura

```
├── src/
│   ├── config/          # Configuração Supabase
│   ├── controllers/     # Lógica de negócio
│   ├── services/        # Serviços (relatórios)
│   ├── templates/       # Layouts de relatórios
│   ├── routes/          # Rotas da API
│   └── index.js         # Servidor
├── .env                 # Variáveis de ambiente
└── package.json         # Dependências
```

## Endpoints Principais

### Colaboradores
```
POST /api/colaboradores/buscar
Body: { filtros: { status, departamento, termo_busca } }
```

### Relatórios
```
POST /api/relatorios/gerar
Body: {
  tipo: "folha" | "beneficios" | "variavel" | "apontamentos" | "seguros",
  cpfs: ["111...", "222..."],
  periodo: { mes: 12, ano: 2024 }
}
```

## Instalação

```bash
npm install
npm run dev
```

## Deploy

```bash
vercel --prod
```

## Google Sheets

1. Extensões → Apps Script
2. Cole o código do `google-apps-script.js`
3. Altere `API_URL` para sua URL do Vercel
4. Salve e atualize o Sheets

## Uso

1. Aba "Colaboradores" → Buscar e selecionar
2. Menu → Relatórios → Escolher tipo
3. Sistema gera nova aba com layout correto
4. Pronto para usar/exportar!

**Versão:** 2.0.0  
**Arquitetura:** Corrigida ✅
