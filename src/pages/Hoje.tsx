import { Link } from 'react-router-dom';
import { useDados } from '../state/DataContext';
import { chaveDia, diaSemana, ultimosDias } from '../lib/datas';
import { calcularSequencia, calcularXp, contarPorDia, nivelDoXp } from '../lib/gamificacao';
import { diagnosticar, questoesErradas } from '../lib/stats';

export default function Hoje() {
  const { respostas, perfil, questoes } = useDados();
  const hoje = chaveDia(new Date());
  const cont = contarPorDia(respostas);
  const feitasHoje = cont.get(hoje) ?? 0;
  const meta = perfil.meta;
  const pronta = feitasHoje >= meta;
  const p = Math.min(1, feitasHoje / meta);
  const xp = calcularXp(respostas, meta);
  const nv = nivelDoXp(xp);
  const seq = calcularSequencia(respostas, meta);
  const diag = diagnosticar(respostas, questoes)[0];
  const erros = questoesErradas(respostas).length;
  const hora = new Date().getHours();
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const semana = ultimosDias(7);
  const acertos = respostas.filter((r) => r.correta).length;

  return (
    <>
      <section className="capa">
        <div className="capa-texto">
          <p className="data">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{saud}{perfil.nome ? `, ${perfil.nome}` : ''}.</h1>
          <p className="lead">
            {pronta ? `Meta cumprida: ${feitasHoje} questões hoje. Dá para ir além ou revisar os erros.` : feitasHoje ? `Faltam ${meta - feitasHoje} questões para fechar a meta de hoje.` : `Sua meta de hoje é de ${meta} questões, uns 15 minutos.`}
          </p>
          <div className="row">
            <Link className="btn pri grande" to="/treino?modo=diario">{pronta ? 'Mais uma rodada' : feitasHoje ? 'Continuar o simulado' : 'Começar o simulado'}</Link>
            {erros > 0 && <Link className="btn grande" to="/treino?modo=erros">Refazer erros ({erros})</Link>}
          </div>
        </div>
        <div className={`anel ${pronta ? 'ok' : ''}`} style={{ ['--p' as string]: p }} role="img" aria-label={`${feitasHoje} de ${meta} questões hoje`}>
          <svg viewBox="0 0 120 120"><circle className="fundo" cx="60" cy="60" r="50" /><circle className="valor" cx="60" cy="60" r="50" /></svg>
          <b><span>{feitasHoje}<small>de {meta}</small></span></b>
        </div>
      </section>

      <section className="semana" aria-label="Últimos 7 dias">
        {semana.map((d) => {
          const n = cont.get(d) ?? 0;
          const feito = n >= meta;
          return (
            <div key={d} className={`dia ${feito ? 'feito' : n > 0 ? 'parcial' : ''} ${d === hoje ? 'hoje' : ''}`} title={`${n} questões`}>
              <span className="marca-dia" aria-hidden="true">{feito ? '✓' : n > 0 ? n : ''}</span>
              <span className="nome-dia">{diaSemana(d)}</span>
            </div>
          );
        })}
      </section>

      <section className="stats" aria-label="Seu ritmo">
        <div><b className="num">{seq.atual}</b><span>{seq.atual === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
        <div><b className="num">{respostas.length}</b><span>respondidas</span></div>
        <div><b className="num">{respostas.length ? Math.round((acertos / respostas.length) * 100) : 0}%</b><span>de acerto</span></div>
        <div><b className="num">{nv.nivel}</b><span>{nv.titulo}</span></div>
      </section>
      <div className="xp"><div className="barra"><i style={{ width: `${((xp - nv.deNivel) / (nv.paraProximo - nv.deNivel)) * 100}%` }} /></div><span className="small muted num">{xp} de {nv.paraProximo} XP para o nível {nv.nivel + 1}</span></div>

      {diag && (
        <section className="correcao-prof">
          <h2>Recado do professor</h2>
          <div className={`recado ${diag.tipo}`}>
            <h3>{diag.titulo}</h3>
            <p>{diag.texto}</p>
            {diag.acao && <Link className="btn peq" to={diag.acao.para}>{diag.acao.rotulo}</Link>}
          </div>
          <p className="small" style={{ marginTop: 10, marginBottom: 0 }}><Link to="/painel">Ver painel completo</Link></p>
        </section>
      )}

      <section className="atalhos">
        <Link to="/provas"><b>Fazer a prova inteira</b><span>PC-PR 2026 com 100 questões. A correção vem no final.</span></Link>
        <Link to="/bancas"><b>Pegadinhas de cada banca</b><span>Como FGV, Cebraspe, Vunesp e FCC costumam cobrar.</span></Link>
      </section>
    </>
  );
}
