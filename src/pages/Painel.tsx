import { Link } from 'react-router-dom';
import { useDados } from '../state/DataContext';
import { agrupar, diagnosticar, nota, porDia } from '../lib/stats';
import { calcularSequencia, calcularXp, conquistas, contarPorDia, nivelDoXp } from '../lib/gamificacao';
import { chaveDia, diaSemana, ultimosDias } from '../lib/datas';

export default function Painel() {
  const { respostas, questoes, mapa, perfil } = useDados();
  const meta = perfil.meta;
  const disc = agrupar(respostas, mapa, 'disciplina').sort((a, b) => a.chave.localeCompare(b.chave, 'pt'));
  const dias = porDia(respostas, ultimosDias(14));
  const max = Math.max(meta, ...dias.map((d) => d.total));
  const xp = calcularXp(respostas, meta);
  const nv = nivelDoXp(xp);
  const seq = calcularSequencia(respostas, meta);
  const total = respostas.length;
  const acertos = respostas.filter((r) => r.correta).length;
  const dg = diagnosticar(respostas, questoes);
  const car = conquistas(respostas, questoes, meta);
  const cont = contarPorDia(respostas);
  const semanas = ultimosDias(84);
  const grade = [...Array(semanas.length)].map((_, i) => semanas[i]);
  const [gy, gm, gd] = grade[0].split('-').map(Number);
  const inicioSem = new Date(gy, gm - 1, gd).getDay();
  const celulas = [...Array(inicioSem).fill(null), ...grade];

  return (
    <>
      <h1>Seu painel</h1>
      <section className="stats" aria-label="Resumo">
        <div><b className="num">{total ? (acertos / total * 10).toFixed(1).replace('.', ',') : '–'}</b><span>nota geral (0 a 10)</span></div>
        <div><b className="num">{total ? Math.round((acertos / total) * 100) : 0}%</b><span>de acerto em {total}</span></div>
        <div><b className="num">{seq.atual}</b><span>dias seguidos (melhor {seq.melhor})</span></div>
        <div><b className="num">{nv.nivel}</b><span>{nv.titulo} · {xp} XP</span></div>
      </section>

      <section className="card">
        <h2>Diagnóstico do professor</h2>
        <div className="dg" style={{ marginTop: 10 }}>
          {dg.map((d, i) => (
            <div key={i} className={`item ${d.tipo}`}>
              <h3>{d.titulo}</h3><p>{d.texto}</p>
              {d.acao && <Link className="btn peq" to={d.acao.para}>{d.acao.rotulo}</Link>}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Boletim</h2>
        <p className="muted small">Nota de 0 a 10 por matéria, com base nas questões que você já respondeu.</p>
        {disc.length === 0 ? <p className="muted">Responda algumas questões para ver o seu boletim.</p> : (
          <div className="boletim" style={{ marginTop: 12 }}>
            {disc.map((l) => {
              const n = nota(l);
              return (
                <div className="l" key={l.chave}>
                  <span className="nome" title={l.chave}>{l.chave}</span>
                  <div className={`barra ${n < 5 ? 'red' : ''}`} role="img" aria-label={`${l.acertos} acertos em ${l.total}`}><i style={{ width: `${n * 10}%` }} /></div>
                  <span className={`nt num ${n < 5 ? 'baixa' : n >= 8 ? 'alta' : ''}`}>{n.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Últimos 14 dias</h2>
        <p className="muted small">Barra azul: respondidas. Vermelho: erros. Tracejado: sua meta ({meta}).</p>
        <div className="colunas" style={{ marginTop: 18 }} role="img" aria-label="Questões respondidas por dia">
          <div className="meta-linha" style={{ bottom: `${22 + (meta / max) * 100}px` }}><span>meta</span></div>
          {dias.map((d) => (
            <div className="c" key={d.dia} title={`${d.dia}: ${d.total} respondidas, ${d.acertos} certas`}>
              <i style={{ height: `${Math.max(2, (d.total / max) * 100)}px` }}>{d.total > 0 && <em style={{ height: `${((d.total - d.acertos) / d.total) * 100}%` }} />}</i>
              <span>{diaSemana(d.dia)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Constância nas últimas 12 semanas</h2>
        <div className="heat" style={{ marginTop: 12 }} aria-label="Dias estudados">
          {celulas.map((d, i) => {
            if (!d) return <i key={i} style={{ visibility: 'hidden' }} />;
            const n = cont.get(chaveDia(d)) ?? 0;
            const nivel = n === 0 ? 0 : n < meta / 2 ? 1 : n < meta ? 2 : 3;
            return <i key={i} data-n={nivel} title={`${d}: ${n}`} />;
          })}
        </div>
      </section>

      <section className="card">
        <h2>Carimbos</h2>
        <div className="carimbos" style={{ marginTop: 12 }}>
          {car.map((c) => (
            <div key={c.id} className={`carimbo ${c.conquistado ? 'on' : ''}`}>
              <b>{c.nome}</b>{c.descricao}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
