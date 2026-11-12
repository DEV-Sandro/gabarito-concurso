import { useState, type FormEvent } from 'react';
import { APP_NOME } from '../config';
import { useDados } from '../state/DataContext';

const traduz = (m: string) =>
  m === 'Invalid login credentials' ? 'Usuário ou senha incorretos.' : /already registered/i.test(m) ? 'Esse nome de usuário já existe. Escolha outro ou entre com a sua senha.' : /rate limit/i.test(m) ? 'Muitas tentativas. Espere um pouco e tente de novo.' : /password/i.test(m) ? 'A senha precisa ter pelo menos 6 caracteres.' : m;

export default function Entrar() {
  const { entrar } = useDados();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [criar, setCriar] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [env, setEnv] = useState(false);
  const valido = /^[a-z0-9_]{3,20}$/i.test(usuario.trim());

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido) return setMsg('Use de 3 a 20 letras, números ou _ no nome de usuário, sem espaços.');
    setEnv(true);
    const r = await entrar(usuario, senha, criar);
    setMsg(r ? traduz(r) : null);
    setEnv(false);
  };
  return (
    <form className="centro" onSubmit={enviar}>
      <h1>{APP_NOME}</h1>
      <p className="muted">{criar ? 'Escolha um nome de usuário e uma senha. Só você acessa o seu progresso.' : 'Entre com o seu usuário e senha para ver o seu progresso.'}</p>
      <label>Usuário<input id="usuario" autoComplete="username" autoCapitalize="none" required value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="ex.: maria_pc" /></label>
      <label>Senha<input id="senha" type="password" autoComplete={criar ? 'new-password' : 'current-password'} minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
      {msg && <div className="aviso red" role="alert">{msg}</div>}
      <button className="btn pri grande" disabled={env}>{env ? 'Aguarde…' : criar ? 'Criar conta' : 'Entrar'}</button>
      <button type="button" className="btn" onClick={() => { setCriar(!criar); setMsg(null); }}>{criar ? 'Já tenho conta' : 'Criar uma conta'}</button>
    </form>
  );
}
