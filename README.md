# Gabarito · simulador de provas

Simulado diário com correção explicada, painel de desempenho, gamificação e uma página com as pegadinhas de cada banca. Já vem com a prova **PC-PR 2026 · Agente de Polícia Judiciária (FGV, Tipo 1)**, com as 100 questões, explicações, dicas, pegadinhas e o porquê de cada alternativa errada.

Stack: Vite + React + TypeScript, Supabase (login e banco), Vercel (hospedagem).

## Rodar agora (sem configurar nada)

```bash
npm install
npm run dev
```

Sem Supabase, o app funciona em **modo local**: o progresso fica no navegador.

## Publicar com Supabase + Vercel

1. **Supabase**: crie um projeto. No *SQL Editor*, rode `supabase/schema.sql`.
2. *Authentication → Providers → Email*: deixe o cadastro **ligado** (qualquer pessoa com o link cria a conta) e **desligue “Confirm email”**. O app usa nome de usuário e senha: por baixo, o usuário `maria` vira o e-mail interno `maria@gabarito.app`, e o Supabase não deixa dois usuários iguais nem entrar na conta de outra pessoa.
3. Copie `.env.example` para `.env` e preencha as chaves (URL e anon key em *Project Settings → API*; a service role só para o importador).
4. (Opcional) Importe as provas para o banco. Sem isso o app usa as provas que já vêm no projeto:
   ```bash
   npm run validar
   npm run importar        # usa node --env-file=.env
   ```
   (Se o banco estiver vazio, o app usa as provas da pasta `provas/`.)
5. **Administrador**: crie a sua conta no app (por exemplo, usuário `sandro`) e rode no SQL Editor `insert into admins (user_id) select id from auth.users where email = 'sandro@gabarito.app';`. A aba **Grupo** aparece só para você e mostra o progresso de cada pessoa. Ninguém se promove pelo app.
6. **Vercel**: importe o repositório, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em *Environment Variables* e faça o deploy. O `vercel.json` já cuida das rotas.

## Adicionar outra prova

Crie `provas/minha-prova.json` seguindo `docs/FORMATO_PROVA.md`, rode `npm run validar` e `npm run importar`. Provas Cebraspe usam `"tipo": "ce"` e `"liquida": true` (cada erro anula um acerto).

## Onde editar

- `src/config.ts`: nome do app (`APP_NOME`), meta padrão, tipos de pegadinha.
- `src/data/bancas.ts`: texto da página “Como cada banca cobra”.
- `src/data/dicas.ts`: dicas do professor por matéria.

## Avisos

- O gabarito da prova PC-PR veio de um espelho de terceiros (preliminar). **Confira com o PDF oficial da FGV** e use `"anulada": true` nas questões anuladas.
- Questões marcadas com `revisar` (leis muito recentes) têm explicação baseada no gabarito, sem o texto integral da lei: vale conferir.
- As provas pertencem às bancas e aos órgãos. Use em grupo pequeno, para estudo, e não publique abertamente.

## Testes

`npm test` (estatísticas, XP/sequência, sorteio ponderado e pontuação líquida) e `npm run build`.
