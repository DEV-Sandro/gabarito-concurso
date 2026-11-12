import { Link, useParams } from 'react-router-dom';
import { useDados } from '../state/DataContext';
import { Explicacao, opcoes } from '../components/Folha';
import { ultimaRespostaPorQuestao } from '../lib/stats';

export default function QuestaoPagina() {
  const { id } = useParams();
  const { mapa, respostas } = useDados();
  const q = id ? mapa.get(decodeURIComponent(id)) : undefined;
  if (!q) return <div className="card"><h1>Questão não encontrada</h1><Link to="/provas">Voltar às provas</Link></div>;
  const ult = ultimaRespostaPorQuestao(respostas).get(q.id);
  return (
    <div className="sessao">
      <div className="row"><Link className="btn peq" to="/provas">Voltar</Link><span className="muted small">Revisão</span></div>
      <article className="folha">
        <div className="meta"><span className="tag">{q.disciplina}</span><span className="tag">Questão {q.numero} · {q.assunto}</span></div>
        <div className="enunciado">{q.enunciado}</div>
        {q.imagem && <figure className="figura"><img src={q.imagem} alt={q.imagemAlt ?? ''} /></figure>}
        <div className="alts">
          {opcoes(q).map((o) => (
            <div key={o.letra} className={`alt ${o.letra === q.gabarito ? 'certa' : ult && o.letra === ult.escolha ? 'errada' : 'apagada'}`}>
              <span className="bolha">{o.letra}</span><span className="t">{o.texto}</span>
            </div>
          ))}
        </div>
        <Explicacao q={q} escolha={ult?.escolha} />
      </article>
    </div>
  );
}
