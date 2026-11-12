// Importa provas/*.json para o Supabase. Uso: node --env-file=.env scripts/importar-prova.mjs [arquivo.json ...]
// Precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (nunca coloque a service role no front-end).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (veja .env.example).'); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });
const arquivos = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('provas').filter((f) => f.endsWith('.json')).map((f) => join('provas', f));

for (const a of arquivos) {
  const p = JSON.parse(readFileSync(a, 'utf8'));
  const { error: e1 } = await sb.from('provas').upsert({ id: p.slug, titulo: p.titulo, banca: p.banca, orgao: p.orgao, cargo: p.cargo, ano: p.ano, tipo: p.tipo, liquida: Boolean(p.liquida), total_questoes: p.questoes.length, gabarito_fonte: p.gabaritoFonte ?? null });
  if (e1) { console.error(`${a}: ${e1.message}`); process.exit(1); }
  const linhas = p.questoes.map((q) => ({
    id: `${p.slug}:${q.numero}`, prova_id: p.slug, numero: q.numero, disciplina: q.disciplina, assunto: q.assunto, tipo: q.tipo ?? p.tipo,
    enunciado: q.enunciado, imagem: q.imagem ?? null, imagem_alt: q.imagemAlt ?? null, alternativas: q.alternativas ?? [], gabarito: q.gabarito,
    dificuldade: q.dificuldade, armadilha: q.armadilha, explicacao: q.explicacao, dica: q.dica, pegadinha: q.pegadinha,
    por_que_errada: q.porQueErrada ?? {}, anulada: Boolean(q.anulada), revisar: Boolean(q.revisar),
  }));
  for (let i = 0; i < linhas.length; i += 50) {
    const { error } = await sb.from('questoes').upsert(linhas.slice(i, i + 50));
    if (error) { console.error(`${a}: ${error.message}`); process.exit(1); }
  }
  console.log(`✓ ${p.titulo}: ${linhas.length} questões importadas`);
}
