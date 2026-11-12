import type { Questao, Resposta } from '../types';
import { ARMADILHAS } from '../config';
import { chaveDia, ultimosDias } from './datas';

export interface Linha {
  chave: string;
  total: number;
  acertos: number;
  erros: number;
  taxaErro: number; // 0..1
  mediaSeg: number;
}

export type Agrupador = 'disciplina' | 'assunto' | 'armadilha';

export function mapaQuestoes(qs: Questao[]): Map<string, Questao> {
  return new Map(qs.map((q) => [q.id, q]));
}

export function agrupar(respostas: Resposta[], mapa: Map<string, Questao>, por: Agrupador): Linha[] {
  const acc = new Map<string, { total: number; acertos: number; seg: number }>();
  for (const r of respostas) {
    const q = mapa.get(r.questaoId);
    if (!q || q.anulada) continue;
    const chave = q[por];
    const a = acc.get(chave) ?? { total: 0, acertos: 0, seg: 0 };
    a.total++;
    if (r.correta) a.acertos++;
    a.seg += r.segundos;
    acc.set(chave, a);
  }
  return [...acc.entries()]
    .map(([chave, a]) => ({
      chave,
      total: a.total,
      acertos: a.acertos,
      erros: a.total - a.acertos,
      taxaErro: a.total ? (a.total - a.acertos) / a.total : 0,
      mediaSeg: a.total ? a.seg / a.total : 0,
    }))
    .sort((x, y) => y.taxaErro - x.taxaErro || y.erros - x.erros);
}

/** Nota 0–10 por disciplina (Boletim). */
export function nota(l: Linha): number {
  return l.total ? Math.round((l.acertos / l.total) * 100) / 10 : 0;
}

export interface Dia {
  dia: string;
  total: number;
  acertos: number;
}

export function porDia(respostas: Resposta[], dias: string[]): Dia[] {
  const m = new Map(dias.map((d) => [d, { dia: d, total: 0, acertos: 0 }]));
  for (const r of respostas) {
    const d = m.get(chaveDia(r.em));
    if (!d) continue;
    d.total++;
    if (r.correta) d.acertos++;
  }
  return dias.map((d) => m.get(d)!);
}

export function ultimaRespostaPorQuestao(respostas: Resposta[]): Map<string, Resposta> {
  const m = new Map<string, Resposta>();
  for (const r of [...respostas].sort((a, b) => a.em.localeCompare(b.em))) m.set(r.questaoId, r);
  return m;
}

export function questoesErradas(respostas: Resposta[]): string[] {
  const ult = ultimaRespostaPorQuestao(respostas);
  return [...ult.values()].filter((r) => !r.correta).map((r) => r.questaoId);
}

export function errosRepetidos(respostas: Resposta[]): string[] {
  const c = new Map<string, number>();
  for (const r of respostas) if (!r.correta) c.set(r.questaoId, (c.get(r.questaoId) ?? 0) + 1);
  return [...c.entries()].filter(([, n]) => n >= 2).map(([id]) => id);
}

export interface Diagnostico {
  tipo: 'alerta' | 'dica' | 'elogio';
  titulo: string;
  texto: string;
  acao?: { rotulo: string; para: string };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Diagnóstico estilo professor: regras simples e explicáveis. */
export function diagnosticar(respostas: Resposta[], qs: Questao[], hoje = new Date()): Diagnostico[] {
  const out: Diagnostico[] = [];
  if (respostas.length < 5) {
    return [
      {
        tipo: 'dica',
        titulo: 'Ainda é cedo para um diagnóstico',
        texto: 'Responda pelo menos 10 questões. Depois disso eu aponto onde você mais perde pontos e por quê.',
        acao: { rotulo: 'Fazer o simulado de hoje', para: '/treino?modo=diario' },
      },
    ];
  }
  const mapa = mapaQuestoes(qs);

  const disc = agrupar(respostas, mapa, 'disciplina').filter((l) => l.total >= 8);
  if (disc.length) {
    const pior = disc[0];
    if (pior.taxaErro >= 0.3) {
      out.push({
        tipo: 'alerta',
        titulo: `${pior.chave} é seu ponto mais fraco`,
        texto: `Você errou ${pior.erros} de ${pior.total} (${pct(pior.taxaErro)}). Faça blocos curtos só dessa matéria e releia as explicações dos erros antes de avançar.`,
        acao: { rotulo: `Treinar ${pior.chave}`, para: `/treino?modo=assunto&disciplina=${encodeURIComponent(pior.chave)}` },
      });
    }
    const melhor = [...disc].sort((a, b) => a.taxaErro - b.taxaErro)[0];
    if (melhor.taxaErro <= 0.25 && melhor.chave !== pior.chave) {
      out.push({
        tipo: 'elogio',
        titulo: `${melhor.chave} está firme`,
        texto: `${pct(1 - melhor.taxaErro)} de acerto em ${melhor.total} questões. Mantenha com revisões curtas e use o tempo extra nas matérias fracas.`,
      });
    }
  }

  const errosResp = respostas.filter((r) => !r.correta);
  const apressados = errosResp.filter((r) => r.segundos > 0 && r.segundos < 10);
  if (errosResp.length >= 6 && apressados.length / errosResp.length >= 0.3) {
    out.push({
      tipo: 'alerta',
      titulo: 'Você erra mais quando responde rápido',
      texto: `${apressados.length} dos seus ${errosResp.length} erros vieram em menos de 10 segundos. Leia todas as alternativas antes de marcar e sublinhe palavras como “apenas”, “sempre” e “exceto”.`,
    });
  }

  const arm = agrupar(respostas, mapa, 'armadilha').filter((l) => l.total >= 5 && l.taxaErro >= 0.4);
  if (arm.length) {
    const a = arm[0];
    const info = ARMADILHAS[a.chave];
    out.push({
      tipo: 'alerta',
      titulo: `Pegadinha que mais te pega: ${info?.nome ?? a.chave}`,
      texto: `Erro de ${pct(a.taxaErro)} nesse tipo (${info?.descricao ?? ''}). Veja como as bancas cobram isso.`,
      acao: { rotulo: 'Ver pegadinhas das bancas', para: '/bancas' },
    });
  }

  const facil = respostas.filter((r) => mapa.get(r.questaoId)?.dificuldade === 1);
  if (facil.length >= 8) {
    const acc = facil.filter((r) => r.correta).length / facil.length;
    if (acc < 0.6) {
      out.push({
        tipo: 'alerta',
        titulo: 'A base ainda tem buracos',
        texto: `Nas questões de dificuldade 1 você acerta ${pct(acc)}. Antes de avançar para as difíceis, fixe os conceitos básicos das matérias fracas.`,
      });
    }
  }

  const sete = ultimosDias(7, hoje);
  const anter = ultimosDias(14, hoje).slice(0, 7);
  const a1 = respostas.filter((r) => anter.includes(chaveDia(r.em)));
  const a2 = respostas.filter((r) => sete.includes(chaveDia(r.em)));
  if (a1.length >= 10 && a2.length >= 10) {
    const t1 = a1.filter((r) => r.correta).length / a1.length;
    const t2 = a2.filter((r) => r.correta).length / a2.length;
    if (t2 - t1 >= 0.08) {
      out.push({ tipo: 'elogio', titulo: 'Você está evoluindo', texto: `Acerto subiu de ${pct(t1)} para ${pct(t2)} em relação à semana anterior.` });
    } else if (t1 - t2 >= 0.08) {
      out.push({ tipo: 'alerta', titulo: 'O acerto caiu esta semana', texto: `De ${pct(t1)} para ${pct(t2)}. Revise o caderno de erros antes de seguir com questões novas.`, acao: { rotulo: 'Refazer meus erros', para: '/treino?modo=erros' } });
    }
  }

  const rep = errosRepetidos(respostas);
  if (rep.length >= 3) {
    out.push({
      tipo: 'dica',
      titulo: `${rep.length} questões você errou mais de uma vez`,
      texto: 'Erro repetido costuma ser conceito mal entendido, não distração. Leia a explicação, escreva o conceito com suas palavras e refaça.',
      acao: { rotulo: 'Refazer meus erros', para: '/treino?modo=erros' },
    });
  }

  if (!out.length) out.push({ tipo: 'elogio', titulo: 'Sem alertas por enquanto', texto: 'Continue no ritmo da meta diária; o diagnóstico fica mais preciso a cada dia.' });
  return out;
}

export interface Recomendacao {
  assunto: string;
  disciplina: string;
  linha: Linha;
  texto: string;
}

export function recomendar(respostas: Resposta[], qs: Questao[]): Recomendacao[] {
  const mapa = mapaQuestoes(qs);
  const discDoAssunto = new Map(qs.map((q) => [q.assunto, q.disciplina]));
  const armDoAssunto = new Map<string, Record<string, number>>();
  for (const r of respostas) {
    const q = mapa.get(r.questaoId);
    if (!q || r.correta) continue;
    const m = armDoAssunto.get(q.assunto) ?? {};
    m[q.armadilha] = (m[q.armadilha] ?? 0) + 1;
    armDoAssunto.set(q.assunto, m);
  }
  return agrupar(respostas, mapa, 'assunto')
    .filter((l) => l.total >= 2 && l.erros >= 1)
    .slice(0, 8)
    .map((l) => {
      const m = armDoAssunto.get(l.chave) ?? {};
      const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0];
      const info = top ? ARMADILHAS[top] : undefined;
      const texto = info
        ? `Seus erros aqui costumam ser do tipo “${info.nome}” (${info.descricao}). Leia a explicação de cada erro e refaça em 24 horas.`
        : 'Releia a explicação de cada erro e refaça as questões em 24 horas.';
      return { assunto: l.chave, disciplina: discDoAssunto.get(l.chave) ?? '', linha: l, texto };
    });
}
