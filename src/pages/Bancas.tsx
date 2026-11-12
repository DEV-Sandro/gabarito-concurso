import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BANCAS, PROVA_BASE } from '../data/bancas';
import { useDados } from '../state/DataContext';
import { ARMADILHAS } from '../config';
import { agrupar } from '../lib/stats';

export default function Bancas() {
  const [id, setId] = useState(BANCAS[0].id);
  const { respostas, mapa } = useDados();
  const b = BANCAS.find((x) => x.id === id)!;
  const minhas = agrupar(respostas, mapa, 'armadilha').filter((l) => l.total >= 3 && l.taxaErro >= 0.35).slice(0, 4);
  return (
    <>
      <h1>Como cada banca cobra</h1>
      <p className="muted" style={{ maxWidth: '60ch' }}>Padrões observados em provas anteriores, não regras. Sempre confirme o formato no edital do seu concurso.</p>
      <div className="tabs" role="group" aria-label="Banca">
        {BANCAS.map((x) => <button key={x.id} aria-pressed={id === x.id} onClick={() => setId(x.id)}>{x.nome}</button>)}
      </div>

      {minhas.length > 0 && (
        <section className="card">
          <h2>Tipos de pegadinha em que você mais cai</h2>
          <div className="lista" style={{ marginTop: 8 }}>
            {minhas.map((l) => <div className="it" key={l.chave}><b>{ARMADILHAS[l.chave]?.nome ?? l.chave}</b><span className="small muted">{Math.round(l.taxaErro * 100)}% de erro em {l.total} questões · {ARMADILHAS[l.chave]?.descricao}</span></div>)}
          </div>
        </section>
      )}

      <section className="card">
        <div className="row"><h2>{b.nome}</h2>{b.confianca === 'media' && <span className="tag">padrões gerais</span>}</div>
        <p style={{ marginTop: 8 }}><b>Formato.</b> {b.formato}</p>
        <p style={{ marginBottom: 0 }}>{b.perfil}</p>
      </section>

      <section className="pegs">
        {b.pegadinhas.map((p) => (
          <details key={p.titulo} className="card">
            <summary>{p.titulo}</summary>
            <p style={{ marginTop: 10 }}><b>Como cobra.</b> {p.comoCobra}</p>
            <p><b>Como evitar.</b> {p.comoEvitar}</p>
            {p.exemplos && (
              <>
                <span className="small muted">Exemplos reais na prova PC-PR 2026 (FGV):</span>
                <div className="cartaz">
                  {p.exemplos.map((n) => <Link key={n} className="tag" to={`/questao/${encodeURIComponent(`${PROVA_BASE}:${n}`)}`}>Questão {n}</Link>)}
                </div>
              </>
            )}
          </details>
        ))}
      </section>

      <section className="card">
        <h2>Estratégia</h2>
        <ul style={{ paddingLeft: 20, marginBottom: 0 }}>{b.estrategia.map((e) => <li key={e} style={{ marginBottom: 6 }}>{e}</li>)}</ul>
      </section>
    </>
  );
}
