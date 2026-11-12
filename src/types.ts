export type Tipo = 'mc' | 'ce';

export type Armadilha =
  | 'palavra-absoluta'
  | 'troca-de-conceito'
  | 'extrapolacao'
  | 'inversao'
  | 'parcialmente-correta'
  | 'excecao'
  | 'caso-concreto'
  | 'lei-seca'
  | 'jurisprudencia'
  | 'calculo-raciocinio'
  | 'pegadinha-gramatical';

export interface Alternativa {
  letra: string;
  texto: string;
}

export interface Questao {
  id: string; // `${slug}:${numero}`
  provaId: string;
  numero: number;
  disciplina: string;
  assunto: string;
  tipo: Tipo;
  enunciado: string;
  imagem?: string;
  imagemAlt?: string;
  alternativas: Alternativa[];
  gabarito: string;
  dificuldade: 1 | 2 | 3;
  armadilha: Armadilha;
  explicacao: string;
  dica: string;
  pegadinha: string;
  porQueErrada: Record<string, string>;
  anulada?: boolean;
  revisar?: boolean;
}

export interface Prova {
  id: string;
  titulo: string;
  banca: string;
  orgao: string;
  cargo: string;
  ano: number;
  tipo: Tipo;
  liquida: boolean; // Cebraspe: cada erro anula um acerto
  totalQuestoes: number;
  gabaritoFonte?: string;
}

export type Modo = 'diario' | 'assunto' | 'erros' | 'prova';

export interface Resposta {
  questaoId: string;
  provaId: string;
  escolha: string;
  correta: boolean;
  segundos: number;
  em: string; // ISO
  modo: Modo;
}

export interface Perfil {
  nome: string;
  meta: number;
}

export interface Usuario {
  id: string;
  email: string;
}

export interface ProvaArquivo {
  slug: string;
  titulo: string;
  banca: string;
  orgao: string;
  cargo: string;
  ano: number;
  tipo: Tipo;
  liquida?: boolean;
  gabaritoFonte?: string;
  questoes: Array<Omit<Questao, 'id' | 'provaId' | 'tipo'> & { tipo?: Tipo }>;
}
