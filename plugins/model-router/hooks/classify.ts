// Classifieur pur, sans dépendance au moteur : testable seul.

export type Tier = 'haiku' | 'sonnet' | 'opus'
export type Kind = 'code' | 'rédaction' | 'analyse' | 'question' | 'conversation'

export type Decision = {
  tier: Tier
  kind: Kind
  score: number
  reasons: string[]
  // true quand la décision reprend le niveau du tour précédent (relance courte)
  isCarried: boolean
}

const has = (re: RegExp, t: string) => re.test(t)

// \b ignore les lettres accentuées en JS ("sécurité\b" ne matche pas) :
// on le remplace par des bornes Unicode, et \w par lettre/chiffre/_.
const L = String.raw`[\p{L}\d_]`
const W = (src: string, flags: string) =>
  new RegExp(
    src
      .replace(/\\b\(/g, `(?<!${L})(`)
      .replace(/\)\\b/g, `)(?!${L})`)
      .replace(/\\w/g, L),
    flags + 'u',
  )

// Relances courtes qui dépendent du contexte : on garde le niveau précédent.
const CONTINUATION = W(String.raw`^(ok|oui|non|vas[- ]y|continue|go|fais[- ]le|d'accord|parfait|encore|et (ensuite|après)|la suite|next|yes|do it|proceed)\b`, 'i')

const SMALLTALK = W(String.raw`^(merci|thanks|salut|bonjour|hello|hi|cool|super|top|👍)\b`, 'i')

const CODE = W(String.raw`\x60{3}|\b(code|fonction|function|bug|erreur|error|stack ?trace|exception|compile|test(s)?|refactor\w*|api|endpoint|script|regex|sql|typescript|python|javascript|rust|java|go(lang)?|css|html|git|commit|pull request|pr|deploy\w*|docker|kubernetes|repo|classe|méthode|variable)\b`, 'i')

const WRITING = W(String.raw`\b(rédige|rédiger|écris|écrire|email|e-mail|mail|lettre|article|post|linkedin|reformule|réécris|traduis|traduction|résume|résumé|plan de|discours|cv|lettre de motivation)\b`, 'i')

const ANALYSIS = W(String.raw`\b(analyse|compare|comparaison|évalue|stratégie|pourquoi|explique en détail|avantages|inconvénients|trade-?offs?|recommande|décide|choisir entre)\b`, 'i')

const HARD = W(String.raw`\b(architecture|concevoir|conçois|design (system|doc)|migration|migrer|refactor\w*|sécurité|security|audit|vulnérab\w*|optimis\w*|performance|concurren\w*|race condition|deadlock|algorithme|complexité|preuve|démontre|prouve|from scratch|de zéro|multi[- ]?fichiers?|toute la (base|codebase)|en profondeur|approfondi\w*|étape par étape|step by step|plan détaillé|cahier des charges|spec(ification)?)\b`, 'i')

const EASY = W(String.raw`^(c'est quoi|qu'est-ce que|que veut dire|définis|définition|traduis|quelle heure|combien|quel(le)? est|donne[- ]moi (un|une) (exemple|synonyme)|corrige (l'orthographe|les fautes)|what is|define)\b`, 'i')

export function classify(text: string, previous?: Tier): Decision {
  const t = text.trim()
  const reasons: string[] = []
  const len = t.length

  if (len === 0 || (len < 40 && CONTINUATION.test(t))) {
    if (previous) {
      return { tier: previous, kind: 'conversation', score: 0, reasons: ['relance courte : niveau précédent conservé'], isCarried: true }
    }
  }
  if (len < 40 && SMALLTALK.test(t)) {
    return { tier: 'haiku', kind: 'conversation', score: -3, reasons: ['politesse / bavardage'], isCarried: false }
  }

  let score = 0
  const kind: Kind = has(CODE, t)
    ? 'code'
    : has(WRITING, t)
      ? 'rédaction'
      : has(ANALYSIS, t)
        ? 'analyse'
        : 'question'

  const hard = t.match(new RegExp(HARD.source, HARD.flags + 'g')) ?? []
  // Longueur : plus de contexte fourni = tâche plus lourde. Une demande courte
  // mais chargée de signaux complexes n'est pas pénalisée.
  if (len < 120 && hard.length === 0) { score -= 2; reasons.push('demande courte') }
  else if (len > 1500) { score += 3; reasons.push('demande longue (>1500 car.)') }
  else if (len > 500) { score += 1; reasons.push('demande moyenne (>500 car.)') }

  const codeBlocks = (t.match(/```/g) ?? []).length / 2
  if (codeBlocks >= 1) { score += 1; reasons.push('bloc de code fourni') }
  if (codeBlocks >= 3) { score += 1; reasons.push('plusieurs blocs de code') }

  if (hard.length) { score += 2 + Math.min(hard.length - 1, 2); reasons.push(`signaux complexes : ${[...new Set(hard.map(h => h.toLowerCase()))].slice(0, 3).join(', ')}`) }

  if (has(EASY, t)) { score -= 2; reasons.push('question factuelle / définition') }

  const items = (t.match(/^\s*(\d+[.)]|[-*•])\s+/gm) ?? []).length
  if (items >= 3) { score += 1; reasons.push(`${items} points listés`) }
  const questions = (t.match(/\?/g) ?? []).length
  if (questions >= 3) { score += 1; reasons.push(`${questions} questions`) }

  if (kind === 'code') { score += 1; reasons.push('code') }
  if (kind === 'analyse') { score += 1; reasons.push('analyse') }
  if (kind === 'rédaction') { score += 1; reasons.push('rédaction (qualité de style)') }

  const tier: Tier = score >= 3 ? 'opus' : score <= -2 ? 'haiku' : 'sonnet'
  return { tier, kind, score, reasons, isCarried: false }
}

// Zone grise : là où un avis du petit modèle vaut le coût d'un appel.
export const isAmbiguous = (d: Decision) => !d.isCarried && (d.score === -1 || d.score === 2)
