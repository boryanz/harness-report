import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Box, CircleCheck, CircleAlert, Coins, FileCog, FolderOpen, Plus, Save, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { FolderCheck, Settings, SettingsResponse } from '../../../shared/types.ts'

const INPUT =
  'h-8 w-full min-w-0 rounded-md border bg-background px-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-(--waiting)'

type Draft = { credits: string; folders: string[]; sandboxFolder: string; sandboxes: string }

function toDraft(saved: SettingsResponse): Draft {
  return {
    credits: saved.settings.monthlyCredits ? String(saved.settings.monthlyCredits) : '',
    folders: saved.settings.evalResults.length > 0 ? saved.settings.evalResults : [''],
    sandboxFolder: saved.settings.sandboxFolder,
    sandboxes: saved.settings.sandboxes.join(', '),
  }
}

// What would be sent: blank rows dropped, so an empty extra row doesn't count as a change.
// Same key order as the server's settings, so the JSON comparison below works.
function toSettings(draft: Draft): Settings {
  return {
    monthlyCredits: draft.credits.trim() === '' ? 0 : Number(draft.credits.replaceAll(/[\s,_]/g, '')),
    evalResults: draft.folders.map((folder) => folder.trim()).filter(Boolean),
    sandboxFolder: draft.sandboxFolder.trim(),
    sandboxes: [...new Set(draft.sandboxes.split(/[\s,]+/).filter(Boolean))],
  }
}

function Section({ icon: Icon, color, title, description, children }: { icon: typeof Coins; color: string; title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card px-5 py-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
        <Icon className="size-3.5" style={{ color }} aria-hidden />
        {title}
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function FolderStatus({ check }: { check: FolderCheck | undefined }) {
  if (!check) return <span className="text-muted-foreground">Checked when you save</span>

  if (!check.found) {
    return (
      <span className="flex items-center gap-1" style={{ color: 'var(--waiting)' }}>
        <CircleAlert className="size-3.5 shrink-0" aria-hidden />
        Folder not found
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <CircleCheck className="size-3.5 shrink-0" style={{ color: 'var(--agent-3)' }} aria-hidden />
      {check.resultFiles} {check.resultFiles === 1 ? 'result file' : 'result files'}
    </span>
  )
}

function SourceNote({ saved }: { saved: SettingsResponse }) {
  const file = <code className="font-mono wrap-anywhere">{saved.file}</code>
  if (saved.source === 'settings') return <>Saved in {file}.</>
  if (saved.source === 'config.toml') {
    return <>Read from your config.toml for now. Saving creates {file}, which the app uses from then on. config.toml is never changed.</>
  }
  return <>Nothing is set up yet. Saving creates {file}.</>
}

function SettingsScreen() {
  const [saved, setSaved] = useState<SettingsResponse | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch('/api/settings', { signal: controller.signal })
        if (!response.ok) throw new Error(await response.text())
        const data: SettingsResponse = await response.json()
        if (controller.signal.aborted) return
        setSaved(data)
        setDraft(toDraft(data))
      } catch {
        if (!controller.signal.aborted) setLoadFailed(true)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  if (!saved || !draft) {
    return loadFailed ? (
      <p className="text-sm text-muted-foreground">Couldn't load settings.</p>
    ) : (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const current = draft
  const next = toSettings(current)
  const creditsInvalid = !Number.isInteger(next.monthlyCredits) || next.monthlyCredits < 0
  const changed = JSON.stringify(next) !== JSON.stringify(saved.settings)
  const checks = new Map(saved.folders.map((check) => [check.path, check]))

  function update(change: Partial<Draft>) {
    setDraft({ ...current, ...change })
    setMessage(null)
  }

  function setFolder(index: number, value: string) {
    update({ folders: current.folders.map((folder, i) => (i === index ? value : folder)) })
  }

  function removeFolder(index: number) {
    const folders = current.folders.filter((_, i) => i !== index)
    update({ folders: folders.length > 0 ? folders : [''] })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!changed || creditsInvalid) return

    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!response.ok) {
        setMessage({ ok: false, text: (await response.text()) || "Settings couldn't be saved" })
        return
      }
      const data: SettingsResponse = await response.json()
      setSaved(data)
      setDraft(toDraft(data))
      setMessage({ ok: true, text: 'Saved' })
    } catch {
      setMessage({ ok: false, text: "Couldn't reach the server" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={save}>
      <Section
        icon={FolderOpen}
        color="var(--agent-7)"
        title="Eval results folders"
        description="Folders your eval tool writes result files into. Every .json file directly inside is read; subfolders are ignored. Use a full path, starting with / or ~."
      >
        <ul className="flex flex-col gap-2">
          {current.folders.map((folder, index) => {
            const check = checks.get(folder.trim())
            return (
              <li key={index} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <input
                    className={INPUT}
                    value={folder}
                    placeholder="~/my-evals/results"
                    aria-label={`Eval results folder ${index + 1}`}
                    aria-invalid={check?.found === false}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    onChange={(event) => setFolder(index, event.target.value)}
                  />
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Remove folder ${index + 1}`}
                    onClick={() => removeFolder(index)}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
                {folder.trim() !== '' && (
                  <div className="pl-0.5 text-xs">
                    <FolderStatus check={check} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          className="mt-2 flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => update({ folders: [...current.folders, ''] })}
        >
          <Plus className="size-3.5" style={{ color: 'var(--agent-7)' }} aria-hidden />
          Add folder
        </button>
      </Section>

      <Section
        icon={Box}
        color="var(--agent-5)"
        title="Sandboxes"
        description="Sessions are copied out of these sandboxes when the server starts and when you save here, then listed with your local sessions."
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Sandbox names, separated by commas
            <input
              className={INPUT}
              value={current.sandboxes}
              placeholder="ccm"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(event) => update({ sandboxes: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Copy sessions into (leave empty for ~/.copilot-sbx)
            <input
              className={INPUT}
              value={current.sandboxFolder}
              placeholder="~/.copilot-sbx"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(event) => update({ sandboxFolder: event.target.value })}
            />
          </label>
        </div>
      </Section>

      <Section
        icon={Coins}
        color="var(--agent-1)"
        title="Monthly AI credits"
        description="Your plan's credit allowance. The credits tile on Overview measures this month's use against it. Leave it empty to hide the budget."
      >
        <input
          className={`${INPUT} max-w-40`}
          value={current.credits}
          inputMode="numeric"
          placeholder="30000"
          aria-label="Monthly AI credits"
          aria-invalid={creditsInvalid}
          onChange={(event) => update({ credits: event.target.value })}
        />
        {creditsInvalid && <p className="mt-1 text-xs" style={{ color: 'var(--waiting)' }}>Use a whole number, such as 30000.</p>}
      </Section>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-5 py-3">
        <button
          type="submit"
          disabled={!changed || creditsInvalid || saving}
          className="flex h-8 items-center gap-1.5 rounded-md bg-(--agent-1) px-3 text-xs font-medium text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          <Save className="size-3.5" aria-hidden />
          {saving ? 'Saving…' : 'Save'}
        </button>
        {message && (
          <span role="status" className="text-xs" style={{ color: message.ok ? 'var(--agent-3)' : 'var(--waiting)' }}>
            {message.text}
          </span>
        )}
        <p className="flex min-w-0 flex-1 basis-64 items-start gap-1.5 text-xs text-muted-foreground">
          <FileCog className="mt-px size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0">
            <SourceNote saved={saved} />
          </span>
        </p>
      </div>
    </form>
  )
}

export default SettingsScreen
