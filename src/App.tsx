import { Navigate, Route, Routes } from 'react-router-dom';
import { useDados } from './state/DataContext';
import Shell from './components/Shell';
import Hoje from './pages/Hoje';
import Treino from './pages/Treino';
import Painel from './pages/Painel';
import Fracos from './pages/Fracos';
import Provas from './pages/Provas';
import Bancas from './pages/Bancas';
import Entrar from './pages/Entrar';
import Ajustes from './pages/Ajustes';
import Admin from './pages/Admin';
import QuestaoPagina from './pages/QuestaoPagina';

export default function App() {
  const { pronto, usuario, nuvem, erro } = useDados();
  if (nuvem && !usuario && pronto) return <Entrar />;
  if (!pronto) return <div className="centro"><p className="muted" role="status">Carregando suas questões…</p></div>;
  if (erro) return <div className="centro"><div className="aviso red"><b>Não foi possível carregar os dados.</b><br />{erro}<br /><button className="btn peq" onClick={() => location.reload()}>Tentar de novo</button></div></div>;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Hoje />} />
        <Route path="treino" element={<Treino />} />
        <Route path="painel" element={<Painel />} />
        <Route path="fracos" element={<Fracos />} />
        <Route path="provas" element={<Provas />} />
        <Route path="bancas" element={<Bancas />} />
        <Route path="admin" element={<Admin />} />
        <Route path="ajustes" element={<Ajustes />} />
        <Route path="questao/:id" element={<QuestaoPagina />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
