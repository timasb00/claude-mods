import { expect, test } from 'claude-code/testing'

import { classify } from './classify'

test('le classifieur trie les cas types', async () => {
  expect(classify('merci !').tier).toBe('haiku')
  expect(classify("c'est quoi un closure ?").tier).toBe('haiku')
  expect(classify('Écris un email pour décaler la réunion de jeudi à vendredi, ton cordial.').tier).toBe('sonnet')
  expect(classify('Corrige ce bug dans ma fonction de tri qui renvoie une liste vide').tier).toBe('sonnet')
  expect(
    classify("Conçois l'architecture d'un système de paiement multi-tenant, avec migration depuis notre monolithe, analyse de sécurité et plan détaillé.").tier,
  ).toBe('opus')
  expect(classify('continue', 'opus').tier).toBe('opus')
  expect(classify('ok vas-y', 'opus').isCarried).toBe(true)
})

// Stand-ins for the engine beneath the plugin; registered before any $ call.
function engine(on: any) {
  const seen: { model?: string } = {}
  on('ui.status', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'route' } }))
  on('prompt.submit', (_: any, e: any) => ({ text: e.text }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.step', async function* (_: any, e: any) {
    seen.model = e.model
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [] }
  })
  return seen
}

async function run($: any, seen: { model?: string }, text: string, messageCount = 3) {
  const turnId = 't' + Math.random()
  await $.turn.start({ text, turnId })
  for await (const _ of $.turn.step({ turnId, index: 0, model: 'claude-opus-5-5', messageCount })) { /* drain */ }
  return seen.model
}

test('une question simple part sur haiku', async ($, on) => {
  const seen = engine(on)
  expect(await run($, seen, 'merci')).toBe('haiku')
})

test('une demande complexe part sur opus', async ($, on) => {
  const seen = engine(on)
  expect(
    await run($, seen, "Conçois l'architecture de migration de notre monolithe vers des microservices, avec audit de sécurité."),
  ).toBe('opus')
})

test('pas de haiku sur une longue conversation', async ($, on) => {
  const seen = engine(on)
  expect(await run($, seen, 'merci', 80)).toBe('sonnet')
})

test('le préfixe @opus force le modèle', async ($, on) => {
  const seen = engine(on)
  await $.prompt.submit({ text: '@opus merci' } as any)
  expect(await run($, seen, 'merci')).toBe('opus')
})
