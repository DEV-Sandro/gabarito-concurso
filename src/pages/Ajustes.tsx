import { useState } from 'react';
import { useDados, usuarioDoEmail } from '../state/DataContext';

export default function Ajustes() {
  const { perfil, atualizarPerfil, usuario, nuvem, sair } = useDados();
  const [nome, setNome] = useState(perfil.nome);
  const [meta, setMeta] = useState(perfil.meta);
  const [ok, setOk] = useState(false);
  return (
    <>
      <h1>Ajustes</h1>
      <form className="card" style={{ display: 'grid', gap: 14, maxWidth: 420 }} onSubmit={async (e) => { e.preventDefault(); await atualizarPerfil({ nome: nome.trim(), meta }); setOk(true); }}>
        <label>Seu nome<input value={nome} onChange={(e) => { setNome(e.target.value); setOk(false); }} maxLength={40} /></label>
        <label>Meta diária
          <select value={meta} onChange={(e) => { setMeta(Number(e.target.value)); setOk(false); }}>
            {[5, 10, 15, 20, 30, 50].map((n) => <option key={n} value={n}>{n} questões por dia</option>)}
          </select>
        </label>
        <button className="btn pri">Salvar</button>
        {ok && <span role="status" className="small" style={{ color: 'var(--ok)' }}>Ajustes salvos.</span>}
      </form>
      <div className="card">
        <p className="small muted" style={{ marginBottom: nuvem ? 12 : 0 }}>{nuvem ? `Conectado como ${usuarioDoEmail(usuario?.email ?? '')}.` : 'Modo local: os dados ficam neste navegador.'}</p>
        {nuvem && <button className="btn" onClick={sair}>Sair</button>}
      </div>
    </>
  );
}
