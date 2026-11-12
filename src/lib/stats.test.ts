import { describe, expect, it } from 'vitest';
import type { Questao, Resposta } from '../types';
import { agrupar, diagnosticar, mapaQuestoes, questoesErradas } from './stats';
import { calcularSequencia, calcularXp, nivelDoXp } from './gamificacao';
import { escolher, pontuar } from './selecao';

const q = (n: number, disciplina = 'Direito Penal', extra: Partial<Questao> = {}): Questao => ({
  id: `p:${n}`, provaId: 'p', numero: n, disciplina, assunto: 'Furto', tipo: 'mc', enunciado: '', alternativas: [{ letra: 'A', texto: 'x' }, { letra: 'B', texto: 'y' }],
  gabarito: 'A', dificuldade: 2, armadilha: 'palavra-absoluta', explicacao: '', dica: '', pegadinha: '', porQueErrada: {}, ...extra,
});
const r = (n: number, correta: boolean, em: string, segundos = 30): Resposta => ({ questaoId: `p:${n}`, provaId: 'p', escolha: correta ? 'A' : 'B', correta, segundos, em, modo: 'diario' });

describe('stats', () => {
  it('agrupa por disciplina e ordena pela maior taxa de erro', () => {
    const qs = [q(1, 'A'), q(2, 'A'), q(3, 'B')];
    const l = agrupar([r(1, false, '2026-11-01T10:00:00'), r(2, true, '2026-11-01T10:01:00'), r(3, true, '2026-11-01T10:02:00')], mapaQuestoes(qs), 'disciplina');
    expect(l[0].chave).toBe('A');
    expect(l[0].taxaErro).toBe(0.5);
  });
  it('ignora questões anuladas', () => {
    const qs = [q(1, 'A', { anulada: true })];
    expect(agrupar([r(1, false, '2026-11-01T10:00:00')], mapaQuestoes(qs), 'disciplina')).toHaveLength(0);
  });
  it('considera erro apenas se a última resposta foi errada', () => {
    expect(questoesErradas([r(1, false, '2026-11-01T10:00:00'), r(1, true, '2026-11-02T10:00:00'), r(2, false, '2026-11-02T10:00:00')])).toEqual(['p:2']);
  });
  it('diagnostica pressa quando muitos erros são rápidos', () => {
    const qs = Array.from({ length: 12 }, (_, i) => q(i + 1));
    const rs = qs.map((x, i) => r(x.numero, i % 2 === 0, '2026-11-01T10:00:00', 5));
    expect(diagnosticar(rs, qs, new Date(2026, 10, 2)).some((d) => d.titulo.includes('rápido'))).toBe(true);
  });
});

describe('gamificação', () => {
  it('calcula XP com bônus de primeira vez e da meta', () => {
    const rs = [r(1, true, '2026-11-01T10:00:00'), r(2, false, '2026-11-01T10:01:00')];
    expect(calcularXp(rs, 2)).toBe(10 + 5 + 3 + 20);
    expect(calcularXp(rs, 5)).toBe(18);
  });
  it('nível sobe com a raiz do XP', () => {
    expect(nivelDoXp(0).nivel).toBe(1);
    expect(nivelDoXp(40).nivel).toBe(2);
    expect(nivelDoXp(160).nivel).toBe(3);
  });
  it('sequência não zera antes de estudar hoje', () => {
    const rs = [r(1, true, '2026-11-09T10:00:00'), r(2, true, '2026-11-10T10:00:00')];
    expect(calcularSequencia(rs, 1, new Date(2026, 10, 11)).atual).toBe(2);
    expect(calcularSequencia(rs, 1, new Date(2026, 10, 12)).atual).toBe(0);
  });
});

describe('seleção e pontuação', () => {
  it('prioriza não vistas e erradas', () => {
    const qs = Array.from({ length: 30 }, (_, i) => q(i + 1));
    const rs = qs.slice(0, 20).map((x) => r(x.numero, true, '2026-11-10T10:00:00'));
    let novas = 0;
    for (let i = 0; i < 50; i++) novas += escolher(qs, rs, 5, Math.random, new Date(2026, 10, 11)).filter((x) => x.numero > 20).length;
    expect(novas / 250).toBeGreaterThan(0.5);
  });
  it('pontua Cebraspe líquida', () => {
    const rs = [r(1, true, ''), r(2, true, ''), r(3, false, '')];
    expect(pontuar(rs, true).pontos).toBe(1);
    expect(pontuar(rs, false).pontos).toBe(2);
  });
});
