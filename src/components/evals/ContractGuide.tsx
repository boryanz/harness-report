import { useState, type ReactNode } from 'react'
import { BookOpen, Calculator, Check, Copy, FileJson, FileWarning, FolderOpen, PenLine, Waves } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Mirrors docs/eval-contract.md. Change both together.

type Field = { name: string; required: boolean; meaning: ReactNode }

const QUICK_START = `{
  "schema": 2,
  "suite": "20260315-093000-my-skill",
  "subject": { "kind": "skill", "name": "my-skill", "version": "a1b2c3" },
  "started": "2026-03-15T09:30:00Z",
  "finished": "2026-03-15T09:34:10Z",
  "complete": true,
  "metrics": [
    { "id": "passed", "label": "Tests passed", "unit": "percent", "better": "higher" }
  ],
  "runs": [
    { "case": "handles-empty-input", "status": "ok", "metrics": { "passed": 1 } }
  ]
}`

const SETTINGS_FILE = `{
  "monthly_credits": 30000,
  "eval_results": ["~/my-evals/results", "~/team-evals/results"]
}`

const COMPARISON = `{
  "schema": 2,
  "suite": "20260316-140000-my-skill",
  "subject": { "kind": "skill", "name": "my-skill", "version": "d4e5f6" },
  "started": "2026-03-16T14:00:00Z",
  "finished": null,
  "complete": false,
  "metrics": [
    { "id": "kept", "label": "Behaviour kept", "unit": "percent", "better": "higher" },
    { "id": "fixed", "label": "Issues fixed", "unit": "percent", "better": "higher", "noisy": true }
  ],
  "arms": ["with-skill", "baseline"],
  "baseline_arm": "baseline",
  "labels": { "agent model": "some-model" },
  "runs": [
    {
      "case": "rename-unclear-locals", "type": "seeded",
      "arm": "with-skill", "rep": 1, "status": "ok",
      "metrics": { "kept": 1, "fixed": 0.9 },
      "session_id": "3f2a…", "credits": 4.3, "duration_s": 9
    },
    {
      "case": "rename-unclear-locals", "type": "seeded",
      "arm": "baseline", "rep": 1, "status": "invalid",
      "reason": "Agent never edited the file",
      "metrics": {}
    }
  ]
}`

const code = (text: string) => <code className="rounded-sm bg-muted px-1 py-px font-mono text-[0.7rem]">{text}</code>

const SUITE_FIELDS: Field[] = [
  { name: 'schema', required: true, meaning: <>Always {code('2')}.</> },
  { name: 'suite', required: true, meaning: 'Unique id for this run of the suite.' },
  { name: 'subject', required: true, meaning: 'What was tested, see below.' },
  { name: 'started', required: true, meaning: 'ISO 8601 time with a timezone.' },
  { name: 'finished', required: false, meaning: <>ISO 8601 time. {code('null')} or missing while the suite runs.</> },
  { name: 'complete', required: true, meaning: <>{code('false')} until the last run is written.</> },
  { name: 'metrics', required: true, meaning: 'The metrics this suite reports, in display order. At least one.' },
  { name: 'arms', required: false, meaning: <>Variants being compared, such as {code('["with-skill", "baseline"]')}. Leave it out if you compare nothing.</> },
  { name: 'baseline_arm', required: false, meaning: <>The arm the others are compared against. Must be listed in {code('arms')}.</> },
  { name: 'labels', required: false, meaning: <>Extra text shown on the card, as string pairs: {code('{ "agent model": "some-model" }')}.</> },
  { name: 'runs', required: true, meaning: 'One entry per run. May be empty while the suite runs.' },
]

const SUBJECT_FIELDS: Field[] = [
  { name: 'kind', required: true, meaning: <>{code('skill')} or {code('agent')}.</> },
  { name: 'name', required: true, meaning: <>Results with the same {code('kind')} and {code('name')} share one card.</> },
  { name: 'version', required: true, meaning: 'Any string that changes when the subject changes, such as a content hash. Version history is grouped by it.' },
]

const METRIC_FIELDS: Field[] = [
  { name: 'id', required: true, meaning: <>Key used in each run's {code('metrics')}.</> },
  { name: 'label', required: true, meaning: 'Text shown in the score table.' },
  { name: 'unit', required: true, meaning: <>{code('percent')} (a number from 0 to 1), {code('count')}, or {code('credits')}.</> },
  { name: 'better', required: true, meaning: <>{code('higher')} or {code('lower')}. Decides whether a difference is good or bad.</> },
  { name: 'noisy', required: false, meaning: <>{code('true')} if the score moves between identical runs, for example when an LLM judge gives it. See Noise.</> },
]

const RUN_FIELDS: Field[] = [
  { name: 'case', required: true, meaning: 'Test case id. Repeats of a case share it.' },
  { name: 'status', required: true, meaning: <>{code('ok')}, {code('invalid')} or {code('error')}. Only {code('ok')} runs are scored.</> },
  { name: 'metrics', required: true, meaning: <>Values by metric id. Use {code('null')} or leave a metric out when it doesn't apply. Pass and fail are {code('1')} and {code('0')}.</> },
  { name: 'type', required: false, meaning: <>Short case category shown as a tag, such as {code('trap')}.</> },
  { name: 'arm', required: false, meaning: <>Which entry of {code('arms')} this run belongs to. Required when the suite has arms.</> },
  { name: 'rep', required: false, meaning: 'Repetition number, starting at 1. Needed for noise.' },
  { name: 'reason', required: false, meaning: <>Why the run is {code('invalid')} or {code('error')}. Shown under Runs left out.</> },
  { name: 'session_id', required: false, meaning: 'Agent session behind this run, so the app can open its timeline and tool log.' },
  { name: 'credits', required: false, meaning: 'Cost of the run.' },
  { name: 'duration_s', required: false, meaning: 'Length of the run in seconds.' },
]

const REJECTIONS: [string, ReactNode][] = [
  ['Not valid JSON', 'The file has a syntax error, or was read halfway through a write.'],
  ['Unknown schema: 1', <>The file uses another format. Set {code('"schema": 2')}.</>],
  ['subject.version is missing', 'A required field is missing. The message names it.'],
  ['Run "x" uses undeclared metric "y"', <>A run reports a metric not listed in {code('metrics')}, usually a typo.</>],
  ['Run "x": percent metric "y" must be from 0 to 1', <>Write {code('0.8')}, not {code('80')}.</>],
  ['baseline_arm must be listed in arms', <>The baseline names an arm that isn't in {code('arms')}.</>],
]

const GLOSSARY: [string, string][] = [
  ['Subject', 'The skill or agent being tested. Each one gets its own card.'],
  ['Case', 'One test task, such as "rename unclear variables in this file".'],
  ['Run', 'One attempt at a case. A case is usually run several times.'],
  ['Metric', 'Something scored on each run, such as "tests passed". Every metric is shown separately.'],
  ['Arm', 'One setup being compared, such as with-skill and baseline (without it).'],
  ['Difference', 'The gain over the baseline. + is better (green) and − is worse (red), even for lower-is-better metrics.'],
  ['Removed', 'The skill or agent is no longer installed in ~/.copilot. Its card moves to the end.'],
  ['Within noise', 'The difference is smaller than the scores move between identical runs, so it may be luck.'],
  ['Left out', "Runs that broke or couldn't be judged. They don't count toward scores."],
  ['Version', 'A change to the skill or agent. Older versions stay listed so you can see progress.'],
]

function CodeBlock({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard is blocked outside secure contexts; the text can still be selected.
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-sm border bg-background">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
        <span className="font-mono">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">{text}</pre>
    </div>
  )
}

function FieldTable({ fields }: { fields: Field[] }) {
  return (
    <div className="overflow-hidden rounded-sm border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 text-xs font-normal text-muted-foreground">Field</TableHead>
            <TableHead className="hidden h-8 text-xs font-normal text-muted-foreground sm:table-cell">Required</TableHead>
            <TableHead className="h-8 w-full text-xs font-normal text-muted-foreground">Meaning</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.name} className="hover:bg-transparent">
              <TableCell className="py-2 align-top font-mono text-xs">
                {field.name}
                <span className="mt-0.5 block font-sans text-[0.65rem] text-muted-foreground sm:hidden">{field.required ? 'required' : 'optional'}</span>
              </TableCell>
              <TableCell className="hidden py-2 align-top text-xs sm:table-cell">
                {field.required ? <span className="font-medium" style={{ color: 'var(--agent-7)' }}>yes</span> : <span className="text-muted-foreground">no</span>}
              </TableCell>
              <TableCell className="py-2 align-top text-xs whitespace-normal text-muted-foreground">{field.meaning}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function Section({ icon: Icon, color, title, children }: { icon: typeof BookOpen; color: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card px-5 py-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
        <Icon className="size-3.5" style={{ color }} aria-hidden />
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="mt-1 font-mono text-xs font-medium text-foreground">{children}</h3>
}

function ContractGuide() {
  return (
    <div className="flex flex-col gap-4">
      <Section icon={BookOpen} color="var(--agent-7)" title="Evals in a nutshell">
        <p className="text-sm text-foreground">
          An eval checks whether a skill or agent actually helps. You give an agent the same tasks many times, score each
          attempt, and compare the scores, usually with the skill and without it.
        </p>
        <p>
          harness-report shows those scores. It doesn't run or understand your tests: your own tool runs them, in any
          language, and writes one JSON result file per suite run. The app reads the folder of result files and draws a card
          for every skill and agent it finds. Runs from a terminal, from CI or from the app all end up in the same file.
        </p>
        <ol className="grid gap-px overflow-hidden rounded-sm border bg-border sm:grid-cols-3">
          {[
            ['1', 'Run your tests', 'Any tool: a script, a Gradle task, pytest, a CI job.'],
            ['2', 'Write a result file', 'One JSON file per suite run, in the format below.'],
            ['3', 'See it here', 'Add the folder in Settings. Results scores the newest suite.'],
          ].map(([step, title, text]) => (
            <li key={step} className="bg-card px-3 py-2.5">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="flex size-4 items-center justify-center rounded-sm bg-(--agent-7) font-mono text-[0.65rem] text-white">{step}</span>
                {title}
              </div>
              <p className="mt-0.5">{text}</p>
            </li>
          ))}
        </ol>
        <h3 className="mt-1 text-xs font-medium text-foreground">Words you'll see on a card</h3>
        <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[8rem_1fr]">
          {GLOSSARY.map(([term, meaning]) => (
            <div key={term} className="contents">
              <dt className="font-medium text-foreground">{term}</dt>
              <dd className="mb-1 sm:mb-0">{meaning}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section icon={FileJson} color="var(--agent-1)" title="Quick start">
        <p>The smallest valid file: one metric, one run, nothing compared.</p>
        <CodeBlock label="results/20260315-093000-my-skill.json" text={QUICK_START} />
        <p>
          Then add the folder under <span className="font-medium text-foreground">Settings → Eval results folders</span>.
          The app checks the folder and says how many result files it found. Every {code('*.json')} file directly in the
          folder is read. Subfolders are ignored, so you can keep run artifacts there.
        </p>
        <p>
          Settings are saved to {code('~/.config/harness-report/settings.json')}. You can also write that file yourself, for
          example on a CI machine:
        </p>
        <CodeBlock label="~/.config/harness-report/settings.json" text={SETTINGS_FILE} />
      </Section>

      <Section icon={FolderOpen} color="var(--agent-3)" title="Suite fields">
        <FieldTable fields={SUITE_FIELDS} />
        <SubHeading>subject</SubHeading>
        <FieldTable fields={SUBJECT_FIELDS} />
        <SubHeading>metrics[]</SubHeading>
        <FieldTable fields={METRIC_FIELDS} />
        <SubHeading>runs[]</SubHeading>
        <FieldTable fields={RUN_FIELDS} />
      </Section>

      <Section icon={FileJson} color="var(--agent-2)" title="Comparing against a baseline">
        <p>
          Add {code('arms')} and {code('baseline_arm')} to compare variants, such as the agent with and without your skill.
          Each run says which arm it belongs to, and the score table shows a Difference column. This file is still running,
          so {code('complete')} is {code('false')} and the card shows progress instead of scores.
        </p>
        <CodeBlock label="results/20260316-140000-my-skill.json" text={COMPARISON} />
      </Section>

      <Section icon={Calculator} color="var(--agent-4)" title="How scores are worked out">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            A metric's score for an arm is the mean of its values across runs with status {code('ok')}. {code('null')} and
            missing values are skipped.
          </li>
          <li>
            {code('invalid')} and {code('error')} runs say nothing about the subject, so they never affect a score. The card
            counts them under Runs left out, with their {code('reason')}.
          </li>
          <li>
            {code('credits')} and {code('duration_s')} are costs, so they're averaged over every run that reports them,
            whatever its status.
          </li>
          <li>Metrics are never blended into one overall score.</li>
          <li>Each card scores the newest complete suite. Older versions appear under Versions.</li>
        </ul>
      </Section>

      <Section icon={Waves} color="var(--agent-5)" title="Noise">
        <p>
          Mark a metric {code('noisy')} and give runs a {code('rep')} to get a noise margin. For each arm, the app takes the
          metric's mean within each repetition, then the standard deviation of those means. The larger value across arms is
          the margin, shown as "± run to run". A difference inside it is labelled "within noise". With one repetition the
          margin is 0.
        </p>
      </Section>

      <Section icon={PenLine} color="var(--agent-6)" title="Rules for writers">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <span className="font-medium text-foreground">Write atomically.</span> Write to a temporary file in the same
            folder and rename it over the real one. The app can read at any moment.
          </li>
          <li>
            <span className="font-medium text-foreground">Keep {code('complete: false')} until the end.</span> Rewrite the
            file after each run for live progress. An incomplete suite is never scored.
          </li>
          <li>
            <span className="font-medium text-foreground">One file per suite run.</span> Don't overwrite old files. They are
            your version history.
          </li>
          <li>
            <span className="font-medium text-foreground">Keep a metric's meaning under its {code('id')}.</span> Versions are
            compared by id, so use a new id if the meaning changes.
          </li>
        </ul>
      </Section>

      <Section icon={FileWarning} color="var(--waiting)" title="When a file is rejected">
        <p>
          A file that can't be read or doesn't follow this format appears under Files that couldn't be used, with the first
          problem found. It never stops other files from loading. Common reasons:
        </p>
        <ul className="divide-y overflow-hidden rounded-sm border">
          {REJECTIONS.map(([message, fix]) => (
            <li key={message} className="px-3 py-2 sm:grid sm:grid-cols-[minmax(0,22rem)_1fr] sm:gap-4">
              <div className="font-mono wrap-anywhere text-foreground">{message}</div>
              <div className="mt-0.5 sm:mt-0">{fix}</div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

export default ContractGuide
