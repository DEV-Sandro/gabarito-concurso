import { Link } from 'react-router-dom';
import { useDados } from '../state/DataContext';
import { questoesErradas, ultimaRespostaPorQuestao } from '../lib/stats';

export default function Provas() {
  const { provas, questoes, respostas, mapa } = useDados();
  const ult = ultimaRespostaPorQuestao(respostas);
  const erros = questoesErradas(respostas).sort((a, b) => (ult.get(b)?.em ?? '').localeCompare(ult.get(a)?.em ?? ''));
  return (
    <>
      <h1>Provas</h1>
      {provas.map((p) => {
        const qs = questoes.filter((q) => q.provaId === p.id);
        const feitas = qs.filter((q) => ult.has(q.id));
        const certas = feitas.filter((q) => ult.get(q.id)!.correta).length;
        return (
          <section key={p.id} className="card">
            <div className="row"><span className="tag">{p.banca}</span><span className="tag" style={{ background: 'transparent', border: '1px solid var(--rule)', color: 'var(--ink-2)' }}>{p.totalQuestoes} questões</span></div>
            <h2 style={{ marginTop: 8 }}>{p.titulo}</h2>
            <p className="muted small">Você já resolveu {feitas.length} de {qs.length}{feitas.length ? ` e acertou ${certas}` : ''}.</p>
            <div className="barra" style={{ margin: '8px 0 14px' }}><i style={{ width: `${(feitas.length / Math.max(1, qs.length)) * 100}%` }} /></div>
            <div className="row">
              <Link className="btn pri" to={`/treino?modo=prova&prova=${encodeURIComponent(p.id)}`}>Fazer a prova completa</Link>
              <Link className="btn" to="/treino?modo=diario">Treino diário</Link>
            </div>
            {p.gabaritoFonte && <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>Gabarito: {p.gabaritoFonte}</p>}
          </section>
        );
      })}

      <section className="card">
        <h2>Caderno de erros</h2>
        <p className="muted small">Questões em que sua última resposta foi errada.</p>
        {erros.length === 0 ? <p className="muted">Nenhum erro pendente.</p> : (
          <div className="lista" style={{ marginTop: 8 }}>
            {erros.map((id) => {
              const q = mapa.get(id);
              if (!q) return null;
              return (
                <div className="it" key={id}>
                  <Link to={`/questao/${encodeURIComponent(id)}`}>Questão {q.numero} · {q.assunto}</Link>
                  <span className="small muted">{q.disciplina} · você marcou {ult.get(id)?.escolha}, gabarito {q.gabarito}</span>
                </div>
              );
            })}
          </div>
        )}
        {erros.length > 0 && <div style={{ marginTop: 12 }}><Link className="btn" to="/treino?modo=erros">Refazer meus erros</Link></div>}
      </section>
    </>
  );
}
