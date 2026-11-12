import { NavLink, Outlet, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { APP_NOME } from '../config';
import { useDados } from '../state/DataContext';
import { IBancas, IFracos, IGear, IHoje, ILua, IPainel, IProvas, Logo } from './Icones';

function useTema() {
  const [t, setT] = useState<string>(() => document.documentElement.dataset.theme ?? '');
  useEffect(() => {
    if (t) document.documentElement.dataset.theme = t;
    try {
      if (t) localStorage.setItem('gabarito:tema', t);
    } catch {
      /* ignora */
    }
  }, [t]);
  const escuro = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { escuro, alternar: () => setT(escuro ? 'light' : 'dark') };
}

function SeloSalvo() {
  const { persistencia, semSalvar } = useDados();
  if (!persistencia) return null;
  const hora = persistencia.ultima ? new Date(persistencia.ultima).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const nuvem = persistencia.estado === 'nuvem';
  const texto = semSalvar > 0 ? 'Salvando…' : nuvem ? (hora ? `Salvo na nuvem às ${hora}` : 'Salvo na nuvem') : 'Salvo só neste navegador';
  return <div className={`selo ${nuvem && !semSalvar ? 'ok' : 'alerta'}`} role="status"><i aria-hidden="true" />{texto}</div>;
}

export default function Shell() {
  const { nuvem, semSalvar, persistencia, admin } = useDados();
  const { escuro, alternar } = useTema();
  const itens = [
    { to: '/', rotulo: 'Hoje', Icon: IHoje, end: true },
    { to: '/painel', rotulo: 'Painel', Icon: IPainel },
    { to: '/fracos', rotulo: 'Pontos fracos', Icon: IFracos },
    { to: '/provas', rotulo: 'Provas', Icon: IProvas },
    { to: '/bancas', rotulo: 'Bancas', Icon: IBancas },
    ...(admin ? [{ to: '/admin', rotulo: 'Grupo', Icon: IFracos }] : []),
  ];
  return (
    <div className="app">
      <header className="topo">
        <Link to="/" className="marca"><i><Logo /></i>{APP_NOME}</Link>
        <div className="acoes row">
          <button className="icone" onClick={alternar} aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}><ILua /></button>
          <Link className="icone" to="/ajustes" aria-label="Ajustes"><IGear /></Link>
        </div>
      </header>
      <nav className="nav" aria-label="Principal">
        {itens.map(({ to, rotulo, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <Icon />
            <span>{rotulo}</span>
          </NavLink>
        ))}
        <NavLink to="/ajustes" className={({ isActive }) => `so-desk ${isActive ? 'on' : ''}`}><IGear /><span>Ajustes</span></NavLink>
        <button className="so-desk nav-btn" onClick={alternar}><ILua /><span>{escuro ? 'Tema claro' : 'Tema escuro'}</span></button>
      </nav>
      <main className="main">
        <SeloSalvo />
        {persistencia?.estado === 'local' && <div className="aviso small" role="status">Seu progresso fica salvo neste navegador e neste aparelho. Se limpar os dados do navegador ou abrir em outro aparelho, começa do zero.</div>}
        {!nuvem && !persistencia && <div className="aviso small">{ 'Modo local: seu progresso fica só neste navegador. Para guardar na nuvem e acessar de qualquer aparelho, configure o Supabase (veja o README).'}</div>}
        {semSalvar > 0 && <div className="aviso red small" role="status">{semSalvar} resposta(s) ainda não foram salvas por falta de conexão. Vamos tentar de novo automaticamente.</div>}
        <Outlet />
      </main>
    </div>
  );
}
