export const APP_NOME = 'Gabarito';
export const META_PADRAO = 10;
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const MODO_NUVEM = Boolean(SUPABASE_URL && SUPABASE_ANON);

export const ARMADILHAS: Record<string, { nome: string; descricao: string }> = {
  'palavra-absoluta': { nome: 'Palavra absoluta', descricao: 'sempre, nunca, apenas, exclusivamente, todo.' },
  'troca-de-conceito': { nome: 'Troca de conceito', descricao: 'o termo certo no lugar do outro (parecidos).' },
  extrapolacao: { nome: 'Extrapolação', descricao: 'diz mais do que o texto ou a lei dizem.' },
  inversao: { nome: 'Inversão', descricao: 'troca causa e efeito, regra e exceção, mais e menos.' },
  'parcialmente-correta': { nome: 'Meia-verdade', descricao: 'começa certa e termina errada.' },
  excecao: { nome: 'Exceto / NÃO', descricao: 'pede a errada, a exceção ou a que não se aplica.' },
  'caso-concreto': { nome: 'Caso concreto', descricao: 'aplicar a regra a uma situação do dia a dia.' },
  'lei-seca': { nome: 'Lei seca alterada', descricao: 'detalhe literal da lei, prazo, órgão ou quórum.' },
  jurisprudencia: { nome: 'Jurisprudência', descricao: 'entendimento do STF/STJ que mudou ou é específico.' },
  'calculo-raciocinio': { nome: 'Conta e raciocínio', descricao: 'erro de passo, unidade ou complementar.' },
  'pegadinha-gramatical': { nome: 'Pegadinha gramatical', descricao: 'regência, crase, concordância em casos limite.' },
};
