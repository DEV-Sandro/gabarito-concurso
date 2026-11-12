import type { Modo, Questao, Resposta } from '../types';
import { chaveDia } from './datas';
import { agrupar, mapaQuestoes, questoesErradas, ultimaRespostaPorQuestao } from './stats';

export interface Filtro {
  modo: Modo;
  provaId?: string;
  disciplina?: string;
  assunto?: string;
}

/** Peso de cada questão para o sorteio ponderado (Efraimidis–Spirakis). */
export function pesos(qs: Questao[], respostas: Resposta[], hoje = new Date()): Map<string, number> {
  const mapa = mapaQuestoes(qs);
  const ult = ultimaRespostaPorQuestao(respostas);
  const taxa = new Map(agrupar(respostas, mapa, 'disciplina').map((l) => [l.chave, l.taxaErro]));
  const hojeKey = chaveDia(hoje);
  const feitasHoje = new Set(respostas.filter((r) => chaveDia(r.em) === hojeKey).map((r) => r.questaoId));
  const m = new Map<string, number>();
  for (const q of qs) {
    let p = 1;
    const u = ult.get(q.id);
    if (!u) p += 3;
    else if (!u.correta) p += 4;
    else {
      const dias = (hoje.getTime() - new Date(u.em).getTime()) / 86_400_000;
      if (dias < 7) p *= 0.1;
    }
    p *= 1 + 3 * (taxa.get(q.disciplina) ?? 0);
    if (feitasHoje.has(q.id)) p *= 0.05;
    m.set(q.id, p);
  }
  return m;
}

export function escolher(qs: Questao[], respostas: Resposta[], n: number, rng: () => number = Math.random, hoje = new Date()): Questao[] {
  const w = pesos(qs, respostas, hoje);
  return [...qs]
    .map((q) => ({ q, k: Math.pow(Math.max(rng(), 1e-9), 1 / (w.get(q.id) ?? 1)) }))
    .sort((a, b) => b.k - a.k)
    .slice(0, n)
    .map((x) => x.q);
}

export function montarSessao(todas: Questao[], respostas: Resposta[], f: Filtro, meta: number, rng: () => number = Math.random): Questao[] {
  const ativas = todas.filter((q) => !q.anulada);
  switch (f.modo) {
    case 'prova':
      return ativas.filter((q) => q.provaId === f.provaId).sort((a, b) => a.numero - b.numero);
    case 'erros': {
      const ids = new Set(questoesErradas(respostas));
      return escolher(ativas.filter((q) => ids.has(q.id)), respostas, Math.max(meta, 10), rng);
    }
    case 'assunto': {
      const base = ativas.filter((q) => (f.disciplina ? q.disciplina === f.disciplina : true) && (f.assunto ? q.assunto === f.assunto : true));
      return escolher(base, respostas, meta, rng);
    }
    default:
      return escolher(ativas, respostas, meta, rng);
  }
}

/** Pontuação de prova: múltipla escolha conta acertos; Cebraspe "líquida" desconta um acerto por erro. */
export function pontuar(rs: Resposta[], liquida: boolean): { acertos: number; erros: number; pontos: number } {
  const acertos = rs.filter((r) => r.correta).length;
  const erros = rs.length - acertos;
  return { acertos, erros, pontos: liquida ? acertos - erros : acertos };
}
