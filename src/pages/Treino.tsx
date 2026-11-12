import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useDados } from '../state/DataContext';
import type { Modo, Questao, Resposta } from '../types';
import { montarSessao, pontuar } from '../lib/selecao';
import { calcularXp } from '../lib/gamificacao';
import Folha from '../components/Folha';

const ROTULO: Record<Modo, string> = { diario: 'Simulado de hoje', assunto: 'Treino por matéria', erros: 'Refazendo seus erros', prova: 'Prova completa' };

export default function Treino() {
  const { questoes, respostas, perfil, responder, provas } = useDados();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const modo = (sp.get('modo') as Modo) || 'diario';
  const provaId = sp.get('prova') ?? undefined;
  const disciplina = sp.get('disciplina') ?? undefined;
  const assunto = sp.get('assunto') ?? undefined;
  const chave = sp.toString();
  const [rodada, setRodada] = useState(0);

  // A fila é sorteada uma vez por rodada; responder não pode embaralhar a sessão.
  const respostasIniciais = useRef(respostas);
  const fila = useMemo<Questao[]>(() => {
    respostasIniciais.current = respostas;
    return montarSessao(questoes, respostas, { modo, provaId, disciplina, assunto }, perfil.meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, rodada, questoes.length]);
  const xpAntes = useRef(calcularXp(respostas, perfil.meta));
  const [pos, setPos] = useState(0);
  const [feitas, setFeitas] = useState<Resposta[]>([]);
  const [fim, setFim] = useState(false);

  const reiniciar = () => {
    setPos(0);
    setFeitas([]);
    setFim(false);
    xpAntes.current = calcularXp(respostas, perfil.meta);
    setRodada((r) => r + 1);
  };

  if (!fila.length) {
    return (
      <div className="sessao">
        <div className="card">
          <h1>Nada para treinar aqui</h1>
          <p className="muted">{modo === 'erros' ? 'Você não tem erros pendentes. Responda um simulado e volte quando errar alguma.' : 'Nenhuma questão encontrada para esse filtro.'}</p>
          <Link className="btn pri" to="/">Voltar</Link>
        </div>
      </div>
    );
  }

  if (fim) {
    const prova = provas.find((p) => p.id === (provaId ?? fila[0]?.provaId));
    const { acertos, erros, pontos } = pontuar(feitas, modo === 'prova' && Boolean(prova?.liquida));
    const xpGanho = calcularXp([...respostasIniciais.current, ...feitas], perfil.meta) - xpAntes.current;
    const errou = feitas.filter((f) => !f.correta);
    return (
      <div className="sessao">
        <div className="card">
          <h1>{acertos} de {feitas.length} certas</h1>
          <p className="muted">{ROTULO[modo]} · +{xpGanho} XP{prova?.liquida && modo === 'prova' ? ` · nota líquida ${pontos}` : ''}</p>
          <div className="barra" style={{ margin: '12px 0' }}><i style={{ width: `${(acertos / Math.max(1, feitas.length)) * 100}%` }} /></div>
          <div className="row">
            <button className="btn pri" onClick={reiniciar}>{modo === 'prova' ? 'Refazer' : 'Mais uma rodada'}</button>
            <Link className="btn" to="/painel">Ver meu painel</Link>
          </div>
        </div>
        {errou.length > 0 && (
          <div className="card">
            <h2>Para revisar ({erros})</h2>
            <p className="muted small">Abra cada erro e leia a explicação antes de seguir.</p>
            <div className="lista">
              {errou.map((f) => (
                <div className="it" key={f.questaoId}>
                  <Link to={`/questao/${encodeURIComponent(f.questaoId)}`}>Questão {f.questaoId.split(':')[1]}</Link>
                  <span className="muted small">Você marcou {f.escolha}. Gabarito {questoes.find((q) => q.id === f.questaoId)?.gabarito}.</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const q = fila[pos];
  const corrigirAgora = modo !== 'prova';
  const confirmar = (escolha: string, segundos: number) => {
    const r: Resposta = { questaoId: q.id, provaId: q.provaId, escolha, correta: Boolean(q.anulada) || escolha === q.gabarito, segundos, em: new Date().toISOString(), modo };
    setFeitas((f) => [...f, r]);
    void responder(r);
  };
  const proxima = () => (pos + 1 >= fila.length ? setFim(true) : setPos(pos + 1));

  return (
    <div className="sessao">
      <div className="row">
        <button className="btn peq" onClick={() => nav(-1)}>Sair</button>
        <b>{ROTULO[modo]}</b>
        <span className="espaco" />
        <span className="muted small num">{pos + 1} / {fila.length}</span>
      </div>
      <div className="progresso"><div className="barra"><i style={{ width: `${(pos / fila.length) * 100}%` }} /></div></div>
      {modo === 'prova' && <div className="aviso small">Modo prova: a correção aparece só no final.</div>}
      <Folha key={q.id} q={q} indice={pos} total={fila.length} corrigirAgora={corrigirAgora} onConfirmar={confirmar} onProxima={proxima} ultima={pos + 1 >= fila.length} />
    </div>
  );
}
