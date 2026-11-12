import type { Questao, Resposta } from '../types';
import { chaveDia, somaDias } from './datas';
import { agrupar, mapaQuestoes } from './stats';

export const TITULOS = ['Calouro', 'Concurseiro', 'Persistente', 'Estrategista', 'Veterano', 'Mestre do gabarito', 'Lenda da prova'];

export interface Nivel {
  nivel: number;
  titulo: string;
  xp: number;
  deNivel: number; // XP no início do nível
  paraProximo: number; // XP necessário para o próximo
}

export function nivelDoXp(xp: number): Nivel {
  const nivel = Math.floor(Math.sqrt(xp / 40)) + 1;
  return {
    nivel,
    titulo: TITULOS[Math.min(nivel - 1, TITULOS.length - 1)],
    xp,
    deNivel: 40 * (nivel - 1) ** 2,
    paraProximo: 40 * nivel ** 2,
  };
}

export function contarPorDia(respostas: Resposta[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of respostas) {
    const d = chaveDia(r.em);
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

/** XP: +10 certa, +5 na primeira vez que acerta a questão, +3 errada (estudar conta), +20 por dia com a meta cumprida. */
export function calcularXp(respostas: Resposta[], meta: number): number {
  let xp = 0;
  const vistas = new Set<string>();
  for (const r of [...respostas].sort((a, b) => a.em.localeCompare(b.em))) {
    if (r.correta) {
      xp += 10;
      if (!vistas.has(r.questaoId)) xp += 5;
    } else xp += 3;
    vistas.add(r.questaoId);
  }
  for (const n of contarPorDia(respostas).values()) if (n >= meta) xp += 20;
  return xp;
}

/** Dias seguidos com a meta cumprida. Não zera antes de você estudar hoje. */
export function calcularSequencia(respostas: Resposta[], meta: number, hoje = new Date()): { atual: number; melhor: number } {
  const dias = contarPorDia(respostas);
  const ok = (d: Date) => (dias.get(chaveDia(d)) ?? 0) >= meta;
  let cursor = ok(hoje) ? hoje : somaDias(hoje, -1);
  let atual = 0;
  while (ok(cursor)) {
    atual++;
    cursor = somaDias(cursor, -1);
  }
  const lista = [...dias.entries()].filter(([, n]) => n >= meta).map(([d]) => d).sort();
  let melhor = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of lista) {
    const [y, m, dd] = d.split('-').map(Number);
    const cur = new Date(y, m - 1, dd);
    run = prev && chaveDia(somaDias(prev, 1)) === d ? run + 1 : 1;
    melhor = Math.max(melhor, run);
    prev = cur;
  }
  return { atual, melhor: Math.max(melhor, atual) };
}

export interface Carimbo {
  id: string;
  nome: string;
  descricao: string;
  conquistado: boolean;
}

export function conquistas(respostas: Resposta[], qs: Questao[], meta: number, hoje = new Date()): Carimbo[] {
  const mapa = mapaQuestoes(qs);
  const seq = calcularSequencia(respostas, meta, hoje).melhor;
  const dias = contarPorDia(respostas);
  const acertos = respostas.filter((r) => r.correta).length;
  const pegadinhasCertas = respostas.filter((r) => r.correta && ['palavra-absoluta', 'troca-de-conceito', 'excecao', 'parcialmente-correta', 'inversao'].includes(mapa.get(r.questaoId)?.armadilha ?? '')).length;
  const disc = agrupar(respostas, mapa, 'disciplina');
  const dominada = disc.some((l) => l.total >= 15 && 1 - l.taxaErro >= 0.8);
  const ult = new Map<string, Resposta>();
  const hist = new Map<string, boolean[]>();
  for (const r of [...respostas].sort((a, b) => a.em.localeCompare(b.em))) {
    ult.set(r.questaoId, r);
    hist.set(r.questaoId, [...(hist.get(r.questaoId) ?? []), r.correta]);
  }
  const virada = [...hist.values()].filter((h) => h.some((x) => !x) && h[h.length - 1]).length;
  return [
    { id: 'primeira', nome: 'Primeira resposta', descricao: 'Respondeu a primeira questão.', conquistado: respostas.length >= 1 },
    { id: 'meta', nome: 'Meta do dia', descricao: `Cumpriu ${meta} questões em um dia.`, conquistado: [...dias.values()].some((n) => n >= meta) },
    { id: 'seq3', nome: '3 dias seguidos', descricao: 'Bateu a meta por 3 dias seguidos.', conquistado: seq >= 3 },
    { id: 'seq7', nome: 'Semana completa', descricao: 'Bateu a meta por 7 dias seguidos.', conquistado: seq >= 7 },
    { id: 'seq14', nome: 'Quinzena de ferro', descricao: 'Bateu a meta por 14 dias seguidos.', conquistado: seq >= 14 },
    { id: 'c50', nome: '50 acertos', descricao: 'Somou 50 questões certas.', conquistado: acertos >= 50 },
    { id: 'c150', nome: '150 acertos', descricao: 'Somou 150 questões certas.', conquistado: acertos >= 150 },
    { id: 'pegadinha', nome: 'Caçador de pegadinhas', descricao: 'Acertou 10 questões com pegadinha clássica.', conquistado: pegadinhasCertas >= 10 },
    { id: 'virada', nome: 'Virada de página', descricao: 'Acertou 5 questões que já tinha errado.', conquistado: virada >= 5 },
    { id: 'dominio', nome: 'Matéria dominada', descricao: '80% de acerto em uma disciplina (mín. 15 questões).', conquistado: dominada },
  ];
}
