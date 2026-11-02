import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import * as c from '../hooks/core'
const g = (cwd: string, ...a: string[]) => execFileSync('git', a, { cwd, encoding: 'utf8' })
const root = mkdtempSync('/tmp/eq-')
const bare = join(root, 'bare.git'); g(root, 'init', '-q', '--bare', '-b', 'main', bare)
const seed = join(root, 'seed'); g(root, 'clone', '-q', bare, seed)
g(seed, 'config', 'user.email', 'a@b'); g(seed, 'config', 'user.name', 'a'); writeFileSync(join(seed, 'README.md'), 'x'); g(seed, 'add', '-A'); g(seed, 'commit', '-qm', 'init'); g(seed, 'push', '-q', 'origin', 'main')
const mk = (n: string): c.IO => {
  const d = join(root, n); g(root, 'clone', '-q', bare, d); g(d, 'config', 'user.email', 'a@b'); g(d, 'config', 'user.name', n)
  return {
    git: async a => { try { return { code: 0, out: g(d, ...a) } } catch (e: any) { return { code: e.status ?? 1, out: String(e.stderr ?? '') } } },
    read: async f => { try { return readFileSync(join(d, f), 'utf8') } catch { return undefined } },
    write: async (f, t) => writeFileSync(join(d, f), t),
    list: async () => readdirSync(d).filter(f => !f.startsWith('.')),
  }
}
const A = mk('a'), B = mk('b'), C = mk('c')
const ok = (cond: boolean, m: string) => { console.log((cond ? 'OK   ' : 'FAIL ') + m); if (!cond) process.exitCode = 1 }
const now = Date.now()
ok(await c.announce(A, { name: 'pc1-abac', machine: 'PC1', task: 'chef', at: now }), 'annonce A')
ok(await c.announce(B, { name: 'pc2-test', machine: 'PC2', task: '', at: now }), 'annonce B')
for (const t of ['un', 'deux', 'trois']) ok(!!(await c.addTask(A, 'pc1-abac', t, now + Math.random() * 1000 | 0)), 'tâche ' + t)
// course : B et C réclament en même temps
await c.announce(C, { name: 'cloud-x', machine: 'cloud', task: '', at: now })
const [rb, rc, ra] = await Promise.all([c.claim(B, 'pc2-test', now), c.claim(C, 'cloud-x', now), c.claim(A, 'pc1-abac', now)])
const ids = [rb, rc, ra].map(t => t?.id)
console.log('claims', ids)
ok(ids.every(Boolean) && new Set(ids).size === 3, 'trois sessions, trois tâches distinctes (pas de doublon)')
ok((await c.claim(A, 'pc1-abac', now)) === undefined, 'plus de tâche libre')
ok(await c.send(A, 'pc1-abac', 'pc2-test', 'salut B', now), 'envoi message')
ok(await c.send(A, 'pc1-abac', 'tous', 'annonce à tous', now + 1), 'envoi à tous')
await c.sync(B)
const inb = await c.inbox(B, 'pc2-test', new Set())
ok(inb.length === 2, 'B reçoit 2 messages : ' + inb.map(m => m.text).join(' | '))
ok((await c.inbox(B, 'pc2-test', new Set(inb.map(m => m.file)))).length === 0, 'messages vus ignorés')
ok((await c.inbox(A, 'pc1-abac', new Set())).length === 0, "A ne reçoit pas ses propres messages")
ok(await c.finish(B, 'pc2-test', rb!.id, 'fait'), 'B finit sa tâche')
await c.sync(A)
ok((await c.inbox(A, 'pc1-abac', new Set())).some(m => m.text.includes('fait')) || rb!.by !== 'pc1-abac', 'créateur prévenu')
// session inactive : sa tâche redevient libre
const old = await c.addTask(A, 'pc1-abac', 'orpheline', now + 5000)
await c.announce(C, { name: 'cloud-x', machine: 'cloud', task: '', at: now - 40 * 60000 })
await c.sync(A); const ts = await c.tasks(A); const ss = await c.sessions(A)
const live = new Map(ss.map(s => [s.name, s]))
const cTask = ts.find(t => t.owner === 'cloud-x')!
ok(c.isFree(cTask, live, now), 'tâche d’une session inactive depuis 40 min redevient libre')
console.log(c.summary(ss, ts, now))
