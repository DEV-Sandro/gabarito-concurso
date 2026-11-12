/**
 * Como cada banca costuma cobrar. Edite à vontade.
 * São padrões observados em provas anteriores, não regras: confirme sempre no edital.
 * `exemplos` aponta números de questões da prova PC-PR 2026 (FGV), id = `pcpr-2026-agente-tipo1:N`.
 */
export const PROVA_BASE = 'pcpr-2026-agente-tipo1';

export interface PegadinhaBanca {
  titulo: string;
  comoCobra: string;
  comoEvitar: string;
  exemplos?: number[];
}

export interface Banca {
  id: string;
  nome: string;
  formato: string;
  perfil: string;
  confianca: 'alta' | 'media';
  pegadinhas: PegadinhaBanca[];
  estrategia: string[];
}

export const BANCAS: Banca[] = [
  {
    id: 'fgv',
    nome: 'FGV',
    formato: 'Múltipla escolha (A–E). Enunciados longos, textos de apoio e alternativas bem redigidas.',
    perfil: 'Cobra interpretação e aplicação em casos concretos, mais do que decoreba. As alternativas erradas costumam parecer plausíveis: a diferença está em uma palavra, uma relação lógica ou um detalhe da lei.',
    confianca: 'alta',
    pegadinhas: [
      {
        titulo: 'Alternativa que muda só um detalhe',
        comoCobra: 'Quatro alternativas bem escritas; a errada troca um verbo, um conectivo ou o sujeito da ação. Em Português, o texto é longo e a pergunta é sobre o efeito de sentido de uma escolha do autor.',
        comoEvitar: 'Volte ao trecho citado antes de marcar e confira se cada palavra da alternativa tem apoio no texto. Se a alternativa afirma algo que o texto não diz, é extrapolação.',
        exemplos: [2, 8, 11, 14, 23],
      },
      {
        titulo: 'Palavras absolutas e restritivas',
        comoCobra: '“Somente”, “exclusivamente”, “sempre”, “única”, “independentemente”, “eliminam”. Aparecem em alternativas de Direito, Informática e Direitos Humanos.',
        comoEvitar: 'Sublinhe a palavra absoluta e procure a exceção. Em regra, a alternativa certa é cautelosa (“pode”, “em regra”); mas confirme: na lei, às vezes o absoluto é o certo (como a proibição da tortura).',
        exemplos: [47, 51, 54, 98, 100],
      },
      {
        titulo: 'Afirmativas I, II e III com combinação',
        comoCobra: 'Três ou quatro afirmativas e alternativas com combinações (“I e III, apenas”). Um item errado derruba duas ou três alternativas ao mesmo tempo.',
        comoEvitar: 'Julgue cada afirmativa sozinha, marque V ou F, e só depois procure a combinação. Se duas afirmativas estão certas com segurança, já elimina metade das opções.',
        exemplos: [34, 38, 40, 46, 49, 56, 58],
      },
      {
        titulo: 'Sequência de verdadeiro e falso',
        comoCobra: 'Itens (  ) V ou F e alternativas com sequências (“V – F – V”). Muito usada em Direito, Informática e Realidade do Paraná.',
        comoEvitar: 'Julgue na ordem, anote ao lado e compare com as alternativas. O item falso costuma ter um detalhe invertido ou um número trocado.',
        exemplos: [32, 36, 43, 50, 60, 87, 90],
      },
      {
        titulo: 'Caso concreto com datas, nomes e personagens',
        comoCobra: 'Um enunciado longo (Perícia, Direito Penal, Processo Penal) pede a aplicação da lei ao caso, e muitas vezes é preciso notar o que o texto NÃO diz (por exemplo, não há causa de aumento).',
        comoEvitar: 'Grife os fatos, descarte o que for ruído e só aplique a lei ao que está escrito. Não imagine circunstâncias (repouso noturno, violência) que o enunciado não trouxe.',
        exemplos: [63, 68, 69, 86, 87, 88],
      },
      {
        titulo: 'Lei seca recente',
        comoCobra: 'Cobra alterações legislativas recentes (leis de 2024, 2025 e 2026) e decisões do STF. Quem estudou pela lei antiga erra.',
        comoEvitar: 'Estude com material atualizado e anote leis novas por tema. Em dúvida entre a regra antiga e a nova, desconfie da antiga.',
        exemplos: [46, 49, 50, 85, 88, 89, 90, 97],
      },
      {
        titulo: 'Exceto, não e a exceção',
        comoCobra: 'O enunciado pede a que NÃO se encaixa. Quem lê rápido marca a primeira correta.',
        comoEvitar: 'Circule “exceto/não/incorreta” antes de ler as alternativas. Depois marque V ou F em cada uma e escolha a que destoa.',
        exemplos: [35, 53],
      },
      {
        titulo: 'Conta com armadilha de passo',
        comoCobra: 'Raciocínio lógico e Estatística em que a resposta mais tentadora é um valor intermediário (o tempo restante, o número de casos “juntos”).',
        comoEvitar: 'Releia a pergunta no final: é o total ou o restante? Usa-se o complementar? Confira se o resultado intermediário aparece entre as alternativas: provavelmente é a isca.',
        exemplos: [26, 27, 28, 77],
      },
    ],
    estrategia: [
      'Antes de ler as alternativas, leia o enunciado inteiro e circule a palavra de comando (exceto, incorreta, de acordo com o texto).',
      'Elimine primeiro as alternativas com absolutos e as que acrescentam informação que o texto não traz.',
      'Em V ou F e em afirmativas I a IV, julgue cada item sozinho e só então compare com as alternativas.',
    ],
  },
  {
    id: 'cebraspe',
    nome: 'Cebraspe (ex-Cespe)',
    formato: 'Julgamento Certo ou Errado. Em muitos concursos, cada item errado anula um certo (nota “líquida”). Também há provas de múltipla escolha.',
    perfil: 'Cobra a literalidade da lei, súmulas e jurisprudência, e testa a atenção: o item parece certo e esconde uma palavra trocada. Em provas líquidas, deixar em branco é uma estratégia legítima.',
    confianca: 'alta',
    pegadinhas: [
      {
        titulo: 'Um termo trocado na lei seca',
        comoCobra: 'O item copia o artigo, mas troca o prazo, o órgão, o quórum ou o verbo (“poderá” por “deverá”).',
        comoEvitar: 'Confira cada elemento numérico e cada verbo de comando contra o que você estudou. Se houver dúvida em um deles, trate o item como suspeito.',
      },
      {
        titulo: 'Extensão indevida (apenas, somente, sempre, qualquer)',
        comoCobra: 'Uma regra geral vira absoluta, ou uma hipótese vira a única. Em Português, o item amplia o que o texto afirma.',
        comoEvitar: 'Ache a palavra de extensão e teste uma exceção. Se existir uma, o item está errado.',
      },
      {
        titulo: 'Item correto com conclusão errada',
        comoCobra: 'Começa com uma premissa verdadeira e termina com uma consequência que a lei ou o texto não autoriza.',
        comoEvitar: 'Leia até o fim. Julgue cada parte; basta um erro para o item inteiro ser errado.',
      },
      {
        titulo: 'Jurisprudência e informativos',
        comoCobra: 'Itens sobre posições recentes do STF/STJ e súmulas, inclusive decisões que mudaram o entendimento anterior.',
        comoEvitar: 'Revise súmulas e teses do tema, e anote o ano. Entendimento antigo costuma aparecer como item errado.',
      },
      {
        titulo: 'Questão de nota líquida',
        comoCobra: 'Cada erro tira um acerto. O chute às cegas tem valor esperado negativo.',
        comoEvitar: 'Só marque quando tiver mais de 50% de confiança no julgamento. Abaixo disso, deixar em branco costuma render mais pontos.',
      },
    ],
    estrategia: [
      'Treine com a pontuação líquida ligada para sentir o custo do erro.',
      'Aprenda a julgar item por item: marque Certo ou Errado e escreva o motivo em uma frase.',
      'Conferir edital: nem toda prova da banca é líquida.',
    ],
  },
  {
    id: 'vunesp',
    nome: 'Vunesp',
    formato: 'Múltipla escolha (A–E), comum em concursos de São Paulo (prefeituras, TJ, polícias).',
    perfil: 'Enunciados mais diretos que os da FGV. Português tradicional com ênfase em interpretação e gramática normativa; Direito com cobrança literal de lei e de súmulas.',
    confianca: 'media',
    pegadinhas: [
      {
        titulo: 'Gramática normativa em frases curtas',
        comoCobra: 'Concordância, regência, crase e pontuação em frases ou trechos curtos, com alternativas que mudam só uma palavra.',
        comoEvitar: 'Domine a regência dos verbos mais comuns e o teste da crase (trocar por masculino). Releia a frase com a alternativa já substituída.',
      },
      {
        titulo: 'Interpretação com alternativas parecidas',
        comoCobra: 'Duas alternativas quase iguais, e a diferença é uma palavra como “apenas” ou “sempre”.',
        comoEvitar: 'Compare as alternativas entre si: o ponto em que diferem é onde está a pegadinha.',
      },
      {
        titulo: 'Questões de “exceto” e de “incorreta”',
        comoCobra: 'Pedem a alternativa que NÃO se encaixa, e o enunciado traz a palavra no meio da frase.',
        comoEvitar: 'Circule a palavra de comando antes de ler as opções.',
      },
    ],
    estrategia: ['Confirme o perfil da banca no edital e nas últimas provas do mesmo cargo.', 'Faça provas anteriores do cargo para pegar o tamanho dos textos e o ritmo.'],
  },
  {
    id: 'fcc',
    nome: 'FCC',
    formato: 'Múltipla escolha (A–E), muito usada em tribunais, fazendas e tribunais de contas.',
    perfil: 'Cobra a literalidade da lei com precisão e atenção à redação oficial; Português com norma-padrão e reescrita de frases.',
    confianca: 'media',
    pegadinhas: [
      {
        titulo: 'Número, prazo e quórum trocados',
        comoCobra: 'A alternativa copia a regra e troca “dez dias” por “quinze”, “maioria absoluta” por “maioria simples”, ou o órgão competente.',
        comoEvitar: 'Monte uma lista de prazos, quóruns e competências do assunto e revise antes da prova.',
      },
      {
        titulo: 'Reescrita de frases',
        comoCobra: 'Pede qual reescrita mantém o sentido e está correta quanto à norma-padrão. A errada geralmente muda a relação lógica ou a regência.',
        comoEvitar: 'Teste as duas condições separadamente: sentido e correção.',
      },
      {
        titulo: 'Afirmativas combinadas em Direito',
        comoCobra: 'Itens I a IV e combinações; um detalhe errado derruba a combinação.',
        comoEvitar: 'Julgue cada item antes de olhar as alternativas.',
      },
    ],
    estrategia: ['Faça resumos de prazos e competências.', 'Treine muitas questões de lei seca da própria banca.'],
  },
  {
    id: 'outras',
    nome: 'IBFC, AOCP, Quadrix e outras',
    formato: 'Variam muito: algumas usam A–D, outras A–E, e há provas com itens Certo ou Errado.',
    perfil: 'Antes de estudar, abra o edital e pelo menos duas provas anteriores do mesmo cargo e banca. O formato, o tamanho dos textos e o peso das matérias mudam mais do que se imagina.',
    confianca: 'media',
    pegadinhas: [
      {
        titulo: 'Literalidade da lei e troca de termos',
        comoCobra: 'Bancas de médio e pequeno porte costumam cobrar o texto da lei com uma palavra alterada.',
        comoEvitar: 'Leia a lei seca em voz alta uma vez e responda questões do tema logo depois.',
      },
      {
        titulo: 'Regra geral com exceção escondida',
        comoCobra: 'A alternativa afirma a regra como absoluta e ignora a exceção prevista em lei.',
        comoEvitar: 'Ao estudar, sempre anote a regra E a exceção.',
      },
    ],
    estrategia: ['Sempre confira no edital o formato e a pontuação.', 'Quando a banca for nova para você, faça duas provas anteriores como diagnóstico.'],
  },
];
