import type { Perfil, Prova, ProvaArquivo, Questao, Resposta } from '../types';
import { META_PADRAO } from '../config';
import { supabase } from './supabase';

const arquivos = import.meta.glob('../../provas/*.json', { eager: true, import: 'default' }) as Record<string, ProvaArquivo>;

export function provasEmpacotadas(): { provas: Prova[]; questoes: Questao[] } {
  const provas: Prova[] = [];
  const questoes: Questao[] = [];
  for (const a of Object.values(arquivos)) {
    provas.push({
      id: a.slug,
      titulo: a.titulo,
      banca: a.banca,
      orgao: a.orgao,
      cargo: a.cargo,
      ano: a.ano,
      tipo: a.tipo,
      liquida: Boolean(a.liquida),
      totalQuestoes: a.questoes.length,
      gabaritoFonte: a.gabaritoFonte,
    });
    const img = (x?: string) => (x && import.meta.env.VITE_ARTIFACT ? x.replace(/^\//, '') : x);
    for (const q of a.questoes) questoes.push({ ...q, imagem: img(q.imagem), id: `${a.slug}:${q.numero}`, provaId: a.slug, tipo: q.tipo ?? a.tipo });
  }
  return { provas, questoes: questoes.sort((x, y) => x.provaId.localeCompare(y.provaId) || x.numero - y.numero) };
}

export interface Repo {
  nuvem: boolean;
  carregarProvas(): Promise<{ provas: Prova[]; questoes: Questao[] }>;
  listarRespostas(userId: string): Promise<Resposta[]>;
  salvarResposta(userId: string, r: Resposta): Promise<void>;
  obterPerfil(userId: string): Promise<Perfil>;
  salvarPerfil(userId: string, p: Perfil): Promise<void>;
}

const ler = <T,>(chave: string, padrao: T): T => {
  try {
    const v = localStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
};
const gravar = (chave: string, v: unknown) => {
  try {
    localStorage.setItem(chave, JSON.stringify(v));
  } catch {
    /* sem armazenamento: segue em memória */
  }
};

export const repoLocal: Repo = {
  nuvem: false,
  async carregarProvas() {
    return provasEmpacotadas();
  },
  async listarRespostas() {
    return ler<Resposta[]>('gabarito:respostas', []);
  },
  async salvarResposta(_u, r) {
    gravar('gabarito:respostas', [...ler<Resposta[]>('gabarito:respostas', []), r]);
  },
  async obterPerfil() {
    return ler<Perfil>('gabarito:perfil', { nome: '', meta: META_PADRAO });
  },
  async salvarPerfil(_u, p) {
    gravar('gabarito:perfil', p);
  },
};

type LinhaQuestao = {
  id: string; prova_id: string; numero: number; disciplina: string; assunto: string; tipo: 'mc' | 'ce'; enunciado: string;
  imagem: string | null; imagem_alt: string | null; alternativas: Questao['alternativas']; gabarito: string; dificuldade: 1 | 2 | 3;
  armadilha: Questao['armadilha']; explicacao: string; dica: string; pegadinha: string; por_que_errada: Record<string, string>;
  anulada: boolean; revisar: boolean;
};

export const repoNuvem: Repo = {
  nuvem: true,
  async carregarProvas() {
    const sb = supabase!;
    const [p, q] = await Promise.all([sb.from('provas').select('*').order('ano', { ascending: false }), sb.from('questoes').select('*').order('prova_id').order('numero')]);
    if (p.error) throw p.error;
    if (q.error) throw q.error;
    if (!p.data?.length) return provasEmpacotadas(); // banco ainda vazio: usa as provas do projeto
    const provas: Prova[] = p.data.map((x) => ({
      id: x.id, titulo: x.titulo, banca: x.banca, orgao: x.orgao, cargo: x.cargo, ano: x.ano, tipo: x.tipo,
      liquida: x.liquida, totalQuestoes: x.total_questoes, gabaritoFonte: x.gabarito_fonte ?? undefined,
    }));
    const questoes: Questao[] = (q.data as LinhaQuestao[]).map((x) => ({
      id: x.id, provaId: x.prova_id, numero: x.numero, disciplina: x.disciplina, assunto: x.assunto, tipo: x.tipo, enunciado: x.enunciado,
      imagem: x.imagem ?? undefined, imagemAlt: x.imagem_alt ?? undefined, alternativas: x.alternativas, gabarito: x.gabarito,
      dificuldade: x.dificuldade, armadilha: x.armadilha, explicacao: x.explicacao, dica: x.dica, pegadinha: x.pegadinha,
      porQueErrada: x.por_que_errada, anulada: x.anulada, revisar: x.revisar,
    }));
    return { provas, questoes };
  },
  async listarRespostas() {
    const sb = supabase!;
    const out: Resposta[] = [];
    for (let de = 0; ; de += 1000) {
      const { data, error } = await sb.from('respostas').select('questao_id,prova_id,escolha,correta,segundos,em,modo').order('em').range(de, de + 999);
      if (error) throw error;
      out.push(...data.map((x) => ({ questaoId: x.questao_id, provaId: x.prova_id, escolha: x.escolha, correta: x.correta, segundos: x.segundos, em: x.em, modo: x.modo })));
      if (data.length < 1000) break;
    }
    return out;
  },
  async salvarResposta(_u, r) {
    const { error } = await supabase!.from('respostas').insert({ questao_id: r.questaoId, prova_id: r.provaId, escolha: r.escolha, correta: r.correta, segundos: r.segundos, em: r.em, modo: r.modo });
    if (error) throw error;
  },
  async obterPerfil(userId) {
    const { data } = await supabase!.from('perfis').select('nome,meta').eq('user_id', userId).maybeSingle();
    return data ? { nome: data.nome, meta: data.meta } : { nome: '', meta: META_PADRAO };
  },
  async salvarPerfil(userId, p) {
    const { error } = await supabase!.from('perfis').upsert({ user_id: userId, nome: p.nome, meta: p.meta });
    if (error) throw error;
  },
};

export interface UsuarioAdmin {
  id: string;
  nome: string;
  meta: number;
  respostas: Resposta[];
}

export async function souAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
  return Boolean(data);
}

/** Só funciona para administradores (as políticas do banco barram os demais). */
export async function carregarTodos(): Promise<UsuarioAdmin[]> {
  const sb = supabase!;
  const { data: perfis, error } = await sb.from('perfis').select('user_id,nome,meta');
  if (error) throw error;
  const porUsuario = new Map<string, Resposta[]>();
  for (let de = 0; ; de += 1000) {
    const { data, error: e2 } = await sb.from('respostas').select('user_id,questao_id,prova_id,escolha,correta,segundos,em,modo').order('id').range(de, de + 999);
    if (e2) throw e2;
    for (const x of data) {
      const l = porUsuario.get(x.user_id) ?? [];
      l.push({ questaoId: x.questao_id, provaId: x.prova_id, escolha: x.escolha, correta: x.correta, segundos: x.segundos, em: x.em, modo: x.modo });
      porUsuario.set(x.user_id, l);
    }
    if (data.length < 1000) break;
  }
  return perfis.map((p) => ({ id: p.user_id, nome: p.nome, meta: p.meta, respostas: porUsuario.get(p.user_id) ?? [] }));
}

/** Cola as provas do projeto no banco (só administradores conseguem gravar). Devolve quantas questões foram enviadas. */
export async function enviarProvasParaBanco(): Promise<{ provas: number; questoes: number }> {
  const sb = supabase!;
  const { provas, questoes } = provasEmpacotadas();
  const { error: e1 } = await sb.from('provas').upsert(
    provas.map((p) => ({ id: p.id, titulo: p.titulo, banca: p.banca, orgao: p.orgao, cargo: p.cargo, ano: p.ano, tipo: p.tipo, liquida: p.liquida, total_questoes: p.totalQuestoes, gabarito_fonte: p.gabaritoFonte ?? null })),
  );
  if (e1) throw e1;
  for (let i = 0; i < questoes.length; i += 50) {
    const { error } = await sb.from('questoes').upsert(
      questoes.slice(i, i + 50).map((q) => ({
        id: q.id, prova_id: q.provaId, numero: q.numero, disciplina: q.disciplina, assunto: q.assunto, tipo: q.tipo, enunciado: q.enunciado,
        imagem: q.imagem ?? null, imagem_alt: q.imagemAlt ?? null, alternativas: q.alternativas, gabarito: q.gabarito, dificuldade: q.dificuldade,
        armadilha: q.armadilha, explicacao: q.explicacao, dica: q.dica, pegadinha: q.pegadinha, por_que_errada: q.porQueErrada,
        anulada: q.anulada ?? false, revisar: q.revisar ?? false,
      })),
    );
    if (error) throw error;
  }
  return { provas: provas.length, questoes: questoes.length };
}

export async function contarQuestoesNoBanco(): Promise<number> {
  const { count, error } = await supabase!.from('questoes').select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}
