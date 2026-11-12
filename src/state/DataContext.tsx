import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Perfil, Prova, Questao, Resposta, Usuario } from '../types';
import { META_PADRAO, MODO_NUVEM } from '../config';
import { repoLocal, repoNuvem, souAdmin, type Repo } from '../lib/repo';
import { repoArtifact, estado as estadoArtifact, type EstadoNuvem } from '../lib/repoArtifact';
import { supabase } from '../lib/supabase';
import { mapaQuestoes } from '../lib/stats';

interface Ctx {
  pronto: boolean;
  erro: string | null;
  nuvem: boolean;
  usuario: Usuario | null;
  provas: Prova[];
  questoes: Questao[];
  mapa: Map<string, Questao>;
  respostas: Resposta[];
  perfil: Perfil;
  responder(r: Resposta): Promise<void>;
  atualizarPerfil(p: Perfil): Promise<void>;
  entrar(email: string, senha: string, criar: boolean): Promise<string | null>;
  sair(): Promise<void>;
  admin: boolean;
  semSalvar: number;
  persistencia: { estado: EstadoNuvem; motivo: string; ultima: number | null } | null;
}

/** Login por nome de usuário: o Supabase pede e-mail, então usamos um e-mail interno derivado do usuário. */
export const DOMINIO_USUARIO = 'gabarito.app';
export const emailDoUsuario = (u: string) => `${u.trim().toLowerCase()}@${DOMINIO_USUARIO}`;
export const usuarioDoEmail = (e: string) => e.replace(`@${DOMINIO_USUARIO}`, '');

const DataCtx = createContext<Ctx | null>(null);
export const useDados = () => {
  const c = useContext(DataCtx);
  if (!c) throw new Error('useDados fora do provider');
  return c;
};

const ARTEFATO = Boolean(import.meta.env.VITE_ARTIFACT);
const repo: Repo = MODO_NUVEM ? repoNuvem : ARTEFATO ? repoArtifact : repoLocal;

export function DataProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(MODO_NUVEM ? null : { id: 'local', email: 'Neste aparelho' });
  const [pronto, setPronto] = useState(!MODO_NUVEM);
  const [erro, setErro] = useState<string | null>(null);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [perfil, setPerfil] = useState<Perfil>({ nome: '', meta: META_PADRAO });
  const [admin, setAdmin] = useState(false);
  const [pendentes, setPendentes] = useState<Resposta[]>([]);
  const [ultima, setUltima] = useState<number | null>(null);
  const [estadoNuvem, setEstadoNuvem] = useState<EstadoNuvem>('carregando');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUsuario(u ? { id: u.id, email: u.email ?? '' } : null);
      if (!u) setPronto(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const u = s?.user;
      setUsuario(u ? { id: u.id, email: u.email ?? '' } : null);
      if (!u) {
        setRespostas([]);
        setPronto(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = usuario?.id;
  useEffect(() => {
    if (!uid) return;
    let vivo = true;
    setPronto(false);
    (async () => {
      try {
        const [{ provas, questoes }, rs, p] = await Promise.all([repo.carregarProvas(), repo.listarRespostas(uid), repo.obterPerfil(uid)]);
        if (!vivo) return;
        setProvas(provas);
        setQuestoes(questoes);
        setRespostas(rs);
        setPerfil(p);
        setEstadoNuvem(estadoArtifact.atual);
        setUltima(estadoArtifact.ultimaGravacao);
        setErro(null);
        if (MODO_NUVEM) setAdmin(await souAdmin(uid));
      } catch (e) {
        if (vivo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar seus dados.');
      } finally {
        if (vivo) setPronto(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [uid]);

  const enviar = useCallback(
    async (r: Resposta) => {
      if (!uid) return;
      await repo.salvarResposta(uid, r);
      if (ARTEFATO) setUltima(estadoArtifact.ultimaGravacao);
    },
    [uid],
  );

  // Reenvia respostas que falharam por rede/instabilidade.
  useEffect(() => {
    if (!pendentes.length) return;
    const t = setTimeout(async () => {
      const ainda: Resposta[] = [];
      for (const r of pendentes) {
        try {
          await enviar(r);
        } catch {
          ainda.push(r);
        }
      }
      setPendentes(ainda);
    }, 4000);
    return () => clearTimeout(t);
  }, [pendentes, enviar]);

  const responder = useCallback(
    async (r: Resposta) => {
      setRespostas((x) => [...x, r]); // otimista: a tela responde na hora
      try {
        await enviar(r);
      } catch {
        setPendentes((p) => [...p, r]);
      }
    },
    [enviar],
  );

  const atualizarPerfil = useCallback(
    async (p: Perfil) => {
      setPerfil(p);
      if (uid) {
        await repo.salvarPerfil(uid, p);
        if (ARTEFATO) setUltima(estadoArtifact.ultimaGravacao);
      }
    },
    [uid],
  );

  const entrar = useCallback(async (nomeUsuario: string, senha: string, criar: boolean) => {
    if (!supabase) return null;
    const email = emailDoUsuario(nomeUsuario);
    if (criar) {
      const { data, error } = await supabase.auth.signUp({ email, password: senha });
      if (error) return error.message;
      if (!data.session) return 'A conta foi criada, mas o projeto exige confirmação de e-mail. Desative "Confirm email" no Supabase (veja o README).';
      await supabase.from('perfis').upsert({ user_id: data.user!.id, nome: nomeUsuario, meta: META_PADRAO });
      return null;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return error ? error.message : null;
  }, []);

  const sair = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const mapa = useMemo(() => mapaQuestoes(questoes), [questoes]);
  const valor: Ctx = { pronto, erro, nuvem: MODO_NUVEM, usuario, provas, questoes, mapa, respostas, perfil, responder, atualizarPerfil, entrar, sair, admin, semSalvar: pendentes.length, persistencia: ARTEFATO ? { estado: estadoNuvem, motivo: estadoArtifact.motivo, ultima } : null };
  return <DataCtx.Provider value={valor}>{children}</DataCtx.Provider>;
}
