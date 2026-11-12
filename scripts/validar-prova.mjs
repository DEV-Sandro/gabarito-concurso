// Uso: node scripts/validar-prova.mjs [provas/arquivo.json ...]  (sem argumentos: valida todas)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ARMADILHAS = ['palavra-absoluta', 'troca-de-conceito', 'extrapolacao', 'inversao', 'parcialmente-correta', 'excecao', 'caso-concreto', 'lei-seca', 'jurisprudencia', 'calculo-raciocinio', 'pegadinha-gramatical'];
const arquivos = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('provas').filter((f) => f.endsWith('.json')).map((f) => join('provas', f));
let problemas = 0;
const erro = (a, m) => { problemas++; console.error(`✗ ${a}: ${m}`); };

for (const a of arquivos) {
  const p = JSON.parse(readFileSync(a, 'utf8'));
  for (const c of ['slug', 'titulo', 'banca', 'orgao', 'cargo', 'ano', 'tipo']) if (!p[c]) erro(a, `campo "${c}" ausente`);
  const nums = new Set();
  for (const q of p.questoes ?? []) {
    const id = `Q${q.numero}`;
    if (nums.has(q.numero)) erro(a, `${id} duplicada`);
    nums.add(q.numero);
    const tipo = q.tipo ?? p.tipo;
    const letras = tipo === 'ce' ? ['C', 'E'] : (q.alternativas ?? []).map((x) => x.letra);
    if (tipo === 'mc' && letras.length < 4) erro(a, `${id} com menos de 4 alternativas`);
    if (!letras.includes(q.gabarito)) erro(a, `${id} gabarito "${q.gabarito}" não está nas alternativas`);
    if (!q.enunciado?.trim()) erro(a, `${id} sem enunciado`);
    if (!ARMADILHAS.includes(q.armadilha)) erro(a, `${id} armadilha inválida "${q.armadilha}"`);
    if (![1, 2, 3].includes(q.dificuldade)) erro(a, `${id} dificuldade inválida`);
    for (const c of ['explicacao', 'dica', 'pegadinha', 'assunto', 'disciplina']) if (!q[c]?.trim()) erro(a, `${id} sem "${c}"`);
    const esperadas = letras.filter((l) => l !== q.gabarito).sort().join('');
    const dadas = Object.keys(q.porQueErrada ?? {}).sort().join('');
    if (!q.anulada && esperadas !== dadas) erro(a, `${id} porQueErrada deveria ter ${esperadas} e tem ${dadas}`);
  }
  console.log(`${problemas ? '' : '✓ '}${a}: ${p.questoes?.length ?? 0} questões`);
}
if (problemas) { console.error(`\n${problemas} problema(s).`); process.exit(1); }
console.log('Tudo certo.');
