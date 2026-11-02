// Logique du tableau partagé, sans dépendance au moteur : testable seule.
// Le tableau est un dépôt git à plat (pas de sous-dossiers) :
//   s-<nom>.json  fiche de session     t-<id>.json  tâche     m-<dest>-<ts>-<exp>.json  message

export type IO = {
  git: (args: string[]) => Promise<{ code: number; out: string }>
  read: (file: string) => Promise<string | undefined>
  write: (file: string, text: string) => Promise<void>
  list: () => Promise<string[]>
}

export type Session = { name: string; machine: string; task: string; at: number }
export type Task = { id: string; title: string; status: 'libre' | 'prise' | 'finie'; owner?: string; result?: string; by: string; at: number }
export type Message = { file: string; from: string; to: string; text: string; at: number }

export const STALE_MS = 30 * 60 * 1000
const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'
const parse = async <T>(io: IO, f: string): Promise<T | undefined> => {
  const t = await io.read(f)
  if (!t) return undefined
  try { return JSON.parse(t) as T } catch { return undefined }
}

export async function sync(io: IO): Promise<boolean> {
  const f = await io.git(['fetch', 'origin'])
  if (f.code !== 0) return false
  const r = await io.git(['reset', '--hard', '@{u}'])
  return r.code === 0
}

// Écrit via `change`, valide et pousse. Push refusé (course avec une autre session) : on resynchronise et on rejoue.
export async function commit(io: IO, msg: string, change: () => Promise<boolean>, tries = 4): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    if (!(await sync(io))) return false
    if (!(await change())) return false
    await io.git(['add', '-A'])
    const c = await io.git(['commit', '-q', '-m', msg])
    if (c.code !== 0) return false
    if ((await io.git(['push', '-q'])).code === 0) return true
  }
  return false
}

export async function announce(io: IO, s: Session): Promise<boolean> {
  return commit(io, `session ${s.name}`, async () => {
    await io.write(`s-${clean(s.name)}.json`, JSON.stringify(s))
    return true
  })
}

export async function sessions(io: IO): Promise<Session[]> {
  const out: Session[] = []
  for (const f of await io.list()) if (/^s-.*\.json$/.test(f)) { const s = await parse<Session>(io, f); if (s) out.push(s) }
  return out
}

export async function tasks(io: IO): Promise<Task[]> {
  const out: Task[] = []
  for (const f of await io.list()) if (/^t-.*\.json$/.test(f)) { const t = await parse<Task>(io, f); if (t) out.push(t) }
  return out.sort((a, b) => a.at - b.at)
}

// Une tâche prise par une session silencieuse depuis STALE_MS redevient libre.
export function isFree(t: Task, live: Map<string, Session>, now: number): boolean {
  if (t.status === 'libre') return true
  if (t.status !== 'prise') return false
  const o = t.owner ? live.get(clean(t.owner)) : undefined
  return !o || now - o.at > STALE_MS
}

export async function addTask(io: IO, by: string, title: string, now: number): Promise<string | undefined> {
  const id = now.toString(36)
  const t: Task = { id, title, status: 'libre', by, at: now }
  return (await commit(io, `tâche ${id}`, async () => { await io.write(`t-${id}.json`, JSON.stringify(t)); return true })) ? id : undefined
}

// Verrou : deux sessions qui visent la même tâche, une seule pousse ; l'autre resynchronise et en prend une autre.
export async function claim(io: IO, name: string, now: number): Promise<Task | undefined> {
  let got: Task | undefined
  const ok = await commit(io, `${name} prend une tâche`, async () => {
    const live = new Map((await sessions(io)).map(s => [clean(s.name), s]))
    const free = (await tasks(io)).find(t => isFree(t, live, now))
    if (!free) return false
    got = { ...free, status: 'prise', owner: name }
    await io.write(`t-${free.id}.json`, JSON.stringify(got))
    return true
  })
  return ok ? got : undefined
}

export async function finish(io: IO, name: string, id: string, result: string): Promise<boolean> {
  let notify: Task | undefined
  const ok = await commit(io, `${name} finit ${id}`, async () => {
    const t = await parse<Task>(io, `t-${id}.json`)
    if (!t || t.owner !== name) return false
    notify = { ...t, status: 'finie', result }
    await io.write(`t-${id}.json`, JSON.stringify(notify))
    return true
  })
  if (ok && notify && notify.by !== name) await send(io, name, notify.by, `Tâche « ${notify.title} » finie : ${result}`, Date.now())
  return ok
}

export async function send(io: IO, from: string, to: string, text: string, now: number): Promise<boolean> {
  const m: Omit<Message, 'file'> = { from, to: clean(to), text, at: now }
  return commit(io, `message ${from} → ${to}`, async () => {
    await io.write(`m-${clean(to)}-${now.toString(36)}-${clean(from)}.json`, JSON.stringify(m))
    return true
  })
}

export async function inbox(io: IO, name: string, seen: ReadonlySet<string>): Promise<Message[]> {
  const me = clean(name)
  const out: Message[] = []
  for (const f of await io.list()) {
    if (!f.startsWith(`m-${me}-`) && !f.startsWith('m-tous-')) continue
    if (seen.has(f)) continue
    const m = await parse<Omit<Message, 'file'>>(io, f)
    if (m && clean(m.from) !== me) out.push({ ...m, file: f })
  }
  return out.sort((a, b) => a.at - b.at)
}

export function summary(ss: Session[], ts: Task[], now: number): string {
  const live = new Map(ss.map(s => [clean(s.name), s]))
  const lines = ss.map(s => `- ${s.name} (${s.machine})${now - s.at > STALE_MS ? ' [inactive]' : ''} : ${s.task || 'rien de déclaré'}`)
  const tl = ts.map(t => `- [${isFree(t, live, now) && t.status !== 'finie' ? 'libre' : t.status}] ${t.id} ${t.title}${t.owner ? ` → ${t.owner}` : ''}${t.result ? ` : ${t.result}` : ''}`)
  return `Sessions :\n${lines.join('\n') || '- aucune'}\n\nTâches :\n${tl.join('\n') || '- aucune'}`
}
