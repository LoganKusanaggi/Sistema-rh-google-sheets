const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Aceita múltiplos nomes de variáveis para compatibilidade com Vercel
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Singleton do cliente Supabase inicializado de forma segura.
 */
let supabaseInstance = null;

function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  if (!supabaseUrl || !supabaseKey) {
    // Não lançamos erro aqui para não quebrar o cold start.
    // Retornamos um proxy que lançará erro apenas quando for usado em uma query.
    console.error('[Supabase Config] ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_KEY/ROLE ausentes.');
    
    return new Proxy({}, {
      get: function(target, prop) {
        return (...args) => {
          console.error(`[Supabase Proxy] Tentativa de usar property "${String(prop)}" sem configuração.`);
          const err = new Error('Configuração do Supabase incompleta no servidor (Vercel Env Vars).');
          err.status = 500;
          throw err;
        };
      }
    });
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('[Supabase Config] Erro ao criar cliente:', err.message);
    throw err;
  }
}

// Exportamos o resultado da inicialização (Proxy ou Cliente Real)
module.exports = getSupabaseClient();

