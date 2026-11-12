import { useEffect, useRef, useState } from 'react';
import type { Questao } from '../types';
import { ARMADILHAS } from '../config';

/** Círculo de caneta vermelha em volta da alternativa certa. */
function Caneta() {
  return (
    <svg className="caneta" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <path pathLength={1} d="M12 8 C60 -2 150 -1 192 7 C203 12 200 30 186 34 C140 41 50 42 14 34 C-2 30 2 12 20 6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function opcoes(q: Questao) {
  return q.tipo === 'ce' ? [{ letra: 'C', texto: 'Certo' }, { letra: 'E', texto: 'Errado' }] : q.alternativas;
}

function Enunciado({ texto }: { texto: string }) {
  const partes = texto.split(/\n{2,}/);
  return (
    <div className="enunciado">
      {partes.map((p, i) => (
        <p key={i} className={i === partes.length - 1 && partes.length > 1 ? 'final' : undefined}>{p}</p>
      ))}
    </div>
  );
}

export function Explicacao({ q, escolha }: { q: Questao; escolha?: string }) {
  const nota = escolha && escolha !== q.gabarito ? q.porQueErrada[escolha] : undefined;
  return (
    <div className="correcao">
      <div className="bloco"><b>Por que a resposta é {q.gabarito}</b><span className="marca-texto">{q.explicacao}</span></div>
      {nota && <div className="nota"><b>Você marcou {escolha}.</b> {nota}</div>}
      <div className="bloco dica"><b>Dica do professor</b>{q.dica}</div>
      <div className="bloco peg"><b>Pegadinha: {ARMADILHAS[q.armadilha]?.nome ?? q.armadilha}</b>{q.pegadinha}</div>
      {q.revisar && <div className="aviso small">Esta explicação segue o gabarito preliminar, sem o texto integral da lei à vista. Se tiver dúvida, confira na fonte oficial.</div>}
      <details className="todas">
        <summary>Por que as outras alternativas estão erradas</summary>
        {Object.entries(q.porQueErrada).map(([l, t]) => <p key={l}><b>{l})</b> {t}</p>)}
      </details>
    </div>
  );
}

interface Props {
  q: Questao;
  indice: number;
  total: number;
  /** Se verdadeiro, mostra a correção logo após confirmar (modo estudo). */
  corrigirAgora: boolean;
  onConfirmar(escolha: string, segundos: number): void;
  onProxima(): void;
  ultima: boolean;
}

export default function Folha({ q, indice, total, corrigirAgora, onConfirmar, onProxima, ultima }: Props) {
  const [sel, setSel] = useState<string | null>(null);
  const [revelada, setRevelada] = useState(false);
  const inicio = useRef(Date.now());
  const ops = opcoes(q);
  const certaAnulada = Boolean(q.anulada);

  useEffect(() => {
    setSel(null);
    setRevelada(false);
    inicio.current = Date.now();
  }, [q.id]);

  const confirmar = () => {
    if (!sel || revelada) return;
    onConfirmar(sel, Math.max(1, Math.round((Date.now() - inicio.current) / 1000)));
    if (corrigirAgora) setRevelada(true);
    else onProxima();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (!revelada && ops.some((o) => o.letra === k)) setSel(k);
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (revelada) onProxima();
        else confirmar();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const acertou = revelada && sel === q.gabarito;
  return (
    <>
      <article className="folha" aria-labelledby={`q-${q.id}`}>
        <div className="meta">
          <span className="tag">{q.disciplina}</span>
          <span className="tag" style={{ background: 'transparent', border: '1px solid var(--rule)', color: 'var(--ink-2)' }}>Questão {q.numero} · {q.assunto}</span>
        </div>
        <h2 id={`q-${q.id}`} className="sr">Questão {indice + 1} de {total}</h2>
        <Enunciado texto={q.enunciado} />
        {q.imagem && <figure className="figura"><img src={q.imagem} alt={q.imagemAlt ?? ''} loading="lazy" /></figure>}
        <div className="alts" role="radiogroup" aria-label="Alternativas">
          {ops.map((o) => {
            const ehCerta = revelada && o.letra === q.gabarito;
            const ehErrada = revelada && o.letra === sel && o.letra !== q.gabarito;
            const cls = ['alt', !revelada && sel === o.letra ? 'sel' : '', ehCerta ? 'certa' : '', ehErrada ? 'errada' : '', revelada && !ehCerta && !ehErrada ? 'apagada' : ''].join(' ');
            return (
              <button key={o.letra} role="radio" aria-checked={sel === o.letra} className={cls} disabled={revelada} onClick={() => setSel(o.letra)}>
                <span className="bolha">{o.letra}</span>
                <span className="t">{o.texto}</span>
                {ehCerta && <Caneta />}
              </button>
            );
          })}
        </div>
        {revelada && (
          <>
            <p className={`veredito ${acertou ? 'ok' : 'no'}`} style={{ marginTop: 14 }} role="status">
              {certaAnulada ? 'Questão anulada pela banca.' : acertou ? 'Certo.' : `Errado. A resposta é ${q.gabarito}.`}
            </p>
            <Explicacao q={q} escolha={sel ?? undefined} />
          </>
        )}
      </article>
      <div className="rodape-sessao">
        <span className="teclas">Teclas {ops.map((o) => <kbd key={o.letra}>{o.letra} </kbd>)}escolhem, <kbd>Enter</kbd> confirma</span>
        {!revelada ? (
          <button className="btn pri" disabled={!sel} onClick={confirmar}>{corrigirAgora ? 'Confirmar' : ultima ? 'Confirmar e finalizar' : 'Confirmar e seguir'}</button>
        ) : (
          <button className="btn pri" onClick={onProxima} autoFocus>{ultima ? 'Ver resultado' : 'Próxima'}</button>
        )}
      </div>
    </>
  );
}
