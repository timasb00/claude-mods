import type { Register } from 'claude-code'

import { classify, isAmbiguous } from './classify'
import type { Decision, Tier } from './classify'

// Préfixe de forçage en début de message : "@opus ...", "@sonnet ...", "@haiku ...".
const OVERRIDE = /^@(haiku|sonnet|opus)\b\s*/i
// Au-delà, on ne descend pas sur Haiku : contexte long, risque de qualité.
const HAIKU_MAX_MESSAGES = 40
const TIERS = ['haiku', 'sonnet', 'opus'] as const

type Mode = 'auto' | 'hybrid' | 'off' | Tier

// Variables de module : remises à zéro à chaque rechargement du mod.
let mode: Mode = 'auto'
let pendingOverride: Tier | undefined
let lastTier: Tier | undefined
let lastDecision: Decision | undefined
const byTurn = new Map<string, Tier>()

const label = (d: Decision) =>
  `routeur → ${d.tier} · ${d.kind}${d.isCarried ? ' (repris)' : ''}`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'route',
      description: 'Routeur de modèle : status | auto | hybrid | off | haiku | sonnet | opus | test <texte>',
    })
    return next(e)
  })

  on('command.run', { command: 'route' }, async ($, e) => {
    const [cmd = 'status', ...rest] = e.args.trim().split(/\s+/)
    const arg = cmd.toLowerCase()
    if (arg === 'test') {
      const d = classify(rest.join(' '), lastTier)
      return { text: `${label(d)} (score ${d.score})\n- ${d.reasons.join('\n- ') || 'aucun signal'}` }
    }
    if (['auto', 'hybrid', 'off', ...TIERS].includes(arg)) {
      mode = arg as Mode
      $.ui.status(mode === 'off' ? undefined : `routeur : ${mode}`)
      return { text: `Routeur réglé sur « ${mode} ».` }
    }
    const last = lastDecision
      ? `Dernier choix : ${label(lastDecision)} (score ${lastDecision.score}) — ${lastDecision.reasons.join(' ; ')}`
      : 'Aucun tour routé pour l’instant.'
    return {
      text: `Mode : ${mode}. Modèle de session : ${await $.session.model()}.\n${last}\n` +
        'Forcer un seul message : commence-le par @haiku, @sonnet ou @opus.',
    }
  })

  // Lit et retire le préfixe @modèle avant que le message soit enregistré.
  on('prompt.submit', ($, e, next) => {
    if (e.command || e.isMeta) return next(e)
    const m = e.text.match(OVERRIDE)
    if (!m) return next(e)
    pendingOverride = m[1].toLowerCase() as Tier
    return next({ ...e, text: e.text.replace(OVERRIDE, '') })
  })

  // Décide une fois par tour, sur la boucle principale seulement.
  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined || mode === 'off') return next(e)

    let d: Decision
    if (pendingOverride) {
      d = { tier: pendingOverride, kind: 'conversation', score: 0, reasons: ['forcé par @préfixe'], isCarried: false }
      pendingOverride = undefined
    } else if (mode !== 'auto' && mode !== 'hybrid') {
      d = { tier: mode, kind: 'conversation', score: 0, reasons: [`mode fixé : ${mode}`], isCarried: false }
    } else {
      d = classify(e.text, lastTier)
      if (mode === 'hybrid' && isAmbiguous(d)) {
        try {
          const pick = await $.model.classify(
            `Classe la difficulté de cette demande pour un assistant IA (simple = réponse courte/factuelle, standard = tâche courante, complexe = raisonnement long, architecture, débogage difficile) :\n\n${e.text.slice(0, 4000)}`,
            ['simple', 'standard', 'complexe'],
            { model: 'haiku' },
          )
          const map: Record<string, Tier> = { simple: 'haiku', standard: 'sonnet', complexe: 'opus' }
          if (pick && map[pick]) d = { ...d, tier: map[pick], reasons: [...d.reasons, `arbitrage Haiku : ${pick}`] }
        } catch {
          // échec de l'appel : on garde la décision heuristique
        }
      }
    }

    byTurn.set(e.turnId, d.tier)
    lastTier = d.tier
    lastDecision = d
    $.ui.status(label(d))
    return next(e)
  })

  // Le seul vrai levier : chaque requête du tour part vers le modèle choisi.
  on('turn.step', async function* ($, e, next) {
    let tier = e.agentId === undefined ? byTurn.get(e.turnId) : undefined
    if (!tier) return yield* next(e)
    if (tier === 'haiku' && e.messageCount > HAIKU_MAX_MESSAGES) tier = 'sonnet'
    return yield* next({ ...e, model: tier })
  })

  on('turn.complete', ($, e, next) => {
    if (e.agentId === undefined) byTurn.delete(e.turnId)
    return next(e)
  })
}
