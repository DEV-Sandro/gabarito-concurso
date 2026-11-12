import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDados } from '../state/DataContext';
import { carregarTodos, contarQuestoesNoBanco, enviarProvasParaBanco, type UsuarioAdmin } from '../lib/repo';
import { agrupar, nota } from '../lib/stats';
import { calcularSequencia, calcularXp, nivelDoXp } from '../lib/gamificacao';
import { chaveDia } from '../lib/datas';

export default function Admin() {
  const { admin, mapa } = useDados();
  const [lista, setLista] = useState<UsuarioAdmin[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [banco, setBanco] = useState<string>('Conferindo as provas no banco…');

  async function colar() {
    setBanco('Colando as provas no banco…');
    try {
      const r = await enviarProvasParaBanco();
      setBanco(`Pronto: ${r.provas} prova(s) e ${r.questoes} questões no banco.`);
    } catch (e) {
      setBanco(`Não foi possível gravar: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    }
  }

  useEffect(() => {
    if (!admin) return;
    contarQuestoesNoBanco().then((n) => { if (n === 0) void colar(); else setBanco(`${n} questões no banco.`); }).catch(() => setBanco('Não foi possível conferir o banco.'));
    carregarTodos().then(setLista).catch((e) => setErro(e instanceof Error ? e.message : 'Não foi possível carregar.'));
  }, [admin]);

  if (!admin) return <Navigate to="/" replace />;
  if (erro) return <div className="aviso red">{erro}</div>;
  if (!lista) return <p className="muted" role="status">Carregando o grupo…</p>;

  const hoje = chaveDia(new Date());
  const linhas = lista
    .map((u) => {
      const acertos = u.respostas.filter((r) => r.correta).length;
      const ult = u.respostas.reduce((m, r) => (r.em > m ? r.em : m), '');
      const hojeN = u.respostas.filter((r) => chaveDia(r.em) === hoje).length;
      const xp = calcularXp(u.respostas, u.meta);
      return { u, total: u.respostas.length, acertos, ult, hojeN, xp, seq: calcularSequencia(u.respostas, u.meta).atual, nv: nivelDoXp(xp) };
    })
    .sort((a, b) => b.ult.localeCompare(a.ult));

  return (
    <>
      <h1>Grupo</h1>
      <p className="muted small" role="status">{banco} <button className="btn" onClick={() => void colar()}>Colar de novo</button></p>
      <p className="muted">{lista.length} pessoa(s) com conta. Você vê isto porque é administrador.</p>
      <section className="lista">
        {linhas.map(({ u, total, acertos, ult, hojeN, seq, nv }) => {
          const disc = agrupar(u.respostas, mapa, 'disciplina').sort((a, b) => a.chave.localeCompare(b.chave, 'pt'));
          return (
            <div className="it card" key={u.id}>
              <button className="btn" style={{ justifyContent: 'space-between', width: '100%' }} aria-expanded={aberto === u.id} onClick={() => setAberto(aberto === u.id ? null : u.id)}>
                <b>{u.nome || 'sem nome'}</b>
                <span className="muted small num">{total} respondidas · {total ? Math.round((acertos / total) * 100) : 0}% · hoje {hojeN}/{u.meta}</span>
              </button>
              <div className="row small muted">
                <span>Nível {nv.nivel} ({nv.titulo})</span><span>· {seq} dia(s) seguidos</span>
                <span>· último estudo {ult ? new Date(ult).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'nunca'}</span>
              </div>
              {aberto === u.id && (
                <div className="boletim" style={{ marginTop: 8 }}>
                  {disc.length === 0 ? <p className="muted small">Sem respostas ainda.</p> : disc.map((l) => (
                    <div className="l" key={l.chave}>
                      <span className="nome" title={l.chave}>{l.chave}</span>
                      <div className={`barra ${nota(l) < 5 ? 'red' : ''}`}><i style={{ width: `${nota(l) * 10}%` }} /></div>
                      <span className={`nt num ${nota(l) < 5 ? 'baixa' : ''}`}>{nota(l).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
