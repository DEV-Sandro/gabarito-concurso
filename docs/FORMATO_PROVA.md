# Formato do arquivo de prova

```jsonc
{
  "slug": "pcpr-2026-agente-tipo1",     // identificador único, sem espaços
  "titulo": "…", "banca": "FGV", "orgao": "PC-PR", "cargo": "…", "ano": 2026,
  "tipo": "mc",                          // "mc" (A–E) ou "ce" (Certo/Errado)
  "liquida": false,                      // true: cada erro anula um acerto (Cebraspe)
  "gabaritoFonte": "texto opcional",
  "questoes": [{
    "numero": 1,
    "disciplina": "Língua Portuguesa",
    "assunto": "Regência verbal",
    "enunciado": "Parágrafos separados por linha em branco. O último parágrafo é a pergunta.",
    "imagem": "/img/minha-prova/q01.png", "imagemAlt": "descrição da imagem",   // opcionais
    "alternativas": [{ "letra": "A", "texto": "…" }],   // omitir em "ce"
    "gabarito": "D",                     // "C" ou "E" em "ce"
    "dificuldade": 2,                    // 1 fácil, 2 média, 3 difícil
    "armadilha": "palavra-absoluta",     // ver src/config.ts (ARMADILHAS)
    "explicacao": "Por que a resposta está certa.",
    "dica": "Como não errar de novo.",
    "pegadinha": "A isca da questão.",
    "porQueErrada": { "A": "…", "B": "…" },   // uma entrada por alternativa errada
    "anulada": false, "revisar": false   // opcionais
  }]
}
```

`npm run validar` confere gabarito, alternativas e `porQueErrada`. As imagens ficam em `public/img/`.
