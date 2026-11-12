import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDados } from '../state/DataContext';
import { agrupar, recomendar, type Agrupador } from '../lib/stats';
import { ARMADILHAS } from '../config';
import { DICAS } from '../data/dicas';

export default function Fracos() {
  const { respostas, mapa, questoes } = useDados();
  const [por, setPor] = useState<Agrupador>('disciplina');
  const linhas = agrupar(respostas, mapa, por).filter((l) => l.total >= 1);
  const recs = recomendar(respostas, questoes);
  const pior = agrupar(respostas, mapa, 'disciplina').filter((l) => l.total >= 3)[0];
  const rot = (k: string) => (por === 'armadilha' ? ARMADILHAS[k]?.nome ?? k : k);
  const treinar = (k: string) => (por === 'disciplina' ? `/treino?modo=assunto&disciplina=${encodeURIComponent(k)}` : por === 'assunto' ? `/treino?modo=assunto&assunto=${encodeURIComponent(k)}` : null);

  return (
    <>
      <h1>Onde você mais erra</h1>
      <div className="row">
        <div className="seg" role="group" aria-label="Agrupar por">
          {(['disciplina', 'assunto', 'armadilha'] as Agrupador[]).map((k) => (
            <button key={k} aria-pressed={por === k} onClick={() => setPor(k)}>{k === 'armadilha' ? 'Tipo de pegadinha' : k === 'assunto' ? 'Assunto' : 'Matéria'}</button>
          ))}
        </div>
      </div>

      <section className="card">
        {linhas.length === 0 ? <p className="muted">Ainda não há respostas. Faça o simulado de hoje para começar.</p> : (
          <div className="lista">
            {linhas.map((l) => (
              <div className="it" key={l.chave}>
                <div className="row">
                  <b>{rot(l.chave)}</b><span className="espaco" />
                  <span className={`tag ${l.taxaErro >= 0.5 ? 'red' : l.taxaErro <= 0.25 ? 'ok' : ''}`}>{Math.round(l.taxaErro * 100)}% de erro</span>
                </div>
                <div className={`barra ${l.taxaErro >= 0.5 ? 'red' : ''}`} role="img" aria-label={`${l.erros} erros em ${l.total}`}><i style={{ width: `${l.taxaErro * 100}%` }} /></div>
                <div className="row small muted">
                  <span className="num">{l.erros} erros em {l.total}</span>
                  {l.mediaSeg > 0 && <span className="num">· {Math.round(l.mediaSeg)}s por questão</span>}
                  <span className="espaco" />
                  {treinar(l.chave) && <Link className="btn peq" to={treinar(l.chave)!}>Treinar</Link>}
                </div>
                {por === 'armadilha' && <span className="small muted">{ARMADILHAS[l.chave]?.descricao}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {recs.length > 0 && (
        <section className="card">
          <h2>Como melhorar</h2>
          <div className="lista" style={{ marginTop: 8 }}>
            {recs.map((r) => (
              <div className="it" key={r.assunto}>
                <b>{r.assunto}</b>
                <span className="small muted">{r.disciplina} · {r.linha.erros} erro(s) em {r.linha.total}</span>
                <p className="small" style={{ margin: 0 }}>{r.texto}</p>
                <div><Link className="btn peq" to={`/treino?modo=assunto&assunto=${encodeURIComponent(r.assunto)}`}>Treinar este assunto</Link></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>Dicas do professor{pior ? `: ${pior.chave}` : ''}</h2>
        <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
          {(DICAS[pior?.chave ?? ''] ?? ['Leia a pergunta antes de olhar as alternativas.', 'Marque a palavra de comando (exceto, incorreta, de acordo com o texto).', 'Depois de errar, escreva em uma frase por que a resposta certa está certa.']).map((d) => <li key={d} style={{ marginBottom: 6 }}>{d}</li>)}
        </ul>
        <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>Para ver como cada banca costuma cobrar esses pontos, abra <Link to="/bancas">Bancas</Link>.</p>
      </section>
    </>
  );
}
