/**
 * Verificador ortográfico simples para o editor de contratos.
 * Deteta palavras comuns em português que estão sem o acento esperado.
 *
 * Estratégia: lista curada de pares "sem acento" -> "com acento" para palavras
 * frequentes em contratos jurídicos. Não substitui um corretor completo,
 * mas sinaliza os erros mais comuns antes de guardar/gerar PDF.
 */

// Mapa de palavras frequentemente escritas sem acento -> forma correta.
// Mantemos minúsculas; a comparação é case-insensitive.
const COMMON_MISSPELLINGS: Record<string, string> = {
  // Substantivos / termos contratuais
  "contratacao": "contratação",
  "contratacoes": "contratações",
  "prestacao": "prestação",
  "prestacoes": "prestações",
  "obrigacao": "obrigação",
  "obrigacoes": "obrigações",
  "rescisao": "rescisão",
  "rescisoes": "rescisões",
  "inscricao": "inscrição",
  "inscricoes": "inscrições",
  "matricula": "matrícula",
  "matriculas": "matrículas",
  "mensalidade": "mensalidade", // sem acento, mantido
  "responsavel": "responsável",
  "responsaveis": "responsáveis",
  "aluno": "aluno",
  "credito": "crédito",
  "creditos": "créditos",
  "debito": "débito",
  "debitos": "débitos",
  "periodo": "período",
  "periodos": "períodos",
  "termino": "término",
  "inicio": "início",
  "numero": "número",
  "numeros": "números",
  "endereco": "endereço",
  "enderecos": "endereços",
  "servico": "serviço",
  "servicos": "serviços",
  "condicao": "condição",
  "condicoes": "condições",
  "disposicao": "disposição",
  "disposicoes": "disposições",
  "execucao": "execução",
  "execucoes": "execuções",
  "informacao": "informação",
  "informacoes": "informações",
  "utilizacao": "utilização",
  "utilizacoes": "utilizações",
  "duracao": "duração",
  "documentacao": "documentação",
  "comunicacao": "comunicação",
  "comunicacoes": "comunicações",
  "formacao": "formação",
  "formacoes": "formações",
  "educacao": "educação",
  "instituicao": "instituição",
  "instituicoes": "instituições",
  "regulamentacao": "regulamentação",
  "regulamentacoes": "regulamentações",
  "legislacao": "legislação",
  "legislacoes": "legislações",
  "remuneracao": "remuneração",
  "renumeracao": "remuneração",
  "isencao": "isenção",
  "isencoes": "isenções",
  "extincao": "extinção",
  "extincoes": "extinções",
  "decisao": "decisão",
  "decisoes": "decisões",
  "previsao": "previsão",
  "previsoes": "previsões",
  "transmissao": "transmissão",
  "transmissoes": "transmissões",
  "uniao": "união",
  "nao": "não",
  "sao": "são",
  "esta": "está",
  "estao": "estão",
  "ja": "já",
  "tambem": "também",
  "ate": "até",
  "voce": "você",
  "voces": "vocês",
  "podera": "poderá",
  "poderao": "poderão",
  "sera": "será",
  "serao": "serão",
  "tera": "terá",
  "terao": "terão",
  "fara": "fará",
  "farao": "farão",
  "ira": "irá",
  "irao": "irão",
  "estara": "estará",
  "estarao": "estarão",
  "havera": "haverá",
  "havendo": "havendo",
  "atraves": "através",
  "alem": "além",
  "apos": "após",
  "porem": "porém",
  "ninguem": "ninguém",
  "alguem": "alguém",
  "tres": "três",
  "video": "vídeo",
  "videos": "vídeos",
  "audio": "áudio",
  "audios": "áudios",
  "logica": "lógica",
  "logicas": "lógicas",
  "minimo": "mínimo",
  "minima": "mínima",
  "maximo": "máximo",
  "maxima": "máxima",
  "publico": "público",
  "publica": "pública",
  "publicos": "públicos",
  "publicas": "públicas",
  "ultimo": "último",
  "ultima": "última",
  "ultimos": "últimos",
  "ultimas": "últimas",
  "proximo": "próximo",
  "proxima": "próxima",
  "proximos": "próximos",
  "proximas": "próximas",
  "unico": "único",
  "unica": "única",
  "automatico": "automático",
  "automatica": "automática",
  "eletronico": "eletrônico",
  "eletronica": "eletrônica",
  "academico": "acadêmico",
  "academica": "acadêmica",
  "pratica": "prática",
  "praticas": "práticas",
  "tecnico": "técnico",
  "tecnica": "técnica",
  "didatico": "didático",
  "didatica": "didática",
  "pedagogico": "pedagógico",
  "pedagogica": "pedagógica",
  "obrigatorio": "obrigatório",
  "obrigatoria": "obrigatória",
  "necessario": "necessário",
  "necessaria": "necessária",
  "anterior": "anterior",
  "posterior": "posterior",
  "objeto": "objeto",
  "objetivo": "objetivo",
  "valido": "válido",
  "valida": "válida",
  "validos": "válidos",
  "validas": "válidas",
  "invalido": "inválido",
  "invalida": "inválida",
  "ciencia": "ciência",
  "consciencia": "consciência",
  "experiencia": "experiência",
  "experiencias": "experiências",
  "referencia": "referência",
  "referencias": "referências",
  "competencia": "competência",
  "competencias": "competências",
  "vigencia": "vigência",
  "diferenca": "diferença",
  "diferencas": "diferenças",
  "presenca": "presença",
  "ausencia": "ausência",
  "licenca": "licença",
  "licencas": "licenças",
  "conteudo": "conteúdo",
  "conteudos": "conteúdos",
  "individuo": "indivíduo",
  "individuos": "indivíduos",
  "fisico": "físico",
  "fisica": "física",
  "juridico": "jurídico",
  "juridica": "jurídica",
  "civel": "cível",
  "judicial": "judicial",
  "extrajudicial": "extrajudicial",
  "ambito": "âmbito",
  "ambitos": "âmbitos",
  "garantia": "garantia",
  "ate-que": "até que",
  "porem,": "porém,",
};

export interface SpellIssue {
  /** Palavra detetada (forma original com case preservado) */
  word: string;
  /** Sugestão correta */
  suggestion: string;
  /** Posição inicial no texto */
  start: number;
  /** Posição final (exclusiva) */
  end: number;
}

/**
 * Verifica o texto e devolve uma lista de problemas ortográficos detetados.
 * Ignora palavras dentro de placeholders como [Nome], [Total_1], etc.
 */
export function findSpellingIssues(text: string): SpellIssue[] {
  if (!text) return [];

  const issues: SpellIssue[] = [];
  // Marcar intervalos de placeholders para ignorar
  const placeholderRanges: Array<[number, number]> = [];
  const placeholderRegex = /\[[^\]]+\]/g;
  let phMatch: RegExpExecArray | null;
  while ((phMatch = placeholderRegex.exec(text)) !== null) {
    placeholderRanges.push([phMatch.index, phMatch.index + phMatch[0].length]);
  }

  const isInsidePlaceholder = (start: number, end: number) =>
    placeholderRanges.some(([s, e]) => start >= s && end <= e);

  // Capturar palavras (incluindo acentos para evitar marcar a versão correta)
  const wordRegex = /[A-Za-zÀ-ÖØ-öø-ÿ]+/g;
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(text)) !== null) {
    const original = match[0];
    const lower = original.toLowerCase();
    const start = match.index;
    const end = start + original.length;

    if (isInsidePlaceholder(start, end)) continue;

    const suggestion = COMMON_MISSPELLINGS[lower];
    if (!suggestion) continue;
    // Se a palavra já estiver na forma correta (com acento), não sinalizar
    if (lower === suggestion.toLowerCase()) continue;

    // Preservar capitalização da primeira letra
    let suggested = suggestion;
    if (original[0] === original[0].toUpperCase()) {
      suggested = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
    }
    if (original === original.toUpperCase() && original.length > 1) {
      suggested = suggestion.toUpperCase();
    }

    issues.push({ word: original, suggestion: suggested, start, end });
  }

  return issues;
}

/** Aplica todas as sugestões automaticamente ao texto. */
export function applySpellingFixes(text: string, issues: SpellIssue[]): string {
  if (issues.length === 0) return text;
  // Aplicar de trás para a frente para preservar índices
  const sorted = [...issues].sort((a, b) => b.start - a.start);
  let result = text;
  for (const issue of sorted) {
    result = result.slice(0, issue.start) + issue.suggestion + result.slice(issue.end);
  }
  return result;
}
