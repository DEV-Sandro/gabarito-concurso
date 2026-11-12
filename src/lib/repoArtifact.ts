import type { Modo, Perfil, Resposta } from '../types';
import { META_PADRAO } from '../config';
import { chaveDia } from './datas';
import { provasEmpacotadas, repoLocal, type Repo } from './repo';

/**
 * Persistência no Claude: usa a capacidade `db` do artefato.
 * Cada pessoa tem uma área privada: data/users/<id>/perfil e, abaixo dela, um documento por dia (dias/AAAA-MM-DD)
 * com todas as respostas daquele dia. Sempre grava também no navegador (cópia de segurança) e,
 * ao abrir, junta as duas fontes e sobe para a nuvem o que só existia no navegador.
 */

type Compacta = { q: string; e: string; c: 0 | 1; s: number; t: number; m: string };
type Claude = { use(nome: string): Promise<any> };
const claude = () => (globalThis as unknown as { claude?: Claude }).claude;

export type EstadoNuvem = 'carregando' | 'nuvem' | 'local';
export const estado: { atual: EstadoNuvem; motivo: string; ultimaGravacao: number | null } = { atual: 'carregando', motivo: '', ultimaGravacao: null };

const MODOS: Record<string, Modo> = { d: 'diario', a: 'assunto', e: 'erros', p: 'prova' };
const comprimir = (r: Resposta): Compacta => ({ q: r.questaoId, e: r.escolha, c: r.correta ? 1 : 0, s: r.segundos, t: new Date(r.em).getTime(), m: r.modo[0] });
const expandir = (c: Compacta): Resposta => ({ questaoId: c.q, provaId: c.q.split(':')[0], escolha: c.e, correta: c.c === 1, segundos: c.s, em: new Date(c.t).toISOString(), modo: MODOS[c.m] ?? 'diario' });
const chave = (c: Compacta) => `${c.q}|${c.t}`;

let db: any = null;
let uid: string | null = null;
const dias = new Map<string, Compacta[]>();
let fila: Promise<unknown> = Promise.resolve();

const docDia = (dia: string) => db.doc(`data/users/${uid}/perfil`).collection('dias').doc(dia);
const docPerfil = () => db.doc(`data/users/${uid}/perfil`);

function serial<T>(f: () => Promise<T>): Promise<T> {
  const p = fila.then(f, f);
  fila = p.catch(() => undefined);
  return p;
}
const comTempo = <T,>(p: Promise<T>, ms: number): Promise<T> => Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('tempo esgotado')), ms))]);

async function gravarDia(dia: string) {
  await serial(() => docDia(dia).set({ dia, respostas: dias.get(dia) ?? [] }));
  estado.ultimaGravacao = Date.now();
}

export const repoArtifact: Repo = {
  nuvem: false,
  carregarProvas: async () => provasEmpacotadas(),

  async listarRespostas() {
    const locais = await repoLocal.listarRespostas('local');
    try {
      const cl = claude();
      const user = await cl?.use('user');
      db = await cl?.use('db');
      uid = (await user?.id?.()) ?? null;
      if (!db || !uid) throw new Error(!db ? 'db indisponível' : 'sem identificação do usuário');
      const snap: { docs: Array<{ id: string; data(): { respostas?: Compacta[] } | undefined }> } = await comTempo(db.doc(`data/users/${uid}/perfil`).collection('dias').get(), 10000);
      for (const d of snap.docs) dias.set(d.id, [...(d.data()?.respostas ?? [])]);
      // sobe o que só existe neste navegador
      const conhecidas = new Set([...dias.values()].flat().map(chave));
      const tocados = new Set<string>();
      for (const r of locais) {
        const c = comprimir(r);
        if (conhecidas.has(chave(c))) continue;
        const dia = chaveDia(r.em);
        dias.set(dia, [...(dias.get(dia) ?? []), c]);
        tocados.add(dia);
      }
      for (const dia of tocados) await gravarDia(dia);
      estado.atual = 'nuvem';
      return [...dias.values()].flat().map(expandir).sort((a, b) => a.em.localeCompare(b.em));
    } catch (e) {
      estado.atual = 'local';
      estado.motivo = e instanceof Error ? e.message : 'erro desconhecido';
      db = null;
      return locais;
    }
  },

  async salvarResposta(u, r) {
    const locais = await repoLocal.listarRespostas(u);
    if (!locais.some((x) => x.questaoId === r.questaoId && x.em === r.em)) await repoLocal.salvarResposta(u, r); // cópia no navegador, sempre
    if (!db || !uid) return;
    const dia = chaveDia(r.em);
    const c = comprimir(r);
    dias.set(dia, [...(dias.get(dia) ?? []), c]);
    try {
      await gravarDia(dia);
    } catch (e) {
      // desfaz na memória: o reenvio automático tenta de novo e não duplica
      dias.set(dia, (dias.get(dia) ?? []).filter((x) => chave(x) !== chave(c)));
      throw e;
    }
  },

  async obterPerfil(u) {
    const local = await repoLocal.obterPerfil(u);
    if (!db || !uid) return local;
    try {
      const s: { data(): { nome?: string; meta?: number } | undefined } = await comTempo(docPerfil().get(), 10000);
      const d = s.data();
      return d ? { nome: d.nome ?? '', meta: d.meta ?? META_PADRAO } : local;
    } catch {
      return local;
    }
  },

  async salvarPerfil(u, p: Perfil) {
    await repoLocal.salvarPerfil(u, p);
    if (!db || !uid) return;
    await serial(() => docPerfil().set({ nome: p.nome, meta: p.meta }));
    estado.ultimaGravacao = Date.now();
  },
};
