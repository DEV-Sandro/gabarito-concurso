-- Gabarito · esquema do banco (Supabase / Postgres)
-- Rode inteiro no SQL Editor do Supabase.

create table if not exists provas (
  id text primary key,
  titulo text not null,
  banca text not null,
  orgao text not null,
  cargo text not null,
  ano int not null,
  tipo text not null default 'mc' check (tipo in ('mc','ce')),
  liquida boolean not null default false,
  total_questoes int not null default 0,
  gabarito_fonte text,
  criado_em timestamptz not null default now()
);

create table if not exists questoes (
  id text primary key,
  prova_id text not null references provas(id) on delete cascade,
  numero int not null,
  disciplina text not null,
  assunto text not null,
  tipo text not null default 'mc' check (tipo in ('mc','ce')),
  enunciado text not null,
  imagem text,
  imagem_alt text,
  alternativas jsonb not null default '[]',
  gabarito text not null,
  dificuldade int not null default 2 check (dificuldade between 1 and 3),
  armadilha text not null default 'parcialmente-correta',
  explicacao text not null default '',
  dica text not null default '',
  pegadinha text not null default '',
  por_que_errada jsonb not null default '{}',
  anulada boolean not null default false,
  revisar boolean not null default false,
  unique (prova_id, numero)
);

create table if not exists perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  meta int not null default 10 check (meta between 1 and 100)
);

create table if not exists respostas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  questao_id text not null,   -- ex.: pcpr-2026-agente-tipo1:47 (sem chave estrangeira: o app já traz as provas)
  prova_id text not null,
  escolha text not null,
  correta boolean not null,
  segundos int not null default 0,
  em timestamptz not null default now(),
  modo text not null default 'diario' check (modo in ('diario','assunto','erros','prova'))
);
create index if not exists respostas_user_em on respostas (user_id, em desc);

-- Segurança: cada pessoa só vê e grava as próprias respostas e o próprio perfil.
alter table provas enable row level security;
alter table questoes enable row level security;
alter table perfis enable row level security;
alter table respostas enable row level security;

drop policy if exists "provas leitura" on provas;
create policy "provas leitura" on provas for select to authenticated using (true);
drop policy if exists "questoes leitura" on questoes;
create policy "questoes leitura" on questoes for select to authenticated using (true);

drop policy if exists "perfil proprio" on perfis;
create policy "perfil proprio" on perfis for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "respostas proprias leitura" on respostas;
create policy "respostas proprias leitura" on respostas for select to authenticated using (user_id = auth.uid());
drop policy if exists "respostas proprias insercao" on respostas;
create policy "respostas proprias insercao" on respostas for insert to authenticated with check (user_id = auth.uid());
-- Sem update/delete: o histórico é imutável. Para "zerar", apague pelo painel do Supabase.

-- ===== Administrador (vê o progresso de todo mundo) =====
-- Só dá para entrar nesta tabela pelo SQL Editor; ninguém consegue se promover pelo app.
create table if not exists admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table admins enable row level security;
drop policy if exists "admin ve a propria linha" on admins;
create policy "admin ve a propria linha" on admins for select to authenticated using (user_id = auth.uid());

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from admins where user_id = auth.uid()) $$;

drop policy if exists "admin le perfis" on perfis;
create policy "admin le perfis" on perfis for select to authenticated using (is_admin());
drop policy if exists "admin le respostas" on respostas;
create policy "admin le respostas" on respostas for select to authenticated using (is_admin());

-- Para virar administrador (troque o nome de usuário; o e-mail interno é usuario@gabarito.app):
-- insert into admins (user_id) select id from auth.users where email = 'sandro@gabarito.app';
